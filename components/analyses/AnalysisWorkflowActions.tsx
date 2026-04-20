import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Mail, PencilLine, Printer, ReceiptText, Save, Tags } from 'lucide-react';
import { getAnalysisStatusMeta, isAnalysisFinalValidated } from '@/lib/analysis-status';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';
import { LabelQuantityModal } from './LabelQuantityModal';
import { useAnalysisContext } from './AnalysisContext';
import { useState } from 'react';

export function AnalysisWorkflowActions() {
  const { printUrl } = useDirectPrint();
  const {
    analysis,
    canTech,
    canBio,
    sendingEmail,
    emailConfigured,
    saving,
    setEditDialogOpen,
    handleSave,
    handlePrint,
    handleSendEmail,
    selectedIds,
    qcReadiness,
  } = useAnalysisContext();

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  
  // We need handleValidation which was passed down, but wait, AnalysisContext exposes validationData which has handleValidation.
  const { handleValidation, validating } = useAnalysisContext();
  const { handlePrintInvoice } = useAnalysisContext();

  const isFinalValidated = isAnalysisFinalValidated(analysis?.status);
  const hasQcBlockers = Boolean(qcReadiness && !qcReadiness.ready && qcReadiness.blockers.length > 0);
  const selectedIdsCount = selectedIds.length;
  
  const onEdit = () => setEditDialogOpen(true);
  const onValidate = handleValidation;
  const onPrintInvoice = handlePrintInvoice;
  const onOpenLabels = () => {
    if (analysis) {
      setLabelModalOpen(true);
    }
  };

  const handleConfirmLabels = (n: number) => {
    if (analysis) {
      // Add count and a unique cache-buster timestamp
      printUrl(`/print/labels/${analysis.id}?autoprint=1&count=${n}&_t=${Date.now()}`);
    }
  };
  const onSave = handleSave;
  const onPrint = handlePrint;
  const onSendEmail = handleSendEmail;
  if (!analysis) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isFinalValidated ? (
        <>
          <button onClick={onEdit} className="btn-secondary h-10">
            <PencilLine size={16} /> Modifier dossier
          </button>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${getAnalysisStatusMeta(analysis.status).stepNumber >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-[var(--color-text-soft)]'}`}>1</div>
              <div className="flex flex-col">
                <span className="section-label leading-none mb-1">Validation Technique</span>
                {getAnalysisStatusMeta(analysis.status).stepNumber >= 2 ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Validée le {analysis.validatedTechAt ? format(new Date(analysis.validatedTechAt), 'dd/MM HH:mm') : ''}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-soft)] font-medium leading-none mt-0.5">Par {analysis.validatedTechName || 'Technicien'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {canTech && analysis.status === 'in_progress' ? (
                      <button
                        onClick={() => onValidate('tech')}
                        disabled={validating || hasQcBlockers}
                        className="btn-primary-sm !h-7 !rounded-md !px-3 !text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                        title={hasQcBlockers ? 'Validation bloquée: QC requis manquant ou en échec' : undefined}
                      >
                        Valider
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        {analysis.status === 'pending' ? 'Saisie...' : 'Attente'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block mx-1" />

            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${analysis.status === 'validated_tech' ? 'bg-indigo-600 text-white' : isFinalValidated ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-[var(--color-text-soft)]'}`}>2</div>
              <div className="flex flex-col">
                <span className="section-label leading-none mb-1">Validation Biologique</span>
                {isFinalValidated ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Signée le {analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd/MM HH:mm') : ''}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-soft)] font-medium leading-none mt-0.5">Par {analysis.validatedBioName || 'Biologiste'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {canBio && analysis.status === 'validated_tech' ? (
                      <button onClick={() => onValidate('bio')} disabled={validating} className="h-7 rounded-md bg-emerald-600 px-3 text-[10px] font-medium text-white transition-colors hover:bg-emerald-700">
                        Signer
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        {analysis.status === 'validated_tech' ? 'Attente' : 'Verrouillée'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={onPrintInvoice} className="btn-secondary h-10 px-4">
              <ReceiptText size={16} /> Facture
            </button>
            <button onClick={onOpenLabels} className="btn-secondary h-10 px-4">
              <Tags size={16} /> Etiquettes
            </button>
            <button onClick={onSave} disabled={saving} className="btn-secondary h-10 px-4">
              <Save size={16} /> {saving ? '...' : 'Sauvegarder'}
            </button>
            <button onClick={onPrint} className="btn-secondary h-10 px-4">
              <Printer size={16} /> {selectedIdsCount > 0 ? `Brouillon (${selectedIdsCount})` : 'Brouillon'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50 p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white">
              <CheckCircle size={20} />
            </div>
            <div className="flex flex-col mr-4">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Dossier Validé & Signé</span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>{analysis.validatedBioName}</span>
                <span className="text-emerald-300">•</span>
                <span className="text-[var(--color-text-soft)]">{analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd MMM yyyy HH:mm', { locale: fr }) : ''}</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={onPrintInvoice} className="btn-secondary h-10 px-4">
              <ReceiptText size={16} /> Facture
            </button>
            <button onClick={onOpenLabels} className="btn-secondary h-10 px-4">
              <Tags size={16} /> Etiquettes
            </button>
            <button
              onClick={onSendEmail}
              disabled={sendingEmail || !emailConfigured}
              title={!emailConfigured ? 'Service email non configuré' : undefined}
              className="btn-secondary h-10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail size={16} className={sendingEmail ? 'animate-pulse' : ''} /> Email
            </button>
            <button onClick={onPrint} className="btn-primary h-10 !bg-emerald-500 hover:!bg-emerald-600">
              <Printer size={16} /> Impression Finale
            </button>
          </div>
        </>
      )}
      <LabelQuantityModal
        open={labelModalOpen}
        onOpenChange={setLabelModalOpen}
        onConfirm={handleConfirmLabels}
      />
    </div>
  );
}
