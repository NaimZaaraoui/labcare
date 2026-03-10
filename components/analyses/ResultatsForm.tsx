'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, Printer, CheckCircle, 
  Activity, ArrowLeft, Beaker, 
  Droplets, Microscope, Sparkles, AlertCircle,
  ChevronRight, History, Calculator, MessageSquare
} from 'lucide-react';
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

  // Confirmation Dialog State
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
        // Load history for each test
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
      
      // Helper to get value by test code
      const getVal = (code: string) => {
        const res = analysis.results.find(r => r.test?.code === code);
        if (!res) return null;
        const val = updatedResults[res.id];
        return val ? parseFloat(val.replace(',', '.')) : null;
      };

      // Helper to set value by test code
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

      // Indices érythrocytaires (calculs automatiques)
      // VGM (Volume Globulaire Moyen) = (HT / GR) × 10 → fL
      if (rbc && hct && rbc > 0) setVal('VGM', (hct / rbc) * 10);
      // TCMH (Teneur Corpusculaire Moyenne en Hémoglobine) = (HB × 10) / GR → pg
      if (hgb && rbc && rbc > 0) setVal('TCMH', (hgb * 10) / rbc);
      // CCMH (Concentration Corpusculaire Moyenne en Hémoglobine) = (HB / HT) × 100 → g/dL
      if (hgb && hct && hct > 0) setVal('CCMH', (hgb / hct) * 100);

    // Formule Leucocytaire (Valeurs Absolues)
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
    
    // Si le prochain élément est un groupe, on passe au suivant
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
    
    // Check individually
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
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    console.log('🔔 Notification:', { type, message });
    setNotification({ type, message });
    
    // Set new timeout (5000ms for better visibility)
    notificationTimeoutRef.current = setTimeout(() => {
      console.log('🔔 Notification cleared');
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  };

  // Cleanup on unmount
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
    
    // Check if enough tests are completed
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
      // Track print event
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
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-[var(--radius-3xl)]" />
        <div className="h-96 bg-slate-100 rounded-[var(--radius-3xl)]" />
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
          
          // Find children in results
          const children = results.filter(r => r.test?.parentId === testId);
          
          // Apply rank sort for children
          children.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
          
          children.forEach(child => addTestAndChildren(child.testId, renderCategory));
        }
      };

      // Group results by category (using ID for grouping but Name/Rank for sorting)
      // We map results to categories based on categoryId or category string fallback
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

      // Special handling for NFS grouping if legacy category string is 'Hématologie' but code is NFS involved?
      // With new system, 'NFS' should be a Category if user wants it separate.
      // Migration script handles creation of Category 'NFS' if it was a distinct category string.
      // Previous logic split Hématologie into NFS/Hematologie.
      // Now we rely on the DB Category. If DB has "Hématologie", all go there.
      // If user wants splitting, they create a category 'NFS'.

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

        // Sort Top Level by Rank
        topLevel.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));

        topLevel.forEach(r => addTestAndChildren(r.testId, cat));
      });
      
      // Any remaining (circular refs or disconnected nodes)
      results.forEach(r => {
        if (!visited.has(r.testId)) {
          sorted.push({ ...r, renderCategory: r.test?.category || 'Divers' });
          visited.add(r.testId);
        }
      });

      return sorted;
    };

  const sortedResults = sortResults(analysis.results);

  return (
    <>
      <div className="animate-fade-in space-y-10 pb-20">
      {/* Premium Hero Header */}
      <div className="relative p-10 bg-slate-900 rounded-[var(--radius-3xl)] text-white overflow-hidden group shadow-premium">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20 group-hover:opacity-30 transition-opacity" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/analyses')}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="glass-badge badge-blue bg-blue-500/20 text-blue-300 border-none">Analysis No. {analysis.orderNumber}</span>
                <span className="text-slate-400 text-sm">•</span>
                <span className="text-slate-400 text-sm font-medium">{format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
              <h1 className={`text-4xl font-black tracking-tight leading-none ${!analysis.patientFirstName && !analysis.patientLastName ? 'text-slate-400 italic' : ''}`}>
                {(analysis.patientFirstName || analysis.patientLastName) ? (
                   <>
                      {analysis.patientFirstName} <span className="text-blue-500">{analysis.patientLastName}</span>
                   </>
                ) : 'Patient Sans Nom'}
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
            {!isValidated ? (
               <>
                <button onClick={handleSave} disabled={saving} className="btn-premium bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                   <Save size={20} className="mr-2" /> {saving ? '...' : 'Sauvegarder'}
                </button>
                <button onClick={handleValidate} disabled={validating} className="btn-primary-premium">
                   <CheckCircle size={20} className="mr-2" /> Valider l&apos;Analyse
                </button>
               </>
              ) : (
                 <button onClick={handlePrint} className="btn-primary-premium bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50">
                    <Printer size={20} className="mr-2" /> {selectedIds.length > 0 ? `Imprimer (${selectedIds.length})` : 'Imprimer Rapport'}
                 </button>
              )}

          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/10 pt-8 relative z-10 text-sm">
           <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">ID Paillasse</p>
              <p className="font-mono font-bold text-lg">{analysis.dailyId}</p>
           </div>
           <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Âge / Sexe</p>
              <p className="font-bold text-lg">{analysis.patientAge || '?'} ans • {analysis.patientGender}</p>
           </div>
           <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Progression</p>
              <p className="font-bold text-emerald-400 text-lg flex items-center gap-2">
                 {Math.round((completedCount/totalCount)*100)}% 
                 <span className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden inline-block">
                    <span className="h-full bg-emerald-500 block transition-all" style={{ width: `${(completedCount/totalCount)*100}%` }} />
                 </span>
              </p>
           </div>
           <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Anomalies</p>
              <p className={`font-bold text-lg ${abnormalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                 {abnormalCount} Détectée{abnormalCount > 1 ? 's' : ''}
              </p>
           </div>
        </div>
      </div>

      <div className="bento-card p-8">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={20} />
               </div>
               <h2 className="text-2xl font-black text-slate-900">Résultats des Tests</h2>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
               <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Tous ({totalCount})</button>
                  <button onClick={() => setActiveTab('urgent')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'urgent' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500'}`}>Anomalies ({abnormalCount})</button>
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
                     className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs"
                   >
                     <Microscope size={14} className={isImporting ? 'animate-pulse' : ''} />
                     {isImporting ? 'Importation...' : 'Importer Diatron'}
                   </button>
                 </div>
               )}

               {isValidated && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={toggleSelectAll}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.length === totalCount ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-300'}`}>
                    {selectedIds.length === totalCount && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">Sélectionner tout pour impression</span>
                </div>
              )}
           </div>


            <div className="space-y-4">
                {(() => {
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
                         <div key={`cat-${renderCategory}`} className="flex items-center gap-4 py-6 mb-4 mt-10 border-b-2 border-slate-900">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                               <Sparkles size={20} />
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                 {renderCategory === 'HEMA' || renderCategory === 'Hématologie' ? 'HÉMATOLOGIE' : 
                                  renderCategory === 'BIO' || renderCategory === 'Biochimie' ? 'BIOCHIMIE' : 
                                  renderCategory === 'NFS' ? 'HÉMATOLOGIE (NFS)' : renderCategory}
                               </h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ensemble de tests</p>
                            </div>
                            <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
                         </div>
                       );
                     }

                    const value = results[result.id];
                    const abnormal = isAbnormal(value, test);
                    const isNumeric = test.resultType === 'numeric' || !test.resultType;
                    const isGroup = test.isGroup;
                    const prevResult = history[result.id];
                    
                    // Renommage éventuel (sécurité)
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
                        <div className={`group transition-all ${isGroup ? 'mt-8 mb-4' : 'mb-2'}`}>
                           {isGroup ? (
                              <div className="flex items-center gap-4 py-4 border-b border-slate-200 bg-slate-50/50 px-4 rounded-xl">
                                 <div>
                                    <h3 className="text-base font-black text-slate-700 uppercase tracking-tight">{displayName}</h3>
                                 </div>
                                 <div className="h-[1px] flex-1 bg-slate-200 ml-4"></div>
                              </div>
                           ) : (
                               <>
                               <div className={`bento-card border-none hover:bg-slate-50 transition-all p-4 flex flex-col lg:flex-row items-center justify-between gap-6 ${test.parentId ? 'ml-8 border-l-4 border-slate-200 bg-slate-50/50' : ''} ${abnormal ? 'bg-rose-50/30 ring-1 ring-rose-100' : 'bg-white shadow-sm hover:shadow-md'}`}>
                                  {isValidated && (
                                     <div 
                                        onClick={() => toggleSelection(result.id)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${selectedIds.includes(result.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                                     >
                                        {selectedIds.includes(result.id) && <CheckCircle size={14} className="text-white" />}
                                     </div>
                                  )}
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${abnormal ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                       {test.category === 'HEMA' ? <Droplets size={18} /> : test.category === 'BIO' ? <Microscope size={18} /> : <Beaker size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                       <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight">{displayName}</h4>
                                          {isFormula && <Calculator size={12} className="text-blue-500" />}
                                       </div>
                                       <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{test.code}</span>
                                    </div>
                                  </div>

                                   <div className="flex-1 flex flex-col items-center gap-2">
                                      <div className="relative w-full flex justify-center">
                                           {test.resultType === 'long_text' ? (
                                              <textarea
                                                ref={(el) => { inputsRef.current[result.id] = el; }}
                                                value={results[result.id]}
                                                onChange={(e) => handleResultChange(result.id, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, index, sortedResults.length)}
                                                  disabled={isValidated || isFormula}
                                                  rows={3}
                                                  className="input-premium py-3 px-4 text-sm w-full max-w-lg min-h-[80px]"
                                                  placeholder="Saisissez les résultats détaillés ici..."
                                                />
                                             ) : test.resultType === 'dropdown' ? (
                                              <select
                                                ref={(el) => { inputsRef.current[result.id] = el; }}
                                                value={results[result.id]}
                                                onChange={(e) => handleResultChange(result.id, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, index, sortedResults.length)}
                                                disabled={isValidated || isFormula}
                                                className={`h-12 w-48 input-premium text-sm font-bold ${results[result.id] ? 'text-blue-600 border-blue-200' : 'text-slate-400'}`}
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
                                                 className={`h-12 input-premium font-black transition-all ${isNumeric ? 'w-32 text-xl text-center' : 'w-64 text-sm px-4'} ${abnormal ? 'text-rose-600 border-rose-200 bg-rose-50/50' : 'text-slate-900 focus:border-blue-600'}`}
                                               />
                                               {abnormal && <AlertCircle className="absolute -right-8 top-1/2 -translate-y-1/2 text-rose-500" size={18} />}
                                            </div>
                                         )}
                                      </div>
                                    
                                    {prevResult && (
                                       <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                          <History size={10} />
                                          <span>Précédent: </span>
                                          <span className="font-bold text-slate-600">{prevResult.value} {prevResult.unit}</span>
                                          <span className="opacity-50">({format(new Date(prevResult.createdAt), 'dd/MM/yy')})</span>
                                       </div>
                                    )}
                                 </div>

                                    <div className="flex items-center gap-8 flex-1 justify-end">
                                      <div className="flex flex-col items-end gap-2">
                                         <div className="flex items-center gap-8 justify-end">
                                            <div className="text-right">
                                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unité</p>
                                               <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{test.unit || '--'}</span>
                                            </div>
                                            <div className="text-right w-24">
                                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Référence</p>
                                               <p className="text-[11px] font-bold text-slate-900">
                                                  {(() => {
                                                    if (!isNumeric) return 'QUALIT.';
                                                    const refVals = getTestReferenceValues(test, analysis.patientGender);
                                                    return formatReferenceRange(refVals.min, refVals.max);
                                                  })()}
                                               </p>
                                            </div>
                                         </div>
                                         
                                         <button 
                                            onClick={() => toggleNote(result.id)}
                                            className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${notes[result.id] ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                                            tabIndex={-1}
                                         >
                                            <MessageSquare size={12} />
                                            {notes[result.id] ? 'Modifier Note' : 'Ajouter Note'}
                                         </button>
                                      </div>
                                   </div>
                                </div>
                                
                                {/* Notes Field - Redesigned UI */}
                                {expandedNotes.includes(result.id) && (
                                   <div className={`mt-4 ml-14 mr-4 animate-fade-in ${isValidated ? 'opacity-70' : ''}`}>
                                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm relative group/note">
                                         <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-slate-500">
                                               <MessageSquare size={14} className="text-blue-500" />
                                               <span className="text-[10px] font-black uppercase tracking-widest">Note Technique</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {notes[result.id] && (
                                                    <button 
                                                        onClick={() => deleteNote(result.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                                                        disabled={isValidated}
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => toggleNote(result.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-200/50 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                                <button 
                                                    onClick={() => applyNote(result.id)}
                                                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95"
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
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all min-h-[80px]"
                                            rows={2}
                                         />
                                      </div>
                                   </div>
                                )}
                                
                                {/* Static Note Display if not expanded but exists */}
                                {!expandedNotes.includes(result.id) && notes[result.id] && (
                                    <div className="mt-2 ml-14 mr-4 flex items-center gap-2 text-[10px] text-blue-600 font-medium bg-blue-50/30 px-3 py-2 rounded-xl border border-blue-50 w-fit cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => toggleNote(result.id)}>
                                        <MessageSquare size={12} />
                                        <span className="truncate max-w-md">Note: {notes[result.id]}</span>
                                    </div>
                                )}
                                </>
                             )}
                          </div>
                      </div>
                    );
                 });
               })()}
            </div>


         {analysis.results.length === 0 && (
            <div className="py-20 text-center">
               <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-400 mb-6">
                  <Beaker size={40} />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Aucun test configuré</h3>
               <p className="text-slate-500 mt-2">Veuillez vérifier la configuration de cette analyse.</p>
            </div>
         )}
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden' }}>
        <div ref={printRef}>
          <RapportImpression 
            analysis={analysis} 
            results={results} 
            selectedResultIds={selectedIds} 
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        confirmLabel="Confirmer"
      />

      </div>

      {/* Notification Toast - Moved outside animate-fade-in div to fix position:fixed behavior */}
      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
      {/* Diatron Selection Dialog */}
      <Dialog open={!!diatronPreview} onOpenChange={(open) => !open && setDiatronPreview(null)}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="p-8 pb-4 border-b border-slate-100 bg-white/50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Microscope size={24} />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Sélectionner un Résultat</DialogTitle>
                  <p className="text-slate-500 font-medium">Fichier importé : Diatron Abacus 380</p>
               </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
            <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
               <AlertCircle size={20} className="shrink-0" />
               <p className="text-sm font-medium">Plusieurs analyses ont été détectées dans ce fichier. Choisissez celle qui correspond à votre patient.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {diatronPreview?.map((record, i) => (
                <button
                  key={record.index}
                  onClick={() => handleDiatronSelect(record.index)}
                  className="group relative w-full flex items-center justify-between p-5 rounded-2xl border border-white bg-white shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-50 group-hover:via-white group-hover:to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative flex items-center gap-6">
                     <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-blue-600 transition-colors duration-300">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-200 mb-0.5">ID</span>
                        <span className="text-lg font-black text-slate-700 group-hover:text-white">{record.sampleId || '?'}</span>
                     </div>
                     
                     <div>
                        <div className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                           Analyse du {record.date}
                        </div>
                        <div className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                           <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                              <History size={12} /> {record.time}
                           </span>
                           <span className="text-slate-300">•</span>
                           <span>Index #{record.index + 1}</span>
                        </div>
                     </div>
                  </div>

                  <div className="relative w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 transform group-hover:translate-x-1">
                    <ChevronRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
            <button
              onClick={() => setDiatronPreview(null)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              Annuler l'importation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
