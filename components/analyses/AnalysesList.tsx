'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronRight, Plus, Calendar, Trash2, AlertCircle, Filter, FileText, ChevronDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Analysis } from '@/lib/types';
import { format, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function AnalysesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState<string>('');
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
       setDateFilter('all'); // Automatically broaden search date if searching specifically
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
    .filter(analysis =>
      !searchId || 
      analysis.patientId.toLowerCase().includes(searchId.toLowerCase()) ||
      analysis.orderNumber.toLowerCase().includes(searchId.toLowerCase()) ||
      `${analysis.patientFirstName} ${analysis.patientLastName}`.toLowerCase().includes(searchId.toLowerCase())
    );

  const handleDeleteClick = (e: React.MouseEvent, analysisId: string) => {
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
      <div className="space-y-8 animate-fade-in">
         <div className="flex gap-4">
            <div className="flex-1 h-14 skeleton rounded-2xl" />
            <div className="w-48 h-14 skeleton rounded-2xl" />
         </div>
         <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="h-24 bento-card border-none bg-slate-100/50 animate-pulse" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Filters Group */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[var(--radius-3xl)] border border-white/40 shadow-premium">
        <div className="flex-1 w-full max-w-2xl">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                placeholder="Chercher par nom, ID patient ou n° de dossier..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="input-premium pl-12 h-14 text-base"
              />
           </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          {dateFilter === 'custom' ? (
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-100"
              />
              <button 
                onClick={() => setDateFilter('today')}
                className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-all font-bold"
              >✕</button>
            </div>
          ) : (
            <Menu as="div" className="relative inline-block">
              <Menu.Button className="h-14 w-48 rounded-2xl border border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2 text-blue-600" />
                  <span>
                    {dateFilter === 'today' && 'Aujourd\'hui'}
                    {dateFilter === 'yesterday' && 'Hier'}
                    {dateFilter === 'week' && 'Cette semaine'}
                    {dateFilter === 'custom' && 'Autre date...'}
                    {dateFilter === 'all' && 'Historique Complet'}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
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
                <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter('today')}
                          className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                          } ${dateFilter === 'today' ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          Aujourd'hui
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter('yesterday')}
                          className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                          } ${dateFilter === 'yesterday' ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          Hier
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter('week')}
                          className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                          } ${dateFilter === 'week' ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          Cette semaine
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter('custom')}
                          className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                          } ${dateFilter === 'custom' ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          Autre date...
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDateFilter('all')}
                          className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                            active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                          } ${dateFilter === 'all' ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          Historique Complet
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          <Link href="/analyses/nouvelle" className="contents">
            <button className="btn-primary-premium h-14 whitespace-nowrap">
              <Plus size={20} className="mr-2" />
              Nouvelle Analyse
            </button>
          </Link>
        </div>
      </div>

      {/* Analysis List View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 mb-2">
           <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              <Filter size={12} />
              Liste des dossiers ({filteredAnalyses.length})
           </div>
           {searchId && <span className="text-xs font-bold text-blue-600">Recherche active...</span>}
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="bento-card py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
               <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Aucun dossier trouvé</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
              {searchId ? 'Essayez des critères différents ou effacez les filtres.' : 'Aucune analyse enregistrée pour cette période.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAnalyses.map((analysis) => {
              // Compter uniquement les tests de "premier niveau" (pas les enfants de groupes)
              // Un groupe (isGroup=true) compte comme 1 seul test
              const topLevelResults = analysis.results.filter(r => {
                // Si c'est un groupe parent, on le compte
                if (r.test?.isGroup) return true;
                // Si c'est un test individuel sans parent, on le compte
                if (!r.test?.parentId) return true;
                // Sinon c'est un enfant d'un groupe, on ne le compte pas
                return false;
              });

              const completedTests = topLevelResults.filter(r => r.value).length;
              const totalTests = topLevelResults.length;
              const progress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
              const isComp = analysis.status === 'completed';

              return (
                <div
                  key={analysis.id}
                  onClick={() => router.push(`/analyses/${analysis.id}`)}
                  className="interactive-row bg-white group border-none"
                >
                  <div className="flex items-center gap-6 flex-1 px-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${isComp ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                        {(analysis.patientFirstName || analysis.patientLastName) 
                           ? `${analysis.patientFirstName?.[0] || ''}${analysis.patientLastName?.[0] || ''}`.toUpperCase()
                           : '?'}
                     </div>
                     <div className="min-w-0">
                        <h4 className={`font-black uppercase tracking-tight text-lg leading-none truncate ${!analysis.patientFirstName && !analysis.patientLastName ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                           {(analysis.patientFirstName || analysis.patientLastName)
                              ? `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`
                              : 'Patient Sans Nom'}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest">
                           <span className="font-mono text-blue-600">ID: {analysis.dailyId}</span>
                           <span className="opacity-20">|</span>
                           <span>{format(new Date(analysis.creationDate), 'HH:mm', { locale: fr })}</span>
                        </p>
                     
                     {/* Tests demandés - Affichage compact */}
                     <div className="mt-3 flex flex-wrap gap-1.5">
                        {topLevelResults.slice(0, 4).map((result) => (
                          <span 
                            key={result.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide transition-all ${
                              result.value 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                          >
                            
                            {result.test?.code || result.test?.name}
                            {result.value && ' ✓'}
                          </span>
                        ))}
                        {topLevelResults.length > 4 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200">
                            +{topLevelResults.length - 4}
                          </span>
                        )}
                     </div>
                  </div>
                  </div>

                  <div className="hidden md:flex flex-col items-center justify-center flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numéro d'Ordre</p>
                     <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">#{analysis.orderNumber}</span>
                  </div>

                  <div className="hidden lg:flex flex-col flex-1 px-6">
                     <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression</span>
                        <span className="text-[10px] font-bold text-slate-900">{completedTests}/{totalTests}</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${isComp ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                          style={{ width: `${progress}%` }} 
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-end flex-none lg:flex-1 gap-6 px-4">
                     <div className="flex items-center gap-2">
                        <span className={`glass-badge ${isComp ? 'badge-green' : 'badge-amber'}`}>
                           {isComp ? 'Validé' : 'En Saisie'}
                        </span>
                        {analysis.printedAt && (
                          <span className="glass-badge badge-blue flex items-center gap-1" title={`Imprimé le ${format(new Date(analysis.printedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}`}>
                            <Printer size={12} />
                          </span>
                        )}
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteClick(e, analysis.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${deletingId === analysis.id ? 'bg-slate-100 text-slate-400 animate-spin' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-600'}`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" size={24} />
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Supprimer l'analyse"
        description="Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer"
        variant="destructive"
      />
    </div>
  );
}