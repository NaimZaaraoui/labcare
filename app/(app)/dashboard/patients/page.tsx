
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Search, 
  Loader2,
  Plus, 
  Phone, 
  Mail,
  Calendar, 
  ChevronRight,
  Edit2,
  DownloadCloud,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function PatientsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';

  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const latestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // UI State
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
      open: boolean;
      title: string;
      description: string;
      action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });

  const fetchPatients = useCallback(async (query: string, requestId: number) => {
    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = query.trim()
        ? `/api/patients?query=${encodedQuery}&skip=0&limit=2000`
        : '/api/patients?skip=0&limit=2000';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (requestId === latestRequestRef.current) {
          setPatients(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
        setIsSearching(false);
        hasLoadedOnceRef.current = true;
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(searchTerm, requestId);
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    try {
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPatient)
      });
      
      if (res.ok) {
        showNotification('success', 'Patient mis à jour');
        setEditingPatient(null);
        const requestId = ++latestRequestRef.current;
        fetchPatients(searchTerm, requestId);
      } else {
        showNotification('error', 'Erreur lors de la mise à jour');
      }
    } catch {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        showNotification('success', 'Patient supprimé');
        const requestId = ++latestRequestRef.current;
        fetchPatients(searchTerm, requestId);
      } else {
         showNotification('error', data.error || 'Erreur suppression');
      }
    } catch {
        showNotification('error', 'Erreur serveur');
    }
  };

  const calculateAge = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const totalPages = Math.max(1, Math.ceil(patients.length / itemsPerPage));
  const paginatedPatients = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Patients</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Répertoire central des dossiers patients.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Total</div>
              <div className="text-lg font-semibold text-[var(--color-text)]">{patients.length}</div>
            </div>

            <button onClick={() => router.push('/dashboard/exports')} className="btn-secondary h-11 px-4">
              <DownloadCloud className="h-4 w-4" />
              Exporter
            </button>

            {role !== 'MEDECIN' && (
              <button onClick={() => router.push('/analyses/nouvelle')} className="btn-primary-md px-4">
                <Plus className="h-4 w-4" />
                Nouveau dossier
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-4 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
        <div className="input-premium h-11 flex items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, prénom ou téléphone..."
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
          {isSearching && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)] whitespace-nowrap">
              <Loader2 size={12} className="animate-spin" />
              Recherche...
            </span>
          )}
        </div>
      </section>


      {loading && patients.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton-card h-[320px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedPatients.map(patient => (
            <div key={patient.id} className="bento-panel p-5 transition-colors group flex flex-col h-[320px] hover:bg-[var(--color-surface-muted)]">
               <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-semibold shrink-0 shadow-inner ${
                       patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                     }`}>
                        {patient.firstName[0]}{patient.lastName[0]}
                     </div>
                     <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-indigo-600">{patient.lastName} {patient.firstName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide ${patient.gender === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                            {patient.gender === 'M' ? 'Homme' : 'Femme'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md">
                            {calculateAge(patient.birthDate)} ans
                          </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-1 ">
                      {role !== 'MEDECIN' && (
                        <button 
                          onClick={() => router.push(`/analyses/nouvelle?patientId=${patient.id}`)}
                          className="w-10 h-10 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"
                          title="Nouvelle Analyse"
                        >
                           <Plus size={18} />
                        </button>
                      )}

                      <button
                          onClick={() => setEditingPatient(patient)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"
                      >
                         <Edit2 size={16} />
                      </button>
                  </div>
               </div>

               <div className="space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-surface-muted)] p-3 rounded-2xl border border-[var(--color-border)]">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone size={10} /> Téléphone
                      </div>
                      <div className="text-xs font-semibold text-slate-700 truncate">{patient.phoneNumber || '—'}</div>
                    </div>
                    <div className="bg-[var(--color-surface-muted)] p-3 rounded-2xl border border-[var(--color-border)]">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Calendar size={10} /> Naissance
                      </div>
                      <div className="text-xs font-semibold text-slate-700">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                  </div>
                  
                  {patient.email && (
                    <div className="bg-[var(--color-surface-muted)] p-3 rounded-2xl border border-[var(--color-border)]">
                       <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Mail size={10} /> Email
                      </div>
                      <div className="text-xs font-medium text-slate-600 truncate">{patient.email}</div>
                    </div>
                  )}
               </div>

               <div className="mt-4">
                  <Link 
                    href={`/dashboard/patients/${patient.id}`}
                    className="btn-secondary-sm w-full justify-between text-[11px] uppercase tracking-wide"
                  >
                    Voir le dossier complet
                    <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </div>
          ))}
          
          {patients.length === 0 && !loading && (
             <div className="col-span-full empty-state py-24">
                <div className="empty-state-icon h-20 w-20 rounded-full bg-slate-200/50">
                  <Users size={40} />
                </div>
                <h3 className="empty-state-title mb-2 text-xl">Aucun patient trouvé</h3>
                <p className="empty-state-text text-sm max-w-sm mx-auto">Ajustez votre recherche ou créez une fiche pour un nouveau patient.</p>
             </div>
          )}
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-1 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="patients-items-per-page" className="text-sm text-[var(--color-text-soft)]">
              Lignes par page
            </label>
            <select
              id="patients-items-per-page"
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="input-premium h-10 w-[92px] px-3"
            >
              {[10, 20, 50, 100].map((option) => (
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
      )}

      {/* Edit Modal */}
      {mounted && editingPatient && createPortal(
         <div className="modal-overlay animate-in fade-in">
             <div 
                className="modal-shell flex w-full max-w-2xl max-h-[90vh] flex-col animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
             >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
                  <h3 className="text-xl font-semibold text-[var(--color-text)]">Modifier le patient</h3>
                  <button onClick={() => setEditingPatient(null)} className="rounded-xl p-2 text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)]">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Prénom</label>
                         <input
                            value={editingPatient.firstName}
                            onChange={(e) => setEditingPatient({...editingPatient, firstName: e.target.value})}
                            className="input-premium h-11"
                            required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom</label>
                         <input
                            value={editingPatient.lastName}
                            onChange={(e) => setEditingPatient({...editingPatient, lastName: e.target.value})}
                            className="input-premium h-11"
                            required
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Date de naissance</label>
                      <input
                         type="date"
                         value={editingPatient.birthDate ? new Date(editingPatient.birthDate).toISOString().split('T')[0] : ''}
                         onChange={(e) => setEditingPatient({...editingPatient, birthDate: e.target.value})}
                         className="input-premium h-11"
                         required
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Sexe</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setEditingPatient({...editingPatient, gender: 'M'})}
                         className={`flex-1 py-3 rounded-xl font-medium border transition-all ${editingPatient.gender === 'M' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
                        >Homme</button>
                        <button
                          type="button"
                          onClick={() => setEditingPatient({...editingPatient, gender: 'F'})}
                          className={`flex-1 py-3 rounded-xl font-medium border transition-all ${editingPatient.gender === 'F' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
                        >Femme</button>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Téléphone</label>
                      <input
                         value={editingPatient.phoneNumber || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, phoneNumber: e.target.value})}
                         className="input-premium h-11"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Email</label>
                      <input
                         value={editingPatient.email || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                         className="input-premium h-11"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Adresse</label>
                      <input
                         value={editingPatient.address || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, address: e.target.value})}
                         className="input-premium h-11"
                      />
                   </div>
                   
                   <div className="pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => setConfirmDialog({
                            open: true,
                            title: 'Supprimer ce patient ?',
                            description: 'Cette action est irréversible. Impossible si des analyses sont liées.',
                            action: () => {
                                handleDelete(editingPatient.id);
                                setEditingPatient(null);
                            }
                        })}
                        className="text-rose-500 font-medium flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
                      >
                         <Trash2 size={16} /> Supprimer
                      </button>

                      <button 
                        type="submit"
                        className="btn-primary-md px-6"
                      >
                         <Save size={16} /> Enregistrer
                      </button>
                   </div>
                </form>
             </div>
         </div>,
         document.body
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
