'use client';

import { NotificationToast } from '@/components/ui/notification-toast';
import { EditAnalysisDialog } from './EditAnalysisDialog';
import { DiatronImportDialog } from './DiatronImportDialog';
import { AnalysisHeaderPanel } from './AnalysisHeaderPanel';
import { AnalysisResultsPanel } from './AnalysisResultsPanel';
import { AnalysisProvider, useAnalysisContext } from './AnalysisContext';

function ResultatsFormContent() {
  const {
    loading,
    analysis,
    notification,
    diatronPreview,
    setDiatronPreview,
    handleDiatronSelect,
    editDialogOpen,
    setEditDialogOpen,
    editForm,
    setEditForm,
    selectedTestIds,
    toggleSelectedTest,
    testSearch,
    setTestSearch,
    availableTests,
    saveAnalysisMeta,
    savingMeta,
    printUrl
  } = useAnalysisContext();

  if (loading || !analysis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-[var(--color-surface-muted)]" />
        <div className="h-80 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5 pb-16">
        <AnalysisHeaderPanel />
        <AnalysisResultsPanel />
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}

      <DiatronImportDialog
        preview={diatronPreview}
        onCancel={() => setDiatronPreview(null)}
        onSelect={handleDiatronSelect}
      />

      <EditAnalysisDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        selectedTestIds={selectedTestIds}
        toggleSelectedTest={toggleSelectedTest}
        testSearch={testSearch}
        setTestSearch={setTestSearch}
        availableTests={availableTests}
        saveAnalysisMeta={saveAnalysisMeta}
        savingMeta={savingMeta}
      />

      {printUrl && (
        <iframe
          src={printUrl}
          title="Print Engine Frame"
          className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
          tabIndex={-1}
          style={{ border: 0, left: -10000, top: -10000 }}
        />
      )}
    </>
  );
}

export function ResultatsForm({ analysisId }: { analysisId: string }) {
  return (
    <AnalysisProvider analysisId={analysisId}>
      <ResultatsFormContent />
    </AnalysisProvider>
  );
}
