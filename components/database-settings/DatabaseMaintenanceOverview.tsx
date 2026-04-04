'use client';

import { AlertTriangle } from 'lucide-react';
import type { HealthResponse } from '@/components/database-settings/types';

interface DatabaseMaintenanceOverviewProps {
  label: string;
  description: string;
  tone: 'ok' | 'warning' | 'alert';
  health: HealthResponse | null;
  warningItems: string[];
}

export function DatabaseMaintenanceOverview({
  label,
  description,
  tone,
  health,
  warningItems,
}: DatabaseMaintenanceOverviewProps) {
  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="bento-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernier backup</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">{label}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-soft)]">{description}</p>
            </div>
            <span className={tone === 'ok' ? 'status-pill status-pill-success' : tone === 'warning' ? 'status-pill status-pill-warning' : 'status-pill status-pill-error'}>
              {tone === 'ok' ? 'OK' : tone === 'warning' ? 'Attention' : 'Urgent'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Base active</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.database.reachable && health?.database.fileExists ? 'Connectée et présente' : 'À vérifier'}
              </p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Copies locales</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.backups.count ? `${health.backups.count} sauvegarde(s)` : 'Aucune sauvegarde'}
              </p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Copies externes</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.externalTarget.configuredPath
                  ? health.externalTarget.available
                    ? 'Prêtes sur support externe'
                    : 'Support externe indisponible'
                  : 'Non configurées'}
              </p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Lecture simple</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">Ce qui protège le labo</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-soft)]">
            <p>1. Une sauvegarde SQLite locale régulière.</p>
            <p>2. Un bundle de reprise avec base + uploads.</p>
            <p>3. Une copie vers un disque ou dossier externe.</p>
          </div>
        </article>
      </section>

      {warningItems.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/90 px-5 py-4 shadow-[0_8px_24px_rgba(180,83,9,0.08)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-amber-900">Points d’attention sauvegarde</h2>
              <div className="mt-3 space-y-2">
                {warningItems.map((item) => (
                  <p key={item} className="text-sm text-amber-900/90">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
