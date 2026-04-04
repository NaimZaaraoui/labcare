'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Result } from '@/lib/types';
import { NotificationToast } from '@/components/ui/notification-toast';
import { EditAnalysisDialog } from './EditAnalysisDialog';
import { DiatronImportDialog } from './DiatronImportDialog';
import { AnalysisHeaderPanel } from './AnalysisHeaderPanel';
import { AnalysisResultsPanel } from './AnalysisResultsPanel';
import {
  calculateResultMetrics,
  getPaymentStatusDisplay,
  performHematologyCalculations,
} from './resultats-metrics';
import { sortAnalysisResults } from './resultats-sorting';
import { useAnalysisValidation } from './useAnalysisValidation';
import { useDiatronImport } from './useDiatronImport';
import { useResultatsData } from './useResultatsData';
import { useResultInteractions } from './useResultInteractions';
import { useResultatsPersistence } from './useResultatsPersistence';
import { useResultatsUi } from './useResultatsUi';
import type { AnalysisInputsMap, AnalysisNotification } from './types';
interface ResultatsFormProps {
  analysisId: string;
}

const NFS_SORT_ORDER = [
  'GB', 'WBC', 
  'LYM',
  'MID', 'MON',
  'GRA', 'GRAN',
  'LYM%',
  'MID%', 'MON%',
  'GRA%',
  'GR', 'RBC', 'HB', 'HGB',
  'HT', 'HCT', 'VGM', 'CCMH', 'TCMH', 'IDR', 'RDW', 'PLT'
];


export function ResultatsForm({ analysisId }: ResultatsFormProps) {
  const session = useSession();
  const inputsRef = useRef<AnalysisInputsMap>({});
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [saveGlobalNoteBusy, setSaveGlobalNoteBusy] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Erreur inconnue';

  const {
    analysis,
    setAnalysis,
    loading,
    results,
    setResults,
    history,
    emailConfigured,
    availableTests,
    selectedTestIds,
    setSelectedTestIds,
    paymentAmountInput,
    setPaymentAmountInput,
    paymentMethod,
    setPaymentMethod,
    globalNote,
    setGlobalNote,
    globalNotePlacement,
    setGlobalNotePlacement,
    editForm,
    setEditForm,
    reportSettings,
    initialResultNotes,
    loadAnalysis,
  } = useResultatsData({
    analysisId,
  });

  const {
    notes,
    draftNotes,
    expandedNotes,
    activeTab,
    setActiveTab,
    selectedIds,
    toggleSelection,
    toggleNote,
    handleNoteChange,
    applyNote,
    deleteNote,
    toggleSelectAll,
    initializeFromAnalysis,
  } = useResultInteractions({
    analysis,
    showNotification: (type, message) => showNotification(type, message),
  });

  const sortedResults = sortAnalysisResults(analysis?.results ?? []);

  const handleResultChange = (resultId: string, value: string) => {
    setResults((prev) => {
      const newResults = { ...prev, [resultId]: value };
      return performHematologyCalculations(analysis, newResults);
    });
  };

  const [notification, setNotification] = useState<AnalysisNotification | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    console.log('🔔 Notification:', { type, message });
    setNotification({ type, message });
    
    notificationTimeoutRef.current = setTimeout(() => {
      console.log('🔔 Notification cleared');
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    initializeFromAnalysis(initialResultNotes);
  }, [initialResultNotes, initializeFromAnalysis]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const {
    validating,
    validationError,
    qcReadiness,
    loadQcReadiness,
    handleValidation,
  } = useAnalysisValidation({
    analysisId,
    analysis,
    results,
    showNotification,
    onValidated: loadAnalysis,
  });

  useEffect(() => {
    loadQcReadiness();
  }, [loadQcReadiness]);

  const {
    fileInputRef,
    isImporting,
    diatronPreview,
    setDiatronPreview,
    handleDiatronFileChange,
    handleDiatronSelect,
  } = useDiatronImport({
    analysisId,
    onImportSuccess: loadAnalysis,
    showNotification,
    getErrorMessage,
  });

  const {
    formatValue,
    handleKeyDown,
    toggleSelectedTest,
    handlePrint,
    handlePrintInvoice,
  } = useResultatsUi({
    analysisId,
    selectedIds,
    sortedResults,
    inputsRef,
    setSelectedTestIds,
  });

  const {
    handleSave,
    saveGlobalNote,
    saveAnalysisMeta,
    handleSavePayment,
    handlePayAll,
    handleSendEmail,
  } = useResultatsPersistence({
    analysisId,
    analysis,
    results,
    notes,
    globalNote,
    globalNotePlacement,
    editForm,
    selectedTestIds,
    paymentAmountInput,
    paymentMethod,
    emailConfigured,
    showNotification,
    getErrorMessage,
    loadAnalysis,
    setAnalysis,
    setSaving,
    setSaveGlobalNoteBusy,
    setSavingMeta,
    setEditDialogOpen,
    setSendingEmail,
    setSavingPayment,
    setPaymentAmountInput,
  });
  if (loading || !analysis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-slate-100 rounded-3xl" />
        <div className="h-80 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  const { totalCount, abnormalCount, progressPct } = calculateResultMetrics(analysis, results);
  const isFinalValidated = analysis.status === 'validated_bio' || analysis.status === 'completed';
  const role = session?.data?.user?.role || '';
  const canTech = ['TECHNICIEN', 'ADMIN'].includes(role);
  const canBio = ['MEDECIN', 'ADMIN'].includes(role);
  const hasNFS = analysis.results.some((r: Result) => r.test && NFS_SORT_ORDER.includes(r.test.code));

  const hasQcBlockers = Boolean(qcReadiness && !qcReadiness.ready && qcReadiness.blockers.length > 0);
  const paymentTotal = analysis.totalPrice ?? 0;
  const paymentPaid = analysis.amountPaid ?? 0;
  const paymentRemaining = Math.max(0, paymentTotal - paymentPaid);
  const currencyUnit = reportSettings.amount_unit || 'DA';
  const paymentStatusDisplay = getPaymentStatusDisplay(analysis.paymentStatus);

  return (
    <>
      <div className="flex flex-col gap-5 pb-16">

      <AnalysisHeaderPanel
        analysis={analysis}
        validationError={validationError}
        qcReadiness={qcReadiness}
        hasQcBlockers={hasQcBlockers}
        isFinalValidated={isFinalValidated}
        canTech={canTech}
        canBio={canBio}
        validating={validating}
        selectedIdsCount={selectedIds.length}
        sendingEmail={sendingEmail}
        emailConfigured={emailConfigured}
        saving={saving}
        paymentTotal={paymentTotal}
        paymentPaid={paymentPaid}
        paymentRemaining={paymentRemaining}
        paymentStatusLabel={paymentStatusDisplay.label}
        paymentStatusClasses={paymentStatusDisplay.classes}
        paymentAmountInput={paymentAmountInput}
        setPaymentAmountInput={setPaymentAmountInput}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        handlePayAll={handlePayAll}
        handleSavePayment={handleSavePayment}
        savingPayment={savingPayment}
        role={role}
        currencyUnit={currencyUnit}
        progressPct={progressPct}
        abnormalCount={abnormalCount}
        globalNote={globalNote}
        setGlobalNote={setGlobalNote}
        globalNotePlacement={globalNotePlacement}
        setGlobalNotePlacement={setGlobalNotePlacement}
        saveGlobalNote={saveGlobalNote}
        saveGlobalNoteBusy={saveGlobalNoteBusy}
        onEdit={() => setEditDialogOpen(true)}
        onValidate={handleValidation}
        onPrintInvoice={handlePrintInvoice}
        onOpenLabels={() => window.open(`/print/labels/${analysis.id}`, '_blank', 'noopener,noreferrer')}
        onSave={handleSave}
        onPrint={handlePrint}
        onSendEmail={handleSendEmail}
      />

      <AnalysisResultsPanel
        analysis={analysis}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={totalCount}
        abnormalCount={abnormalCount}
        isFinalValidated={isFinalValidated}
        hasNFS={hasNFS}
        isImporting={isImporting}
        fileInputRef={fileInputRef}
        handleDiatronFileChange={handleDiatronFileChange}
        toggleSelectAll={() => toggleSelectAll(totalCount)}
        selectedIds={selectedIds}
        sortedResults={sortedResults}
        results={results}
        history={history}
        notes={notes}
        draftNotes={draftNotes}
        expandedNotes={expandedNotes}
        inputsRef={inputsRef}
        handleResultChange={handleResultChange}
        formatValue={formatValue}
        handleKeyDown={handleKeyDown}
        toggleSelection={toggleSelection}
        toggleNote={toggleNote}
        handleNoteChange={handleNoteChange}
        applyNote={applyNote}
        deleteNote={deleteNote}
      />
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
    </>
  );
}
