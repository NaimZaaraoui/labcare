import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrinterCheck, Trash2 } from 'lucide-react';
import type { Analysis } from '@/lib/types';
import { formatTatLabel, getTatMinutes, getTatTextClass } from '@/lib/tat';

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  in_progress: { label: 'En cours', classes: 'bg-blue-50 text-blue-700 border border-blue-200/70' },
  validated_tech: { label: 'Validé Tech', classes: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70' },
  validated_bio: { label: 'Validé Bio', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
  completed: { label: 'Validé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; classes: string }> = {
  UNPAID: { label: 'Non payé', classes: 'bg-rose-50 text-rose-700 border border-rose-200/70' },
  PARTIAL: { label: 'Partiel', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  PAID: { label: 'Payé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

interface Props {
  analysis: Analysis;
  currencyUnit: string;
  tatThresholds: { warnMinutes: number; alertMinutes: number };
  deletingId: string | null;
  onDeleteRequest: (event: React.MouseEvent, id: string) => void;
}

export function AnalysisTableRow({ analysis, currencyUnit, tatThresholds, deletingId, onDeleteRequest }: Props) {
  const testsCount = typeof (analysis as Analysis & { testsCount?: number }).testsCount === 'number'
    ? (analysis as Analysis & { testsCount: number }).testsCount
    : (analysis.results || []).filter((result) => !result.test?.parentId).length;
  
  const status = STATUS_MAP[analysis.status || ''] ?? {
    label: analysis.status || 'Inconnu',
    classes: 'bg-slate-50 text-slate-700 border border-slate-200/70',
  };
  
  const payment = PAYMENT_STATUS_MAP[analysis.paymentStatus || 'UNPAID'] ?? PAYMENT_STATUS_MAP.UNPAID;
  const isReleased = analysis.status === 'completed' || analysis.status === 'validated_bio';
  const patientName = `${analysis.patientLastName || 'ANONYME'} ${analysis.patientFirstName || ''}`.trim();
  const remaining = Math.max(0, (analysis.totalPrice || 0) - (analysis.amountPaid || 0));

  return (
    <Link
      href={`/analyses/${analysis.id}`}
      className={`grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface-muted)] lg:grid-cols-12 lg:items-center ${
        analysis.isUrgent ? 'border-l-4 border-l-rose-500 pl-4' : ''
      }`}
    >
      <div className="hidden text-center text-xs font-medium text-[var(--color-text-soft)] lg:col-span-1 lg:block">
        #{analysis.dailyId || '?'}
      </div>

      <div className="lg:col-span-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <span className="truncate">{patientName}</span>
          {analysis.isUrgent && (
            <span className="rounded-full border border-rose-200/70 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              Urgent
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-[var(--color-text-soft)]">
          {testsCount} analyse{testsCount > 1 ? 's' : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${payment.classes}`}>
            {payment.label}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
            Reste: {remaining.toFixed(2)} {currencyUnit}
          </span>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {format(new Date(analysis.creationDate), 'dd MMM yyyy', { locale: fr })}
        </div>
        <div className="text-xs text-[var(--color-text-soft)]">
          {format(new Date(analysis.creationDate), 'HH:mm')}
        </div>
      </div>

      <div className={`lg:col-span-1 lg:text-center text-xs ${getTatTextClass(getTatMinutes(analysis), tatThresholds)}`}>
        {isReleased ? 'Validé' : formatTatLabel(getTatMinutes(analysis))}
      </div>

      <div className="lg:col-span-2 lg:text-center">
        <span className="inline-flex rounded-lg border bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-secondary)]">
          {analysis.orderNumber}
        </span>
      </div>

      <div className="flex items-center gap-2 lg:col-span-1 lg:justify-center">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}>
          {status.label}
        </span>
        {analysis.printedAt && (
          <div 
            title={`Imprimé le ${format(new Date(analysis.printedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm transition-transform hover:scale-110"
          >
            <PrinterCheck className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="flex justify-end lg:col-span-1">
        {!isReleased && (
          <button
            onClick={(event) => onDeleteRequest(event, analysis.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              deletingId === analysis.id
                ? 'text-slate-400'
                : 'text-[var(--color-text-soft)] hover:bg-rose-50 hover:text-rose-700'
            }`}
            title="Supprimer analyse"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Link>
  );
}
