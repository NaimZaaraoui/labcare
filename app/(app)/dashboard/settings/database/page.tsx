'use client';

import { Download, FolderArchive, RefreshCw } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { DatabaseExternalBackupSection } from '@/components/database-settings/DatabaseExternalBackupSection';
import { DatabaseFileTable } from '@/components/database-settings/DatabaseFileTable';
import { DatabaseMaintenanceOverview } from '@/components/database-settings/DatabaseMaintenanceOverview';
import { DatabaseMaintenanceSection } from '@/components/database-settings/DatabaseMaintenanceSection';
import { DatabaseRecoverySection } from '@/components/database-settings/DatabaseRecoverySection';
import { DatabaseRetentionSection } from '@/components/database-settings/DatabaseRetentionSection';
import { DatabaseInfoCards } from '@/components/database-settings/DatabaseInfoCards';
import { DatabaseAuditHistory } from '@/components/database-settings/DatabaseAuditHistory';
import { DatabaseHealthSection } from '@/components/database-settings/DatabaseHealthSection';
import { DatabaseGuideSection } from '@/components/database-settings/DatabaseGuideSection';
import { useDatabaseSettings } from '@/components/database-settings/useDatabaseSettings';
import { formatBytes } from '@/components/database-settings/database-helpers';

export default function DatabaseSettingsPage() {
  const {
    status,
    role,
    loading,
    creating,
    creatingRecovery,
    importingRecovery,
    restoringFile,
    restoringRecoveryFile,
    savingMaintenance,
    savingRetention,
    pruning,
    data,
    recoveryBundles,
    health,
    history,
    maintenanceMode,
    maintenanceMessage,
    backupRetentionCount,
    externalTarget,
    recoveryImportFile,
    savingExternalTarget,
    restoreModal,
    notification,
    newestBackup,
    lastBackupStatus,
    warningItems,
    loadBackups,
    handleCreateBackup,
    handleCreateRecoveryBundle,
    handleImportRecoveryBundle,
    handleRestoreBackup,
    handleRestoreRecoveryBundle,
    handleConfirmRestore,
    handleSaveMaintenance,
    handleSaveRetention,
    handleSaveExternalTarget,
    handlePruneBackups,
    setRecoveryImportFile,
    setMaintenanceMode,
    setMaintenanceMessage,
    setBackupRetentionCount,
    setExternalTarget,
    setRestoreModal,
  } = useDatabaseSettings();

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
        <PageBackLink href="/dashboard/settings" />
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
            <button onClick={handleCreateRecoveryBundle} className="btn-secondary-sm" disabled={creatingRecovery}>
              <FolderArchive size={16} className={creatingRecovery ? 'animate-pulse' : ''} />
              {creatingRecovery ? 'Bundle en cours...' : 'Créer un bundle de reprise'}
            </button>
          </div>
        </div>
      </section>

      <DatabaseMaintenanceOverview
        label={lastBackupStatus.label}
        description={lastBackupStatus.description}
        tone={lastBackupStatus.tone}
        health={health}
        warningItems={warningItems}
      />

      <DatabaseAuditHistory history={history} />

      <DatabaseInfoCards data={data} newestBackupCreatedAt={newestBackup?.createdAt} />

      <DatabaseExternalBackupSection
        externalTarget={externalTarget}
        health={health}
        saving={savingExternalTarget}
        onExternalTargetChange={setExternalTarget}
        onSave={handleSaveExternalTarget}
      />

      <DatabaseRecoverySection
        recoveryImportFile={recoveryImportFile}
        importingRecovery={importingRecovery}
        onRecoveryImportFileChange={setRecoveryImportFile}
        onImport={handleImportRecoveryBundle}
      />

      <DatabaseHealthSection health={health} />

      <DatabaseGuideSection />

      <DatabaseRetentionSection
        backupRetentionCount={backupRetentionCount}
        savingRetention={savingRetention}
        pruning={pruning}
        onBackupRetentionCountChange={setBackupRetentionCount}
        onSaveRetention={handleSaveRetention}
        onPrune={handlePruneBackups}
      />

      <DatabaseMaintenanceSection
        maintenanceMode={maintenanceMode}
        maintenanceMessage={maintenanceMessage}
        savingMaintenance={savingMaintenance}
        onMaintenanceModeToggle={() => setMaintenanceMode((v) => !v)}
        onMaintenanceMessageChange={setMaintenanceMessage}
        onSaveMaintenance={handleSaveMaintenance}
      />

      <DatabaseFileTable
        title="Sauvegardes disponibles"
        subtitle={`${data?.items.length ?? 0} fichier(s) prêt(s) au téléchargement`}
        items={data?.items}
        loading={loading}
        restoringFile={restoringFile}
        onRestore={handleRestoreBackup}
        getDownloadHref={(fileName) => `/api/database/backups/${encodeURIComponent(fileName)}`}
        emptyLabel="Aucune sauvegarde n'a encore été créée."
        formatBytes={formatBytes}
      />

      <DatabaseFileTable
        title="Bundles de reprise"
        subtitle={`${recoveryBundles?.items.length ?? 0} archive(s) complète(s) prêtes au téléchargement`}
        items={recoveryBundles?.items}
        loading={loading}
        restoringFile={restoringRecoveryFile}
        onRestore={handleRestoreRecoveryBundle}
        getDownloadHref={(fileName) => `/api/database/recovery-bundles/${encodeURIComponent(fileName)}`}
        emptyLabel="Aucun bundle de reprise n'a encore été créé."
        formatBytes={formatBytes}
      />

      <ConfirmationModal
        isOpen={restoreModal.isOpen}
        onClose={() => setRestoreModal({ isOpen: false, kind: null, fileName: null })}
        onConfirm={handleConfirmRestore}
        title={restoreModal.kind === 'bundle' ? 'Restaurer un bundle de reprise' : 'Restaurer une sauvegarde'}
        message={
          restoreModal.kind === 'bundle'
            ? `Cette action va restaurer la base active et les fichiers uploads depuis ${restoreModal.fileName || 'le bundle sélectionné'}. Un bundle de sécurité sera créé avant écrasement.`
            : `Cette action va écraser la base active avec ${restoreModal.fileName || 'la sauvegarde sélectionnée'}. Une sauvegarde de sécurité sera créée avant restauration.`
        }
        confirmText="Restaurer"
        cancelText="Annuler"
        type="danger"
        icon="warning"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
