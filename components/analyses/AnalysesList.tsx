'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  FileSearch,
  Plus,
  PrinterCheck,
  Search,
  Trash2,
} from 'lucide-react';
import { Analysis } from '@/lib/types';
import { differenceInMinutes, format, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSession } from 'next-auth/react';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'validated_tech' | 'validated_bio' | 'completed';
type DateFilter = 'today' | 'yesterday' | 'week' | 'custom' | 'all';

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  in_progress: { label: 'En cours', classes: 'bg-blue-50 text-blue-700 border border-blue-200/70' },
  validated_tech: { label: 'Validé Tech', classes: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70' },
  validated_bio: { label: 'Validé Bio', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
  completed: { label: 'Validé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'custom', label: 'Date personnalisée' },
  { value: 'all', label: 'Tout historique' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'validated_tech', label: 'Validé technique' },
  { value: 'validated_bio', label: 'Validé bio' },
  { value: 'completed', label: 'Validé (legacy)' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

const PAYMENT_STATUS_MAP: Record<string, { label: string; classes: string }> = {
  UNPAID: { label: 'Non payé', classes: 'bg-rose-50 text-rose-700 border border-rose-200/70' },
  PARTIAL: { label: 'Partiel', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  PAID: { label: 'Payé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

const getTatClass = (creationDate: string | Date) => {
  const minutes = differenceInMinutes(new Date(), new Date(creationDate));
  if (minutes >= 60) return 'text-[var(--color-critical)] font-semibold';
  if (minutes >= 45) return 'text-[var(--color-warning)] font-semibold';
  return 'text-[var(--color-text-soft)]';
};

const getTatLabel = (creationDate: string | Date) => {
  const minutes = differenceInMinutes(new Date(), new Date(creationDate));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export function AnalysesList() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? 'TECHNICIEN';
  const searchParams = useSearchParams();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchValue(query);
      setDateFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        const response = await fetch('/api/analyses', { cache: 'no-store' });
        if (!response.ok) throw new Error('Erreur API');
        const data = await response.json();
        setAnalyses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur analyses:', error);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };
    loadAnalyses();
  }, []);

  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((analysis) => {
        const analysisDate = new Date(analysis.creationDate);
        const day = new Date(analysisDate);
        day.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') return day.getTime() === today.getTime();
        if (dateFilter === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return day.getTime() === yesterday.getTime();
        }
        if (dateFilter === 'week') return isThisWeek(day, { weekStartsOn: 1 });
        if (dateFilter === 'custom' && customDate) {
          const selected = new Date(customDate);
          selected.setHours(0, 0, 0, 0);
          return day.getTime() === selected.getTime();
        }
        return true;
      })
      .filter((analysis) => statusFilter === 'all' || analysis.status === statusFilter)
      .filter((analysis) => {
        if (!searchValue) return true;
        const query = searchValue.toLowerCase();
        return (
          analysis.patientId?.toLowerCase().includes(query) ||
          analysis.orderNumber?.toLowerCase().includes(query) ||
          `${analysis.patientFirstName ?? ''} ${analysis.patientLastName ?? ''}`.toLowerCase().includes(query)
        );
      });
  }, [analyses, customDate, dateFilter, searchValue, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, dateFilter, customDate, statusFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / itemsPerPage));
  const paginatedAnalyses = filteredAnalyses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteRequest = (event: React.MouseEvent, analysisId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmDialog({ open: true, id: analysisId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    const id = confirmDialog.id;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Suppression impossible');
      setAnalyses((previous) => previous.filter((analysis) => analysis.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-line h-14" />
        <div className="skeleton-card h-[480px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-white p-4 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_220px_220px_auto]">
          <div className="input-premium h-11 flex items-center gap-2 px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher patient, ID ou n° commande..."
              aria-label="Rechercher une analyse"
              className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
            />
          </div>

          <div className="input-premium h-11 flex items-center gap-2 px-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              aria-label="Filtrer par date"
              className="h-full w-full appearance-none border-0 bg-transparent pr-2 text-sm text-[var(--color-text)] outline-none"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-premium h-11 flex items-center gap-2 px-3">
            <Activity className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filtrer par statut"
              className="h-full w-full appearance-none border-0 bg-transparent pr-2 text-sm text-[var(--color-text)] outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {role !== 'MEDECIN' && (
            <Link href="/analyses/nouvelle" className="btn-primary-md px-4">
              <Plus className="h-4 w-4" />
              Nouvelle analyse
            </Link>
          )}
        </div>

        {dateFilter === 'custom' && (
          <div className="mt-3 max-w-[260px]">
            <input
              type="date"
              value={customDate}
              onChange={(event) => setCustomDate(event.target.value)}
              className="input-premium h-10"
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-[0_10px_30px_rgba(15,31,51,0.06)]">
        {filteredAnalyses.length === 0 ? (
          <div className="empty-state mx-4 my-6">
            <div className="empty-state-icon">
              <FileSearch className="h-6 w-6 text-[var(--color-text-soft)]" />
            </div>
            <p className="empty-state-title">Aucun dossier trouvé</p>
            <p className="empty-state-text">
              Ajustez les filtres ou la période pour afficher des analyses.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-12 border-b bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)] lg:grid">
              <div className="col-span-1 text-center">ID</div>
              <div className="col-span-4">Patient</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">TAT</div>
              <div className="col-span-2 text-center">Commande</div>
              <div className="col-span-1 text-center">Statut</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y">
              {paginatedAnalyses.map((analysis) => {
                const testsCount = (analysis.results || []).filter(
                  (result) => !result.test?.parentId || result.test?.isGroup,
                ).length;
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
                    key={analysis.id}
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
                          Reste: {remaining.toFixed(2)} DA
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

                    <div className={`lg:col-span-1 lg:text-center text-xs ${getTatClass(analysis.creationDate)}`}>
                      {isReleased ? 'Validé' : getTatLabel(analysis.creationDate)}
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
                        <PrinterCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>

                    <div className="flex justify-end lg:col-span-1">
                      {analysis.status !== 'completed' && analysis.status !== 'validated_bio' && (
                        <button
                          onClick={(event) => handleDeleteRequest(event, analysis.id)}
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
              })}
            </div>

            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="items-per-page" className="text-sm text-[var(--color-text-soft)]">
                  Lignes par page
                </label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(event) => setItemsPerPage(Number(event.target.value))}
                  className="input-premium h-10 w-[92px] px-3"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((current) => ({ ...current, open }))}
        title="Supprimer l'analyse"
        description="Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer quand même"
        variant="destructive"
      />
    </div>
  );
}
