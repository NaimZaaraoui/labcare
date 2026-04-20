'use client';

import type React from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { X } from 'lucide-react';
import { PERIOD_LABELS, type Instrument, type TemperaturePeriod } from '@/components/temperature/types';

interface RecordReadingModalProps {
  open: boolean;
  instrument: Instrument | null;
  selectedPeriod: TemperaturePeriod;
  recordValue: string;
  correctiveAction: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onRecordValueChange: (value: string) => void;
  onCorrectiveActionChange: (value: string) => void;
}

export function RecordReadingModal({
  open,
  instrument,
  selectedPeriod,
  recordValue,
  correctiveAction,
  submitting,
  onClose,
  onSubmit,
  onRecordValueChange,
  onCorrectiveActionChange,
}: RecordReadingModalProps) {
  useScrollLock(open);
  if (!open || !instrument) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-shell flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Relevé {PERIOD_LABELS[selectedPeriod]}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">{instrument.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <label className="grid gap-2">
              <span className="form-label">Température mesurée</span>
              <div className="input-premium flex h-12 items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={recordValue}
                  onChange={(event) => onRecordValueChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      const next = document.getElementById('correctiveAction');
                      next?.focus();
                    }
                  }}
                  className="w-full border-none bg-transparent text-lg font-semibold outline-none"
                  placeholder={`Ex: ${instrument.targetMin}`}
                  autoFocus
                  required
                />
                <span className="text-xs font-semibold text-[var(--color-text-soft)]">{instrument.unit}</span>
              </div>
            </label>

            <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 text-xs text-[var(--color-text-soft)]">
              Plage cible: {instrument.targetMin}
              {instrument.unit} à {instrument.targetMax}
              {instrument.unit}
            </div>

            <label className="grid gap-2">
              <span className="form-label">Action corrective (si hors plage)</span>
              <textarea
                id="correctiveAction"
                value={correctiveAction}
                onChange={(event) => onCorrectiveActionChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSubmit(event);
                  }
                }}
                rows={3}
                className="input-premium resize-none py-3"
                placeholder="Ex: ajustement thermostat, vérification porte..."
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
            <button type="button" className="btn-secondary-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary-sm" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
