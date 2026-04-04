// components/analyses/GlobalNotePanel.tsx
import React from 'react';
import { Save } from 'lucide-react';

interface GlobalNotePanelProps {
  isFinalValidated: boolean;
  globalNote: string;
  setGlobalNote: (note: string) => void;
  globalNotePlacement: 'all' | 'first' | 'last';
  setGlobalNotePlacement: (placement: 'all' | 'first' | 'last') => void;
  saveGlobalNote: () => void;
  saveGlobalNoteBusy: boolean;
}

export function GlobalNotePanel({
  isFinalValidated,
  globalNote,
  setGlobalNote,
  globalNotePlacement,
  setGlobalNotePlacement,
  saveGlobalNote,
  saveGlobalNoteBusy,
}: GlobalNotePanelProps) {
  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-6 space-y-3">
      <span className="section-label">Note globale du rapport</span>
      {isFinalValidated ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 min-h-[56px]">
          {globalNote ? (
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{globalNote}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Aucune note globale.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <select
              value={globalNotePlacement}
              onChange={(e) => setGlobalNotePlacement(e.target.value as 'all' | 'first' | 'last')}
              className="input-premium h-10 text-xs w-[240px]"
            >
              <option value="all">Afficher sur toutes les pages</option>
              <option value="first">Afficher sur la 1ère page</option>
              <option value="last">Afficher sur la dernière page</option>
            </select>
          </div>
          <textarea
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value)}
            placeholder="Ajouter une note globale (conclusion, recommandation, commentaire général)..."
            className="input-premium min-h-[96px] w-full resize-none p-3 text-sm bg-white"
          />
          <div className="flex justify-end">
            <button
              onClick={saveGlobalNote}
              disabled={saveGlobalNoteBusy}
              className="btn-secondary-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {saveGlobalNoteBusy ? 'Enregistrement...' : 'Enregistrer la note'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
