'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Save, Printer, CheckCircle, 
  Activity, ArrowLeft, Beaker, 
  Microscope, Sparkles, AlertCircle,
  ChevronRight, History, Calculator, MessageSquare, Mail,
  PencilLine, 
  NotepadTextIcon
} from 'lucide-react';
import { getTestReferenceValues, formatReferenceRange } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { RapportImpression } from '@/components/print/RapportImpression';
import { FactureImpression } from '@/components/print/FactureImpression';
import { Analysis, Result, Test } from '@/lib/types';
import { ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationToast } from '@/components/ui/notification-toast';
import { getCategoryIcon } from '@/lib/category-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { HistogramView } from './HistogramView';
import { getHematologyInterpretations } from '@/lib/interpretations';


interface ResultatsFormProps {
  analysisId: string;
}

interface AvailableTestOption {
  id: string;
  code: string;
  name: string;
}

interface AnalysisQcReadiness {
  ready: boolean;
  blockers: Array<{
    materialName: string;
    lotNumber: string;
    status: 'missing' | 'fail';
    tests: string[];
  }>;
  relevantLots: number;
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
  const router = useRouter();
  const session = useSession();
  const printRef = useRef<HTMLDivElement>(null);
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});
  
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
  });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [qcReadiness, setQcReadiness] = useState<AnalysisQcReadiness | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState<Record<string, Result | null>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [diatronPreview, setDiatronPreview] = useState<{ index: number; sampleId: string; date: string; time: string }[] | null>(null);
  const [lastFileContent, setLastFileContent] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [availableTests, setAvailableTests] = useState<AvailableTestOption[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [saveGlobalNoteBusy, setSaveGlobalNoteBusy] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [savingPayment, setSavingPayment] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [globalNote, setGlobalNote] = useState('');
  const [globalNotePlacement, setGlobalNotePlacement] = useState<'all' | 'first' | 'last'>('all');
  const [editForm, setEditForm] = useState({
    dailyId: '',
    receiptNumber: '',
    patientFirstName: '',
    patientLastName: '',
    patientAge: '',
    patientGender: 'M',
    provenance: '',
    medecinPrescripteur: '',
    isUrgent: false
  });
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleNote = (id: string) => {
    const isOpening = !expandedNotes.includes(id);
    if (isOpening) {
        setDraftNotes(prev => ({ ...prev, [id]: notes[id] || '' }));
    }
    setExpandedNotes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNoteChange = (id: string, value: string) => {
    setDraftNotes(prev => ({ ...prev, [id]: value }));
  };

  const applyNote = (id: string) => {
    setNotes(prev => ({ ...prev, [id]: draftNotes[id] || '' }));
    showNotification('success', 'Note enregistrée localement (pensez à sauvegarder l\'analyse)');
    toggleNote(id);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[id];
        return newNotes;
    });
    setDraftNotes(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[id];
        return newDrafts;
    });
    showNotification('success', 'Note supprimée');
    if (expandedNotes.includes(id)) toggleNote(id);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === totalCount) {
      setSelectedIds([]);
    } else {
      setSelectedIds(analysis?.results.filter((r: Result) => !r.test?.isGroup).map((r: Result) => r.id) || []);
    }
  };

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Erreur inconnue';

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setReportSettings(data);
      }
    } catch (e) {
      console.error('Erreur chargement paramètres impression', e);
    }
  }, []);

  const loadHistory = useCallback(async (patientId: string, testId: string, resultId: string) => {
    try {
      const response = await fetch(`/api/results/history?patientId=${patientId}&testId=${testId}&currentAnalysisId=${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(prev => ({ ...prev, [resultId]: data }));
      }
    } catch (e) {
      console.error('History fetch error', e);
    }
  }, [analysisId]);

  const loadAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}`);
      if (!response.ok) throw new Error('Analyse non trouvée');
      const data = await response.json();
      setAnalysis(data);
      const initialResults: Record<string, string> = {};
      const initialNotes: Record<string, string> = {};
      data.results.forEach((result: Result) => {
        initialResults[result.id] = result.value || '';
        if (result.notes) initialNotes[result.id] = result.notes;
        loadHistory(data.patientId, result.testId, result.id);
      });
      setResults(initialResults);
      setNotes(initialNotes);
      setGlobalNote(data.globalNote || '');
      setGlobalNotePlacement(data.globalNotePlacement || 'all');
      setPaymentAmountInput(String(data.amountPaid ?? 0));
      setPaymentMethod(data.paymentMethod || 'cash');
      setEditForm({
        dailyId: data.dailyId || '',
        receiptNumber: data.receiptNumber || '',
        patientFirstName: data.patientFirstName || '',
        patientLastName: data.patientLastName || '',
        patientAge: data.patientAge !== null && data.patientAge !== undefined ? String(data.patientAge) : '',
        patientGender: data.patientGender || 'M',
        provenance: data.provenance || '',
        medecinPrescripteur: data.medecinPrescripteur || '',
        isUrgent: Boolean(data.isUrgent)
      });
      setSelectedTestIds(Array.from(new Set(data.results.map((r: Result) => r.testId))));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [analysisId, loadHistory]);

  const loadTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) {
        setAvailableTests([]);
        return;
      }
      const normalized = data
        .filter((item): item is { id: string; code?: string; name?: string } => Boolean(item?.id))
        .map((item) => ({
          id: item.id,
          code: item.code ?? '',
          name: item.name ?? '',
        }));
      setAvailableTests(normalized);
    } catch (error) {
      console.error('Erreur chargement tests', error);
    }
  }, []);

  const loadQcReadiness = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}/qc-readiness`, { cache: 'no-store' });
      if (!response.ok) {
        setQcReadiness(null);
        return;
      }
      const data = await response.json();
      setQcReadiness(data);
    } catch (error) {
      console.error('Erreur chargement statut QC analyse', error);
      setQcReadiness(null);
    }
  }, [analysisId]);

  useEffect(() => {
    loadAnalysis();
    loadTests();
    loadSettings();
    loadQcReadiness();
  }, [loadAnalysis, loadSettings, loadTests, loadQcReadiness]);

  const handleResultChange = (resultId: string, value: string) => {
    setResults(prev => {
      const newResults = { ...prev, [resultId]: value };
      return performCalculations(newResults);
    });
  };

  const formatValue = (value: string, decimals: number = 1): string => {
    if (!value) return '';
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return value;
    return num.toFixed(decimals).replace('.', ',');
  };

    const performCalculations = (currentResults: Record<string, string>) => {
      if (!analysis) return currentResults;
      const updatedResults = { ...currentResults };
      
      const getVal = (code: string) => {
        const res = analysis.results.find((r: Result) => r.test?.code === code);
        if (!res) return null;
        const val = updatedResults[res.id];
        return val ? parseFloat(val.replace(',', '.')) : null;
      };

      const setVal = (code: string, value: number) => {
        const res = analysis.results.find((r: Result) => r.test?.code === code);
        if (res) {
          const decimals = res.test?.decimals ?? 1;
          updatedResults[res.id] = value.toFixed(decimals).replace('.', ',');
        }
      };

      const rbc = getVal('RBC') || getVal('GR');
      const hgb = getVal('HGB') || getVal('HB');
      const hct = getVal('HCT') || getVal('HT');
      const wbc = getVal('WBC') || getVal('GB');

      if (rbc && hct && rbc > 0) setVal('VGM', (hct / rbc) * 10);
      if (hgb && rbc && rbc > 0) setVal('TCMH', (hgb * 10) / rbc);
      if (hgb && hct && hct > 0) setVal('CCMH', (hgb / hct) * 100);

    if (wbc) {
        const diffMap = [
          { pct: 'GRA%', abs: 'GRA' },
          { pct: 'LYM%', abs: 'LYM' },
          { pct: 'MID%', abs: 'MID' }
        ];

      diffMap.forEach(({ pct, abs }) => {
        const pVal = getVal(pct);
        if (pVal !== null) setVal(abs, ((pVal / 100) * wbc));
      });
    }

    return updatedResults;
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = (index + 1) % total;
    const nextId = sortedResults[nextIndex]?.id;
    
    if (sortedResults[nextIndex]?.test?.isGroup) {
      handleKeyDown(e, nextIndex, total);
      return;
    }

    if (nextId && inputsRef.current[nextId]) {
      inputsRef.current[nextId]?.focus();
    }
  }
};

  const isAbnormal = (value: string, test: Test) => {
    if (!value) return false;
    const refVals = getTestReferenceValues(test, analysis?.patientGender);
    const min = refVals?.min ?? test.minValue;
    const max = refVals?.max ?? test.maxValue;
    
    if (min === null && max === null) return false;
    
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return false;

    if (max !== null && num > max) return true;
    if (min !== null && num < min) return true;
    return false;
  };

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
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
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, notes }),
      });
      if (!response.ok) {
        let errorMessage = 'Erreur serveur';
        const bodyText = await response.text();
        try {
          const error = JSON.parse(bodyText);
          errorMessage = error.error || error.details || errorMessage;
        } catch {
          errorMessage = bodyText || errorMessage;
        }
        console.error('Save error:', errorMessage);
        throw new Error(errorMessage);
      }
      await loadAnalysis();
      showNotification('success', 'Résultats sauvegardés avec succès');
    } catch (error) {
      console.error('Save exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      showNotification('error', `Erreur lors de la sauvegarde: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const saveGlobalNote = async () => {
    setSaveGlobalNoteBusy(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalNote, globalNotePlacement }),
      });
      if (!response.ok) throw new Error('Impossible d’enregistrer la note globale');
      const updated = await response.json();
      setAnalysis(updated);
      showNotification('success', 'Note globale enregistrée');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors de la sauvegarde de la note globale');
    } finally {
      setSaveGlobalNoteBusy(false);
    }
  };

  const saveAnalysisMeta = async () => {
    setSavingMeta(true);
    try {
      const testsResponse = await fetch(`/api/analyses/${analysisId}/results`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testsIds: selectedTestIds
        }),
      });
      if (!testsResponse.ok) throw new Error('Impossible de mettre à jour les tests sélectionnés');

      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyId: editForm.dailyId,
          receiptNumber: editForm.receiptNumber,
          patientFirstName: editForm.patientFirstName,
          patientLastName: editForm.patientLastName,
          patientAge: editForm.patientAge,
          patientGender: editForm.patientGender,
          provenance: editForm.provenance,
          medecinPrescripteur: editForm.medecinPrescripteur,
          isUrgent: editForm.isUrgent
        }),
      });
      if (!response.ok) throw new Error('Impossible de mettre à jour le dossier');
      await response.json();
      await loadAnalysis();
      setEditDialogOpen(false);
      showNotification('success', 'Dossier mis à jour');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors de la mise à jour du dossier');
    } finally {
      setSavingMeta(false);
    }
  };

  const toggleSelectedTest = (testId: string) => {
    setSelectedTestIds(prev => (
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    ));
  };

  const handleValidation = async (type: 'tech' | 'bio') => {
    if (!analysis) return;
    if (type === 'tech') {
      const tc = analysis.results.filter((r: Result) => !r.test?.isGroup).length;
      const cc = analysis.results.filter((r: Result) => !r.test?.isGroup && Boolean(results[r.id]) && results[r.id] !== '').length;
      if (tc === 0 || cc < tc) {
        setValidationError('Saisissez tous les résultats et sauvegardez avant la validation technique.');
        showNotification('error', 'Saisissez tous les résultats et sauvegardez avant la validation technique.');
        return;
      }
    }
    setValidating(true);
    setValidationError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error || 'Erreur de validation');
        return;
      }
      await loadAnalysis();
      await loadQcReadiness();
      showNotification('success', type === 'tech'
        ? 'Validation technique enregistrée'
        : 'Résultats libérés — validation biologique enregistrée');
    } catch {
      setValidationError('Erreur réseau');
    } finally {
      setValidating(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rapport_${analysis?.orderNumber}`,
    pageStyle: `@page {size: A4 landscape; margin: 12mm 10mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`,
    onAfterPrint: async () => {
      try {
        await fetch(`/api/analyses/${analysisId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printedAt: new Date().toISOString() })
        });
      } catch (error) {
        console.error('Error tracking print:', error);
      }
    }
  });

  const handleSendEmail = async () => {
    if (!analysis) return;
    
    const recipientEmail = analysis.patient?.email;
    if (!recipientEmail) {
      showNotification('error', 'Le patient n\'a pas d\'adresse email renseignée.');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors de l\'envoi');
      }

      showNotification('success', `Email envoyé avec succès à ${recipientEmail}`);
    } catch (error: unknown) {
      console.error('Email error:', error);
      showNotification('error', getErrorMessage(error) || 'Échec de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSavePayment = async () => {
    if (!analysis) return;
    const parsed = Number(paymentAmountInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      showNotification('error', 'Montant payé invalide');
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: parsed,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du paiement');
      }
      await loadAnalysis();
      showNotification('success', 'Paiement mis à jour');
    } catch (error: unknown) {
      console.error(error);
      showNotification('error', getErrorMessage(error));
    } finally {
      setSavingPayment(false);
    }
  };


  const handleDiatronFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      setLastFileContent(content);
      const res = await fetch(`/api/analyses/${analysisId}/import/diatron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l\'import');
      }

      const data = await res.json();
      
      if (data.preview) {
        setDiatronPreview(data.records);
      } else {
        showNotification('success', data.message || 'Importation réussie');
        await loadAnalysis();
      }
    } catch (error: unknown) {
      console.error(error);
      showNotification('error', getErrorMessage(error));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDiatronSelect = async (index: number) => {
    if (!lastFileContent) return;
    
    setIsImporting(true);
    setDiatronPreview(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/import/diatron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lastFileContent, selectedIndex: index })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l\'import');
      }

      const data = await res.json();
      showNotification('success', data.message || 'Importation réussie');
      await loadAnalysis();
    } catch (error: unknown) {
      console.error(error);
      showNotification('error', getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-slate-100 rounded-3xl" />
        <div className="h-80 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  const totalCount = analysis.results.filter((r: Result) => !r.test?.isGroup).length;
  const completedCount = analysis.results.filter((r: Result) => {
    return !r.test?.isGroup && Boolean(results[r.id]) && results[r.id] !== '';
  }).length;
  const abnormalCount = analysis.results.filter((r: Result) => {
    const val = results[r.id];
    const test = r.test;
    if (!test || test.isGroup) return false;
    const refVals = getTestReferenceValues(test, analysis.patientGender);
    return (refVals.min !== null || refVals.max !== null) && isAbnormal(val, test);
  }).length;
  const isFinalValidated = analysis.status === 'validated_bio' || analysis.status === 'completed';
  const role = session?.data?.user?.role || '';
  const canTech = ['TECHNICIEN', 'ADMIN'].includes(role);
  const canBio = ['MEDECIN', 'ADMIN'].includes(role);
  const hasNFS = analysis.results.some((r: Result) => r.test && NFS_SORT_ORDER.includes(r.test.code));

    const sortResults = (results: Result[]): (Result & { renderCategory?: string })[] => {
      const sorted: (Result & { renderCategory?: string })[] = [];
      const visited = new Set<string>();

      const addTestAndChildren = (testId: string, renderCategory: string) => {
        if (visited.has(testId)) return;
        const result = results.find(r => r.testId === testId);
        if (result) {
          sorted.push({ ...result, renderCategory });
          visited.add(testId);
          
          const children = results.filter(r => r.test?.parentId === testId);
          children.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
          children.forEach(child => addTestAndChildren(child.testId, renderCategory));
        }
      };

      const categoryGroups: Record<string, Result[]> = {};
      const categoriesMeta: Record<string, { rank: number, name: string }> = {};

      results.forEach(res => {
        const catRel = res.test?.categoryRel;
        const catName = catRel?.name || "Divers";
        const catRank = catRel?.rank ?? 999;
        
        if (!categoryGroups[catName]) {
            categoryGroups[catName] = [];
            categoriesMeta[catName] = { rank: catRank, name: catName };
        }
        categoryGroups[catName].push(res);
      });

      const categories = Object.keys(categoryGroups).sort((a, b) => {
        const metaA = categoriesMeta[a];
        const metaB = categoriesMeta[b];
        if (metaA.rank !== metaB.rank) return metaA.rank - metaB.rank;
        return a.localeCompare(b);
      });

      categories.forEach(cat => {
        const catResults = categoryGroups[cat];
        const topLevel = catResults.filter(r => {
          const parentId = r.test?.parentId;
          return !parentId || !catResults.some(pr => pr.testId === parentId);
        });

        topLevel.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
        topLevel.forEach(r => addTestAndChildren(r.testId, cat));
      });
      
      results.forEach(r => {
        if (!visited.has(r.testId)) {
          sorted.push({ ...r, renderCategory: r.test?.categoryRel?.name || 'Divers' });
          visited.add(r.testId);
        }
      });

      return sorted;
    };

  const sortedResults = sortResults(analysis.results);

  const progressPct = Math.round((completedCount / totalCount) * 100);
  const hasQcBlockers = Boolean(qcReadiness && !qcReadiness.ready && qcReadiness.blockers.length > 0);
  const paymentTotal = analysis.totalPrice ?? 0;
  const paymentPaid = analysis.amountPaid ?? 0;
  const paymentRemaining = Math.max(0, paymentTotal - paymentPaid);
  const paymentStatusLabel =
    analysis.paymentStatus === 'PAID'
      ? 'Payé'
      : analysis.paymentStatus === 'PARTIAL'
        ? 'Partiellement payé'
        : 'Non payé';
  const paymentStatusClasses =
    analysis.paymentStatus === 'PAID'
      ? 'status-pill status-pill-success'
      : analysis.paymentStatus === 'PARTIAL'
        ? 'status-pill status-pill-warning'
        : 'status-pill status-pill-error';

  return (
    <>
      <div className="flex flex-col gap-5 pb-16">

      {/* ─── Header Panel ─── */}
      <div className="rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(15,31,51,0.06)] lg:p-6">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-start gap-3">
            <button 
              onClick={() => router.push('/analyses')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="status-pill border border-blue-200/70 bg-blue-50 text-blue-700">N° {analysis.orderNumber}</span>
                <span className="text-xs text-[var(--color-text-soft)]">{format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
              <h1 className={`text-xl font-semibold tracking-tight text-[var(--color-text)] ${!analysis.patientFirstName && !analysis.patientLastName ? 'italic text-[var(--color-text-soft)]' : ''}`}>
                {(analysis.patientFirstName || analysis.patientLastName) ? (
                   <>{analysis.patientFirstName} <span className="text-[var(--color-accent)]">{analysis.patientLastName}</span></>
                ) : 'Patient Sans Nom'}
              </h1>
              {analysis.validatedTechAt && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600">
                  <CheckCircle size={12} />
                  <span>Validation technique: {analysis.validatedTechName || 'Utilisateur'} — {format(new Date(analysis.validatedTechAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
              )}
              {analysis.validatedBioAt && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle size={12} />
                  <span>Validation biologique: {analysis.validatedBioName || 'Utilisateur'} — {format(new Date(analysis.validatedBioAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <div className="w-full rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {validationError}
            </div>
          )}

          {analysis.status === 'in_progress' && qcReadiness && qcReadiness.relevantLots > 0 && (
            <div className={`w-full rounded-2xl border px-4 py-3 text-sm ${
              hasQcBlockers
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {hasQcBlockers ? 'QC requis non conforme avant validation technique' : 'QC requis conforme pour cette analyse'}
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    {qcReadiness.relevantLots} lot{qcReadiness.relevantLots > 1 ? 's' : ''} QC lié{qcReadiness.relevantLots > 1 ? 's' : ''} aux tests de cette analyse.
                  </div>
                </div>
                <span className={`status-pill ${hasQcBlockers ? 'status-pill-warning' : 'status-pill-success'}`}>
                  {hasQcBlockers ? `${qcReadiness.blockers.length} blocage(s)` : 'Prêt'}
                </span>
              </div>
              {hasQcBlockers && (
                <div className="mt-3 space-y-2 text-xs">
                  {qcReadiness.blockers.map((blocker, index) => (
                    <div key={`${blocker.materialName}-${blocker.lotNumber}-${index}`} className="rounded-xl border border-amber-200/70 bg-white/70 px-3 py-2">
                      <span className="font-semibold">{blocker.materialName}</span>
                      <span> · lot {blocker.lotNumber} · </span>
                      <span>{blocker.status === 'fail' ? 'QC en échec' : 'QC manquant aujourd’hui'}</span>
                      <div className="mt-1 opacity-80">Tests concernés: {blocker.tests.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-label">Paiement</span>
                  <span className={paymentStatusClasses}>{paymentStatusLabel}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                    Total: {paymentTotal.toFixed(2)} DA
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                    Payé: {paymentPaid.toFixed(2)} DA
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                    Reste: {paymentRemaining.toFixed(2)} DA
                  </span>
                  {analysis.paidAt && (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                      Soldé le {format(new Date(analysis.paidAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  )}
                </div>
              </div>

              {role !== 'MEDECIN' && (
                <div className="grid gap-3 sm:grid-cols-[160px_160px_auto]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    className="input-premium h-11"
                    placeholder="Montant payé"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input-premium h-11"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte</option>
                    <option value="transfer">Virement</option>
                    <option value="check">Chèque</option>
                    <option value="other">Autre</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput(String(paymentTotal))}
                      className="btn-secondary-sm"
                    >
                      Tout payer
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePayment}
                      disabled={savingPayment}
                      className="btn-primary-md"
                    >
                      {savingPayment ? '...' : 'Enregistrer paiement'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFinalValidated ? (
               <>
                <button onClick={() => setEditDialogOpen(true)} className="btn-secondary h-10">
                  <PencilLine size={16} /> Modifier dossier
                </button>

                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                  {/* Workflow Step 1: Technical */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${analysis.status !== 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className="flex flex-col">
                      <span className="section-label leading-none mb-1">Validation Technique</span>
                      {analysis.status === 'validated_tech' || analysis.status === 'validated_bio' || analysis.status === 'completed' ? (
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                             <CheckCircle size={12} /> Validée le {analysis.validatedTechAt ? format(new Date(analysis.validatedTechAt), 'dd/MM HH:mm') : ''}
                           </span>
                           <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">Par {analysis.validatedTechName || 'Technicien'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canTech && analysis.status === 'in_progress' ? (
                            <button
                              onClick={() => handleValidation('tech')}
                              disabled={validating || hasQcBlockers}
                              className="btn-primary-sm !h-7 !px-3 !text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                              title={hasQcBlockers ? 'Validation bloquée: QC requis manquant ou en échec' : undefined}
                            >
                              Valider
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 italic">
                               {analysis.status === 'pending' ? 'Saisie...' : 'Attente'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden md:block mx-1" />

                  {/* Workflow Step 2: Biological */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${analysis.status === 'validated_tech' ? 'bg-indigo-600 text-white' : isFinalValidated ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    <div className="flex flex-col">
                      <span className="section-label leading-none mb-1">Validation Biologique</span>
                      {isFinalValidated ? (
                         <div className="flex flex-col">
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle size={12} /> Signée le {analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd/MM HH:mm') : ''}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">Par {analysis.validatedBioName || 'Biologiste'}</span>
                         </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canBio && analysis.status === 'validated_tech' ? (
                            <button onClick={() => handleValidation('bio')} disabled={validating} className="h-7 rounded-lg bg-emerald-600 px-3 text-[10px] font-medium text-white transition-colors hover:bg-emerald-700">
                              Signer
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 italic">
                               {analysis.status === 'validated_tech' ? 'Attente' : 'Verrouillée'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-auto flex gap-2">
                  <button onClick={handlePrintInvoice} className="btn-secondary h-10 px-4">
                    <ReceiptText size={16} /> Facture
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-secondary h-10 px-4">
                    <Save size={16} /> {saving ? '...' : 'Sauvegarder'}
                  </button>
                  <button onClick={handlePrint} className="btn-secondary h-10 px-4">
                    <Printer size={16} /> {selectedIds.length > 0 ? `Brouillon (${selectedIds.length})` : 'Brouillon'}
                  </button>
                </div>
               </>
               ) : (
                 <>
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50 p-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                       <CheckCircle size={20} />
                    </div>
                    <div className="flex flex-col mr-4">
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Dossier Validé & Signé</span>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span>{analysis.validatedBioName}</span>
                          <span className="text-emerald-300">•</span>
                          <span className="text-slate-500">{analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd MMM yyyy HH:mm', { locale: fr }) : ''}</span>
                       </div>
                    </div>
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button onClick={handlePrintInvoice} className="btn-secondary h-10 px-4">
                      <ReceiptText size={16} /> Facture
                    </button>
                    <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-secondary h-10">
                      <Mail size={16} className={sendingEmail ? 'animate-pulse' : ''} /> Email
                    </button>
                  <button onClick={handlePrint} className="btn-primary h-10 !bg-emerald-500 hover:!bg-emerald-600">
                      <Printer size={16} /> Impression Finale
                  </button>
                </div>
                 </>
               )}
          </div>
        </div>

        {/* Hidden components for printing */}
        <div className="hidden">
           <div ref={printRef}>
              <RapportImpression analysis={analysis} results={results} selectedResultIds={selectedIds} settings={reportSettings}  />
           </div>
           <div ref={invoicePrintRef}>
              <FactureImpression analysis={analysis} settings={reportSettings} />
           </div>
        </div>

        {/* Metadata Row */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2 xl:grid-cols-4">
           <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Paillasse</div>
              <div className="font-mono font-bold text-lg text-slate-800">{analysis.dailyId}</div>
           </div>
           <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Âge / Sexe</div>
              <div className="font-bold text-lg text-slate-800">{analysis.patientAge || '?'} ans • {analysis.patientGender}</div>
           </div>
           <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progression</div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg ${progressPct === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{progressPct}%</span>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPct}%` }} />
                </div>
              </div>
           </div>
           <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Anomalies</div>
              <div className={`font-bold text-lg ${abnormalCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                 {abnormalCount} Détectée{abnormalCount > 1 ? 's' : ''}
              </div>
           </div>
        </div>
        <div className="mt-6 border-t border-[var(--color-border)] pt-6 space-y-3">
          <span className="section-label">Note globale du rapport</span>
          {isFinalValidated ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 min-h-[56px]">
              {globalNote ? (
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {globalNote}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Aucune note globale.</p>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <select
                  value={globalNotePlacement}
                  onChange={(e) => setGlobalNotePlacement(e.target.value as 'all' | 'first' | 'last')}
                  className="input-premium h-10 text-xs w-[240px]"
                >
                  <option value="all">Afficher sur toutes les pages</option>
                  <option value="first">Afficher sur la 1ère page</option>
                  <option value="last">Afficher sur la dernière page</option>
                </select>
              </div>
              <textarea
                value={globalNote}
                onChange={(e) => setGlobalNote(e.target.value)}
                placeholder="Ajouter une note globale (conclusion, recommandation, commentaire général)..."
                className="input-premium min-h-[96px] w-full resize-none p-3 text-sm bg-white"
              />
              <div className="flex justify-end">
                <button onClick={saveGlobalNote} disabled={saveGlobalNoteBusy} className="btn-secondary-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  <Save size={14} /> {saveGlobalNoteBusy ? 'Enregistrement...' : 'Enregistrer la note'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Results Panel ─── */}
      <div className="rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(15,31,51,0.06)] lg:p-6">
         {/* Toolbar */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Activity size={16} />
               </div>
               <h2 className="text-lg font-semibold text-[var(--color-text)]">Résultats des tests</h2>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
               {/* Tabs */}
               <div className="flex gap-1 rounded-xl border bg-[var(--color-surface-muted)] p-1">
                  <button onClick={() => setActiveTab('all')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'all' ? 'border bg-white text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>Tous ({totalCount})</button>
                  <button onClick={() => setActiveTab('urgent')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'urgent' ? 'bg-rose-600 text-white' : 'text-[var(--color-text-secondary)] hover:text-rose-700'}`}>Anomalies ({abnormalCount})</button>
                  {analysis.histogramData && (
                     <button onClick={() => setActiveTab('charts')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'charts' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}>Graphiques</button>
                  )}
               </div>
               
               {!isFinalValidated && hasNFS && (
                 <div className="flex items-center gap-2">
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleDiatronFileChange} 
                     accept=".txt" 
                     className="hidden" 
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isImporting}
                     className="btn-secondary h-9 text-xs"
                   >
                     <Microscope size={14} className={isImporting ? 'animate-pulse' : ''} />
                     {isImporting ? 'Import...' : 'Diatron'}
                   </button>
                 </div>
               )}

               {isFinalValidated && (
                 <button className="btn-secondary h-9 text-xs" onClick={toggleSelectAll}>
                   <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedIds.length === totalCount ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                     {selectedIds.length === totalCount && <CheckCircle size={10} className="text-white" />}
                   </div>
                   Tout sélectionner
                 </button>
               )}
            </div>
         </div>


             <div className="space-y-1">
                 {/* Charts Tab */}
                 {activeTab === 'charts' && analysis.histogramData && (() => {
                    try {
                      const data = JSON.parse(analysis.histogramData);
                      const pltData = {
                        bins: data.rbc.bins.slice(0, 60),
                        markers: data.rbc.markers.filter((m: number) => m < 60)
                      };

                      return (
                        <div className="flex flex-col gap-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <HistogramView data={data.wbc} title="WBC (LEUCOCYTES)" color="#6366f1" width={350} height={200} xAxisMax={400} />
                            <HistogramView data={data.rbc} title="RBC (ÉRYTHROCYTES)" color="#ef4444" width={350} height={200} xAxisMax={250} />
                            <HistogramView data={pltData} title="PLT (PLAQUETTES)" color="#10b981" width={350} height={200} xAxisMax={60} />
                          </div>

                          {(() => {
                            const interpretations = getHematologyInterpretations(analysis, results);
                            if (interpretations.length === 0) return (
                              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2">
                                <Sparkles className="text-indigo-500" size={16} />
                                <p className="text-sm font-semibold text-slate-500">Aucune anomalie morphologique majeure détectée</p>
                              </div>
                            );

                            return (
                              <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Activity size={12} /> Interprétations Diagnostiques
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {interpretations.map((flag: string) => (
                                    <span key={flag} className="status-pill bg-white border border-indigo-200 text-indigo-700 shadow-sm">
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    } catch {
                      return <div className="p-8 text-center text-slate-400">Erreur lors de l&apos;affichage des graphiques.</div>;
                    }
                 })()}

                 {/* Results List */}
                 {activeTab !== 'charts' ? (() => {
                  let currentCategory = '';
                  return sortedResults.map((result, index) => {
                     const test = result.test;
                     if (!test) return null;

                      const renderCategory = result.renderCategory || test.categoryRel?.name || 'Divers';
                     const showCategoryHeader = renderCategory !== currentCategory;
                     
                     let categoryHeader = null;
                     if (showCategoryHeader) {
                       currentCategory = renderCategory;
                       categoryHeader = (
                         <div key={`cat-${renderCategory}`} className="flex items-center gap-3 pt-6 pb-3 mt-4 first:mt-0 first:pt-0">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {renderCategory}
                            </h3>
                            <div className="h-px flex-1 bg-slate-100" />
                         </div>
                       );
                     }

                    const value = results[result.id];
                    const abnormal = isAbnormal(value, test);
                    const isNumeric = test.resultType === 'numeric' || !test.resultType;
                    const isGroup = test.isGroup;
                    const prevResult = history[result.id];
                    const displayName = test.name;
                    const CategoryIcon = getCategoryIcon(test.categoryRel?.icon);
                    
                    const isFormula = [
                        'VGM', 'CCMH', 'TCMH',
                        'PNN', 'GRA', 
                        'LYM', 'LYM', 
                        'MON', 'MID'
                    ].includes(test.code || '');

                    if (activeTab === 'urgent' && !abnormal) return null;

                    return (
                      <div key={result.id}>
                        {categoryHeader}
                        {isGroup ? (
                           <div className="flex items-center gap-3 py-3 mt-4 mb-1">
                              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{displayName}</h3>
                              <div className="h-px flex-1 bg-slate-100" />
                           </div>
                        ) : (
                            <>
                            {/* Result Row */}
                            <div className={`group flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 px-4 py-3 rounded-2xl transition-colors ${test.parentId ? 'pl-6' : ''} ${abnormal ? 'bg-rose-50/60' : 'hover:bg-slate-50/50'}`}>
                               
                               {/* Selection Checkbox */}
                               {isFinalValidated && (
                                  <div 
                                     onClick={() => toggleSelection(result.id)}
                                     className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${selectedIds.includes(result.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
                                  >
                                     {selectedIds.includes(result.id) && <CheckCircle size={10} className="text-white" />}
                                  </div>
                               )}

                               {/* Test Name + Icon */}
                               <div className="flex items-center gap-3 lg:w-56 shrink-0">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${abnormal ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                     <CategoryIcon size={14} />
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                       <span className="font-semibold text-sm text-slate-800 truncate">{displayName}</span>
                                       {isFormula && <Calculator size={12} className="text-indigo-400 shrink-0" />}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{test.code}</span>
                                 </div>
                               </div>

                               {/* Input Field */}
                                <div className="flex-1 flex flex-col items-center gap-1">
                                   <div className="w-full flex justify-center">
                                        {test.resultType === 'long_text' ? (
                                           <textarea
                                             ref={(el) => { inputsRef.current[result.id] = el; }}
                                             value={results[result.id]}
                                             onChange={(e) => handleResultChange(result.id, e.target.value)}
                                             onKeyDown={(e) => handleKeyDown(e, index, sortedResults.length)}
                                              disabled={isFinalValidated || isFormula}
                                               rows={3}
                                               className="input-premium py-3 px-4 text-sm w-full max-w-md min-h-[80px] rounded-xl resize-none"
                                               placeholder="Saisissez les résultats détaillés ici..."
                                             />
                                          ) : test.resultType === 'dropdown' ? (
                                           <select
                                             ref={(el) => { inputsRef.current[result.id] = el; }}
                                             value={results[result.id]}
                                             onChange={(e) => handleResultChange(result.id, e.target.value)}
                                             onKeyDown={(e) => handleKeyDown(e, index, sortedResults.length)}
                                            disabled={isFinalValidated || isFormula}
                                             className={`h-10 w-full max-w-[200px] px-4 rounded-xl border text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-indigo-500/10 ${results[result.id] ? 'text-indigo-700 border-indigo-200 bg-indigo-50/50' : 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-white'}`}
                                           >
                                              <option value="">-- Sélectionner --</option>
                                              {test.options?.split(',').map((opt: string) => (
                                                 <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                              ))}
                                           </select>
                                        ) : (
                                           <div className="relative">
                                              <input 
                                                ref={(el) => { inputsRef.current[result.id] = el; }}
                                                value={results[result.id]}
                                                onChange={(e) => handleResultChange(result.id, e.target.value)}
                                                onBlur={(e) => {
                                                  if (isNumeric && e.target.value) {
                                                    const decimals = parseInt(String(test.decimals ?? 1), 10);
                                                    const formatted = formatValue(e.target.value, decimals);
                                                    handleResultChange(result.id, formatted);
                                                  }
                                                }}
                                                onKeyDown={(e) => handleKeyDown(e, index, sortedResults.length)}
                                                disabled={isFinalValidated || isFormula}
                                              placeholder="--"
                                              className={`h-10 rounded-xl border transition-all outline-none focus:ring-4 font-mono font-bold ${isNumeric ? 'w-28 text-lg text-center tracking-tight' : 'w-48 text-sm px-4'} ${abnormal ? 'text-rose-600 border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-500/10' : 'text-slate-800 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 hover:border-slate-300'} ${isFormula ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' : ''}`}
                                            />
                                            {abnormal && <AlertCircle className="absolute -right-7 top-1/2 -translate-y-1/2 text-rose-500" size={16} />}
                                         </div>
                                      )}
                                   </div>
                                 
                                 {/* Previous Result (Delta Check) */}
                                 {prevResult && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                       <History size={10} />
                                       <span>Préc: </span>
                                       <span className="font-mono font-bold text-slate-600">{prevResult.value} {prevResult.unit}</span>
                                       <span className="opacity-60">({format(new Date(prevResult.createdAt), 'dd/MM/yy')})</span>
                                    </div>
                                 )}
                              </div>

                               {/* Unit + Reference + Note */}
                                 <div className="flex items-center gap-4 lg:w-52 shrink-0 justify-end">
                                    <div className="text-right">
                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unité</div>
                                       <span className="text-xs font-semibold text-slate-600" dangerouslySetInnerHTML={{ __html: test.unit || '--' }} />
                                    </div>
                                    <div className="text-right w-20">
                                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Réf.</div>
                                       <span className="text-xs font-mono font-bold text-slate-800">
                                          {(() => {
                                            if (!isNumeric) return 'QUALIT.';
                                            const refVals = getTestReferenceValues(test, analysis.patientGender);
                                            return formatReferenceRange(refVals.min, refVals.max);
                                          })()}
                                       </span>
                                    </div>
                                    {!isFinalValidated && (
                                      <button 
                                         onClick={() => toggleNote(result.id)}
                                         className={`p-1.5 rounded-lg transition-colors ${notes[result.id] ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'}`}
                                         tabIndex={-1}
                                         title={notes[result.id] ? 'Modifier Note' : 'Ajouter Note'}
                                      >
                                         <NotepadTextIcon size={14} />
                                      </button>
                                    )}
                                 </div>
                            </div>
                            
                            {/* Notes Expanded */}
                            {expandedNotes.includes(result.id) && (
                               <div className={`ml-10 mr-4 mb-2 ${isFinalValidated ? 'opacity-70' : ''}`}>
                                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                                     <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                           <MessageSquare size={12} className="text-indigo-500" />
                                           <span className="section-label">Note technique</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {notes[result.id] && (
                                                <button 
                                                    onClick={() => deleteNote(result.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-medium hover:bg-rose-100 transition-colors"
                                                    disabled={isFinalValidated}
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => toggleNote(result.id)}
                                                className="px-2.5 py-1 rounded-lg bg-white border border-[var(--color-border)] text-slate-600 text-[10px] font-medium hover:bg-slate-50 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button 
                                                onClick={() => applyNote(result.id)}
                                                className="btn-primary-sm !rounded-lg !px-3 !py-1"
                                                disabled={isFinalValidated}
                                            >
                                                Appliquer
                                            </button>
                                        </div>
                                     </div>
                                     <textarea
                                        value={draftNotes[result.id] || ''}
                                        onChange={(e) => handleNoteChange(result.id, e.target.value)}
                                        placeholder="Saisissez une observation (ex: prélèvement hémolysé, contrôle refait...)"
                                        disabled={isFinalValidated}
                                        className="input-premium w-full min-h-[82px] resize-none rounded-xl bg-white p-3 text-xs"
                                        rows={2}
                                     />
                                  </div>
                               </div>
                            )}
                            
                            {/* Static Note Indicator */}
                            {!expandedNotes.includes(result.id) && notes[result.id] && (
                                <div
                                  className={`ml-10 mr-4 mb-1 flex items-center gap-1.5 text-[10px] text-indigo-600 font-medium px-3 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50/70 w-fit transition-colors ${
                                    isFinalValidated ? 'cursor-default' : 'cursor-pointer hover:bg-indigo-50'
                                  }`}
                                  onClick={() => {
                                    if (!isFinalValidated) toggleNote(result.id);
                                  }}
                                >
                                    <MessageSquare size={10} />
                                    <span className="truncate max-w-md">Note: {notes[result.id]}</span>
                                </div>
                            )}
                            </>
                         )}
                      </div>
                    );
                 });
                })() : null}
             </div>


         {analysis.results.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-300 mb-4">
                  <Beaker size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-700">Aucun test configuré</h3>
               <p className="text-sm text-slate-400 mt-1">Veuillez vérifier la configuration de cette analyse.</p>
            </div>
         )}
      </div>

      {/* Hidden Print Area */}
      <div style={{ position: 'absolute', left: '-9999px', width: '210mm', height: 'auto' }}>
        <div ref={printRef}>
          <RapportImpression
            ref={printRef}
            analysis={analysis}
            results={results}
            selectedResultIds={selectedIds}
            settings={reportSettings}
          />
        </div>
        <div ref={invoicePrintRef}>
          <FactureImpression analysis={analysis} settings={reportSettings} />
        </div>
      </div>

      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}

      {/* Diatron Selection Dialog */}
      <Dialog open={!!diatronPreview} onOpenChange={(open: boolean) => !open && setDiatronPreview(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border-slate-200 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Microscope size={20} />
               </div>
               <div>
                  <DialogTitle className="text-lg font-bold text-slate-800">Sélectionner un Résultat</DialogTitle>
                  <p className="text-sm text-slate-500">Fichier importé : Diatron Abacus 380</p>
               </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-5 flex items-center gap-2.5 p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
               <AlertCircle size={18} className="shrink-0" />
               <p className="text-sm font-medium">Plusieurs analyses ont été détectées dans ce fichier. Choisissez celle qui correspond à votre patient.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {diatronPreview?.map((record) => (
                <button
                  key={record.index}
                  onClick={() => handleDiatronSelect(record.index)}
                  className="group w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-600 transition-colors">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-200">ID</span>
                        <span className="text-base font-bold text-slate-700 group-hover:text-white">{record.sampleId || '?'}</span>
                     </div>
                     
                     <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                           Analyse du {record.date}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                           <span className="flex items-center gap-1 text-xs">
                              <History size={12} /> {record.time}
                           </span>
                           <span className="text-slate-300">•</span>
                           <span className="text-xs">Index #{record.index + 1}</span>
                        </div>
                     </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="p-5 border-t border-slate-100">
            <button
              onClick={() => setDiatronPreview(null)}
              className="btn-secondary"
            >
              Annuler l&apos;importation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] bg-white border-slate-200 shadow-2xl flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Modifier le dossier d&apos;analyse</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 min-h-0">
            <div className="grid grid-cols-2 gap-4 py-2">
              <input className="input-premium h-10 text-sm" placeholder="N° Paillasse" value={editForm.dailyId} onChange={(e) => setEditForm(prev => ({ ...prev, dailyId: e.target.value }))} />
              <input className="input-premium h-10 text-sm" placeholder="Quittance" value={editForm.receiptNumber} onChange={(e) => setEditForm(prev => ({ ...prev, receiptNumber: e.target.value }))} />
              <input className="input-premium h-10 text-sm" placeholder="Nom" value={editForm.patientLastName} onChange={(e) => setEditForm(prev => ({ ...prev, patientLastName: e.target.value }))} />
              <input className="input-premium h-10 text-sm" placeholder="Prénom" value={editForm.patientFirstName} onChange={(e) => setEditForm(prev => ({ ...prev, patientFirstName: e.target.value }))} />
              <input className="input-premium h-10 text-sm" placeholder="Âge" value={editForm.patientAge} onChange={(e) => setEditForm(prev => ({ ...prev, patientAge: e.target.value }))} />
              <select className="input-premium h-10 text-sm" value={editForm.patientGender} onChange={(e) => setEditForm(prev => ({ ...prev, patientGender: e.target.value }))}>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <input className="input-premium h-10 text-sm col-span-2" placeholder="Provenance" value={editForm.provenance} onChange={(e) => setEditForm(prev => ({ ...prev, provenance: e.target.value }))} />
              <input className="input-premium h-10 text-sm col-span-2" placeholder="Médecin prescripteur" value={editForm.medecinPrescripteur} onChange={(e) => setEditForm(prev => ({ ...prev, medecinPrescripteur: e.target.value }))} />
              <div className="col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, isUrgent: false }))}
                  className={`h-10 px-4 rounded-xl text-xs font-bold border ${!editForm.isUrgent ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  Non urgent
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, isUrgent: true }))}
                  className={`h-10 px-4 rounded-xl text-xs font-bold border ${editForm.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  Urgent
                </button>
              </div>
              <div className="col-span-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tests sélectionnés</span>
                  <span className="text-xs font-semibold text-indigo-600">{selectedTestIds.length} test(s)</span>
                </div>
                <input
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Rechercher un test (code ou nom)..."
                  className="input-premium h-10 text-sm w-full mb-3"
                />
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                  {availableTests
                    .filter((test) => {
                      const q = testSearch.toLowerCase().trim();
                      if (!q) return true;
                      return test.code?.toLowerCase().includes(q) || test.name?.toLowerCase().includes(q);
                    })
                    .map((test) => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => toggleSelectedTest(test.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                          selectedTestIds.includes(test.id)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{test.code} - {test.name}</span>
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedTestIds.includes(test.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {selectedTestIds.includes(test.id) && <CheckCircle size={10} className="text-white" />}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 pt-3 bg-white sticky bottom-0">
            <button onClick={() => setEditDialogOpen(false)} className="btn-secondary">Annuler</button>
            <button onClick={saveAnalysisMeta} disabled={savingMeta} className="btn-primary">
              {savingMeta ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
