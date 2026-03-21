import { Suspense } from 'react';
import { AnalysesList } from '@/components/analyses/AnalysesList';

export default function AnalysesPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registre des Analyses</h1>
          <p className="text-sm text-slate-500 mt-1">Base de données complète et suivi des dossiers patients</p>
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