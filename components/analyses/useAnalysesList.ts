import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isThisWeek } from 'date-fns';
import { Analysis } from '@/lib/types';

export type StatusFilter = 'all' | 'pending' | 'in_progress' | 'validated_tech' | 'validated_bio' | 'completed';
export type DateFilter = 'today' | 'yesterday' | 'week' | 'custom' | 'all';

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'validated_tech', label: 'Validé technique' },
  { value: 'validated_bio', label: 'Validé bio' },
  { value: 'completed', label: 'Validé (legacy)' },
];

export const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'custom', label: 'Date personnalisée' },
  { value: 'all', label: 'Tout historique' },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function useAnalysesList() {
  const searchParams = useSearchParams();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [tatThresholds, setTatThresholds] = useState({ warnMinutes: 45, alertMinutes: 60 });
  const [currencyUnit, setCurrencyUnit] = useState('DA');
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
        const [response, tatResponse, settingsResponse] = await Promise.all([
          fetch('/api/analyses', { cache: 'no-store' }),
          fetch('/api/tat-settings', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ]);
        if (!response.ok) throw new Error('Erreur API');
        const data = await response.json();
        setAnalyses(Array.isArray(data) ? data : []);

        if (tatResponse.ok) {
          const tatData = await tatResponse.json();
          setTatThresholds({
            warnMinutes: Number(tatData.tatWarn) || 45,
            alertMinutes: Number(tatData.tatAlert) || 60,
          });
        }

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setCurrencyUnit(settingsData.amount_unit || 'DA');
        }
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
      setConfirmDialog({ open: false, id: null });
    }
  };

  return {
    loading,
    searchValue,
    setSearchValue,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    customDate,
    setCustomDate,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    tatThresholds,
    currencyUnit,
    filteredAnalyses,
    paginatedAnalyses,
    totalPages,
    deletingId,
    confirmDialog,
    setConfirmDialog,
    handleDeleteRequest,
    handleConfirmDelete,
  };
}
