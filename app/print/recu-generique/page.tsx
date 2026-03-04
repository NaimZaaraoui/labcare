'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { BlankRecu, GRID_STYLE } from '@/components/print/RecuImpression';
import { Printer } from 'lucide-react';

const SLOTS = Array.from({ length: 8 });

export default function RecuGeneriquePage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'BonsRetrait_Generiques',
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 gap-6">
      {/* Controls — hidden on print */}
      <div className="no-print flex flex-col items-center gap-3">
        <h1 className="text-2xl font-black text-slate-900">Bons de Retrait Génériques</h1>
        <p className="text-sm text-slate-500">8 bons vierges par page A4 — à remplir manuellement</p>
        <button
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Printer size={18} />
          Imprimer (8 bons / A4)
        </button>
      </div>

      {/* Preview + print target */}
      <div
        ref={printRef}
        className="bg-white shadow-2xl"
        style={{ ...GRID_STYLE, width: '210mm', height: '297mm' }}
      >
        {SLOTS.map((_, i) => <BlankRecu key={i} />)}
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
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
