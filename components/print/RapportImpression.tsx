import React, { forwardRef, useMemo } from 'react';
import { HistogramView } from '../analyses/HistogramView';
import { getHematologyInterpretations } from '@/lib/interpretations';
import { ReportPrintProps } from '@/components/print/types';
import {
  buildReportReferenceMap,
  filterSelectedReportResults,
  groupReportResultsByCategory,
  parseReportHistograms,
} from '@/components/print/report-helpers';
import { ReportHeader } from '@/components/print/ReportHeader';
import { ReportFooterSignature } from '@/components/print/ReportFooterSignature';
import { ReportResultsTable } from '@/components/print/ReportResultsTable';

export const RapportImpression = forwardRef<HTMLDivElement, ReportPrintProps>(
  ({ analysis, results, selectedResultIds = [], settings }, ref) => {
    const isValidated = analysis.status === 'completed' || analysis.status === 'validated_bio';
    const globalNote = analysis.globalNote?.trim();
    const globalNotePlacement = analysis.globalNotePlacement || 'all';

    const filteredResults = useMemo(() => {
      return filterSelectedReportResults(analysis.results || [], selectedResultIds);
    }, [analysis.results, selectedResultIds]);

    const { categoryGroups, allOrderedCategories } = useMemo(() => {
      return groupReportResultsByCategory(filteredResults);
    }, [filteredResults]);

    const { histogramData: parsedHistograms, pltData } = useMemo(() => {
      return parseReportHistograms(analysis.histogramData);
    }, [analysis.histogramData]);

    const testReferences = useMemo(() => {
      return buildReportReferenceMap(analysis.results, analysis.patientGender);
    }, [analysis.results, analysis.patientGender]);

    const totalPages = allOrderedCategories.length + (analysis.histogramData ? 1 : 0);
    const shouldRenderGlobalNote = (pageIndex: number) => {
      if (!globalNote) return false;
      if (globalNotePlacement === 'first') return pageIndex === 0;
      if (globalNotePlacement === 'last') return pageIndex === totalPages - 1;
      return true;
    };

    const renderGlobalNote = (pageIndex: number) => {
      if (!shouldRenderGlobalNote(pageIndex)) return null;
      return (
        <div className="px-4 py-2 mb-4 bg-[var(--color-surface-muted)]/40 print:bg-white">
          <p className="text-[11px] text-[var(--color-text-secondary)] italic leading-relaxed whitespace-pre-wrap print:text-black">
            <span className="font-bold not-italic">(*) </span>
            {globalNote}
          </p>
      </div>
    );
    };

    return (
      <div ref={ref} className="bg-[var(--color-surface)] font-sans text-[var(--color-text)] w-[210mm] mx-auto relative leading-relaxed print:p-0 print:text-black">
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 right-0 h-24 w-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

        {allOrderedCategories.map((cat, index) => {
          const isNFS = cat === 'NFS';
          return (
            <div key={cat} className={`${index > 0 ? 'print:break-before-page' : ''} relative`}>
            {!isValidated && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] text-[var(--color-text-soft)]/[0.07] text-[120px] font-black pointer-events-none select-none z-0 tracking-tighter whitespace-nowrap px-12 py-4 rounded-[60px] print:text-black/[0.05] print:border-black/[0.05]">
                 BROUILLON
               </div>
            )}
              <table className="w-full border-collapse border-none mb-4 relative z-10 flex-1">
                <ReportHeader analysis={analysis} settings={settings} />
                <ReportResultsTable 
                  categories={[cat]} 
                  categoryGroups={categoryGroups} 
                  results={results} 
                  testReferences={testReferences} 
                  analysis={analysis} 
                />
                <tbody><tr><td>{renderGlobalNote(index)}</td></tr></tbody>
                <ReportFooterSignature analysis={analysis} settings={settings} showFull={!isNFS} />
          </table>
          </div>
          );
        })}

        {analysis.histogramData && (
          <div className="print:break-before-page mt-8 relative">
            {!isValidated && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] text-[var(--color-text-soft)]/[0.07] text-[120px] font-black pointer-events-none select-none z-90 tracking-tighter whitespace-nowrap px-12 py-4 rounded-[60px] print:text-black/[0.05] print:border-black/[0.05]">
                 BROUILLON
               </div>
            )}
            <table className="w-full border-collapse border-none mb-4 relative z-10">
              <ReportHeader analysis={analysis} settings={settings} />
                <tbody>
                    <tr>
                        <td>
                            <div className="mb-8">
                      <div className="py-1.75">
                                      <div className="flex items-center gap-3 px-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">Morphologie & Histogrammes</span>
                                        <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10"></div>
                                      </div>
                                    </div>

                                <div className="mt-8 grid grid-cols-3 gap-8">
                                {(() => {
                          if (!parsedHistograms) return null;
                                        return (
                                          <>
                                              <div className="space-y-4">
                                <HistogramView data={parsedHistograms.wbc} title="Distribution leucocytaire (WBC)" color="#000000" width={220} height={140} xAxisMax={400} variant="report" />
                                              </div>
                                              <div className="space-y-4">
                                <HistogramView data={parsedHistograms.rbc} title="Distribution érythrocytaire (RBC)" color="#000000" width={220} height={140} xAxisMax={250} variant="report" />
                                              </div>
                                              <div className="space-y-4">
                                <HistogramView data={pltData!} title="Distribution plaquettaire (PLT)" color="#000000" width={220} height={140} xAxisMax={60} variant="report" />
                                              </div>
                                          </>
                                        );
                                })()}
                                </div>
                            </div>

                            {(() => {
                                try {
                                    const interpretations = getHematologyInterpretations(analysis, results);
                                    if (interpretations.length === 0) return (
                          <p className="my-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conclusion Morphologique : Absence d&apos;anomalies majeures détectables</p>
                                    );
                                    
                                    return (
                                        <div className='p-6'>
                            <h4 className="text-[11px] font-black text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 print:text-black">Interprétations Diagnostiques</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {interpretations.map(flag => (
                                <span key={flag} className="px-3 py-1.5 bg-[var(--color-surface)] border border-indigo-100 rounded-lg text-[10px] font-medium text-indigo-700 print:border-black/80 print:text-black">
                                                        {flag}
                                                    </span>
                                                ))}
                                            </div>
                                            </div>
                                    );
                      } catch { return null; }
                            })()}
                        </td>
                    </tr>
                <tr>
                  <td>{renderGlobalNote(allOrderedCategories.length)}</td>
                </tr>
                </tbody>
              <ReportFooterSignature analysis={analysis} settings={settings} showFull={true} />
            </table>
          </div>
        )}

        <style jsx global>{`
          .break-inside-avoid {
            break-inside: avoid;
          }
          
          @media print {
              @page {
                margin: 12mm 10mm;
                size: A4;
                width: 189mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                counter-reset: page;
              }
              thead { 
                display: table-header-group;
              }
              tfoot { 
                display: table-footer-group;
              }
              
              .page-number::after {
                counter-increment: page;
                content: counter(page);
              }

              tr {
                break-inside: avoid;
              }
          }
        `}</style>
      </div>
    );
  }
);

RapportImpression.displayName = 'RapportImpression';
