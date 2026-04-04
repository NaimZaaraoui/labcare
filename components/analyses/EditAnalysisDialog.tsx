// components/analyses/EditAnalysisDialog.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { AvailableTestOption, EditAnalysisForm } from './types';

interface EditAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: EditAnalysisForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditAnalysisForm>>;
  selectedTestIds: string[];
  toggleSelectedTest: (testId: string) => void;
  testSearch: string;
  setTestSearch: (val: string) => void;
  availableTests: AvailableTestOption[];
  saveAnalysisMeta: () => void;
  savingMeta: boolean;
}

export function EditAnalysisDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  selectedTestIds,
  toggleSelectedTest,
  testSearch,
  setTestSearch,
  availableTests,
  saveAnalysisMeta,
  savingMeta,
}: EditAnalysisDialogProps) {
  const updateEditForm = <K extends keyof EditAnalysisForm>(key: K, value: EditAnalysisForm[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] bg-white border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Modifier le dossier d&apos;analyse</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-1 min-h-0">
          <div className="grid grid-cols-2 gap-4 py-2">
            <input className="input-premium h-10 text-sm" placeholder="N° Paillasse" value={editForm.dailyId} onChange={(e) => updateEditForm('dailyId', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Quittance" value={editForm.receiptNumber} onChange={(e) => updateEditForm('receiptNumber', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Nom" value={editForm.patientLastName} onChange={(e) => updateEditForm('patientLastName', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Prénom" value={editForm.patientFirstName} onChange={(e) => updateEditForm('patientFirstName', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Âge" value={editForm.patientAge} onChange={(e) => updateEditForm('patientAge', e.target.value)} />
            <select className="input-premium h-10 text-sm" value={editForm.patientGender} onChange={(e) => updateEditForm('patientGender', e.target.value)}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
            <input className="input-premium h-10 text-sm col-span-2" placeholder="Provenance" value={editForm.provenance} onChange={(e) => updateEditForm('provenance', e.target.value)} />
            <input className="input-premium h-10 text-sm col-span-2" placeholder="Médecin prescripteur" value={editForm.medecinPrescripteur} onChange={(e) => updateEditForm('medecinPrescripteur', e.target.value)} />
            <div className="col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', false)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${!editForm.isUrgent ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                Non urgent
              </button>
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', true)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${editForm.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                Urgent
              </button>
            </div>
            <div className="col-span-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tests sélectionnés</span>
                <span className="text-xs font-semibold text-indigo-600">{selectedTestIds.length} test(s)</span>
              </div>
              <input
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Rechercher un test (code ou nom)..."
                className="input-premium h-10 text-sm w-full mb-3"
              />
              <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                {availableTests
                  .filter((test) => {
                    const q = testSearch.toLowerCase().trim();
                    if (!q) return true;
                    return test.code.toLowerCase().includes(q) || test.name.toLowerCase().includes(q);
                  })
                  .map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => toggleSelectedTest(test.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                        selectedTestIds.includes(test.id)
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{test.code} - {test.name}</span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedTestIds.includes(test.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {selectedTestIds.includes(test.id) && <CheckCircle size={10} className="text-white" />}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-slate-100 pt-3 bg-white sticky bottom-0">
          <button onClick={() => onOpenChange(false)} className="btn-secondary">Annuler</button>
          <button onClick={saveAnalysisMeta} disabled={savingMeta} className="btn-primary">
            {savingMeta ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
