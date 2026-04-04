'use client';

import type React from 'react';
import { Plus } from 'lucide-react';
import { LEVELS, type Material, type MaterialFormState } from '@/components/qc/config-types';

interface QcMaterialsPanelProps {
  materialForm: MaterialFormState;
  materialQuery: string;
  filteredMaterials: Material[];
  onMaterialFormChange: React.Dispatch<React.SetStateAction<MaterialFormState>>;
  onMaterialQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
}

export function QcMaterialsPanel({
  materialForm,
  materialQuery,
  filteredMaterials,
  onMaterialFormChange,
  onMaterialQueryChange,
  onSubmit,
}: QcMaterialsPanelProps) {
  return (
    <article className="bento-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Matériels</h2>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <input
          className="input-premium h-11 bg-white"
          value={materialForm.name}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Nom du matériel QC"
          required
        />
        <select
          className="input-premium h-11 bg-white"
          value={materialForm.level}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, level: event.target.value }))}
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <input
          className="input-premium h-11 bg-white"
          value={materialForm.manufacturer}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, manufacturer: event.target.value }))}
          placeholder="Fabricant"
        />
        <button className="btn-primary-md justify-center" type="submit">
          <Plus className="h-4 w-4" />
          Ajouter le matériel
        </button>
      </form>

      <div className="mt-5">
        <input
          className="input-premium h-11 bg-white"
          value={materialQuery}
          onChange={(event) => onMaterialQueryChange(event.target.value)}
          placeholder="Rechercher un matériel, un lot ou un test QC"
        />
      </div>

      <div className="mt-5 space-y-3">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                  {material.level} · {material.manufacturer || 'Sans fabricant'}
                </div>
              </div>
              <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
        {filteredMaterials.length === 0 && (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
            Aucun matériel ou lot QC ne correspond à cette recherche.
          </div>
        )}
      </div>
    </article>
  );
}
