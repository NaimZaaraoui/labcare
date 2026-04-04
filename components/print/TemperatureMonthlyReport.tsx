'use client';

import React, { forwardRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';

type TemperatureReading = {
  id: string;
  value: number;
  period: string;
  recordedAt: string;
  isOutOfRange: boolean;
  correctiveAction?: string | null;
  recordedBy: string;
};

type Instrument = {
  id: string;
  name: string;
  type: string;
  unit: string;
  targetMin: number;
  targetMax: number;
  location?: string | null;
};

interface TemperatureMonthlyReportProps {
  instrument: Instrument;
  readings: TemperatureReading[];
  month: string;
  settings?: Record<string, string>;
}

export const TemperatureMonthlyReport = forwardRef<HTMLDivElement, TemperatureMonthlyReportProps>(
  ({ instrument, readings, month, settings }, ref) => {
    useEffect(() => {
      // Auto-trigger print after a short delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    const LAB_NAME = settings?.lab_name || 'Laboratoire';
    const LAB_SUBTITLE = settings?.lab_subtitle || 'Service de Laboratoire';
    const BIO_TITLE = settings?.lab_bio_title || 'Docteur';
    const BIO_NAME = settings?.lab_bio_name || '';
    const BIO_ONMPT = settings?.lab_bio_onmpt || '';
    const BIO_SIGNATURE = settings?.lab_signature;

    const printDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    const targetMonth = format(new Date(month + '-01'), 'MMMM yyyy', { locale: fr });

    const renderHeader = () => (
      <thead>
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
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 print:text-black">SUIVI TEMPÉRATURE</h2>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">Période: {targetMonth}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest print:text-black">{instrument.name} · {instrument.type}</p>
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
                    Revue effectuée conformément aux procédures d'assurance qualité du laboratoire. 
                    Les écarts hors plage font l'objet d'actions correctives documentées.<br />
                    <span className="text-[8px] font-black text-slate-300 uppercase print:text-black/40 italic mt-2 block tracking-wider">Document généré le {printDate}</span>
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

    // Basic SVG Chart for Print (simplified from interactive one)
    const renderChart = () => {
      if (readings.length === 0) return null;

      const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      const values = sorted.map((item) => item.value);
      const minObs = Math.min(instrument.targetMin, ...values);
      const maxObs = Math.max(instrument.targetMax, ...values);
      const padding = (maxObs - minObs || 1) * 0.4;
      const chartMin = minObs - padding;
      const chartMax = maxObs + padding;
      const chartRange = chartMax - chartMin;

      const width = 800;
      const height = 250;
      const margin = 40;

      const getX = (index: number) => margin + (index * (width - margin * 2)) / (sorted.length - 1 || 1);
      const getY = (value: number) => height - margin - ((value - chartMin) * (height - margin * 2)) / chartRange;

      const points = sorted.map((item, index) => `${getX(index)},${getY(item.value)}`).join(' ');

      return (
        <div className="mb-12 break-inside-avoid">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] print:text-black">Graphique de tendance</span>
            <div className="h-[1px] flex-1 bg-slate-100 print:bg-black/5"></div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400">
               <span>Zone: {instrument.targetMin} - {instrument.targetMax}{instrument.unit}</span>
            </div>
          </div>
          
          <div className="bg-slate-50/30 p-4 border border-slate-100">
             <svg width="100%" height="200" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
              {/* Acceptance Zone */}
              <rect
                x={margin}
                y={getY(instrument.targetMax)}
                width={width - margin * 2}
                height={Math.abs(getY(instrument.targetMin) - getY(instrument.targetMax))}
                fill="rgba(16, 185, 129, 0.08)"
              />
              <line x1={margin} y1={getY(instrument.targetMin)} x2={width - margin} y2={getY(instrument.targetMin)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={margin} y1={getY(instrument.targetMax)} x2={width - margin} y2={getY(instrument.targetMax)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

              <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
              
              {sorted.map((item, index) => (
                <circle
                  key={item.id}
                  cx={getX(index)}
                  cy={getY(item.value)}
                  r="4"
                  fill={item.isOutOfRange ? '#ef4444' : '#10b981'}
                />
              ))}
            </svg>
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className="bg-white p-10 text-slate-900 font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

        <table className="w-full border-collapse border-none">
          {renderHeader()}
          <tbody>
            <tr>
              <td>
                <div className="py-8">
                  {renderChart()}
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

TemperatureMonthlyReport.displayName = 'TemperatureMonthlyReport';
