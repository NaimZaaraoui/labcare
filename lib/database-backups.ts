import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';

export type DatabaseBackupFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

export type DatabaseBackupValidation = {
  valid: boolean;
  issues: string[];
};

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'database');

function normalizeSqlitePath(input: string) {
  const raw = input.startsWith('file:') ? input.slice(5) : input;

  if (raw.startsWith('/')) {
    return raw;
  }

  return path.resolve(process.cwd(), raw);
}

export function getDatabaseFilePath() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  return normalizeSqlitePath(url);
}

export function getDatabaseBackupDirectory() {
  return BACKUP_DIR;
}

export async function ensureBackupDirectory() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

export async function createDatabaseBackup() {
  await ensureBackupDirectory();

  const sourcePath = getDatabaseFilePath();
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const fileName = `nexlab-backup-${timestamp}.sqlite`;
  const destinationPath = path.join(BACKUP_DIR, fileName);

  const db = new Database(sourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(destinationPath);
  } finally {
    db.close();
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies DatabaseBackupFile;
}

export function validateDatabaseBackupFile(absolutePath: string): DatabaseBackupValidation {
  let db: InstanceType<typeof Database> | null = null;

  try {
    db = new Database(absolutePath, { fileMustExist: true, readonly: true });
    const rows = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const issues = rows
      .map((row) => String(row.integrity_check))
      .filter((issue) => issue !== 'ok');

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Validation SQLite impossible'],
    };
  } finally {
    db?.close();
  }
}

export function validateActiveDatabase(): DatabaseBackupValidation {
  return validateDatabaseBackupFile(getDatabaseFilePath());
}

export async function createNamedDatabaseBackup(prefix: string) {
  await ensureBackupDirectory();

  const sourcePath = getDatabaseFilePath();
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = `${safePrefix}-${timestamp}.sqlite`;
  const destinationPath = path.join(BACKUP_DIR, fileName);

  const db = new Database(sourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(destinationPath);
  } finally {
    db.close();
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies DatabaseBackupFile;
}

export async function listDatabaseBackups() {
  await ensureBackupDirectory();

  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sqlite'))
      .map(async (entry) => {
        const absolutePath = path.join(BACKUP_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        } satisfies DatabaseBackupFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBackupFileByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.sqlite$/.test(fileName)) {
    return null;
  }

  const absolutePath = path.join(BACKUP_DIR, fileName);

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;

    return {
      fileName,
      absolutePath,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    } satisfies DatabaseBackupFile;
  } catch {
    return null;
  }
}

export async function restoreDatabaseBackup(fileName: string) {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    throw new Error('Sauvegarde introuvable.');
  }

  const destinationPath = getDatabaseFilePath();
  const sourceDb = new Database(backup.absolutePath, { fileMustExist: true, readonly: true });

  try {
    await sourceDb.backup(destinationPath);
  } finally {
    sourceDb.close();
  }

  return backup;
}

export async function deleteDatabaseBackup(fileName: string) {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    return null;
  }

  await fs.unlink(backup.absolutePath);
  return backup;
}

export async function pruneDatabaseBackups(retainCount: number) {
  const safeRetainCount = Math.max(0, Math.floor(retainCount));
  const backups = await listDatabaseBackups();

  if (safeRetainCount <= 0) {
    return { deleted: [] as DatabaseBackupFile[], retained: backups };
  }

  const toDelete = backups.slice(safeRetainCount);
  const deleted: DatabaseBackupFile[] = [];

  for (const backup of toDelete) {
    await fs.unlink(backup.absolutePath);
    deleted.push(backup);
  }

  return {
    deleted,
    retained: backups.slice(0, safeRetainCount),
  };
}
