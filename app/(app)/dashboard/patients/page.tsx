
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail,
  Calendar, 
  ChevronRight,
  Edit2
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
import { X, Save, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function PatientsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'TECHNICIEN';

  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  
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

  const fetchPatients = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const skip = isLoadMore ? patients.length : 0;
      const limit = 50;
      const url = searchTerm 
        ? `/api/patients?query=${searchTerm}&skip=${skip}&limit=${limit}`
        : `/api/patients?skip=${skip}&limit=${limit}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (isLoadMore) {
          setPatients(prev => [...prev, ...data]);
        } else {
          setPatients(data);
        }
        setHasMore(data.length === limit);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, patients.length]);

  useEffect(() => {
    setMounted(true);
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
       fetchPatients();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchPatients]);

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
        fetchPatients();
      } else {
        showNotification('error', 'Erreur lors de la mise à jour');
      }
    } catch(err) {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        showNotification('success', 'Patient supprimé');
        fetchPatients();
      } else {
         showNotification('error', data.error || 'Erreur suppression');
      }
    } catch (err) {
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

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patients</h1>
          <p className="text-slate-500 font-medium mt-1">Répertoire central et dossiers médicaux dématérialisés.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-slate-900">{patients.length}{hasMore ? '+' : ''}</span>
          </div>
          {role !== 'MEDECIN' && (
            <button 
              onClick={() => router.push('/analyses/nouvelle')}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} /> Nouveau Patient
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, prénom, téléphone..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-14 pr-6 h-14 text-base font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all shadow-sm"
        />
      </div>


      {loading && !loadingMore ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map(patient => (
            <div key={patient.id} className="bento-panel !p-6 hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col h-full bg-white">
               <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner ${
                       patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                     }`}>
                        {patient.firstName[0]}{patient.lastName[0]}
                     </div>
                     <div className="min-w-0">
                        <h3 className="font-black text-slate-900 leading-tight text-lg truncate uppercase group-hover:text-blue-600 transition-colors">{patient.lastName} {patient.firstName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${patient.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                            {patient.gender === 'M' ? 'Homme' : 'Femme'}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                            {calculateAge(patient.birthDate)} ans
                          </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-1 ">
                      {role !== 'MEDECIN' && (
                        <button 
                          onClick={() => router.push(`/analyses/nouvelle?patientId=${patient.id}`)}
                          className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"
                          title="Nouvelle Analyse"
                        >
                           <Plus size={18} />
                        </button>
                      )}

                      <button 
                          onClick={() => setEditingPatient(patient)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"
                      >
                         <Edit2 size={16} />
                      </button>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Phone size={10} /> Téléphone
                      </div>
                      <div className="text-xs font-black text-slate-700 truncate">{patient.phoneNumber || '—'}</div>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Calendar size={10} /> Naissance
                      </div>
                      <div className="text-xs font-black text-slate-700">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                  </div>
                  
                  {patient.email && (
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Mail size={10} /> Email
                      </div>
                      <div className="text-xs font-bold text-slate-600 truncate">{patient.email}</div>
                    </div>
                  )}
               </div>

               <div className="mt-6">
                  <Link 
                    href={`/dashboard/patients/${patient.id}`}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-blue-600 rounded-2xl text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all group/link"
                  >
                    Voir le dossier complet
                    <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </div>
          ))}
          
          {patients.length === 0 && !loading && (
             <div className="col-span-full bento-panel py-32 text-center bg-slate-50/50 border-dashed">
                <div className="w-20 h-20 rounded-full bg-slate-200/50 flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Users size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Aucun patient trouvé</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">Ajustez votre recherche ou créez une fiche pour un nouveau patient.</p>
             </div>
          )}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-8">
           <button 
             onClick={() => fetchPatients(true)}
             disabled={loadingMore}
             className="px-8 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {loadingMore ? 'Chargement...' : 'Charger plus de patients'}
           </button>
        </div>
      )}

      {/* Edit Modal */}
      {mounted && editingPatient && createPortal(
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
             <div 
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
             >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Modifier le Patient</h3>
                  <button onClick={() => setEditingPatient(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prénom</label>
                         <input 
                            value={editingPatient.firstName}
                            onChange={(e) => setEditingPatient({...editingPatient, firstName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                            required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nom</label>
                         <input 
                            value={editingPatient.lastName}
                            onChange={(e) => setEditingPatient({...editingPatient, lastName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                            required
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date de Naissance</label>
                      <input 
                         type="date"
                         value={editingPatient.birthDate ? new Date(editingPatient.birthDate).toISOString().split('T')[0] : ''}
                         onChange={(e) => setEditingPatient({...editingPatient, birthDate: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                         required
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sexe</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setEditingPatient({...editingPatient, gender: 'M'})}
                          className={`flex-1 py-3 rounded-xl font-black border-2 transition-all ${editingPatient.gender === 'M' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                        >Homme</button>
                        <button
                          type="button"
                          onClick={() => setEditingPatient({...editingPatient, gender: 'F'})}
                          className={`flex-1 py-3 rounded-xl font-black border-2 transition-all ${editingPatient.gender === 'F' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-100 text-slate-400'}`}
                        >Femme</button>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
                      <input 
                         value={editingPatient.phoneNumber || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, phoneNumber: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                         value={editingPatient.email || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Adresse</label>
                      <input 
                         value={editingPatient.address || ''}
                         onChange={(e) => setEditingPatient({...editingPatient, address: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold input-premium"
                      />
                   </div>
                   
                   <div className=" pt-4 border-t border-slate-100 flex justify-between items-center">
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
                        className="text-rose-500 font-bold flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
                      >
                         <Trash2 size={16} /> Supprimer
                      </button>

                      <button 
                        type="submit"
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                      >
                         <Save size={18} /> Enregistrer
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
