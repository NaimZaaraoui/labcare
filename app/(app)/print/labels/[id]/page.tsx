'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { Analysis } from '@/lib/types';
import { Code39Barcode } from '@/components/print/Code39Barcode';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function TubeLabelsPage() {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState(6);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: analysis ? `Etiquettes_${analysis.orderNumber}` : 'Etiquettes_tubes',
    pageStyle: `@page { size: A4 portrait; margin: 10mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/analyses/${id}`);
        const data = await response.json();
        if (mounted && response.ok) {
          setAnalysis(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  const patientName = useMemo(() => {
    if (!analysis) return '';
    return `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'Patient sans nom';
  }, [analysis]);

  const barcodeValue = useMemo(() => {
    if (!analysis) return '';
    return analysis.orderNumber || analysis.dailyId || analysis.id.slice(0, 12).toUpperCase();
  }, [analysis]);

  const labels = useMemo(
    () => Array.from({ length: Math.max(1, Math.min(24, copies)) }, (_, index) => index),
    [copies]
  );

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-[var(--color-text-soft)]">Chargement des etiquettes...</div>;
  }

  if (!analysis) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-rose-600">Analyse introuvable.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)] print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href={`/analyses/${analysis.id}`} />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Etiquettes tubes</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Impression rapide du code-barres echantillon pour {patientName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="input-premium flex h-11 items-center gap-3 px-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Copies</span>
              <input
                type="number"
                min="1"
                max="24"
                value={copies}
                onChange={(event) => setCopies(Number(event.target.value) || 1)}
                className="w-16 border-none bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <button
              onClick={handlePrint}
              className="btn-primary-md"
            >
              <Printer size={16} />
              Imprimer
            </button>
          </div>
        </div>
      </section>

      <section
        id="tube-label-sheet"
        ref={printRef}
        className="grid grid-cols-1 justify-items-center gap-4 rounded-3xl border bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_8px_24px_rgba(15,31,51,0.05)] sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-4 print:gap-2 print:border-none print:bg-white print:p-0 print:shadow-none"
      >
        {labels.map((label) => (
          <article
            key={label}
            className="w-full max-w-[320px] rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_6px_20px_rgba(15,31,51,0.05)] print:h-[33mm] print:w-[46mm] print:max-w-none print:break-inside-avoid print:rounded-[4mm] print:border print:p-[2.2mm] print:shadow-none"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[7px]">Tube</p>
                <h2 className="mt-0.5 truncate text-sm font-semibold uppercase tracking-tight text-slate-900 print:text-[9px]">
                  {patientName}
                </h2>
              </div>
              <div className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 print:px-1.5 print:text-[6px]">
                {analysis.patientGender === 'F' ? 'F' : analysis.patientGender === 'M' ? 'M' : 'P'}
              </div>
            </div>

            <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-2.5 py-2 print:mt-1.5 print:rounded-[3mm] print:px-1.5 print:py-1.5">
              <Code39Barcode
                value={barcodeValue}
                height={34}
                className="print:[&_svg]:h-[10mm]"
                labelClassName="mt-1 text-center font-mono text-[8px] font-black tracking-[0.16em] text-slate-800 print:mt-0.5 print:text-[6px] print:tracking-[0.12em]"
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] print:mt-1.5 print:gap-1 print:text-[6px]">
              <div>
                <p className="font-bold uppercase tracking-[0.12em] text-slate-400">Ordre</p>
                <p className="mt-0.5 truncate font-mono font-semibold text-slate-800">{analysis.orderNumber}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.12em] text-slate-400">ID</p>
                <p className="mt-0.5 truncate font-mono font-semibold text-slate-800">{analysis.dailyId || '-'}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
