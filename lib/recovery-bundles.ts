import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import { getDatabaseFilePath } from '@/lib/database-backups';

const execFileAsync = promisify(execFile);

export type RecoveryBundleFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

const RECOVERY_DIR = path.join(process.cwd(), 'backups', 'recovery');

async function copyIfExists(sourcePath: string, destinationPath: string) {
  try {
    await fs.access(sourcePath);
    await fs.cp(sourcePath, destinationPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function removeDirectorySafe(targetPath: string) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export function getRecoveryBundleDirectory() {
  return RECOVERY_DIR;
}

export async function ensureRecoveryBundleDirectory() {
  await fs.mkdir(RECOVERY_DIR, { recursive: true });
}

export async function createRecoveryBundle() {
  await ensureRecoveryBundleDirectory();

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const fileName = `nexlab-recovery-${timestamp}.tar.gz`;
  const destinationPath = path.join(RECOVERY_DIR, fileName);
  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-'));
  const dbSourcePath = getDatabaseFilePath();
  const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
  const dataDir = path.join(bundleRoot, 'data');
  const appDir = path.join(bundleRoot, 'app-files');

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(appDir, { recursive: true });

  const dbDestination = path.join(dataDir, 'database.sqlite');
  const db = new Database(dbSourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(dbDestination);
  } finally {
    db.close();
  }

  const copiedUploads = await copyIfExists(path.join(process.cwd(), 'public', 'uploads'), path.join(appDir, 'uploads'));
  const copiedDockerCompose = await copyIfExists(path.join(process.cwd(), 'docker-compose.yml'), path.join(bundleRoot, 'docker-compose.yml'));
  const copiedSchema = await copyIfExists(path.join(process.cwd(), 'prisma', 'schema.prisma'), path.join(bundleRoot, 'schema.prisma'));

  const manifest = {
    createdAt: new Date().toISOString(),
    version: 1,
    database: {
      sourcePath: dbSourcePath,
      bundledAs: 'data/database.sqlite',
    },
    includedAssets: {
      uploads: copiedUploads,
      dockerCompose: copiedDockerCompose,
      prismaSchema: copiedSchema,
    },
    requiredEnv: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
    restoreNotes: [
      '1. Installer l application NexLab sur une machine saine.',
      '2. Restaurer data/database.sqlite comme base active SQLite.',
      '3. Restaurer le dossier app-files/uploads dans public/uploads.',
      '4. Verifier les variables d environnement avant redemarrage.',
      '5. Demarrer l application puis verifier les donnees critiques.',
    ],
  };

  await fs.writeFile(path.join(bundleRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(
    path.join(bundleRoot, 'RESTORE.txt'),
    [
      'NexLab Recovery Bundle',
      '',
      'Contenu:',
      '- data/database.sqlite',
      '- app-files/uploads',
      '- manifest.json',
      '',
      'Restauration rapide:',
      '1. Stopper l application.',
      '2. Remplacer la base SQLite active par data/database.sqlite.',
      '3. Restaurer public/uploads depuis app-files/uploads.',
      '4. Verifier DATABASE_URL et NEXTAUTH_SECRET.',
      '5. Redemarrer l application.',
      '',
    ].join('\n'),
    'utf8'
  );

  try {
    await execFileAsync('tar', ['-czf', destinationPath, '-C', stagingPath, 'nexlab-recovery']);
  } finally {
    await removeDirectorySafe(stagingPath);
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies RecoveryBundleFile;
}

export async function listRecoveryBundles() {
  await ensureRecoveryBundleDirectory();

  const entries = await fs.readdir(RECOVERY_DIR, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tar.gz'))
      .map(async (entry) => {
        const absolutePath = path.join(RECOVERY_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        } satisfies RecoveryBundleFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeImportedBundleName(fileName: string) {
  const safeBaseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!safeBaseName.endsWith('.tar.gz')) {
    throw new Error('Le fichier doit être un bundle .tar.gz.');
  }

  return safeBaseName;
}

export async function importRecoveryBundle(fileName: string, source: Buffer | Uint8Array) {
  await ensureRecoveryBundleDirectory();

  const normalizedName = normalizeImportedBundleName(fileName);
  const destinationBaseName = normalizedName.replace(/\.tar\.gz$/, '');
  let destinationPath = path.join(RECOVERY_DIR, normalizedName);

  try {
    await fs.access(destinationPath);
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    destinationPath = path.join(RECOVERY_DIR, `${destinationBaseName}-import-${timestamp}.tar.gz`);
  } catch {
    // File does not exist yet, keep original name.
  }

  await fs.writeFile(destinationPath, source);

  try {
    await execFileAsync('tar', ['-tzf', destinationPath]);
  } catch {
    await fs.rm(destinationPath, { force: true });
    throw new Error('Le bundle importé est invalide ou corrompu.');
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName: path.basename(destinationPath),
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies RecoveryBundleFile;
}

export async function getRecoveryBundleByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.tar\.gz$/.test(fileName)) {
    return null;
  }

  const absolutePath = path.join(RECOVERY_DIR, fileName);

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;

    return {
      fileName,
      absolutePath,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    } satisfies RecoveryBundleFile;
  } catch {
    return null;
  }
}

export async function restoreRecoveryBundle(fileName: string) {
  const bundle = await getRecoveryBundleByName(fileName);
  if (!bundle) {
    throw new Error('Bundle de reprise introuvable.');
  }

  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-restore-'));

  try {
    await execFileAsync('tar', ['-xzf', bundle.absolutePath, '-C', stagingPath]);

    const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
    const restoredDbPath = path.join(bundleRoot, 'data', 'database.sqlite');
    const restoredUploadsPath = path.join(bundleRoot, 'app-files', 'uploads');
    const targetDbPath = getDatabaseFilePath();
    const targetUploadsPath = path.join(process.cwd(), 'public', 'uploads');

    const db = new Database(restoredDbPath, { fileMustExist: true, readonly: true });
    try {
      await db.backup(targetDbPath);
    } finally {
      db.close();
    }

    const uploadsExists = await fs
      .stat(restoredUploadsPath)
      .then((stat) => stat.isDirectory())
      .catch(() => false);

    if (uploadsExists) {
      await fs.rm(targetUploadsPath, { recursive: true, force: true });
      await fs.mkdir(path.dirname(targetUploadsPath), { recursive: true });
      await fs.cp(restoredUploadsPath, targetUploadsPath, { recursive: true });
    }

    return {
      bundle,
      restoredUploads: uploadsExists,
    };
  } finally {
    await removeDirectorySafe(stagingPath);
  }
}
