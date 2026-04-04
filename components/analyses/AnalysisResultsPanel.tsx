import { Beaker } from 'lucide-react';
import type { Analysis, Result } from '@/lib/types';
import type { ResultWithRenderCategory } from './types';
import { AnalysisChartsTab } from './AnalysisChartsTab';
import { AnalysisResultRow } from './AnalysisResultRow';
import { AnalysisResultsToolbar } from './AnalysisResultsToolbar';
import { isResultAbnormal } from './resultats-metrics';

interface AnalysisResultsPanelProps {
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
  sortedResults: ResultWithRenderCategory[];
  results: Record<string, string>;
  history: Record<string, Result | null>;
  notes: Record<string, string>;
  draftNotes: Record<string, string>;
  expandedNotes: string[];
  inputsRef: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>;
  handleResultChange: (resultId: string, value: string) => void;
  formatValue: (value: string, decimals?: number) => string;
  handleKeyDown: (e: React.KeyboardEvent, index: number, total: number) => void;
  toggleSelection: (id: string) => void;
  toggleNote: (id: string) => void;
  handleNoteChange: (id: string, value: string) => void;
  applyNote: (id: string) => void;
  deleteNote: (id: string) => void;
}

export function AnalysisResultsPanel({
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
  sortedResults,
  results,
  history,
  notes,
  draftNotes,
  expandedNotes,
  inputsRef,
  handleResultChange,
  formatValue,
  handleKeyDown,
  toggleSelection,
  toggleNote,
  handleNoteChange,
  applyNote,
  deleteNote,
}: AnalysisResultsPanelProps) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(15,31,51,0.06)] lg:p-6">
      <AnalysisResultsToolbar
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
        toggleSelectAll={toggleSelectAll}
        selectedIds={selectedIds}
      />

      <div className="space-y-1">
        {activeTab === 'charts' && <AnalysisChartsTab analysis={analysis} results={results} />}

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

            const isGroup = test.isGroup;
            const displayName = test.name;
            const abnormal = isResultAbnormal(results[result.id], test, analysis.patientGender);

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
                  <AnalysisResultRow
                    analysis={analysis}
                    result={result}
                    index={index}
                    total={sortedResults.length}
                    isFinalValidated={isFinalValidated}
                    selectedIds={selectedIds}
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
  );
}
