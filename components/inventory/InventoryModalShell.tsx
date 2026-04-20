'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface InventoryModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function InventoryModalShell({ title, onClose, children }: InventoryModalShellProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-shell flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4 rotate-45" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
