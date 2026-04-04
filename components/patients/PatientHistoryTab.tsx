'use client';

import { Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { PatientAnalysis } from '@/components/patients/types';

interface PatientHistoryTabProps {
  analyses: PatientAnalysis[];
}

export function PatientHistoryTab({ analyses }: PatientHistoryTabProps) {
  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Link
          href={`/analyses/${analysis.id}`}
          key={analysis.id}
          className="group flex items-center justify-between rounded-3xl border bg-white p-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)] transition-all hover:border-indigo-200 hover:bg-[var(--color-surface-muted)]"
        >
          <div className="flex items-center gap-8">
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 transition-colors group-hover:border-indigo-100 group-hover:bg-indigo-50">
              <span className="mb-1 text-[10px] font-semibold uppercase leading-none text-slate-400 group-hover:text-indigo-400">
                {new Date(analysis.creationDate).toLocaleString('fr-FR', { month: 'short' })}
              </span>
              <span className="text-xl font-semibold leading-none text-slate-900 group-hover:text-indigo-600">
                {new Date(analysis.creationDate).getDate()}
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-4">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">{analysis.orderNumber}</h3>
                <span
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    analysis.status === 'completed' || analysis.status === 'validated_bio'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-100/50 text-amber-600'
                  }`}
                >
                  {analysis.status === 'completed' || analysis.status === 'validated_bio' ? 'Dossier Validé' : 'En cours'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity size={12} /> {analysis.results.length} Paramètres
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <span>Créé à {format(new Date(analysis.creationDate), 'HH:mm')}</span>
              </div>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-500/30">
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}

      {analyses.length === 0 && (
        <div className="empty-state py-20">
          <div className="empty-state-icon h-16 w-16 rounded-full bg-slate-100">
            <Activity size={32} />
          </div>
          <p className="empty-state-title">Aucune analyse enregistrée</p>
        </div>
      )}
    </div>
  );
}
