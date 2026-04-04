'use client';

import Link from 'next/link';
import type { InventoryItemSummary } from '@/components/inventory/types';

interface InventoryAttentionPanelProps {
  items: InventoryItemSummary[];
  formatReason: (item: InventoryItemSummary) => string;
}

export function InventoryAttentionPanel({ items, formatReason }: InventoryAttentionPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-amber-200/70 bg-amber-50/80 px-5 py-4 shadow-[0_8px_22px_rgba(180,120,20,0.08)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-800">Priorités du jour</h2>
        <p className="text-sm text-amber-900">Vue rapide des articles qui demandent une action avant impact paillasse.</p>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/inventory/${item.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200/60 bg-white/80 px-3 py-2 transition-colors hover:bg-white"
          >
            <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
            <span className="text-xs text-[var(--color-text-soft)]">{formatReason(item)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
