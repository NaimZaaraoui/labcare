import { Suspense } from 'react';
import { AnalyseForm } from '@/components/analyses/AnalyseForm';

export default function NouvelleAnalysePage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nouvelle Analyse</h1>
          <p className="text-slate-400">Enregistrez une nouvelle demande d&apos;analyse biologique</p>
        </div>
        <Suspense fallback={<div className="text-center text-slate-400 py-10">Chargement du formulaire...</div>}>
           <AnalyseForm />
        </Suspense>
      </div>
    </div>
  );
}