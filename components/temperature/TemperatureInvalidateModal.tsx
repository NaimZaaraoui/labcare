'use client';

import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import type { TemperatureReading } from '@/components/temperature/types';

interface TemperatureInvalidateModalProps {
  reading: TemperatureReading | null;
  reason: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
}

export function TemperatureInvalidateModal({
  reading,
  reason,
  saving,
  onClose,
  onConfirm,
  onReasonChange,
}: TemperatureInvalidateModalProps) {
  if (!reading) return null;

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal-shell flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Annuler un relevé</h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              {new Date(reading.recordedAt).toLocaleString('fr-FR')} · {reading.period}
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-[var(--color-text-soft)]">
            Indiquez le motif d’annulation pour garder une trace claire dans l’historique et l’audit.
          </p>
          <label className="grid gap-2">
            <span className="form-label">Motif d’annulation</span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              className="input-premium resize-none py-3"
              placeholder="Ex. erreur de saisie, relevé fait au mauvais horaire, valeur non valide..."
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
          <button type="button" className="btn-secondary-sm" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="btn-primary-sm" onClick={onConfirm} disabled={saving || !reason.trim()}>
            {saving ? 'Annulation...' : 'Confirmer l’annulation'}
          </button>
        </div>
      </div>
    </div>
  );
}
