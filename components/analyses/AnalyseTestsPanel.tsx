import { Check, Search } from 'lucide-react';
import type { Test } from '@/lib/types';
import type { BilanOption } from './analyse-form-types';

interface AnalyseTestsPanelProps {
  searchTest: string;
  setSearchTest: (value: string) => void;
  bilans: BilanOption[];
  selectedTests: string[];
  toggleBilan: (bilan: BilanOption) => void;
  groupedTests: Record<string, Test[]>;
  toggleTest: (testId: string) => void;
}

export function AnalyseTestsPanel({
  searchTest,
  setSearchTest,
  bilans,
  selectedTests,
  toggleBilan,
  groupedTests,
  toggleTest,
}: AnalyseTestsPanelProps) {
  return (
    <div className="bento-panel flex h-full flex-col p-6 lg:p-7">
      <div className="mb-6 flex flex-col items-start justify-between gap-4">
        <div className="input-premium flex h-11 w-full max-w-sm items-center gap-2 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            placeholder="Chercher analyse..."
            value={searchTest}
            onChange={(e) => setSearchTest(e.target.value)}
            className="h-full w-full bg-slate-50 pr-4 text-sm font-medium outline-none"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {bilans.map((bilan) => {
            const bilanTestIds = bilan.tests.map((test) => test.id);
            const isSelected = bilanTestIds.length > 0 && bilanTestIds.every((id: string) => selectedTests.includes(id));
            return (
              <button
                key={bilan.id}
                type="button"
                onClick={() => toggleBilan(bilan)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {bilan.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 max-h-[560px] space-y-8 overflow-y-auto pr-1">
        {Object.entries(groupedTests).map(([category, categoryTests]) => (
          <div key={category} className="space-y-3">
            <div className="sticky top-0 z-10 block flex items-center gap-3 bg-white/95 py-2 backdrop-blur-sm">
              <h3 className="section-label">{category}</h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categoryTests.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                const isChild = !!test.parentId;
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => toggleTest(test.id)}
                    className={`group relative flex min-h-[88px] flex-col justify-center overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                    } ${isChild ? 'ml-4 opacity-80 border-dashed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {test.code}
                        </span>
                        <span className={`mt-0.5 text-sm font-medium leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {test.name}
                        </span>
                      </div>
                      <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-300'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={4} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
