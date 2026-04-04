'use client';

import { X } from 'lucide-react';

interface QcLotEditModalProps {
  open: boolean;
  saving: boolean;
  lot: {
    id: string;
    lotNumber: string;
    expiryDate: string;
    openedAt: string;
  } | null;
  onClose: () => void;
  onChange: (next: { id: string; lotNumber: string; expiryDate: string; openedAt: string } | null) => void;
  onSave: () => void;
}

export function QcLotEditModal({ open, saving, lot, onClose, onChange, onSave }: QcLotEditModalProps) {
  if (!open || !lot) return null;

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal-shell flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Modifier le lot QC</h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Ajustez les informations du lot sans quitter la configuration QC.</p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <label className="grid gap-2">
            <span className="form-label">Numero du lot</span>
            <input
              className="input-premium h-11 bg-white"
              value={lot.lotNumber}
              onChange={(event) => onChange({ ...lot, lotNumber: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="form-label">Date d&apos;expiration</span>
            <input
              type="date"
              className="input-premium h-11 bg-white"
              value={lot.expiryDate}
              onChange={(event) => onChange({ ...lot, expiryDate: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="form-label">Date d&apos;ouverture</span>
            <input
              type="date"
              className="input-premium h-11 bg-white"
              value={lot.openedAt}
              onChange={(event) => onChange({ ...lot, openedAt: event.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
          <button type="button" className="btn-secondary-sm" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="btn-primary-sm" onClick={onSave} disabled={saving || !lot.lotNumber.trim() || !lot.expiryDate}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
