'use client';

import { Save } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { AnalysePatientPanel } from './AnalysePatientPanel';
import { AnalyseTestsPanel } from './AnalyseTestsPanel';
import { AnalyseOrderPanel } from './AnalyseOrderPanel';
import { useAnalyseForm } from './useAnalyseForm';

const INSURANCE_PROVIDERS = [
  { value: '', label: '-- Aucune assurance --' },
  { value: 'CNAM', label: 'CNAM' },
  { value: 'CNSS', label: 'CNSS' },
  { value: 'CNRPS', label: 'CNRPS' },
  { value: 'PRIVATE', label: 'Assurance Privée' },
];

const COVERAGE_OPTIONS = [
  { value: '', label: '-- Choisir --' },
  { value: '100', label: '100% (Exonéré)' },
  { value: '80', label: '80%' },
  { value: '70', label: '70%' },
  { value: '50', label: '50%' },
];

export function AnalyseForm() {
  const state = useAnalyseForm();

  if (state.loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
         <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 pb-28 animate-fade-in">
      
      {/* LEFT COLUMN: Patient & Order Info (High Density) */}
      <div className="w-full flex flex-col gap-6">
         <AnalyseOrderPanel
            dailyId={state.dailyId}
            setDailyId={state.setDailyId}
            receiptNumber={state.receiptNumber}
            setReceiptNumber={state.setReceiptNumber}
            provenance={state.provenance}
            setProvenance={state.setProvenance}
            medecinPrescripteur={state.medecinPrescripteur}
            setMedecinPrescripteur={state.setMedecinPrescripteur}
            isUrgent={state.isUrgent}
            setIsUrgent={state.setIsUrgent}
         />

         <AnalysePatientPanel
            patient={state.patientState.patient}
            setPatient={state.patientState.setPatient}
            searchTerm={state.patientState.searchTerm}
            setSearchTerm={state.patientState.setSearchTerm}
            searchResults={state.patientState.searchResults}
            isSearching={state.patientState.isSearching}
            selectedPatientId={state.patientState.selectedPatientId}
            selectPatient={state.patientState.selectPatient}
            clearSelection={state.patientState.clearSelection}
            insuranceProvider={state.patientState.insuranceProvider}
            setInsuranceProvider={state.patientState.setInsuranceProvider}
            insuranceNumber={state.patientState.insuranceNumber}
            setInsuranceNumber={state.patientState.setInsuranceNumber}
            insuranceCoverage={state.patientState.insuranceCoverage}
            setInsuranceCoverage={state.patientState.setInsuranceCoverage}
            insuranceProviders={INSURANCE_PROVIDERS}
            coverageOptions={COVERAGE_OPTIONS}
         />
      </div>

      {/* RIGHT COLUMN: Tests & Bilans (High Density Grid) */}
      <div className="w-full flex flex-col gap-6">
         <AnalyseTestsPanel
            searchTest={state.searchTest}
            setSearchTest={state.setSearchTest}
            bilans={state.bilans}
            selectedTests={state.selectedTests}
            toggleBilan={state.toggleBilan}
            groupedTests={state.groupedTests}
            toggleTest={state.toggleTest}
         />
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="pointer-events-none fixed right-0 bottom-0 z-50 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] sm:px-4">
         <div className="mx-auto flex w-full max-w-6xl justify-end">
            <div className="pointer-events-auto flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 sm:px-4 sm:py-3 md:flex-row md:items-center md:justify-between">
               <div className="grid w-full grid-cols-3 gap-3 md:flex md:w-auto md:items-center md:gap-6">
                  <div className="flex flex-col">
                     <span className="section-label">Sélection</span>
                     <span className="text-sm font-semibold text-slate-900">{state.selectedTests.length} examen(s)</span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-100" />
                  <div className="flex flex-col">
                     <span className="section-label text-indigo-500">Total à payer</span>
                     <span className="text-base sm:text-lg font-semibold text-indigo-600 tracking-tight">
                        {state.tests
                          .filter((t) => state.selectedTests.includes(t.id))
                          .reduce((sum, t) => sum + (t.price || 0), 0)
                          .toLocaleString()} <span className="text-[10px]">{state.labSettings.amount_unit}</span>
                     </span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-100" />
                  <div className="flex items-center md:block">
                    <span className={`status-pill ${state.isUrgent ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {state.isUrgent ? 'Urgent' : 'Routine'}
                    </span>
                  </div>
               </div>
               
               <div className="flex w-full items-center gap-2 sm:gap-3 md:w-auto">
                  <button 
                     onClick={() => state.router.back()} 
                     className="btn-secondary-md w-full md:w-auto"
                  >
                     Annuler
                  </button>
                  
                  <button 
                     onClick={state.handleSubmit}
                     disabled={state.submitting || state.selectedTests.length === 0} 
                     className="btn-primary-md w-full md:w-auto md:min-w-[180px]"
                  >
                     {state.submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <><Save size={18} /> <span className="inline">Valider & Créer</span></>
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>

      {state.notification && (
        <NotificationToast type={state.notification.type} message={state.notification.message} />
      )}
    </div>
  );
}
