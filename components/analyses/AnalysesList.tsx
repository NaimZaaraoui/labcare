'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Calendar, Trash2, Printer, ChevronDown, Activity, ChevronRight, FileText, PrinterCheck, PrinterCheckIcon } from 'lucide-react';
import { Analysis } from '@/lib/types';
import { differenceInMinutes, format, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSession } from 'next-auth/react';


const tatC = (d: string | Date) => {
  const m = differenceInMinutes(new Date(), new Date(d));
  return m >= 60 ? 'text-rose-500 font-bold' : m >= 45 ? 'text-amber-500 font-bold' : 'text-slate-400 font-medium';
};

const fmtD = (d: string | Date) => {
  const m = differenceInMinutes(new Date(), new Date(d));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}min`;
};

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-600' },
  in_progress: { label: 'En cours', classes: 'bg-indigo-50 text-indigo-600' },
  validated_tech: { label: 'Valid. Tech.', classes: 'bg-indigo-50 text-indigo-600' },
  validated_bio: { label: 'Validé ✓', classes: 'bg-emerald-50 text-emerald-600' },
  completed: { label: 'Validé ✓', classes: 'bg-emerald-50 text-emerald-600' },
};

export function AnalysesList() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'TECHNICIEN';

  const searchParams = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'validated_tech' | 'validated_bio' | 'completed'
  >('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        id: string | null;
      }>({ open: false, id: null });

  useEffect(() => {
    loadAnalyses();
    
    // Check for query param from global search
    const query = searchParams.get('q');
    if (query) {
       setSearchId(query);
       setDateFilter('all'); 
    }
  }, [searchParams]);

  const loadAnalyses = async () => {
    try {
      const response = await fetch('/api/analyses');
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      setAnalyses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (analysis: Analysis) => {
    const date = new Date(analysis.creationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return date.getTime() === today.getTime();
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getTime() === yesterday.getTime();
      case 'week':
        return isThisWeek(date, { weekStartsOn: 1 });
      case 'custom':
        if (!customDate) return true;
        const selectedDate = new Date(customDate);
        selectedDate.setHours(0, 0, 0, 0);
        return date.getTime() === selectedDate.getTime();
      case 'all':
        return true;
      default:
        return true;
    }
  };

  const filteredAnalyses = analyses
    .filter(analysis => filterByDate(analysis))
    .filter(analysis => statusFilter === 'all' || analysis.status === statusFilter)
    .filter(analysis =>
      !searchId || 
      analysis.patientId?.toLowerCase().includes(searchId.toLowerCase()) ||
      analysis.orderNumber?.toLowerCase().includes(searchId.toLowerCase()) ||
      `${analysis.patientFirstName} ${analysis.patientLastName}`.toLowerCase().includes(searchId.toLowerCase())
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchId, dateFilter, customDate, statusFilter]);

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / itemsPerPage));
  const paginatedAnalyses = filteredAnalyses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteClick = (e: React.MouseEvent, analysisId: string) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    setConfirmDialog({ open: true, id: analysisId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    const analysisId = confirmDialog.id;
    setDeletingId(analysisId);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
         <div className="flex gap-4">
            <div className="flex-1 h-12 bg-slate-100 animate-pulse rounded-full" />
            <div className="w-48 h-12 bg-slate-100 animate-pulse rounded-full" />
         </div>
         <div className="bento-panel h-96 flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filters Group */}
      <div className="flex flex-col items-start gap-4">
        <div className="flex-1 w-full relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input
             placeholder="Rechercher (nom, n° commande)..."
             value={searchId}
             onChange={(e) => setSearchId(e.target.value)}
             className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-12 pl-12 pr-6 rounded-full text-sm transition-all placeholder:text-slate-400 outline-none font-medium shadow-sm"
           />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {dateFilter === 'custom' ? (
            <div className="flex bg-white rounded-full p-1 border border-slate-200 shadow-sm">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 px-4 bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
              <button 
                onClick={() => setDateFilter('today')}
                className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors"
                title="Annuler la date"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <Menu as="div" className="relative z-50 inline-block text-left">
              <Menu.Button className="h-12 min-w-[200px] rounded-full border border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-5 flex items-center justify-between hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-500" />
                  <span className="text-sm">
                    {dateFilter === 'today' && "Aujourd'hui"}
                    {dateFilter === 'yesterday' && "Hier"}
                    {dateFilter === 'week' && "7 Derniers Jours"}
                    {dateFilter === 'custom' && "Autre date..."}
                    {dateFilter === 'all' && "Tout l'Historique"}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400 ml-2" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-2xl border border-slate-100 focus:outline-none overflow-hidden p-2">
                  {[
                    { id: 'today', label: "Aujourd'hui" },
                    { id: 'yesterday', label: 'Hier' },
                    { id: 'week', label: '7 Derniers Jours' },
                    { id: 'custom', label: 'Calendrier personnalisé...' },
                    { id: 'all', label: 'Tout l\'Historique' }
                  ].map((item) => (
                    <Menu.Item key={item.id}>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter(item.id)}
                          className={`flex w-full px-4 py-2.5 text-sm font-bold transition-all rounded-xl ${
                            active ? 'bg-slate-50 text-indigo-600' : 'text-slate-600'
                          } ${dateFilter === item.id ? 'bg-indigo-50 text-indigo-600' : ''}`}
                        >
                          {item.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          <Menu as="div" className="relative z-50 inline-block text-left">
            <Menu.Button className="h-12 min-w-[180px] rounded-full border border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-5 flex items-center justify-between hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                <span className="text-sm">
                  {statusFilter === 'all' && 'Tous les statuts'}
                  {statusFilter === 'pending' && 'En attente'}
                  {statusFilter === 'in_progress' && 'En cours'}
                  {statusFilter === 'validated_tech' && 'Valid. Tech.'}
                  {statusFilter === 'validated_bio' && 'Validé (bio)'}
                  {statusFilter === 'completed' && 'Validé (legacy)'}
                </span>
              </div>
              <ChevronDown size={16} className="text-slate-400 ml-2" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-2xl border border-slate-100 focus:outline-none overflow-hidden p-2">
                {[
                  { id: 'all', label: 'Tous les statuts' },
                  { id: 'pending', label: 'En attente' },
                  { id: 'in_progress', label: 'En cours' },
                  { id: 'validated_tech', label: 'Valid. technique' },
                  { id: 'validated_bio', label: 'Validé (bio)' },
                  { id: 'completed', label: 'Validé (legacy)' }
                ].map((item) => (
                  <Menu.Item key={item.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setStatusFilter(item.id as typeof statusFilter)}
                        className={`flex w-full px-4 py-2.5 text-sm font-bold transition-all rounded-xl ${
                          active ? 'bg-slate-50 text-indigo-600' : 'text-slate-600'
                        } ${statusFilter === item.id ? 'bg-indigo-50 text-indigo-600' : ''}`}
                      >
                        {item.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          {role !== 'MEDECIN' && (
            <Link href="/analyses/nouvelle" className="btn-primary shrink-0 h-12 px-6 shadow-indigo-500/20 shadow-lg">
              <Plus size={18} /> Nouvelle Analyse
            </Link>
          )}
          

        </div>
      </div>

      {/* Analysis List: High-Density Table */}
      <div className="bento-panel flex flex-col overflow-hidden">
        {filteredAnalyses.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
               <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Aucun dossier trouvé</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchId ? 'Affinez votre recherche ou effacez les filtres.' : 'Aucune donnée disponible pour cette période.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-1 text-center">ID</div>
              <div className="col-span-4 pl-4">Patient</div>
              <div className="col-span-2">Date & Heure</div>
              <div className="col-span-1 text-center">Durée</div>
              <div className="col-span-2 text-center">N° Commande</div>
              <div className="col-span-1 text-center">Statut</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-50">
              {paginatedAnalyses.map((analysis) => {
                const topLevelResults = (analysis.results || []).filter(r => !r.test?.parentId || r.test?.isGroup);
                const isReleased = analysis.status === 'completed' || analysis.status === 'validated_bio';
                const s = STATUS_MAP[analysis.status || ''] ?? { label: analysis.status || '—', classes: 'bg-slate-50 text-slate-500' };

                return (
                  <Link
                    key={analysis.id}
                    href={`/analyses/${analysis.id}`}
                    className={`grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center group relative gap-y-4 ${analysis.isUrgent ? 'border-l-4 border-rose-500 pl-2' : ''}`}
                  >
                    <div className="md:col-span-1 text-center text-xs font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors hidden md:block">
                      #{analysis.dailyId || '?'}
                    </div>
                    
                    <div className="md:col-span-4 flex items-center gap-3 md:pl-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${analysis.isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {analysis.patientFirstName?.[0]}{analysis.patientLastName?.[0]}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-2">
                          {analysis.patientLastName || 'ANONYME'} <span className="font-semibold text-slate-600">{analysis.patientFirstName}</span>
                          {analysis.isUrgent && (
                            <span className="status-pill bg-rose-50 text-rose-600">URGENT</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-2">
                          <span className="truncate">
                            {topLevelResults.slice(0, 3).map(r => r.test?.code).join(', ')}
                            {topLevelResults.length > 3 && ` +${topLevelResults.length - 3}`}
                          </span>
                          <span className="bg-slate-100 text-slate-500 text-[10px] rounded-full px-2 py-0.5 whitespace-nowrap">
                            {topLevelResults.length} analyses
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex flex-col justify-center text-sm">
                       <span className="font-semibold text-slate-700">{format(new Date(analysis.creationDate), 'dd MMM yyyy', { locale: fr })}</span>
                       <span className="text-[11px] text-slate-400">{format(new Date(analysis.creationDate), 'HH:mm')}</span>
                    </div>

                    <div className="md:col-span-1 text-center text-sm">
                      {isReleased ? (
                        <span className="text-slate-400 font-medium">{format(new Date(analysis.creationDate), 'HH:mm')}</span>
                      ) : (
                        <span className={tatC(analysis.creationDate)}>{fmtD(analysis.creationDate)}</span>
                      )}
                    </div>

                    <div className="md:col-span-2 text-center font-mono text-xs font-medium text-slate-500 bg-slate-50 py-1 px-2 rounded-lg w-fit md:mx-auto">
                      {analysis.orderNumber}
                    </div>

                    <div className="md:col-span-1 flex justify-start md:justify-center items-center gap-2">
                      <span className={`status-pill ${s.classes}`}>
                        {s.label}
                      </span>
                      {analysis.printedAt && (
                         <div className="w-6 h-6 rounded text-emerald-400 flex items-center justify-center" title="Imprimé">
                           <PrinterCheckIcon size={12} />
                         </div>
                      )}
                    </div>

                    <div className="md:col-span-1 flex justify-end gap-2">
                       {analysis.status !== 'completed' && analysis.status !== 'validated_bio' && (
                         <button
                            onClick={(e) => handleDeleteClick(e, analysis.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              deletingId === analysis.id ? 'bg-slate-100 text-slate-400 animate-spin' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-500'
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                       )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Supprimer l'analyse"
        description="Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer quand même"
        variant="destructive"
      />

    </div>
  );
}