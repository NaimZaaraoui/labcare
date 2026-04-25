import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { resolvePrintBranding } from '@/lib/report-generation';
import type { Analysis } from '@/lib/types';
import type { PrintSettings } from '@/components/print/types';

interface Props {
  analysis: Analysis;
  settings?: PrintSettings;
}

export function ReportHeader({ analysis, settings }: Props) {
  const { LAB_NAME, LAB_SUBTITLE, LAB_ADDRESS } = resolvePrintBranding(settings);

  const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
  const dateEdition = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const datePrelevement = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <thead className="display-table-header-group">
      <tr>
        <td>
          <div className="flex justify-between items-end mb-4 relative z-10 pt-4 px-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-black rounded-xl">
                <LucideMicroscope size={40} className="text-white" />
              </div>
              <div className="flex flex-col ml-2">
                <h1 className="text-4xl font-black text-[var(--color-text)] tracking-tight uppercase print:text-black leading-none">
                  {LAB_NAME}
                </h1>
                <div className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className="w-6 h-[2px] bg-indigo-600 print:bg-black"></span>
                  {LAB_SUBTITLE}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-5 pr-6">
              <div className="text-right">
                <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">RAPPORT D&apos;ANALYSE</h2>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">Référence: {analysis.orderNumber}</p>
                  {analysis.receiptNumber && (
                    <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest print:text-black">Quittance: {analysis.receiptNumber}</p>
                  )}
                </div>
              </div>
              <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm print:border-black/20 print:shadow-none shrink-0 mix-blend-multiply">
                <QRCodeSVG value={analysis.orderNumber.trim()} size={54} level="M" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-8 relative z-10 px-4">
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
            <div className="col-span-4">
              <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">Patient</span>
              <div className="flex flex-col mt-2">
                <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{patientName}</h3>
                <div className="flex gap-4 text-sm font-medium text-[var(--color-text-soft)] print:text-black">
                  <span>{analysis.patientAge} ans</span>
                  <span className="text-slate-200 print:text-black/30">|</span>
                  <span className="uppercase">{analysis.patientGender === 'M' ? 'H' : 'F'}</span>
                  <span className="text-slate-200 print:text-black/30">|</span>
                  <span>ID: <span className="font-bold text-[var(--color-text)] print:text-black">{analysis.dailyId}</span></span>
                </div>
              </div>
            </div>

            <div className="col-span-8 grid grid-cols-2 gap-4 pl-8 border-l border-[var(--color-border)] print:border-black/10">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Prélèvement</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{datePrelevement}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Édition</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{dateEdition}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Établissement</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{LAB_NAME}{LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}</p>
              </div>
            </div>
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
          </div>
        </td>
      </tr>
    </thead>
  );
}
