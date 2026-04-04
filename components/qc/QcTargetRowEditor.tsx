'use client';

import type { RangeBasis, TargetRow, TestOption } from '@/components/qc/config-types';
import { formatQcLimit, getEffectiveSd } from '@/components/qc/qc-config-helpers';

interface QcTargetRowEditorProps {
  row: TargetRow;
  index: number;
  tests: TestOption[];
  globalRangeBasis: RangeBasis;
  rangeBasisLabel: string;
  onChange: (index: number, next: TargetRow) => void;
}

export function QcTargetRowEditor({
  row,
  index,
  tests,
  globalRangeBasis,
  rangeBasisLabel,
  onChange,
}: QcTargetRowEditorProps) {
  const effectiveSd = getEffectiveSd(row, globalRangeBasis);

  return (
    <div className="grid gap-3 rounded-2xl border bg-white px-4 py-4">
      <select
        className="input-premium h-11 bg-white"
        value={row.testId}
        onChange={(event) => {
          const test = tests.find((entry) => entry.id === event.target.value);
          onChange(index, {
            ...row,
            testId: event.target.value,
            testCode: test?.code || '',
            testName: test?.name || '',
            unit: test?.unit || '',
          });
        }}
      >
        <option value="">Importer depuis les tests</option>
        {tests.map((test) => (
          <option key={test.id} value={test.id}>{test.code} · {test.name}</option>
        ))}
      </select>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="input-premium h-11 bg-white" value={row.testCode} onChange={(event) => onChange(index, { ...row, testCode: event.target.value })} placeholder="Code test" />
        <input className="input-premium h-11 bg-white" value={row.testName} onChange={(event) => onChange(index, { ...row, testName: event.target.value })} placeholder="Nom du test" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input className="input-premium h-11 bg-white" type="number" step="0.01" value={row.mean} onChange={(event) => onChange(index, { ...row, mean: event.target.value })} placeholder="Cible" />
        <select
          className="input-premium h-11 bg-white"
          value={row.inputMode}
          onChange={(event) => onChange(index, { ...row, inputMode: event.target.value as 'sd' | 'range' })}
        >
          <option value="range">Plage d&apos;acceptation</option>
          <option value="sd">Mode statistique (SD)</option>
        </select>
        <input className="input-premium h-11 bg-white" value={row.unit} onChange={(event) => onChange(index, { ...row, unit: event.target.value })} placeholder="Unité" />
        <div className="rounded-2xl border border-slate-200 bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">SD retenue</div>
          <div className="mt-1 font-semibold text-[var(--color-text)]">{effectiveSd || '--'}</div>
        </div>
      </div>
      {row.inputMode === 'sd' ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">Ecart-type (1 SD)</span>
          <input
            className="input-premium h-11 bg-white"
            type="number"
            step="0.0001"
            value={row.sd}
            onChange={(event) => onChange(index, { ...row, sd: event.target.value })}
            placeholder="Valeur SD du fabricant"
          />
          <span className="text-xs text-[var(--color-text-soft)]">
            Recommande si la fiche du controle fournit une vraie SD pour le suivi Westgard.
          </span>
        </label>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Valeur minimale acceptable</span>
            <input
              className="input-premium h-11 bg-white"
              type="number"
              step="0.01"
              value={row.minValue}
              onChange={(event) => onChange(index, { ...row, minValue: event.target.value })}
              placeholder="Borne basse fabricant"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Valeur maximale acceptable</span>
            <input
              className="input-premium h-11 bg-white"
              type="number"
              step="0.01"
              value={row.maxValue}
              onChange={(event) => onChange(index, { ...row, maxValue: event.target.value })}
              placeholder="Borne haute fabricant"
            />
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
          Mode: {row.inputMode === 'sd' ? 'Statistique / Westgard' : 'Plage d’acceptation'}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
          SD retenue: {effectiveSd || '--'}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
          1 SD: {formatQcLimit(row.mean, effectiveSd, -1)} / {formatQcLimit(row.mean, effectiveSd, 1)}
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
          2 SD: {formatQcLimit(row.mean, effectiveSd, -2)} / {formatQcLimit(row.mean, effectiveSd, 2)}
        </span>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
          3 SD: {formatQcLimit(row.mean, effectiveSd, -3)} / {formatQcLimit(row.mean, effectiveSd, 3)}
        </span>
      </div>
      {row.inputMode === 'range' && (
        <div className="text-xs text-[var(--color-text-soft)]">
          Utilise pour les fiches fabricant qui donnent une plage toleree. La validation se fait sur min/max, et la SD affichee reste une estimation interne basee sur {rangeBasisLabel}.
        </div>
      )}
    </div>
  );
}
