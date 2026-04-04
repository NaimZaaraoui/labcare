'use client';

import { Edit2, Sparkles, Trash2 } from 'lucide-react';
import type { BilanItem } from '@/components/bilans/types';

interface BilanCardProps {
  bilan: BilanItem;
  onEdit: (bilan: BilanItem) => void;
  onDelete: (bilan: BilanItem) => void;
}

export function BilanCard({ bilan, onEdit, onDelete }: BilanCardProps) {
  return (
    <div className="group relative flex flex-col gap-5 overflow-hidden bento-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">{bilan.name}</h3>
            {bilan.code && <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">{bilan.code}</span>}
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={() => onEdit(bilan)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-text-soft)] transition-all hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-accent)]">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(bilan)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-text-soft)] transition-all hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">{bilan.tests.length} Analyses</p>
          <div className="mx-4 h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-wrap gap-2">
          {bilan.tests.slice(0, 6).map((test) => (
            <span key={test.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              {test.code}
            </span>
          ))}
          {bilan.tests.length > 6 && (
            <span className="rounded-xl border border-blue-100 bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">
              +{bilan.tests.length - 6}
            </span>
          )}
        </div>
      </div>

      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[var(--color-accent-soft)] opacity-0 blur-2xl transition-opacity group-hover:opacity-40" />
    </div>
  );
}
