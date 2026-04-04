'use client';

import Link from 'next/link';
import type { InventoryAnalytics } from '@/components/inventory/types';
import type { InventoryCategoryConfig } from '@/lib/inventory-categories';

interface InventoryAnalyticsPanelProps {
  analytics: InventoryAnalytics;
  categories: InventoryCategoryConfig[];
}

export function InventoryAnalyticsPanel({ analytics, categories }: InventoryAnalyticsPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="bento-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Consommation des 30 derniers jours
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Vue consolidée de la consommation réelle et des pertes enregistrées.
            </p>
          </div>
          <span className="status-pill status-pill-info">{analytics.windowDays} jours</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Consommé</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.consumption30d}</div>
          </div>
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Rebut</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.waste30d}</div>
          </div>
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Moyenne / jour</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.avgDailyConsumption30d}</div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {analytics.topConsumedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-[var(--color-text-soft)]">
              Pas encore assez de mouvements pour afficher une tendance.
            </div>
          ) : (
            analytics.topConsumedItems.map((entry) => (
              <Link
                key={entry.itemId}
                href={`/dashboard/inventory/${entry.itemId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">{entry.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                    {entry.category} · {entry.avgDailyConsumption30d} / jour
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--color-accent)]">{entry.consumption30d}</div>
                  <div className="text-[11px] text-[var(--color-text-soft)]">{entry.unit}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="bento-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Catégories configurables
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Organisation actuelle des articles inventaire.</p>
          </div>
          <span className="text-xs text-[var(--color-text-soft)]">{categories.filter((c) => c.isActive).length} active(s)</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.filter((category) => category.isActive).map((category) => (
            <span key={category.id} className="status-pill status-pill-info">
              {category.name}
            </span>
          ))}
        </div>
        {analytics.topWastedItems.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Articles les plus rebutés</div>
            <div className="mt-3 space-y-2">
              {analytics.topWastedItems.map((entry) => (
                <Link
                  key={entry.itemId}
                  href={`/dashboard/inventory/${entry.itemId}`}
                  className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-[var(--color-text)]">{entry.name}</span>
                  <span className="text-[var(--color-text-soft)]">
                    {entry.waste30d} {entry.unit}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
