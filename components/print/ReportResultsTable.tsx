import React from 'react';
import { sortReportResults } from '@/lib/report-generation';
import type { Analysis, Result } from '@/lib/types';
import type { ReferenceDisplay } from '@/components/print/types';

interface Props {
  categories: string[];
  categoryGroups: Record<string, Result[]>;
  results: Record<string, string>;
  testReferences: Map<string, ReferenceDisplay>;
  analysis: Analysis;
}

export function ReportResultsTable({
  categories,
  categoryGroups,
  results,
  testReferences,
  analysis,
}: Props) {
  return (
    <tbody className="display-table-row-group print:h-full">
      <tr>
        <td>
          <div className="mb-6 relative z-10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-muted)]/50 print:bg-black/5">
                  <th className="py-2 pl-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Examen / Paramètre</th>
                  <th className="py-2 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Résultat</th>
                  <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black w-20">Antér.</th>
                  <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Unité</th>
                  <th className="py-2 pr-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Valeurs de Référence</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((categoryName) => {
                  const catResults = sortReportResults(categoryGroups[categoryName]);
                  const isNFS = categoryName === 'NFS';

                  return (
                    <React.Fragment key={categoryName}>
                      <tr>
                        <td colSpan={5} className="py-2">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">
                              {categoryName === 'NFS' ? 'Hématologie (NFS)' : categoryName}
                            </span>
                            <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10"></div>
                          </div>
                        </td>
                      </tr>
                      {catResults.map((res) => {
                        const refVals = testReferences.get(res.testId);
                        const val = results[res.id] || '';
                        const test = res.test;
                        const isGroup = test?.isGroup;

                        let flag: 'H' | 'L' | null = null;
                        if (test && refVals) {
                          const nVal = parseFloat(val.replace(',', '.'));
                          if (!isNaN(nVal)) {
                            if (refVals.max !== null && nVal > refVals.max) flag = 'H';
                            else if (refVals.min !== null && nVal < refVals.min) flag = 'L';
                          }
                        }

                        if (isGroup) {
                          return (
                            <tr key={res.id} className="break-inside-avoid">
                              <td colSpan={5} className="py-1.75 bg-[var(--color-surface-muted)]/30 print:bg-black/5">
                                <div className="flex items-center gap-3 px-4">
                                  <span className="text-[12px] font-black text-[var(--color-accent)] uppercase tracking-tight print:text-black">{test?.name}</span>
                                  <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10"></div>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <React.Fragment key={res.id}>
                            <tr className={`group even:bg-[var(--color-surface-muted)]/30 print:even:bg-black/2 transition-colors break-inside-avoid `}>
                              <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} pl-4`}>
                                <div className={`flex flex-col ${test?.parentId ? 'pl-6' : 'pl-4'}`}>
                                  <span className="text-[11px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">{test?.name}</span>
                                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest print:text-black/40">{test?.code}</span>
                                </div>
                              </td>
                              <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} text-start`}>
                                <div className="flex flex-col items-start gap-0.5">
                                  <div className="flex items-center justify-start gap-2">
                                    <span className={`text-[14px] tracking-tight text-[var(--color-text)] ${flag ? 'font-black' : 'font-semibold'} print:text-black`}>
                                      {val || '—'}
                                    </span>
                                    {flag && (
                                      <span className="text-[12px] font-black text-[var(--color-text)] px-1 py-0.5 min-w-3.5">
                                        {flag === 'H' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>

                                  {res.notes && (
                                    <span className="text-[9px] font-medium text-[var(--color-text-soft)] italic leading-none mt-1 print:text-black/60">
                                      ({res.notes})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} text-center`}>
                                <span className="text-xs tracking-tight font-bold text-slate-400 print:text-black/40">
                                  {analysis.previousResults?.[res.testId] || '—'}
                                </span>
                              </td>
                              <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} px-4 text-center text-xs font-bold text-[var(--color-text-soft)] print:text-black`}><span dangerouslySetInnerHTML={{ __html: res.unit || test?.unit || '—' }} /></td>
                              <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} pr-4 text-right text-xs font-bold text-slate-400 print:text-black`}>
                                {refVals && (
                                  refVals.display === 'QUALIT.' ? (
                                    <span className="opacity-10 text-[8px] font-black tracking-widest">SANS RÉF.</span>
                                  ) : (
                                    <span className="text-[var(--color-text)] tracking-tight print:text-black">{refVals.display}</span>
                                  )
                                )}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </tbody>
  );
}
