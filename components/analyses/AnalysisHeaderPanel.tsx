import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Printer } from 'lucide-react';
import { PageBackLink } from '@/components/ui/PageBackLink';
import type { Analysis } from '@/lib/types';
import { AnalysisMetadataCards } from './AnalysisMetadataCards';
import { AnalysisPaymentPanel } from './AnalysisPaymentPanel';
import { AnalysisWorkflowActions } from './AnalysisWorkflowActions';
import { GlobalNotePanel } from './GlobalNotePanel';

interface AnalysisHeaderPanelProps {
  analysis: Analysis;
  validationError: string | null;
  qcReadiness: {
    ready: boolean;
    blockers: Array<{
      materialName: string;
      lotNumber: string;
      status: 'missing' | 'fail';
      tests: string[];
    }>;
    relevantLots: number;
  } | null;
  hasQcBlockers: boolean;
  isFinalValidated: boolean;
  canTech: boolean;
  canBio: boolean;
  validating: boolean;
  selectedIdsCount: number;
  sendingEmail: boolean;
  emailConfigured: boolean;
  saving: boolean;
  paymentTotal: number;
  paymentPaid: number;
  paymentRemaining: number;
  paymentStatusLabel: string;
  paymentStatusClasses: string;
  paymentAmountInput: string;
  setPaymentAmountInput: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  handlePayAll: () => void;
  handleSavePayment: () => void;
  savingPayment: boolean;
  role: string;
  currencyUnit: string;
  progressPct: number;
  abnormalCount: number;
  globalNote: string;
  setGlobalNote: (note: string) => void;
  globalNotePlacement: 'all' | 'first' | 'last';
  setGlobalNotePlacement: (placement: 'all' | 'first' | 'last') => void;
  saveGlobalNote: () => void;
  saveGlobalNoteBusy: boolean;
  onEdit: () => void;
  onValidate: (type: 'tech' | 'bio') => void;
  onPrintInvoice: () => void;
  onOpenLabels: () => void;
  onSave: () => void;
  onPrint: () => void;
  onSendEmail: () => void;
}

export function AnalysisHeaderPanel({
  analysis,
  validationError,
  qcReadiness,
  hasQcBlockers,
  isFinalValidated,
  canTech,
  canBio,
  validating,
  selectedIdsCount,
  sendingEmail,
  emailConfigured,
  saving,
  paymentTotal,
  paymentPaid,
  paymentRemaining,
  paymentStatusLabel,
  paymentStatusClasses,
  paymentAmountInput,
  setPaymentAmountInput,
  paymentMethod,
  setPaymentMethod,
  handlePayAll,
  handleSavePayment,
  savingPayment,
  role,
  currencyUnit,
  progressPct,
  abnormalCount,
  globalNote,
  setGlobalNote,
  globalNotePlacement,
  setGlobalNotePlacement,
  saveGlobalNote,
  saveGlobalNoteBusy,
  onEdit,
  onValidate,
  onPrintInvoice,
  onOpenLabels,
  onSave,
  onPrint,
  onSendEmail,
}: AnalysisHeaderPanelProps) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(15,31,51,0.06)] lg:p-6">
      <div className="flex flex-col items-start gap-6">
        <div className="flex items-start gap-3">
          <PageBackLink href="/analyses" className="mb-0 shrink-0" iconSize={18} />
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="status-pill border border-blue-200/70 bg-blue-50 text-blue-700">N° {analysis.orderNumber}</span>
              <span className="text-xs text-[var(--color-text-soft)]">{format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
            <h1 className={`text-xl font-semibold tracking-tight text-[var(--color-text)] ${!analysis.patientFirstName && !analysis.patientLastName ? 'italic text-[var(--color-text-soft)]' : ''}`}>
              {(analysis.patientFirstName || analysis.patientLastName) ? (
                <>{analysis.patientFirstName} <span className="text-[var(--color-accent)]">{analysis.patientLastName}</span></>
              ) : 'Patient Sans Nom'}
            </h1>
            {analysis.validatedTechAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600">
                <CheckCircle size={12} />
                <span>Validation technique: {analysis.validatedTechName || 'Utilisateur'} — {format(new Date(analysis.validatedTechAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
            {analysis.validatedBioAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle size={12} />
                <span>Validation biologique: {analysis.validatedBioName || 'Utilisateur'} — {format(new Date(analysis.validatedBioAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
            {analysis.printedAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                <Printer size={12} />
                <span>Dernière impression: {format(new Date(analysis.printedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <div className="w-full rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {validationError}
          </div>
        )}

        {analysis.status === 'in_progress' && qcReadiness && qcReadiness.relevantLots > 0 && (
          <div className={`w-full rounded-2xl border px-4 py-3 text-sm ${
            hasQcBlockers
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {hasQcBlockers ? 'QC requis non conforme avant validation technique' : 'QC requis conforme pour cette analyse'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  {qcReadiness.relevantLots} lot{qcReadiness.relevantLots > 1 ? 's' : ''} QC lié{qcReadiness.relevantLots > 1 ? 's' : ''} aux tests de cette analyse.
                </div>
              </div>
              <span className={`status-pill ${hasQcBlockers ? 'status-pill-warning' : 'status-pill-success'}`}>
                {hasQcBlockers ? `${qcReadiness.blockers.length} blocage(s)` : 'Prêt'}
              </span>
            </div>
            {hasQcBlockers && (
              <div className="mt-3 space-y-2 text-xs">
                {qcReadiness.blockers.map((blocker, index) => (
                  <div key={`${blocker.materialName}-${blocker.lotNumber}-${index}`} className="rounded-xl border border-amber-200/70 bg-white/70 px-3 py-2">
                    <span className="font-semibold">{blocker.materialName}</span>
                    <span> · lot {blocker.lotNumber} · </span>
                    <span>{blocker.status === 'fail' ? 'QC en échec' : 'QC manquant aujourd’hui'}</span>
                    <div className="mt-1 opacity-80">Tests concernés: {blocker.tests.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <AnalysisPaymentPanel
          paymentTotal={paymentTotal}
          paymentPaid={paymentPaid}
          paymentRemaining={paymentRemaining}
          paymentStatusLabel={paymentStatusLabel}
          paymentStatusClasses={paymentStatusClasses}
          paymentAmountInput={paymentAmountInput}
          setPaymentAmountInput={setPaymentAmountInput}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handlePayAll={handlePayAll}
          handleSavePayment={handleSavePayment}
          savingPayment={savingPayment}
          role={role}
          currencyUnit={currencyUnit}
          paidAt={analysis.paidAt}
          insuranceProvider={analysis.insuranceProvider}
          insuranceCoverage={analysis.insuranceCoverage}
          insuranceShare={analysis.insuranceShare ?? 0}
          patientShare={analysis.patientShare ?? undefined}
        />

        <AnalysisWorkflowActions
          analysis={analysis}
          isFinalValidated={isFinalValidated}
          canTech={canTech}
          canBio={canBio}
          validating={validating}
          hasQcBlockers={hasQcBlockers}
          selectedIdsCount={selectedIdsCount}
          sendingEmail={sendingEmail}
          emailConfigured={emailConfigured}
          saving={saving}
          onEdit={onEdit}
          onValidate={onValidate}
          onPrintInvoice={onPrintInvoice}
          onOpenLabels={onOpenLabels}
          onSave={onSave}
          onPrint={onPrint}
          onSendEmail={onSendEmail}
        />
      </div>

      <AnalysisMetadataCards
        dailyId={analysis.dailyId || ''}
        patientAge={analysis.patientAge ? String(analysis.patientAge) : ''}
        patientGender={analysis.patientGender || 'M'}
        progressPct={progressPct}
        abnormalCount={abnormalCount}
      />

      <GlobalNotePanel
        isFinalValidated={isFinalValidated}
        globalNote={globalNote}
        setGlobalNote={setGlobalNote}
        globalNotePlacement={globalNotePlacement}
        setGlobalNotePlacement={setGlobalNotePlacement}
        saveGlobalNote={saveGlobalNote}
        saveGlobalNoteBusy={saveGlobalNoteBusy}
      />
    </div>
  );
}
