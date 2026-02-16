import { Suspense } from 'react';
import { AnalysesList } from '@/components/analyses/AnalysesList';

export default function AnalysesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analyses</h1>
          <p className="text-slate-500">Gestion des demandes d'analyses</p>
        </div>
      </div>

      <Suspense fallback={
         <div className="p-8 text-center text-slate-500">Chargement des filtres...</div>
      }>
        <AnalysesList />
      </Suspense>
    </div>
  );
}