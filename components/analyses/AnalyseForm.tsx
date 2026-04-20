'use client';

import { Save } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { AnalysePatientPanel } from './AnalysePatientPanel';
import { AnalyseTestsPanel } from './AnalyseTestsPanel';
import { AnalyseOrderPanel } from './AnalyseOrderPanel';
import { useAnalyseForm } from './useAnalyseForm';
import { useLicense } from '@/components/providers/LicenseProvider';

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
  const { isExpired } = useLicense();
  const totalAmount = state.tests
    .filter((test) => state.selectedTests.includes(test.id))
    .reduce((sum, test) => sum + (test.price || 0), 0);

  if (state.loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 pb-28 animate-fade-in">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Nouveau dossier d&apos;analyse</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Enregistrez le dossier, rattachez le patient et sélectionnez les examens demandés.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
            <span className="status-pill rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[var(--color-text-secondary)]">
              {state.selectedTests.length} examen(s)
            </span>
            <span className={`status-pill rounded-md px-2.5 py-1 ${state.isUrgent ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
              {state.isUrgent ? 'Urgent' : 'Routine'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-5">
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

      <div className="w-full flex flex-col gap-5">
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

      <div className="pointer-events-none fixed right-0 bottom-0 z-50 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] sm:px-4">
         <div className="mx-auto flex w-full max-w-6xl justify-end">
            <div className="pointer-events-auto flex w-full flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 sm:px-4 sm:py-3 md:flex-row md:items-center md:justify-between">
               <div className="grid w-full grid-cols-3 gap-3 md:flex md:w-auto md:items-center md:gap-6">
                  <div className="flex flex-col">
                     <span className="section-label">Sélection</span>
                     <span className="text-sm font-semibold text-[var(--color-text)]">{state.selectedTests.length} examen(s)</span>
                  </div>
                  <div className="hidden h-8 w-px bg-slate-200 md:block" />
                  <div className="flex flex-col">
                     <span className="section-label">Total à payer</span>
                     <span className="text-base font-semibold tracking-tight text-[var(--color-text)] sm:text-lg">
                        {totalAmount.toLocaleString()} <span className="text-[10px] text-[var(--color-text-soft)]">{state.labSettings.amount_unit}</span>
                     </span>
                  </div>
                  <div className="hidden h-8 w-px bg-slate-200 md:block" />
                  <div className="flex items-center md:block">
                    <span className={`status-pill rounded-md px-2.5 py-1 ${state.isUrgent ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
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
                     disabled={state.submitting || state.selectedTests.length === 0 || isExpired} 
                     className="btn-primary-md w-full md:w-auto md:min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                     title={isExpired ? "Impossible de créer un dossier avec une licence expirée" : "Enregistrer"}
                  >
                     {state.submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : isExpired ? (
                        <span className="inline font-bold">Bloqué (Licence)</span>
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
