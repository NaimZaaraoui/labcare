'use client';

import { TestsList } from '@/components/tests/TestsList';
import { Beaker, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestsPage() {
  const router = useRouter();

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all mb-4"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest">Paramètres</span>
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200 shrink-0">
               <Beaker size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catalogue d'Analyses</h1>
              <p className="text-slate-500 font-medium mt-1">Gérez les paramètres biologiques et les plages de référence.</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Catalogue Actif</span>
        </div>
      </div>

      <TestsList />
    </div>
  );
}