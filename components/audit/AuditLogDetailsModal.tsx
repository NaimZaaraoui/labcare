'use client';

import { X } from 'lucide-react';
import type { AuditItem } from '@/components/audit/types';

interface AuditLogDetailsModalProps {
  selectedLog: AuditItem | null;
  detailsContent: React.ReactNode;
  onClose: () => void;
}

export function AuditLogDetailsModal({ selectedLog, detailsContent, onClose }: AuditLogDetailsModalProps) {
  if (!selectedLog) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell w-full max-w-3xl p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Détails du log</h3>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              {new Date(selectedLog.createdAt).toLocaleString('fr-FR')} • {selectedLog.action}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="rounded-xl border bg-[var(--color-surface-muted)] p-4">
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words text-xs text-[var(--color-text-secondary)]">{detailsContent}</pre>
        </div>
      </div>
    </div>
  );
}
