// components/analyses/DiatronImportDialog.tsx
import React from 'react';
import { Microscope, AlertCircle, History, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { DiatronPreviewItem } from './types';

interface DiatronImportDialogProps {
  preview: DiatronPreviewItem[] | null;
  onCancel: () => void;
  onSelect: (index: number) => void;
}

export function DiatronImportDialog({ preview, onCancel, onSelect }: DiatronImportDialogProps) {
  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl bg-white border-slate-200 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Microscope size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">Sélectionner un Résultat</DialogTitle>
              <p className="text-sm text-slate-500">Fichier importé : Diatron Abacus 380</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-5 flex items-center gap-2.5 p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-sm font-medium">Plusieurs analyses ont été détectées dans ce fichier. Choisissez celle qui correspond à votre patient.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {preview?.map((record) => (
              <button
                key={record.index}
                onClick={() => onSelect(record.index)}
                className="group w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-600 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-200">ID</span>
                    <span className="text-base font-bold text-slate-700 group-hover:text-white">{record.sampleId || '?'}</span>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      Analyse du {record.date}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs">
                        <History size={12} /> {record.time}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs">Index #{record.index + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <DialogFooter className="p-5 border-t border-slate-100">
          <button onClick={onCancel} className="btn-secondary">
            Annuler l&apos;importation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
