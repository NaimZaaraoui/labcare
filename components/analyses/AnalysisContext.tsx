'use client';

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useResultatsData } from './useResultatsData';
import { useResultInteractions } from './useResultInteractions';
import { useAnalysisValidation } from './useAnalysisValidation';
import { useDiatronImport } from './useDiatronImport';
import { useResultatsUi } from './useResultatsUi';
import { useResultatsPersistence } from './useResultatsPersistence';
import { sortAnalysisResults } from './resultats-sorting';
import { calculateResultMetrics, performHematologyCalculations } from './resultats-metrics';
import type { AnalysisInputsMap, AnalysisNotification } from './types';
import type { Analysis, Result } from '@/lib/types';

// Extract the return types from the hooks to build our Context interface
type ResultatsDataRet = ReturnType<typeof useResultatsData>;
type ResultInteractionsRet = ReturnType<typeof useResultInteractions>;
type AnalysisValidationRet = ReturnType<typeof useAnalysisValidation>;
type DiatronImportRet = ReturnType<typeof useDiatronImport>;
type ResultatsUiRet = ReturnType<typeof useResultatsUi>;
type ResultatsPersistenceRet = ReturnType<typeof useResultatsPersistence>;

export interface AnalysisContextType extends 
  ResultatsDataRet, 
  ResultInteractionsRet, 
  AnalysisValidationRet, 
  DiatronImportRet, 
  ResultatsUiRet, 
  ResultatsPersistenceRet {
    inputsRef: React.MutableRefObject<AnalysisInputsMap>;
    saving: boolean;
    sendingEmail: boolean;
    testSearch: string;
    setTestSearch: React.Dispatch<React.SetStateAction<string>>;
    savingMeta: boolean;
    saveGlobalNoteBusy: boolean;
    savingPayment: boolean;
    editDialogOpen: boolean;
    setEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    notification: AnalysisNotification | null;
    showNotification: (type: 'success' | 'error', message: string) => void;
    sortedResults: ReturnType<typeof sortAnalysisResults>;
    role: string;
    canTech: boolean;
    canBio: boolean;
    hasNFS: boolean;
    totalCount: number;
    abnormalCount: number;
    progressPct: number;
    isFinalValidated: boolean;
    hasQcBlockers: boolean;
    handleResultChange: (resultId: string, value: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
}

interface AnalysisProviderProps {
  analysisId: string;
  children: React.ReactNode;
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

export function AnalysisProvider({ analysisId, children }: AnalysisProviderProps) {
  const session = useSession();
  const role = session?.data?.user?.role || '';
  const canTech = ['TECHNICIEN', 'ADMIN'].includes(role);
  const canBio = ['MEDECIN', 'ADMIN'].includes(role);

  const inputsRef = useRef<AnalysisInputsMap>({});
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [saveGlobalNoteBusy, setSaveGlobalNoteBusy] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [notification, setNotification] = useState<AnalysisNotification | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Erreur inconnue';

  // 1. Data Hook
  const resultatsData = useResultatsData({ analysisId });
  const { analysis, results, setResults, emailConfigured, selectedTestIds, paymentAmountInput, setPaymentAmountInput, paymentMethod, globalNote, globalNotePlacement, editForm, initialResultNotes, loadAnalysis, setAnalysis } = resultatsData;

  // 2. Interactions Hook
  const interactionsData = useResultInteractions({
    analysis,
    showNotification,
  });

  useEffect(() => {
    interactionsData.initializeFromAnalysis(initialResultNotes);
  }, [initialResultNotes, interactionsData.initializeFromAnalysis]);

  // Derived Values
  const sortedResults = sortAnalysisResults(analysis?.results ?? []);
  const hasNFS = analysis?.results?.some((r: Result) => r.test && NFS_SORT_ORDER.includes(r.test.code)) ?? false;
  
  const { totalCount, abnormalCount, progressPct } = analysis ? calculateResultMetrics(analysis, results) : { totalCount: 0, abnormalCount: 0, progressPct: 0 };

  // 3. Validation Hook
  const validationData = useAnalysisValidation({
    analysisId,
    analysis,
    results,
    showNotification,
    onValidated: loadAnalysis,
  });

  useEffect(() => {
    validationData.loadQcReadiness();
  }, [validationData.loadQcReadiness]);

  const isFinalValidated = analysis?.status === 'validated_bio' || analysis?.status === 'completed';
  const hasQcBlockers = Boolean(validationData.qcReadiness && !validationData.qcReadiness.ready && validationData.qcReadiness.blockers.length > 0);

  const handleResultChange = (resultId: string, value: string) => {
    setResults((prev: Record<string, string>) => {
      const newResults = { ...prev, [resultId]: value };
      return performHematologyCalculations(analysis, newResults);
    });
  };

  // 4. Import Hook
  const importData = useDiatronImport({
    analysisId,
    onImportSuccess: loadAnalysis,
    showNotification,
    getErrorMessage,
  });

  // 5. UI Hook
  const uiData = useResultatsUi({
    analysisId,
    selectedIds: interactionsData.selectedIds,
    sortedResults,
    inputsRef,
    setSelectedTestIds: resultatsData.setSelectedTestIds,
  });

  // 6. Persistence Hook
  const persistenceData = useResultatsPersistence({
    analysisId,
    analysis,
    results,
    notes: interactionsData.notes,
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

  const value: AnalysisContextType = {
    ...resultatsData,
    ...interactionsData,
    ...validationData,
    ...importData,
    ...uiData,
    ...persistenceData,
    inputsRef,
    saving,
    sendingEmail,
    testSearch,
    setTestSearch,
    savingMeta,
    saveGlobalNoteBusy,
    savingPayment,
    editDialogOpen,
    setEditDialogOpen,
    notification,
    showNotification,
    sortedResults,
    role,
    canTech,
    canBio,
    hasNFS,
    totalCount,
    abnormalCount,
    progressPct,
    isFinalValidated,
    hasQcBlockers,
    handleResultChange,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}
