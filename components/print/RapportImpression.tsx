import React, { forwardRef, useMemo } from 'react';
import { isAnalysisValidated } from '@/lib/status-flow';
import { ReportPrintProps } from '@/components/print/types';
import {
  buildReportReferenceMap,
  filterSelectedReportResults,
  groupReportResultsByCategory,
  parseReportHistograms,
} from '@/lib/report-generation';
import { ReportHeader } from '@/components/print/ReportHeader';
import { ReportFooterSignature } from '@/components/print/ReportFooterSignature';
import { ReportResultsTable } from '@/components/print/ReportResultsTable';
import { ReportPageFrame } from '@/components/print/ReportPageFrame';
import { ReportMorphologySection } from '@/components/print/ReportMorphologySection';
import type { AnalysisStatus } from '@/lib/status-flow';

export const RapportImpression = forwardRef<HTMLDivElement, ReportPrintProps>(
  ({ analysis, results, selectedResultIds = [], settings }, ref) => {
    const isValidated = isAnalysisValidated(analysis.status as AnalysisStatus);
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
            <ReportPageFrame key={cat} isValidated={isValidated} breakBefore={index > 0}>
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
            </ReportPageFrame>
          );
        })}

        {analysis.histogramData && (
          <ReportPageFrame isValidated={isValidated} breakBefore>
            <table className="w-full border-collapse border-none mb-4 relative z-10">
              <ReportHeader analysis={analysis} settings={settings} />
              <ReportMorphologySection
                analysis={analysis}
                results={results}
                parsedHistograms={parsedHistograms}
                pltData={pltData}
              />
              <tbody>
                <tr>
                  <td>{renderGlobalNote(allOrderedCategories.length)}</td>
                </tr>
              </tbody>
              <ReportFooterSignature analysis={analysis} settings={settings} showFull={true} />
            </table>
          </ReportPageFrame>
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
