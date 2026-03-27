
'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  Info,
  Edit,
  Calendar,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

import { TrendChart } from '@/components/patients/TrendChart';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createPortal } from 'react-dom';


interface AnalysisResult {
  id: string;
  test: {
    name: string;
    unit?: string;
  };
  value: string;
}

interface Analysis {
  id: string;
  orderNumber: string;
  creationDate: string;
  status: string;
  results: AnalysisResult[];
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  analyses: Analysis[];
}

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history');
  const [mounted, setMounted] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });


  const fetchPatientData = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}/history`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setMounted(true);
    fetchPatientData();
  }, [fetchPatientData]);

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
        body: JSON.stringify(editingPatient),
      });

      if (res.ok) {
        showNotification('success', 'Patient mis à jour');
        setEditingPatient(null);
        fetchPatientData();
      } else {
        showNotification('error', 'Erreur lors de la mise à jour');
      }
    } catch {
      showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'Patient supprimé');
        router.push('/dashboard/patients');
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

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="skeleton-card h-40" />
        <div className="skeleton-card h-96" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-400">
         <p>Patient introuvable</p>
      </div>
    );
  }

  // Process data for trends
  const trendData: Record<string, { unit?: string; points: { date: string; value: number; label: string }[] }> = {};
  
  patient.analyses.forEach(analysis => {
    analysis.results.forEach(res => {
      // Safety check to prevent crash if value or test is missing
      if (!res.value || !res.test) return;

      const numValue = parseFloat(res.value.toString().replace(',', '.'));
      if (!isNaN(numValue)) {
        if (!trendData[res.test.name]) {
          trendData[res.test.name] = { unit: res.test.unit, points: [] };
        }
        trendData[res.test.name].points.push({
          date: analysis.creationDate,
          value: numValue,
          label: analysis.orderNumber
        });
      }
    });
  });

  // Filter tests that have at least 2 points for a meaningful trend
  const parameterTrends = Object.entries(trendData)
    .filter(([, data]) => data.points.length >= 2)
    .sort((a, b) => b[1].points.length - a[1].points.length);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
       {/* Breadcrumbs / Back */}
       <div className="flex items-center justify-between">
         <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 font-medium text-[var(--color-text-soft)] transition-all hover:text-[var(--color-text)]"
         >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white shadow-sm transition-all group-hover:bg-[var(--color-surface-muted)]">
              <ArrowLeft size={20} />
            </div>
           <span className="text-sm uppercase tracking-wide">Retour au répertoire</span>
         </button>

         <div className="flex gap-2">
            <button 
               onClick={() => setEditingPatient(patient)}
               className="btn-secondary-md px-6"
            >
              <Edit size={16} /> Modifier la fiche
            </button>
             {role !== 'MEDECIN' && (
               <button 
                  onClick={() => router.push(`/analyses/nouvelle?patientId=${id}`)}
                  className="btn-primary-md px-6 shadow-indigo-500/20 shadow-lg"
               >
                 <Plus size={18} /> Nouvelle Analyse
               </button>
             )}

         </div>
       </div>

       {/* Patient Profile Bento */}
       <div className="bento-panel relative overflow-hidden p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start">
             <div className="flex gap-8 items-center flex-1">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-semibold shadow-inner ${
                    patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                }`}>
                   {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{patient.lastName} {patient.firstName}</h1>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${patient.gender === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                       {patient.gender === 'M' ? 'Homme' : 'Femme'}
                     </span>
                   </div>
                   <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-300" />
                        <span>{calculateAge(patient.birthDate)} ans <span className="text-slate-200 ml-1">({patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : 'N/A'})</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-slate-300" />
                        <span>Dernière analyse il y a {patient.analyses.length > 0 ? 'qq jours' : 'jamais'}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 w-full lg:w-72">
                <div className="bg-[var(--color-surface-muted)] p-4 rounded-2xl border border-[var(--color-border)] group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <Phone size={12} /> Téléphone
                   </div>
                   <div className="text-sm font-semibold text-slate-700">{patient.phoneNumber || '—'}</div>
                </div>
                <div className="bg-[var(--color-surface-muted)] p-4 rounded-2xl border border-[var(--color-border)] group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <Mail size={12} /> Email
                   </div>
                   <div className="text-sm font-semibold text-slate-700 truncate">{patient.email || '—'}</div>
                </div>
                <div className="bg-[var(--color-surface-muted)] p-4 rounded-2xl border border-[var(--color-border)] group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <MapPin size={12} /> Adresse
                   </div>
                   <div className="text-sm font-semibold text-slate-700 truncate">{patient.address || '—'}</div>
                </div>
             </div>
          </div>
       </div>

        {/* Tabs & Content */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Info size={14} /> Historique
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] transition-all ${activeTab === 'trends' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <TrendingUpIcon size={14} /> Tendances
              </button>
           </div>

           {activeTab === 'history' ? (
             <div className="space-y-4">
                {patient.analyses.map(analysis => (
                  <Link 
                    href={`/analyses/${analysis.id}`}
                    key={analysis.id} 
                    className="group flex items-center justify-between rounded-3xl border bg-white p-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)] transition-all hover:border-indigo-200 hover:bg-[var(--color-surface-muted)]"
                  >
                    <div className="flex items-center gap-8">
                       <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-400 uppercase leading-none mb-1">{new Date(analysis.creationDate).toLocaleString('fr-FR', { month: 'short' })}</span>
                          <span className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 leading-none">{new Date(analysis.creationDate).getDate()}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-4 mb-1">
                          <h3 className="text-xl font-semibold tracking-tight text-slate-900">{analysis.orderNumber}</h3>
                             <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg ${
                               analysis.status === 'completed' || analysis.status === 'validated_bio'
                                 ? 'bg-emerald-50 text-emerald-600' 
                                 : 'bg-amber-100/50 text-amber-600'
                             }`}>
                               {analysis.status === 'completed' || analysis.status === 'validated_bio' ? 'Dossier Validé' : 'En cours'}
                             </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                             <span className="flex items-center gap-1.5"><Activity size={12} /> {analysis.results.length} Paramètres</span>
                             <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                             <span>Créé à {format(new Date(analysis.creationDate), 'HH:mm')}</span>
                          </div>
                       </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-500/30">
                       <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
                
                {patient.analyses.length === 0 && (
                  <div className="empty-state py-20">
                     <div className="empty-state-icon w-16 h-16 rounded-full bg-slate-100">
                        <Activity size={32} />
                     </div>
                     <p className="empty-state-title">Aucune analyse enregistrée</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parameterTrends.length > 0 ? (
                  parameterTrends.map(([name, data]) => (
                    <TrendChart 
                      key={name}
                      testName={name}
                      unit={data.unit}
                      data={data.points}
                    />
                  ))
                ) : (
                  <div className="col-span-full empty-state py-24">
                    <div className="empty-state-icon w-16 h-16 rounded-full bg-slate-100">
                        <TrendingUpIcon size={32} />
                     </div>
                     <p className="text-slate-500 font-semibold max-w-sm mx-auto">
                      Pas assez de données pour afficher les tendances.<br />
                      <span className="text-xs font-medium text-slate-400 mt-2 block italic text-center">Les graphiques apparaissent automatiquement lorsqu&apos;un même paramètre est analysé au moins deux fois.</span>
                    </p>
                  </div>
                )}
             </div>
           )}
        </div>
      {mounted && editingPatient && createPortal(
        <div className="modal-overlay">
          <div
            className="modal-shell flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
              <h3 className="text-xl font-semibold text-[var(--color-text)]">Modifier le patient</h3>
              <button onClick={() => setEditingPatient(null)} className="rounded-xl p-2 text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Prénom</label>
                  <input
                    value={editingPatient.firstName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                    className="input-premium h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom</label>
                  <input
                    value={editingPatient.lastName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
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
                  onChange={(e) => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                  className="input-premium h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Sexe</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingPatient({ ...editingPatient, gender: 'M' })}
                    className={`flex-1 rounded-xl border py-3 font-medium transition-all ${editingPatient.gender === 'M' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
                  >
                    Homme
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPatient({ ...editingPatient, gender: 'F' })}
                    className={`flex-1 rounded-xl border py-3 font-medium transition-all ${editingPatient.gender === 'F' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
                  >
                    Femme
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Téléphone</label>
                <input
                  value={editingPatient.phoneNumber || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, phoneNumber: e.target.value })}
                  className="input-premium h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Email</label>
                <input
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  className="input-premium h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Adresse</label>
                <input
                  value={editingPatient.address || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="input-premium h-11"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: 'Supprimer ce patient ?',
                      description: 'Cette action est irréversible. Impossible si des analyses sont liées.',
                      action: () => {
                        handleDelete(editingPatient.id);
                        setEditingPatient(null);
                      },
                    })
                  }
                  className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <Trash2 size={16} /> Supprimer
                </button>

                <button type="submit" className="btn-primary-md px-6">
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
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
