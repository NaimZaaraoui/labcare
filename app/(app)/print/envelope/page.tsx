'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Info, Scissors, FlipVertical, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeImpression } from '@/components/print/EnvelopeImpression';
import { Analysis } from '@/lib/types';

function EnvelopeContent() {
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [analysis, setAnalysis] = useState<Analysis | undefined>();
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setReportSettings(data);
        }
      } catch (e) {
        console.error('Error fetching settings for envelope:', e);
      }
    };
    fetchSettings();

    if (patientId) {
      async function fetchAnalysis() {
        setLoading(true);
        try {
          const res = await fetch(`/api/analyses/${patientId}/results`); 
          if (res.ok) {
            const data = await res.json();
             setAnalysis(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
      fetchAnalysis();
    } else {
      // No patient ID => Generic Mode
      setLoading(false);
    }
  }, [patientId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Gabarit_Enveloppe_CSSB',
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Gabarit Enveloppe</h1>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Conception Professionnelle A4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-4 text-slate-400">
               <span className="text-[10px] font-bold uppercase tracking-wider">Imprimez en 1:1 sans marges</span>
            </div>
            <button 
              onClick={() => handlePrint()}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Printer size={18} /> Imprimer l&apos;Enveloppe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col items-center gap-8">
           <div className="flex items-center gap-4 w-full max-w-[210mm]">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aperçu Avant Impression</span>
              <div className="h-px flex-1 bg-slate-200"></div>
           </div>

           {/* The actual component to print (Visible on screen as preview) */}
           <div className={`shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden scale-[0.6] origin-top md:scale-[0.85] lg:scale-100 transition-transform ${loading ? 'opacity-50 grayscale' : ''}`}>
             <EnvelopeImpression ref={componentRef} analysis={analysis} settings={reportSettings} />
           </div>
        </div>

        {/* Instructions Sidebar */}
        <div className="w-full lg:w-80 space-y-6 print:hidden">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Scissors size={18} className="text-blue-600" /> Instructions de Montage
              </h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black flex-shrink-0">1</div>
                    <div className="text-sm text-slate-600 font-medium">
                       <p className="font-black text-slate-900 uppercase text-[10px] mb-1">Impression</p>
                       Imprimez les 2 pages. Si votre imprimante le permet, utilisez le mode <span className="font-bold text-slate-900 italic">Recto-Verso (Retournement bord long)</span>.
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black flex-shrink-0">2</div>
                    <div className="text-sm text-slate-600 font-medium">
                       <p className="font-black text-slate-900 uppercase text-[10px] mb-1">Découpe</p>
                       Découpez les coins selon les guides. Les rabats latéraux doivent pouvoir se replier sans gêne.
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black flex-shrink-0">3</div>
                    <div className="text-sm text-slate-600 font-medium">
                       <p className="font-black text-slate-900 uppercase text-[10px] mb-1">Pliage</p>
                       Pliez d&apos;abord les côtés vers l&apos;intérieur, puis remontez le fond de <span className="font-bold text-blue-600">2 cm</span> pour former la pochette.
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl">
                       <FlipVertical size={20} />
                       <span className="text-xs font-bold leading-tight">Design optimisé pour un aspect premium labo.</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Conseil Pro</p>
              <p className="text-sm font-medium leading-relaxed">
                Utilisez un papier de <span className="text-blue-400 font-bold">120g/m²</span> ou plus pour une tenue parfaite et un rendu &quot;Haut de Gamme&quot;.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function EnvelopePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Chargement du gabarit...</p>
        </div>
      </div>
    }>
      <EnvelopeContent />
    </Suspense>
  );
}
