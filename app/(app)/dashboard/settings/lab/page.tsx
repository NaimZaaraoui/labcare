'use client';

import { ArrowLeft, Beaker } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LabSettingsForm } from './LabSettingsForm';

export default function LabSettingsPage() {
  const router = useRouter();

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all mb-4"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest">Retour aux paramètres</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Beaker size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuration <span className="text-indigo-600">Métier</span></h1>
          </div>
          <p className="text-slate-500 font-medium mt-1 ml-16">Gérez les types d'échantillons et les paramètres financiers.</p>
        </div>
      </div>

      <LabSettingsForm />
    </div>
  );
}
