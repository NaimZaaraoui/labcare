'use client';

import { Check, Filter, Save, Search, Sparkles, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { BilanItem, BilanTest } from '@/components/bilans/types';

interface BilanEditorModalProps {
  mounted: boolean;
  open: boolean;
  editingBilan: BilanItem | null;
  formData: { name: string; code: string };
  selectedTests: string[];
  searchQuery: string;
  filteredTests: BilanTest[];
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (value: { name: string; code: string }) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleTest: (testId: string) => void;
}

export function BilanEditorModal({
  mounted,
  open,
  editingBilan,
  formData,
  selectedTests,
  searchQuery,
  filteredTests,
  onClose,
  onSubmit,
  onFormDataChange,
  onSearchQueryChange,
  onToggleTest,
}: BilanEditorModalProps) {
  if (!mounted || !open) return null;

  return createPortal(
    <div className="modal-overlay z-[60] animate-in fade-in duration-300">
      <div className="modal-shell flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                {editingBilan ? 'Modifier le Bilan' : 'Nouveau Bilan'}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Gérez vos raccourcis d&apos;analyses pour une saisie rapide.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[var(--color-text-soft)] transition-all hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]">
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom du bilan</label>
              <input
                value={formData.name}
                onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
                placeholder="Ex: Bilan Pré-opératoire"
                className="input-premium h-11 bg-white"
              />
            </div>
            <div className="space-y-3">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Code raccourci</label>
              <input
                value={formData.code}
                onChange={(event) => onFormDataChange({ ...formData, code: event.target.value })}
                placeholder="Ex: PREOP"
                className="input-premium h-11 bg-white uppercase"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-inner">
                  <Filter size={16} />
                </div>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Analyses incluses ({selectedTests.length})
                </label>
              </div>

              <div className="group relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors group-focus-within:text-[var(--color-accent)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  placeholder="Chercher une analyse..."
                  className="input-premium h-11 bg-white pl-12"
                />
              </div>
            </div>

            <div className="grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto scroll-smooth p-2 lg:grid-cols-3">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => onToggleTest(test.id)}
                    className={`flex h-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'translate-y-[-2px] border-[var(--color-accent)] bg-[var(--color-accent)] shadow-md'
                        : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <span className={`mb-1 block truncate text-sm font-semibold leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>{test.code}</span>
                      <span className={`block truncate text-[10px] font-medium italic opacity-60 ${isSelected ? 'text-indigo-50' : 'text-slate-500'}`}>{test.name}</span>
                    </div>

                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
              {filteredTests.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                    <Search size={32} />
                  </div>
                  <p className="text-sm font-medium italic text-slate-400">Aucune analyse trouvée pour &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-3 border-t border-[var(--color-border)] bg-white p-6">
          <button onClick={onClose} className="btn-secondary-md">
            Annuler
          </button>
          <button onClick={onSubmit} className="btn-primary-md min-w-[180px] justify-center">
            <Save size={16} />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
