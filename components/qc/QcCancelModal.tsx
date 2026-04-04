'use client';

import { X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm print:hidden p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl animate-scale-in">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Invalider le point</h3>
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
            className="input-premium h-24 mb-5 text-sm resize-none"
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
