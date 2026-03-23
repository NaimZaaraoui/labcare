import { Suspense } from 'react';
import { AnalysesList } from '@/components/analyses/AnalysesList';

export default function AnalysesPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Registre des Analyses</h1>
        <p className="text-slate-500 font-medium mt-1">Base de données complète et suivi des dossiers patients.</p>
      </div>

      <Suspense fallback={
         <div className="p-8 text-center text-slate-500">Chargement des filtres...</div>
      }>
        <AnalysesList />
      </Suspense>
    </div>
  );
}