import { Loader2, Plus, Search, User, X } from 'lucide-react';
import type { AnalysePatientForm, PatientSearchItem } from './analyse-form-types';

interface InsuranceOption {
  value: string;
  label: string;
}

interface AnalysePatientPanelProps {
  patient: AnalysePatientForm;
  setPatient: React.Dispatch<React.SetStateAction<AnalysePatientForm>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: PatientSearchItem[];
  isSearching: boolean;
  selectedPatientId: string | null;
  selectPatient: (patient: PatientSearchItem) => void;
  clearSelection: () => void;
  insuranceProvider: string;
  setInsuranceProvider: (value: string) => void;
  insuranceNumber: string;
  setInsuranceNumber: (value: string) => void;
  insuranceCoverage: string;
  setInsuranceCoverage: (value: string) => void;
  insuranceProviders: InsuranceOption[];
  coverageOptions: InsuranceOption[];
}

export function AnalysePatientPanel({
  patient,
  setPatient,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  selectedPatientId,
  selectPatient,
  clearSelection,
  insuranceProvider,
  setInsuranceProvider,
  insuranceNumber,
  setInsuranceNumber,
  insuranceCoverage,
  setInsuranceCoverage,
  insuranceProviders,
  coverageOptions,
}: AnalysePatientPanelProps) {
  return (
    <div className="bento-panel flex flex-col gap-5 flex-1 p-6 lg:p-7">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <User size={16} />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Patient</h2>
      </div>

      <div className="relative z-50">
        <div className="input-premium relative flex h-11 w-full max-w-sm items-center gap-2 bg-slate-50 pr-2">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
          <input
            placeholder="Chercher un patient existant ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-full w-full bg-slate-50 pr-4 text-sm font-medium outline-none"
            disabled={!!selectedPatientId}
          />
          {selectedPatientId && (
            <button
              onClick={clearSelection}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
              title="Effacer la sélection"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searchResults.length > 0 && !selectedPatientId && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_10px_30px_rgba(15,31,51,0.12)]">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectPatient(item)}
                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="block text-sm font-semibold text-slate-700">{item.lastName} {item.firstName}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-0.5">
                    <span>{item.birthDate ? new Date(item.birthDate).toLocaleDateString() : 'Age inconnu'}</span>
                    {item.phoneNumber && <span>• {item.phoneNumber}</span>}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500">
                  <Plus size={14} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`space-y-4 transition-all duration-300 ${selectedPatientId ? 'opacity-80' : ''}`}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="section-label">Nom *</label>
            <input
              value={patient.patientLastName}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientLastName: e.target.value.toUpperCase() }))}
              className={`input-premium h-11 font-semibold ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Prénom *</label>
            <input
              value={patient.patientFirstName}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientFirstName: e.target.value.toUpperCase() }))}
              className={`input-premium h-11 font-semibold ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="section-label">Sexe *</label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!selectedPatientId}
                onClick={() => setPatient((prev) => ({ ...prev, patientGender: 'M' }))}
                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                  patient.patientGender === 'M'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                M
              </button>
              <button
                type="button"
                disabled={!!selectedPatientId}
                onClick={() => setPatient((prev) => ({ ...prev, patientGender: 'F' }))}
                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all border ${
                  patient.patientGender === 'F'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                F
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Date naissance</label>
            <input
              type="date"
              value={patient.patientBirthDate}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientBirthDate: e.target.value }))}
              className={`input-premium h-11 text-sm ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
        </div>

        {!selectedPatientId && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
            <div className="space-y-1.5">
              <label className="section-label">Téléphone</label>
              <input
                value={patient.patientPhone}
                onChange={(e) => setPatient((prev) => ({ ...prev, patientPhone: e.target.value }))}
                className="input-premium h-11 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Email</label>
              <input
                type="email"
                value={patient.patientEmail}
                onChange={(e) => setPatient((prev) => ({ ...prev, patientEmail: e.target.value }))}
                className="input-premium h-11 text-sm"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-50 space-y-3">
          <h3 className="section-label">Prise en charge (Tier Payant)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="section-label">Caisse</label>
              <select
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className="input-premium h-11 text-sm"
              >
                {insuranceProviders.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Matricule / N° Adhérent</label>
              <input
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                placeholder="Ex: 12345678/A"
                className="input-premium h-11 text-sm"
              />
            </div>
          </div>
          {insuranceProvider && (
            <div className="space-y-1.5">
              <label className="section-label">Taux de couverture</label>
              <div className="flex gap-2 flex-wrap">
                {coverageOptions.slice(1).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInsuranceCoverage(option.value)}
                    className={`h-9 px-4 rounded-xl text-sm font-medium border transition-all ${
                      insuranceCoverage === option.value
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
