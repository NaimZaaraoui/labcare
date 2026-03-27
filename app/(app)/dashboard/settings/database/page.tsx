'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Download,
  History,
  FolderArchive,
  HardDrive,
  Trash2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';

type BackupItem = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

type BackupsResponse = {
  databasePath: string;
  backupDirectory: string;
  items: BackupItem[];
};

type HealthResponse = {
  database: {
    reachable: boolean;
    fileExists: boolean;
    path: string;
    size: number | null;
  };
  backups: {
    count: number;
    latestCreatedAt: string | null;
    isFresh: boolean;
    freeSpaceBytes: number | null;
  };
  maintenance: {
    enabled: boolean;
  };
  criticalLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
  }>;
};

type DatabaseAuditItem = {
  id: string;
  action: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  entity: string;
  entityId: string | null;
  userName: string | null;
  createdAt: string;
};

type DatabaseAuditResponse = {
  items: DatabaseAuditItem[];
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export default function DatabaseSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [data, setData] = useState<BackupsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<DatabaseAuditItem[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [backupRetentionCount, setBackupRetentionCount] = useState('10');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && role !== 'ADMIN') router.push('/');
  }, [status, role, router]);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const [backupsResponse, settingsResponse, healthResponse, historyResponse] = await Promise.all([
        fetch('/api/database/backups', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/database/health', { cache: 'no-store' }),
        fetch('/api/audit-logs?module=database&limit=8', { cache: 'no-store' }),
      ]);
      const [backupsJson, settingsJson, healthJson, historyJson] = await Promise.all([
        backupsResponse.json(),
        settingsResponse.json(),
        healthResponse.json(),
        historyResponse.json(),
      ]);

      if (!backupsResponse.ok) {
        throw new Error(backupsJson.error || 'Erreur lors du chargement des sauvegardes');
      }
      if (!settingsResponse.ok) {
        throw new Error(settingsJson.error || 'Erreur lors du chargement des paramètres système');
      }
      if (!healthResponse.ok) {
        throw new Error((healthJson as { error?: string })?.error || 'Erreur lors du chargement de la santé système');
      }
      if (!historyResponse.ok) {
        throw new Error((historyJson as { error?: string })?.error || 'Erreur lors du chargement de l’historique');
      }

      setData(backupsJson as BackupsResponse);
      setHealth(healthJson as HealthResponse);
      setHistory((historyJson as DatabaseAuditResponse).items || []);
      setMaintenanceMode(settingsJson.maintenance_mode === 'true');
      setMaintenanceMessage(settingsJson.maintenance_message || '');
      setBackupRetentionCount(settingsJson.database_backup_retention_count || '10');
    } catch (error) {
      console.error('Database backups load error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
      setData(null);
      setHealth(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (status === 'authenticated' && role === 'ADMIN') {
      loadBackups();
    }
  }, [status, role, loadBackups]);

  const handleCreateBackup = useCallback(async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/database/backups', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors de la création de la sauvegarde');
      }

      showNotification('success', 'Sauvegarde créée avec succès');
      await loadBackups();
    } catch (error) {
      console.error('Database backup create error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [loadBackups, showNotification]);

  const handleRestoreBackup = useCallback(
    async (fileName: string) => {
      const typed = window.prompt(
        `Cette action va ecraser la base active avec ${fileName}.\nUne sauvegarde de securite sera creee avant restauration.\n\nTapez RESTAURER pour confirmer.`
      );

      if (typed !== 'RESTAURER') {
        return;
      }

      setRestoringFile(fileName);
      try {
        const response = await fetch(`/api/database/backups/${encodeURIComponent(fileName)}/restore`, {
          method: 'POST',
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || 'Erreur lors de la restauration');
        }

        showNotification('success', `Base restauree depuis ${fileName}`);
        await loadBackups();
      } catch (error) {
        console.error('Database backup restore error:', error);
        showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la restauration');
      } finally {
        setRestoringFile(null);
      }
    },
    [loadBackups, showNotification]
  );

  const newestBackup = useMemo(() => data?.items?.[0] ?? null, [data]);

  const handleSaveMaintenance = useCallback(async () => {
    setSavingMaintenance(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            maintenance_mode: maintenanceMode ? 'true' : 'false',
            maintenance_message: maintenanceMessage,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors de la mise a jour du mode maintenance');
      }

      showNotification('success', maintenanceMode ? 'Mode maintenance active' : 'Mode maintenance desactive');
    } catch (error) {
      console.error('Maintenance settings save error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingMaintenance(false);
    }
  }, [maintenanceMessage, maintenanceMode, showNotification]);

  const handleSaveRetention = useCallback(async () => {
    setSavingRetention(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            database_backup_retention_count: backupRetentionCount,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors de la mise a jour de la retention');
      }

      showNotification('success', 'Politique de retention enregistree');
    } catch (error) {
      console.error('Backup retention save error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingRetention(false);
    }
  }, [backupRetentionCount, showNotification]);

  const handlePruneBackups = useCallback(async () => {
    setPruning(true);
    try {
      const response = await fetch('/api/database/backups/prune', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors du nettoyage');
      }

      showNotification('success', json.message || 'Nettoyage termine');
      await loadBackups();
    } catch (error) {
      console.error('Database backup prune error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du nettoyage');
    } finally {
      setPruning(false);
    }
  }, [loadBackups, showNotification]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
            <ArrowLeft size={16} />
          </span>
          Paramètres
        </button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Maintenance base de données</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Créer des sauvegardes SQLite propres, les télécharger et garder une copie avant toute opération sensible.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/api/database/export-full" className="btn-secondary-sm">
              <Download size={16} />
              Export complet
            </a>
            <button onClick={loadBackups} className="btn-secondary-sm" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button onClick={handleCreateBackup} className="btn-primary-sm" disabled={creating}>
              <FolderArchive size={16} className={creating ? 'animate-pulse' : ''} />
              {creating ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
            </button>
          </div>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Historique visuel</h2>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Dernières actions liées aux sauvegardes, restaurations, exports et nettoyages.
            </p>
          </div>
          <button onClick={() => router.push('/dashboard/settings/audit')} className="btn-secondary-sm">
            Ouvrir l&apos;audit
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {history.length === 0 ? (
            <div className="rounded-2xl border bg-white px-4 py-5 text-sm text-[var(--color-text-soft)]">
              Aucun événement base de données récent.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={severityBadgeClass(item.severity)}>{item.severity}</span>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{formatDatabaseAction(item.action)}</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                    {item.userName || 'Système'} · {item.entity}
                    {item.entityId ? ` · ${item.entityId}` : ''}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-text-soft)]">
                  {new Date(item.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="bento-panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Database size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier actif</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{data?.databasePath || '—'}</p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <HardDrive size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernière sauvegarde</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {newestBackup ? new Date(newestBackup.createdAt).toLocaleString('fr-FR') : 'Aucune sauvegarde'}
              </p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dossier backups</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{data?.backupDirectory || '—'}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="bento-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Santé système</h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Vue rapide de l’état de la base, des sauvegardes et des alertes critiques.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          <HealthCard
            title="Base de données"
            status={health?.database.reachable && health?.database.fileExists ? 'ok' : 'alert'}
            value={health?.database.reachable && health?.database.fileExists ? 'Connectée' : 'À vérifier'}
            meta={health?.database.size ? `Taille: ${formatBytes(health.database.size)}` : 'Fichier indisponible'}
          />
          <HealthCard
            title="Sauvegardes"
            status={health?.backups.isFresh ? 'ok' : 'alert'}
            value={health?.backups.count ? `${health.backups.count} fichier(s)` : 'Aucune'}
            meta={
              health?.backups.latestCreatedAt
                ? `Dernière: ${new Date(health.backups.latestCreatedAt).toLocaleString('fr-FR')}`
                : 'Aucune sauvegarde récente'
            }
          />
          <HealthCard
            title="Espace backups"
            status={health?.backups.freeSpaceBytes && health.backups.freeSpaceBytes > 1024 * 1024 * 512 ? 'ok' : 'alert'}
            value={health?.backups.freeSpaceBytes ? formatBytes(health.backups.freeSpaceBytes) : 'Inconnu'}
            meta="Espace libre estimé"
          />
          <HealthCard
            title="Mode maintenance"
            status={health?.maintenance.enabled ? 'alert' : 'ok'}
            value={health?.maintenance.enabled ? 'Activé' : 'Désactivé'}
            meta={health?.maintenance.enabled ? 'Les utilisateurs non-admin sont bloqués' : 'Accès normal'}
          />
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Derniers événements critiques</h3>
          </div>

          <div className="mt-3 space-y-2">
            {!health || health.criticalLogs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-soft)]">Aucun événement critique récent.</p>
            ) : (
              health.criticalLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{log.action}</p>
                    <p className="text-xs text-[var(--color-text-soft)]">
                      {log.entity}
                      {log.entityId ? ` · ${log.entityId}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--color-text-soft)]">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Bonnes pratiques</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Crée une sauvegarde avant une migration, un import massif ou une maintenance sensible. Les téléchargements et restaurations sont journalisés dans l&apos;audit.
          </p>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <Trash2 size={20} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Politique de retention</h2>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                  Garde uniquement les N dernieres sauvegardes. La regle s&apos;applique automatiquement apres chaque nouveau backup.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-2xl space-y-4">
            <label className="block">
              <span className="form-label mb-1.5">Nombre de sauvegardes a conserver</span>
              <input
                type="number"
                min="0"
                max="200"
                value={backupRetentionCount}
                onChange={(e) => setBackupRetentionCount(e.target.value)}
                className="input-premium h-11 w-full md:max-w-xs"
                placeholder="10"
              />
              <p className="mt-2 text-xs text-[var(--color-text-soft)]">
                `0` desactive le nettoyage automatique. Valeur recommandee: `10`.
              </p>
            </label>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleSaveRetention} className="btn-primary-sm" disabled={savingRetention}>
                <ShieldCheck size={16} />
                {savingRetention ? 'Enregistrement...' : 'Enregistrer la retention'}
              </button>
              <button onClick={handlePruneBackups} className="btn-secondary-sm" disabled={pruning}>
                <Trash2 size={16} className={pruning ? 'animate-pulse' : ''} />
                {pruning ? 'Nettoyage...' : 'Appliquer maintenant'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Wrench size={20} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Mode maintenance guide</h2>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                  Active une page d&apos;attente pour les utilisateurs non administrateurs avant une restauration ou une intervention sensible.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-2xl space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Maintenance active</p>
                <p className="text-xs text-[var(--color-text-soft)]">Les admins gardent l&apos;acces, les autres voient l&apos;ecran de maintenance.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode((value) => !value)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="block">
              <span className="form-label mb-1.5">Message affiche aux utilisateurs</span>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={4}
                className="input-premium min-h-[120px] w-full resize-y py-3"
                placeholder="Maintenance en cours. Merci de revenir dans quelques minutes."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleSaveMaintenance} className="btn-primary-sm" disabled={savingMaintenance}>
                <ShieldCheck size={16} />
                {savingMaintenance ? 'Enregistrement...' : 'Enregistrer le mode maintenance'}
              </button>
              <a href="/maintenance" className="btn-secondary-sm">
                Voir l&apos;ecran public
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
        <div className="flex items-center justify-between border-b bg-[var(--color-surface-muted)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Sauvegardes disponibles</h2>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              {data?.items.length ?? 0} fichier(s) prêt(s) au téléchargement
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b bg-white text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Créé le</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Taille</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Chemin</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                    Chargement des sauvegardes...
                  </td>
                </tr>
              )}

              {!loading && (!data || data.items.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                    Aucune sauvegarde n&apos;a encore été créée.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.items.map((item) => (
                  <tr key={item.fileName} className="hover:bg-[var(--color-surface-muted)]/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[var(--color-text)]">{item.fileName}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                      {new Date(item.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{formatBytes(item.size)}</td>
                    <td className="max-w-[360px] px-5 py-4 text-xs text-[var(--color-text-soft)]">
                      <span className="line-clamp-2">{item.absolutePath}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRestoreBackup(item.fileName)}
                          className="btn-secondary-sm inline-flex"
                          disabled={Boolean(restoringFile)}
                        >
                          <RotateCcw size={16} className={restoringFile === item.fileName ? 'animate-spin' : ''} />
                          {restoringFile === item.fileName ? 'Restauration...' : 'Restaurer'}
                        </button>
                        <a href={`/api/database/backups/${encodeURIComponent(item.fileName)}`} className="btn-secondary-sm inline-flex">
                          <Download size={16} />
                          Télécharger
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}

function HealthCard({
  title,
  value,
  meta,
  status,
}: {
  title: string;
  value: string;
  meta: string;
  status: 'ok' | 'alert';
}) {
  return (
    <article className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">{title}</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">{meta}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
            status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {status === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </span>
      </div>
    </article>
  );
}

function severityBadgeClass(level: DatabaseAuditItem['severity']) {
  if (level === 'CRITICAL') return 'status-pill status-pill-error';
  if (level === 'WARN') return 'status-pill status-pill-warning';
  return 'status-pill status-pill-info';
}

function formatDatabaseAction(action: string) {
  const labels: Record<string, string> = {
    'database.backup_create': 'Sauvegarde créée',
    'database.backup_download': 'Sauvegarde téléchargée',
    'database.backup_restore': 'Base restaurée',
    'database.backup_prune': 'Nettoyage des sauvegardes',
    'database.full_export': 'Export complet généré',
  };

  return labels[action] || action;
}
