import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope, CalendarClock, ShieldCheck } from 'lucide-react';
import { LeveyJenningsChart } from '../qc/LeveyJenningsChart';
import { getQcZone } from '@/lib/qc';

interface QcMonthlyReportProps {
  lot: any; 
  settings?: Record<string, string>;
  month?: Date;
}

export const QcMonthlyReport = forwardRef<HTMLDivElement, QcMonthlyReportProps>(
  ({ lot, settings, month = new Date() }, ref) => {
    const LAB_NAME = settings?.lab_name || 'Laboratoire';
    const LAB_SUBTITLE = settings?.lab_subtitle || 'Service de Laboratoire';
    const LAB_ADDRESS = [settings?.lab_address_1, settings?.lab_address_2].filter(Boolean).join(', ');
    const LAB_PHONE = settings?.lab_phone || '';
    const BIO_TITLE = settings?.lab_bio_title || 'Docteur';
    const BIO_NAME = settings?.lab_bio_name || '';
    const BIO_ONMPT = settings?.lab_bio_onmpt || '';
    const FOOTER_TEXT = settings?.lab_footer_text || '';
    const STAMP_IMAGE = settings?.lab_stamp_image || '';
    const BIO_SIGNATURE = settings?.lab_bio_signature || '';

    const printDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const targetMonth = format(month, 'MMMM yyyy', { locale: fr });

    const grouped = lot.targets.map((target: any) => {
      const points = lot.results
        .map((result: any) => {
          const value = result.values.find((v: any) => v.testCode === target.testCode);
          if (!value) return null;
          return {
            id: value.id,
            performedAt: result.performedAt,
            performedByName: result.performedByName || 'Utilisateur',
            measured: value.measured,
            zScore: value.zScore,
            controlMode: value.controlMode,
            minAcceptable: value.minAcceptable,
            maxAcceptable: value.maxAcceptable,
            inAcceptanceRange: value.inAcceptanceRange,
            flag: value.flag,
            rule: value.rule,
          };
        })
        .filter(Boolean);

      const validPoints = points.filter((p: any) => p.flag !== 'fail' && p.controlMode === 'STATISTICAL');
      const n = validPoints.length;
      const expMean = n > 0 ? validPoints.reduce((acc: number, p: any) => acc + p.measured, 0) / n : null;
      const expSD = n > 1 && expMean !== null ? Math.sqrt(validPoints.reduce((acc: number, p: any) => acc + Math.pow(p.measured - expMean, 2), 0) / (n - 1)) : null;
      const expCV = expMean !== null && expSD !== null && expMean !== 0 ? (expSD / expMean) * 100 : null;

      return { target, points, stats: { n, expMean, expSD, expCV } };
    });

    const renderHeader = () => (
      <thead className="display-table-header-group">
        <tr>
          <td>
            <div className="flex justify-between items-end mb-8 relative z-10 pt-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-black rounded-md">
                  <LucideMicroscope size={40} className="text-white" />
                </div>
                <div className="flex flex-col ml-2">
                  <h1 className="text-4xl font-black text-slate-900 tracking-[-0.05em] uppercase print:text-black leading-none">
                    {LAB_NAME}
                  </h1>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-indigo-600 print:bg-black"></span>
                    {LAB_SUBTITLE.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="text-right border-r-4 border-indigo-600 pr-6 print:border-black">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 print:text-black">REVUE MENSUELLE CQ</h2>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">Période: {targetMonth}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest print:text-black">{lot.material.name} · LOT {lot.lotNumber}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </thead>
    );

    const renderFooter = () => (
      <tfoot className="display-table-footer-group">
        <tr>
          <td>
            <div className="pt-6 border-t-2 border-slate-900 print:border-black mt-12">
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Validation Biologiste</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md print:text-black">
                    Revue effectuée conformément aux procédures du laboratoire. 
                    Les graphiques de Levey-Jennings sont revus mensuellement pour valider la stabilité du système analytique.<br />
                    <span className="text-[8px] font-black text-slate-300 uppercase print:text-black/40">Z = z-score | 1-2S, 1-3S, 2-2S, R-4S, 4-1S, 10-X = Règles de Westgard</span>
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">Cachet & Signature</span>
                  </div>
                  <div className="flex flex-col items-center min-h-[100px]">
                    {BIO_SIGNATURE && (
                      <img src={BIO_SIGNATURE} alt="Signature" className="max-h-20 object-contain mix-blend-multiply opacity-90 mb-2" />
                    )}
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest print:text-black text-center">
                      {BIO_TITLE} {BIO_NAME}
                    </p>
                    {BIO_ONMPT && <p className="text-[8px] font-bold text-slate-400 print:text-black/60 mt-0.5">ONMPT: {BIO_ONMPT}</p>}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    );

    return (
      <div ref={ref} className="bg-white p-10 text-slate-900 font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

        <table className="w-full border-collapse border-none">
          {renderHeader()}
          <tbody>
            <tr>
              <td>
                <div className="space-y-12 py-8">
                  {grouped.map(({ target, points }: any) => (
                    <div key={target.id} className="break-inside-avoid">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] print:text-black">
                          {target.testName} ({target.testCode})
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-100 print:bg-black/5"></div>
                        <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                          <span>Cible: {target.mean.toFixed(2)}</span>
                          <span>Unité: {target.unit}</span>
                        </div>
                      </div>

                      <div className="transform scale-[0.98] origin-top mb-12">
                        <LeveyJenningsChart
                          title=""
                          points={points}
                          mean={target.mean}
                          sd={target.sd}
                          unit={target.unit}
                          controlMode={target.controlMode}
                          minAcceptable={target.minAcceptable}
                          maxAcceptable={target.maxAcceptable}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
          {renderFooter()}
        </table>

        <style jsx global>{`
          @media print {
            @page {
              margin: 12mm 10mm;
              size: A4;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        `}</style>
      </div>
    );
  }
);

QcMonthlyReport.displayName = 'QcMonthlyReport';
