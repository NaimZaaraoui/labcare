import { FileDigit } from 'lucide-react';

interface Props {
  dailyId: string;
  setDailyId: (value: string) => void;
  receiptNumber: string;
  setReceiptNumber: (value: string) => void;
  provenance: string;
  setProvenance: (value: string) => void;
  medecinPrescripteur: string;
  setMedecinPrescripteur: (value: string) => void;
  isUrgent: boolean;
  setIsUrgent: (value: boolean) => void;
}

export function AnalyseOrderPanel({
  dailyId,
  setDailyId,
  receiptNumber,
  setReceiptNumber,
  provenance,
  setProvenance,
  medecinPrescripteur,
  setMedecinPrescripteur,
  isUrgent,
  setIsUrgent,
}: Props) {
  return (
    <div className="bento-panel flex flex-col gap-5 p-6 lg:p-7">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileDigit size={16} />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Dossier / Paillasse</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="section-label">N° Paillasse *</label>
            <input
                value={dailyId}
                onChange={(e) => setDailyId(e.target.value)}
                placeholder="Ex: 54"
                className="input-premium h-12 text-center text-lg font-semibold text-indigo-600"
                required
                autoFocus
            />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="section-label">Quittance</label>
            <input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Optionnel"
                className="input-premium h-12 text-center"
            />
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-1.5">
            <label className="section-label">Provenance</label>
            <select
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                className="input-premium h-11 text-sm"
            >
                <option value="">-- Non spécifié --</option>
                <option value="consultation">Consultation</option>
                <option value="externe">Externe</option>
                <option value="interne">Interne</option>
                <option value="urgence">Urgence</option>
                <option value="medecin_traitant">Médecin traitant</option>
                <option value="maternite">Maternité</option>
                <option value="chirurgie">Chirurgie</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Médecin Prescripteur</label>
            <input
                value={medecinPrescripteur}
                onChange={(e) => setMedecinPrescripteur(e.target.value)}
                placeholder="Dr. Nom Prénom"
                className="input-premium h-11 text-sm"
            />
          </div>
      </div>

      <div className="space-y-1.5 pt-4 border-t border-slate-50">
          <label className="section-label">Urgence</label>
          <div className="grid grid-cols-2 gap-2">
            <button
                type="button"
                onClick={() => setIsUrgent(false)}
                className={`h-11 rounded-xl text-sm font-medium transition-all border ${
                  !isUrgent
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
                Non urgent
            </button>
            <button
                type="button"
                onClick={() => setIsUrgent(true)}
                className={`h-11 rounded-xl text-sm font-medium transition-all border ${
                  isUrgent
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
                Urgent
            </button>
          </div>
      </div>
    </div>
  );
}
