'use client';

import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface Props {
  isOpen: boolean;
  motive: string;
  savingCancel: boolean;
  onClose: () => void;
  onMotiveChange: (motive: string) => void;
  onConfirm: () => void;
}

export function QcCancelModal({
  isOpen,
  motive,
  savingCancel,
  onClose,
  onMotiveChange,
  onConfirm,
}: Props) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 print:hidden">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_10px_26px_rgba(15,31,51,0.10)]">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)]">Invalider le point</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
               <X size={20} />
            </button>
         </div>
         <p className="text-sm text-[var(--color-text-soft)] mb-4 leading-relaxed">
            Un point invalidé ne sera plus pris en compte dans les calculs de Levey-Jennings ni dans la moyenne mensuelle.
         </p>
         <textarea
            value={motive}
            onChange={(e) => onMotiveChange(e.target.value)}
            placeholder="Motif d'invalidation (obligatoire)..."
            className="input-premium mb-5 h-24 resize-none text-sm"
         />
         <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary-md w-full">Annuler</button>
            <button 
               onClick={onConfirm} 
               disabled={!motive.trim() || savingCancel}
               className="btn-primary-md w-full bg-rose-500 hover:bg-rose-600 border-rose-500 disabled:opacity-50"
            >
               {savingCancel ? 'Sauvegarde...' : 'Invalider'}
            </button>
         </div>
      </div>
    </div>
  );
}
