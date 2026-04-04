'use client';

import { Layers, Plus, Save, Settings2, X } from 'lucide-react';
import { RESULT_TYPES, type CategoryOption, type TestFormState, type TestWithInventory, type TestsLabSettings } from '@/components/tests/types';

interface TestEditorModalProps {
  open: boolean;
  editingTestId: string | null;
  form: TestFormState;
  isSexBased: boolean;
  categories: CategoryOption[];
  tests: TestWithInventory[];
  labSettings: TestsLabSettings;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: TestFormState) => void;
  onSexBasedChange: (value: boolean) => void;
}

export function TestEditorModal({
  open,
  editingTestId,
  form,
  isSexBased,
  categories,
  tests,
  labSettings,
  onClose,
  onSubmit,
  onFormChange,
  onSexBasedChange,
}: TestEditorModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay z-[60] animate-in fade-in duration-300">
      <div
        className="modal-shell flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${editingTestId ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
              {editingTestId ? <Settings2 size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] tracking-tight">
                {editingTestId ? 'Modifier' : 'Ajouter'} <span className="text-[var(--color-accent)]">test</span>
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Configurez les parametres de l&apos;analyse biologique.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onFormChange({ ...form, isGroup: false })}
              className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${!form.isGroup ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}
            >
              Individuel
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ ...form, isGroup: true, resultType: 'text', unit: '', minValue: '', maxValue: '' })}
              className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${form.isGroup ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}
            >
              Panel / Bilan
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Code</label>
              <input
                value={form.code}
                onChange={(event) => onFormChange({ ...form, code: event.target.value.toUpperCase() })}
                placeholder="Ex: HEMO"
                className="input-premium h-11 bg-white uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom complet</label>
              <input
                value={form.name}
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                placeholder="Ex: Hemoglobine Glyquee"
                className="input-premium h-11 bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categorie</label>
              <select
                value={form.categoryId}
                onChange={(event) => onFormChange({ ...form, categoryId: event.target.value })}
                className="input-premium h-11 bg-white"
              >
                <option value="">Selectionner...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Panel Parent</label>
              <select
                value={form.parentId}
                onChange={(event) => onFormChange({ ...form, parentId: event.target.value })}
                className="input-premium h-11 bg-white"
              >
                <option value="">-- Racine (Catalogue principal) --</option>
                {tests.filter((test) => test.isGroup).map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.code} - {panel.name}
                  </option>
                ))}
              </select>
            </div>
            {!form.isGroup && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Resultat</label>
                <select
                  value={form.resultType}
                  onChange={(event) => onFormChange({ ...form, resultType: event.target.value })}
                  className="input-premium h-11 bg-white"
                >
                  {RESULT_TYPES.map((resultType) => (
                    <option key={resultType.value} value={resultType.value}>{resultType.label}</option>
                  ))}
                </select>
              </div>
            )}
            {form.resultType === 'dropdown' && !form.isGroup && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options (separees par virgule)</label>
                <input
                  value={form.options}
                  onChange={(event) => onFormChange({ ...form, options: event.target.value })}
                  placeholder="Ex: Positif, Negatif"
                  className="input-premium h-11 bg-white"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Echantillon</label>
              <select
                value={form.sampleType}
                onChange={(event) => onFormChange({ ...form, sampleType: event.target.value })}
                className="input-premium h-11 bg-white"
              >
                <option value="">Selectionner...</option>
                {labSettings.sample_types.split(',').map((sample) => {
                  const value = sample.trim();
                  return <option key={value} value={value}>{value}</option>;
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant ({labSettings.amount_unit})</label>
              <input
                type="number"
                value={form.price}
                onChange={(event) => onFormChange({ ...form, price: event.target.value })}
                placeholder="0"
                className="input-premium h-11 bg-white text-[var(--color-accent)]"
              />
            </div>
          </div>

          {!form.isGroup && form.resultType === 'numeric' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parametres Physico-chimiques</h4>
                <button
                  type="button"
                  onClick={() => onSexBasedChange(!isSexBased)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all ${isSexBased ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                >
                  <Layers size={12} />
                  Plages par sexe
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 text-center block">Unite</label>
                  <input value={form.unit} onChange={(event) => onFormChange({ ...form, unit: event.target.value })} placeholder="g/L" className="input-premium h-12 bg-white text-center font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 text-center block">Min Std</label>
                  <input step="0.01" type="number" value={form.minValue} onChange={(event) => onFormChange({ ...form, minValue: event.target.value })} placeholder="0.00" className="input-premium h-12 bg-white text-center font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 text-center block">Max Std</label>
                  <input step="0.01" type="number" value={form.maxValue} onChange={(event) => onFormChange({ ...form, maxValue: event.target.value })} placeholder="∞" className="input-premium h-12 bg-white text-center font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Dec</label>
                  <select value={form.decimals} onChange={(event) => onFormChange({ ...form, decimals: event.target.value })} className="input-premium h-12 bg-white text-center font-black">
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>

                {isSexBased && (
                  <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100/50">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-center block">H Min</label>
                      <input step="0.01" type="number" value={form.minValueM} onChange={(event) => onFormChange({ ...form, minValueM: event.target.value })} placeholder="Min H" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-center block">H Max</label>
                      <input step="0.01" type="number" value={form.maxValueM} onChange={(event) => onFormChange({ ...form, maxValueM: event.target.value })} placeholder="Max H" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 text-center block">F Min</label>
                      <input step="0.01" type="number" value={form.minValueF} onChange={(event) => onFormChange({ ...form, minValueF: event.target.value })} placeholder="Min F" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 text-center block">F Max</label>
                      <input step="0.01" type="number" value={form.maxValueF} onChange={(event) => onFormChange({ ...form, maxValueF: event.target.value })} placeholder="Max F" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="mt-auto flex justify-end gap-3 border-t border-[var(--color-border)] bg-white p-6">
          <button onClick={onClose} className="btn-secondary-md">
            Annuler
          </button>
          <button onClick={onSubmit} className="btn-primary-md min-w-[160px] justify-center">
            <Save size={16} /> <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
