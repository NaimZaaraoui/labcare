'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, Printer, CheckCircle, 
  Activity, ArrowLeft, Beaker, 
  Droplets, Microscope, Sparkles, AlertCircle,
  ChevronRight, History, Calculator, MessageSquare, Mail
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getTestReferenceValues, formatReferenceRange } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { RapportImpression } from '@/components/print/RapportImpression';
import { Analysis, Result } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NotificationToast } from '@/components/ui/notification-toast';
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

const HGPO75_SORT_ORDER = ['T0', 'T1H', 'T2H'];


export function ResultatsForm({ analysisId }: ResultatsFormProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
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
      setSelectedIds(analysis?.results.filter(r => !r.test?.isGroup).map(r => r.id) || []);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', description: '', action: async () => {} });

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
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
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (patientId: string, testId: string, resultId: string) => {
    try {
      const response = await fetch(`/api/results/history?patientId=${patientId}&testId=${testId}&currentAnalysisId=${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(prev => ({ ...prev, [resultId]: data }));
      }
    } catch (e) {
      console.error('History fetch error', e);
    }
  };

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
        const res = analysis.results.find(r => r.test?.code === code);
        if (!res) return null;
        const val = updatedResults[res.id];
        return val ? parseFloat(val.replace(',', '.')) : null;
      };

      const setVal = (code: string, value: number) => {
        const res = analysis.results.find(r => r.test?.code === code);
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

  const isAbnormal = (value: string, test: any) => {
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

  const executeValidation = async () => {
    if (!analysis) return;
    setValidating(true);
    
    try {
      const response = await fetch(`/api/analyses/${analysisId}/validate`, { method: 'POST' });
      if (!response.ok) {
        let errorMessage = 'Erreur serveur';
        const bodyText = await response.text();
        try {
          const error = JSON.parse(bodyText);
          errorMessage = error.error || error.details || errorMessage;
        } catch {
          errorMessage = bodyText || errorMessage;
        }
        console.error('Validation error:', errorMessage);
        throw new Error(errorMessage);
      }
      await loadAnalysis();
      showNotification('success', 'Analyse validée et verrouillée');
    } catch (error) {
      console.error('Validation exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur lors de la validation';
      showNotification('error', `Erreur lors de la validation: ${errorMsg}`);
    } finally {
      setValidating(false);
    }
  };

  const handleValidate = () => {
    if (!analysis) return;
    
    if (completedCount < totalCount) {
       showNotification('error', 'Veuillez saisir tous les résultats avant de valider.');
       return;
    }

    setConfirmDialog({
      open: true,
      title: 'Validation définitive',
      description: 'Êtes-vous sûr de vouloir valider ces résultats ? Cette action est irréversible.',
      action: executeValidation
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rapport_${analysis?.orderNumber}`,
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
    } catch (error: any) {
      console.error('Email error:', error);
      showNotification('error', error.message || 'Échec de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
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
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.message);
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
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.message);
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

  const totalCount = analysis.results.filter(r => !r.test?.isGroup).length;
  const completedCount = analysis.results.filter(r => {
    return !r.test?.isGroup && results[r.id] && results[r.id] !== '';
  }).length;
  const abnormalCount = analysis.results.filter(r => {
    const val = results[r.id];
    const test = r.test;
    if (!test || test.isGroup) return false;
    const refVals = getTestReferenceValues(test, analysis.patientGender);
    return (refVals.min !== null || refVals.max !== null) && isAbnormal(val, test);
  }).length;
  const isValidated = analysis.status === 'completed';
  const hasNFS = analysis.results.some(r => r.test && NFS_SORT_ORDER.includes(r.test.code));

    const sortResults = (results: Result[]) => {
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
        // @ts-ignore - relation populated via API
        const catRel = res.test?.categoryRel;
        const catName = catRel?.name || res.test?.category || "Divers";
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
          sorted.push({ ...r, renderCategory: r.test?.category || 'Divers' });
          visited.add(r.testId);
        }
      });

      return sorted;
    };

  const sortedResults = sortResults(analysis.results);

  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <div className="animate-fade-in flex flex-col gap-6 pb-20">

      {/* ─── Header Panel ─── */}
      <div className="bento-panel p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/analyses')}
              className="btn-secondary w-10 h-10 !p-0 shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="status-pill bg-blue-50 text-blue-600">N° {analysis.orderNumber}</span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-slate-400 text-sm font-medium">{format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
              <h1 className={`text-2xl font-bold text-slate-800 tracking-tight ${!analysis.patientFirstName && !analysis.patientLastName ? 'text-slate-400 italic' : ''}`}>
                {(analysis.patientFirstName || analysis.patientLastName) ? (
                   <>{analysis.patientFirstName} <span className="text-blue-600">{analysis.patientLastName}</span></>
                ) : 'Patient Sans Nom'}
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            {!isValidated ? (
               <>
                <button onClick={handleSave} disabled={saving} className="btn-secondary h-10">
                   <Save size={16} /> {saving ? '...' : 'Sauvegarder'}
                </button>
                <button onClick={handlePrint} className="btn-secondary h-10">
                   <Printer size={16} /> {selectedIds.length > 0 ? `Brouillon (${selectedIds.length})` : 'Brouillon'}
                </button>
                <button onClick={handleValidate} disabled={validating} className="btn-primary h-10">
                   <CheckCircle size={16} /> Valider
                </button>
               </>
               ) : (
                 <>
                   <button 
                     onClick={handleSendEmail} 
                     disabled={sendingEmail} 
                     className="btn-secondary h-10"
                   >
                     <Mail size={16} className={sendingEmail ? 'animate-pulse' : ''} /> 
                     {sendingEmail ? 'Envoi...' : 'Email'}
                   </button>
                   <button onClick={handlePrint} className="btn-primary h-10 !bg-emerald-500 hover:!bg-emerald-600">
                       <Printer size={16} /> {selectedIds.length > 0 ? `Imprimer (${selectedIds.length})` : 'Imprimer'}
                   </button>
                 </>
              )}
          </div>
        </div>

        {/* Metadata Row */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-100 pt-6">
           <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Paillasse</div>
              <div className="font-mono font-bold text-lg text-slate-800">{analysis.dailyId}</div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Âge / Sexe</div>
              <div className="font-bold text-lg text-slate-800">{analysis.patientAge || '?'} ans • {analysis.patientGender}</div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progression</div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg ${progressPct === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{progressPct}%</span>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressPct}%` }} />
                </div>
              </div>
           </div>
           <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Anomalies</div>
              <div className={`font-bold text-lg ${abnormalCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                 {abnormalCount} Détectée{abnormalCount > 1 ? 's' : ''}
              </div>
           </div>
        </div>
      </div>

      {/* ─── Results Panel ─── */}
      <div className="bento-panel p-6">
         {/* Toolbar */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={16} />
               </div>
               <h2 className="text-lg font-bold text-slate-800">Résultats des Tests</h2>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
               {/* Tabs */}
               <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl gap-1">
                  <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Tous ({totalCount})</button>
                  <button onClick={() => setActiveTab('urgent')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'urgent' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-red-500'}`}>Anomalies ({abnormalCount})</button>
                  {analysis.histogramData && (
                     <button onClick={() => setActiveTab('charts')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'charts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}>Graphiques</button>
                  )}
               </div>
               
               {!isValidated && hasNFS && (
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

               {isValidated && (
                 <button className="btn-secondary h-9 text-xs" onClick={toggleSelectAll}>
                   <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedIds.length === totalCount ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
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
                            <HistogramView data={data.wbc} title="WBC (LEUCOCYTES)" color="#3b82f6" width={350} height={200} xAxisMax={400} />
                            <HistogramView data={data.rbc} title="RBC (ÉRYTHROCYTES)" color="#ef4444" width={350} height={200} xAxisMax={250} />
                            <HistogramView data={pltData} title="PLT (PLAQUETTES)" color="#10b981" width={350} height={200} xAxisMax={60} />
                          </div>

                          {(() => {
                            const interpretations = getHematologyInterpretations(analysis, results);
                            if (interpretations.length === 0) return (
                              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2">
                                <Sparkles className="text-blue-500" size={16} />
                                <p className="text-sm font-semibold text-slate-500">Aucune anomalie morphologique majeure détectée</p>
                              </div>
                            );

                            return (
                              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Activity size={12} /> Interprétations Diagnostiques
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {interpretations.map(flag => (
                                    <span key={flag} className="status-pill bg-white border border-blue-200 text-blue-700 shadow-sm">
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    } catch (e) {
                      return <div className="p-8 text-center text-slate-400">Erreur lors de l'affichage des graphiques.</div>;
                    }
                 })()}

                 {/* Results List */}
                 {activeTab !== 'charts' ? (() => {
                  let currentCategory = '';
                  return sortedResults.map((result, index) => {
                     const test = result.test;
                     if (!test) return null;

                     const resWithCat = result as any;
                     const renderCategory = resWithCat.renderCategory || test.category || 'Divers';
                     const showCategoryHeader = renderCategory !== currentCategory;
                     
                     let categoryHeader = null;
                     if (showCategoryHeader) {
                       currentCategory = renderCategory;
                       categoryHeader = (
                         <div key={`cat-${renderCategory}`} className="flex items-center gap-3 pt-6 pb-3 mt-4 first:mt-0 first:pt-0">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {renderCategory === 'HEMA' || renderCategory === 'Hématologie' ? 'Hématologie' : 
                               renderCategory === 'BIO' || renderCategory === 'Biochimie' ? 'Biochimie' : 
                               renderCategory === 'NFS' ? 'NFS' : renderCategory}
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
                            <div className={`group flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4 px-4 py-3 rounded-2xl transition-colors ${test.parentId ? 'ml-6 border-l-2 border-l-blue-200' : ''} ${abnormal ? 'bg-red-50/60' : 'hover:bg-slate-50/50'}`}>
                               
                               {/* Selection Checkbox */}
                               {isValidated && (
                                  <div 
                                     onClick={() => toggleSelection(result.id)}
                                     className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${selectedIds.includes(result.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'}`}
                                  >
                                     {selectedIds.includes(result.id) && <CheckCircle size={10} className="text-white" />}
                                  </div>
                               )}

                               {/* Test Name + Icon */}
                               <div className="flex items-center gap-3 lg:w-56 shrink-0">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${abnormal ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {test.category === 'HEMA' ? <Droplets size={14} /> : test.category === 'BIO' ? <Microscope size={14} /> : <Beaker size={14} />}
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                       <span className="font-semibold text-sm text-slate-800 truncate">{displayName}</span>
                                       {isFormula && <Calculator size={12} className="text-blue-400 shrink-0" />}
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
                                               disabled={isValidated || isFormula}
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
                                             disabled={isValidated || isFormula}
                                             className={`h-10 w-full max-w-[200px] px-4 rounded-xl border text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-blue-500/10 ${results[result.id] ? 'text-blue-700 border-blue-200 bg-blue-50/50' : 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-white'}`}
                                           >
                                              <option value="">-- Sélectionner --</option>
                                              {test.options?.split(',').map(opt => (
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
                                                disabled={isValidated || isFormula}
                                              placeholder="--"
                                              className={`h-10 rounded-xl border transition-all outline-none focus:ring-4 font-bold ${isNumeric ? 'w-28 text-lg text-center tracking-tight' : 'w-48 text-sm px-4'} ${abnormal ? 'text-red-600 border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10' : 'text-slate-800 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10 hover:border-slate-300'} ${isFormula ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' : ''}`}
                                            />
                                            {abnormal && <AlertCircle className="absolute -right-7 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
                                         </div>
                                      )}
                                   </div>
                                 
                                 {/* Previous Result (Delta Check) */}
                                 {prevResult && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                       <History size={10} />
                                       <span>Préc: </span>
                                       <span className="font-semibold text-slate-600">{prevResult.value} {prevResult.unit}</span>
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
                                       <span className="text-xs font-semibold text-slate-800">
                                          {(() => {
                                            if (!isNumeric) return 'QUALIT.';
                                            const refVals = getTestReferenceValues(test, analysis.patientGender);
                                            return formatReferenceRange(refVals.min, refVals.max);
                                          })()}
                                       </span>
                                    </div>
                                    <button 
                                       onClick={() => toggleNote(result.id)}
                                       className={`p-1.5 rounded-lg transition-colors ${notes[result.id] ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50'}`}
                                       tabIndex={-1}
                                       title={notes[result.id] ? 'Modifier Note' : 'Ajouter Note'}
                                    >
                                       <MessageSquare size={14} />
                                    </button>
                                 </div>
                            </div>
                            
                            {/* Notes Expanded */}
                            {expandedNotes.includes(result.id) && (
                               <div className={`ml-10 mr-4 mb-2 ${isValidated ? 'opacity-70' : ''}`}>
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                     <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                           <MessageSquare size={12} className="text-blue-500" />
                                           <span className="text-[10px] font-bold uppercase tracking-widest">Note Technique</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {notes[result.id] && (
                                                <button 
                                                    onClick={() => deleteNote(result.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors"
                                                    disabled={isValidated}
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => toggleNote(result.id)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button 
                                                onClick={() => applyNote(result.id)}
                                                className="btn-primary !rounded-lg !px-3 !py-1 text-[10px]"
                                                disabled={isValidated}
                                            >
                                                Appliquer
                                            </button>
                                        </div>
                                     </div>
                                     <textarea
                                        value={draftNotes[result.id] || ''}
                                        onChange={(e) => handleNoteChange(result.id, e.target.value)}
                                        placeholder="Saisissez une observation (ex: prélèvement hémolysé, contrôle refait...)"
                                        disabled={isValidated}
                                        className="w-full bg-white border border-slate-100 rounded-lg p-3 text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all min-h-[72px]"
                                        rows={2}
                                     />
                                  </div>
                               </div>
                            )}
                            
                            {/* Static Note Indicator */}
                            {!expandedNotes.includes(result.id) && notes[result.id] && (
                                <div className="ml-10 mr-4 mb-1 flex items-center gap-1.5 text-[10px] text-blue-600 font-medium px-3 py-1.5 rounded-lg bg-blue-50/50 w-fit cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => toggleNote(result.id)}>
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
            analysis={analysis} 
            results={results} 
            selectedResultIds={selectedIds} 
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        confirmLabel="Confirmer"
      />

      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}

      {/* Diatron Selection Dialog */}
      <Dialog open={!!diatronPreview} onOpenChange={(open) => !open && setDiatronPreview(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border-slate-200 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Microscope size={20} />
               </div>
               <div>
                  <DialogTitle className="text-lg font-bold text-slate-800">Sélectionner un Résultat</DialogTitle>
                  <p className="text-sm text-slate-500">Fichier importé : Diatron Abacus 380</p>
               </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-5 flex items-center gap-2.5 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
               <AlertCircle size={18} className="shrink-0" />
               <p className="text-sm font-medium">Plusieurs analyses ont été détectées dans ce fichier. Choisissez celle qui correspond à votre patient.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {diatronPreview?.map((record, i) => (
                <button
                  key={record.index}
                  onClick={() => handleDiatronSelect(record.index)}
                  className="group w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-blue-600 transition-colors">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-200">ID</span>
                        <span className="text-base font-bold text-slate-700 group-hover:text-white">{record.sampleId || '?'}</span>
                     </div>
                     
                     <div>
                        <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
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

                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
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
              Annuler l'importation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
