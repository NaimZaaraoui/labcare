import { Activity, CheckCircle, Microscope } from 'lucide-react';
import type { Analysis } from '@/lib/types';

interface AnalysisResultsToolbarProps {
  analysis: Analysis;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalCount: number;
  abnormalCount: number;
  isFinalValidated: boolean;
  hasNFS: boolean;
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDiatronFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleSelectAll: () => void;
  selectedIds: string[];
}

export function AnalysisResultsToolbar({
  analysis,
  activeTab,
  setActiveTab,
  totalCount,
  abnormalCount,
  isFinalValidated,
  hasNFS,
  isImporting,
  fileInputRef,
  handleDiatronFileChange,
  toggleSelectAll,
  selectedIds,
}: AnalysisResultsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Activity size={16} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Résultats des tests</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border bg-[var(--color-surface-muted)] p-1">
          <button onClick={() => setActiveTab('all')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'all' ? 'border bg-white text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>Tous ({totalCount})</button>
          <button onClick={() => setActiveTab('urgent')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'urgent' ? 'bg-rose-600 text-white' : 'text-[var(--color-text-secondary)] hover:text-rose-700'}`}>Anomalies ({abnormalCount})</button>
          {analysis.histogramData && (
            <button onClick={() => setActiveTab('charts')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'charts' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}>Graphiques</button>
          )}
        </div>

        {!isFinalValidated && hasNFS && (
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleDiatronFileChange} accept=".txt" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="btn-secondary h-9 text-xs">
              <Microscope size={14} className={isImporting ? 'animate-pulse' : ''} />
              {isImporting ? 'Import...' : 'Diatron'}
            </button>
          </div>
        )}

        {isFinalValidated && (
          <button className="btn-secondary h-9 text-xs" onClick={toggleSelectAll}>
            <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${selectedIds.length === totalCount ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
              {selectedIds.length === totalCount && <CheckCircle size={10} className="text-white" />}
            </div>
            Tout sélectionner
          </button>
        )}
      </div>
    </div>
  );
}
