'use client';

import type React from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import type { InventoryCategoryConfig } from '@/lib/inventory-categories';
import { UNIT_OPTIONS, type InventoryItemFormValues } from '@/components/inventory/types';

interface InventoryItemFormModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  form: InventoryItemFormValues;
  categories: InventoryCategoryConfig[];
  showInitialStock: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onFormChange: (next: InventoryItemFormValues) => void;
}

export function InventoryItemFormModal({
  open,
  title,
  subtitle,
  submitLabel,
  form,
  categories,
  showInitialStock,
  onClose,
  onSubmit,
  onFormChange,
}: InventoryItemFormModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-shell flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
            <p className="text-sm text-[var(--color-text-soft)]">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">Nom du réactif</label>
                <input
                  className="input-premium h-11 bg-white"
                  value={form.name}
                  onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Référence fabricant</label>
                <input
                  className="input-premium h-11 bg-white"
                  value={form.reference}
                  onChange={(event) => onFormChange({ ...form, reference: event.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Catégorie</label>
                <select
                  className="input-premium h-11 bg-white"
                  value={form.category}
                  onChange={(event) => onFormChange({ ...form, category: event.target.value })}
                >
                  {categories.filter((category) => category.isActive).map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Unité</label>
                <select
                  className="input-premium h-11 bg-white"
                  value={form.unit}
                  onChange={(event) => onFormChange({ ...form, unit: event.target.value })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Seuil minimum</label>
                <input
                  type="number"
                  className="input-premium h-11 bg-white"
                  value={form.minThreshold}
                  onChange={(event) => onFormChange({ ...form, minThreshold: event.target.value })}
                  required
                />
              </div>
              {showInitialStock && (
                <div>
                  <label className="form-label">Stock initial</label>
                  <input
                    type="number"
                    className="input-premium h-11 bg-white"
                    value={form.currentStock || ''}
                    onChange={(event) => onFormChange({ ...form, currentStock: event.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="form-label">Stockage</label>
                <input
                  className="input-premium h-11 bg-white"
                  value={form.storage}
                  onChange={(event) => onFormChange({ ...form, storage: event.target.value })}
                  placeholder="Réfrigérateur 2-8°C"
                />
              </div>
              <div>
                <label className="form-label">Fournisseur</label>
                <input
                  className="input-premium h-11 bg-white"
                  value={form.supplier}
                  onChange={(event) => onFormChange({ ...form, supplier: event.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select
                  className="input-premium h-11 bg-white"
                  value={form.kind}
                  onChange={(event) => onFormChange({ ...form, kind: event.target.value })}
                >
                  <option value="REAGENT">Réactif</option>
                  <option value="CONSUMABLE">Consommable</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea
                className="input-premium min-h-[110px] bg-white p-3"
                value={form.notes}
                onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
              <ClipboardList className="h-4 w-4" />
              Les mouvements seront historisés automatiquement.
            </div>
            <button className="btn-primary-md px-6" type="submit">
              <Plus className="h-4 w-4" />
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
