import React, { forwardRef } from 'react';
import { Analysis } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';

interface RecuImpressionProps {
  analysis: Analysis;
}

// Shared grid config: 4 rows × 2 cols = 8 per A4
// Note: width & height should be set separately by the parent.
const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: '1fr 1fr 1fr 1fr',
};

// Shared receipt outer shell
function RecuShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full p-3 flex flex-col justify-between border border-dashed border-slate-300 print:border-black/20 relative overflow-hidden bg-white">
      {/* Corner accents — same as RapportImpression */}
      <div className="absolute top-0 right-0 w-1/3 h-[2px] bg-slate-900 print:bg-black" />
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-blue-600 print:bg-black" />
      <div className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-slate-900 print:bg-black" />
      {children}
    </div>
  );
}

// Shared header logo + title
function RecuHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <div className="p-[3px] bg-black rounded print:bg-black">
          <LucideMicroscope size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-900 tracking-[-0.03em] uppercase print:text-black leading-none">
            CSSB <span className="text-blue-600 print:text-black">GALLEL</span>
          </p>
          <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black/50">
            SERVICE DE LABORATOIRE
          </p>
        </div>
      </div>
      <div className="text-right border-r-2 border-blue-600 pr-2 print:border-black">
        <p className="text-[8px] font-black text-slate-900 uppercase tracking-tight print:text-black">{title}</p>
        {subtitle && <p className="text-[7px] font-bold text-slate-400 print:text-black/60">{subtitle}</p>}
      </div>
    </div>
  );
}

// Footer instruction strip
function RecuFooter() {
  return (
    <div className="mt-2 pt-1.5 border-t border-slate-100 print:border-black/10">
      <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.12em] text-center print:text-black/50">
        Présentez ce bon pour récupérer vos résultats · CSSB Gallel · Manzel Bouzaienne
      </p>
    </div>
  );
}

// ----- Analysis-specific receipt -----
function SingleRecu({ analysis }: { analysis: Analysis }) {
  const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
  const datePrelevement = format(new Date(analysis.creationDate), 'dd/MM/yyyy', { locale: fr });
  const heurePrelevement = format(new Date(analysis.creationDate), 'HH:mm', { locale: fr });

  return (
    <RecuShell>
      <RecuHeader
        title="BON DE RETRAIT"
        subtitle={`Réf: ${analysis.orderNumber}${analysis.receiptNumber ? ` · N° ${analysis.receiptNumber}` : ''}`}
      />

      <div className="flex-1 space-y-4">
        {/* Patient */}
        <div className="mt-3">
          <p className="text-[6px] font-black text-blue-600 uppercase tracking-[0.2em] print:text-black/70">Patient</p>
          <div className="h-px bg-slate-100 print:bg-black/10 mb-1.5" />
          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none print:text-black">
            {patientName}
          </p>
          <div className="flex gap-2 mt-0.5 text-[7px] font-bold text-slate-500 print:text-black/60">
            <span>{analysis.patientAge} ans</span>
            <span className="text-slate-300 print:text-black/20">|</span>
            <span className="uppercase">{analysis.patientGender === 'M' ? 'Homme' : 'Femme'}</span>
            <span className="text-slate-300 print:text-black/20">|</span>
            <span>ID: <span className="font-black text-slate-800 print:text-black">{analysis.dailyId}</span></span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.15em] print:text-black/50">Date</p>
            <p className="text-[10px] font-bold text-slate-900 print:text-black">{datePrelevement}</p>
          </div>
          <div>
            <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.15em] print:text-black/50">Heure</p>
            <p className="text-[10px] font-bold text-slate-900 print:text-black">{heurePrelevement}</p>
          </div>
        </div>
      </div>

      <RecuFooter />
    </RecuShell>
  );
}

// ----- Blank / generic receipt (dotted lines, same visual design) -----
export function BlankRecu() {
  const dotLine = (className = 'w-full') => (
    <div className={`${className} border-b border-dotted border-slate-400 print:border-black/40 h-3.5 mt-0.5`} />
  );

  return (
    <RecuShell>
      <RecuHeader title="BON DE RETRAIT" />

      <div className="flex-1 space-y-4">
        <div className="mt-3">
          <p className="text-[6px] font-black text-blue-600 uppercase tracking-[0.2em] print:text-black/70">Patient</p>
          <div className="h-px bg-slate-100 print:bg-black/10 mb-1.5" />
          {dotLine()}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.12em] print:text-black/50">Date</p>
            {dotLine()}
          </div>
          <div>
            <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.12em] print:text-black/50">Heure</p>
            {dotLine()}
          </div>
        </div>

        <div>
          <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.12em] print:text-black/50">ID Paillasse / N° Réf.</p>
          {dotLine('w-1/2')}
        </div>
      </div>

      <RecuFooter />
    </RecuShell>
  );
}

// ----- Empty slot (no analysis yet) -----
function EmptyRecu() {
  return (
    <div className="w-full h-full border border-dashed border-slate-150 print:border-black/8 flex items-center justify-center bg-slate-50/20 print:bg-transparent">
      <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest print:text-black/8">—</span>
    </div>
  );
}

// ----- Main export: 8-per-page for a specific analysis -----
export const RecuImpression = forwardRef<HTMLDivElement, RecuImpressionProps>(
  ({ analysis }, ref) => {
    const slots: (Analysis | null)[] = [analysis, null, null, null, null, null, null, null];

    return (
      <div ref={ref} className="bg-white text-slate-900 font-sans mx-auto" style={{ width: '210mm', height: '297mm' }}>
        <div style={GRID_STYLE}>
          {slots.map((item, i) =>
            item ? <SingleRecu key={i} analysis={item} /> : <EmptyRecu key={i} />
          )}
        </div>

        <style jsx global>{`
          @media print {
            @page { margin: 5mm; size: A4; }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

RecuImpression.displayName = 'RecuImpression';

// Reusable grid config export for the generic page
export { GRID_STYLE };
