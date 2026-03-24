
'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { 
  User, 
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
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

import { TrendChart } from '@/components/patients/TrendChart';
import { useSession } from 'next-auth/react';


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
  const role = (session?.user as any)?.role || 'TECHNICIEN';
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history');


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
    fetchPatientData();
  }, [fetchPatientData]);

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
      <div className="p-8 space-y-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-40 bg-slate-100 rounded-3xl" />
        <div className="h-96 bg-slate-100 rounded-3xl" />
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
    <div className="p-8 space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
       {/* Breadcrumbs / Back */}
       <div className="flex items-center justify-between">
         <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-slate-400 font-bold hover:text-slate-900 transition-all"
         >
           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 shadow-sm transition-all">
             <ArrowLeft size={20} />
           </div>
           <span className="text-sm uppercase tracking-widest">Retour au répertoire</span>
         </button>

         <div className="flex gap-2">
            <button 
               onClick={() => router.push(`/dashboard/patients/${id}/edit`)}
               className="btn-secondary h-11 px-6 shadow-sm"
            >
              <Edit size={16} /> Modifier la fiche
            </button>
             {role !== 'MEDECIN' && (
               <button 
                  onClick={() => router.push(`/analyses/nouvelle?patientId=${id}`)}
                  className="btn-primary h-11 px-6 shadow-indigo-500/20 shadow-lg"
               >
                 <Plus size={18} /> Nouvelle Analyse
               </button>
             )}

         </div>
       </div>

       {/* Patient Profile Bento */}
       <div className="bento-panel p-8 bg-white border-indigo-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start">
             <div className="flex gap-8 items-center flex-1">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl shadow-inner ${
                    patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                }`}>
                   {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">{patient.lastName} {patient.firstName}</h1>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${patient.gender === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                       {patient.gender === 'M' ? 'Homme' : 'Femme'}
                     </span>
                   </div>
                   <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400">
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
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Phone size={12} /> Téléphone
                   </div>
                   <div className="text-sm font-black text-slate-700">{patient.phoneNumber || '—'}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Mail size={12} /> Email
                   </div>
                   <div className="text-sm font-black text-slate-700 truncate">{patient.email || '—'}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group hover:bg-white hover:border-indigo-100 transition-all">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <MapPin size={12} /> Adresse
                   </div>
                   <div className="text-sm font-black text-slate-700 truncate">{patient.address || '—'}</div>
                </div>
             </div>
          </div>
       </div>

        {/* Tabs & Content */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Info size={14} /> Historique
              </button>
              <button 
                onClick={() => setActiveTab('trends')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'trends' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                    className="bento-panel !p-6 hover:shadow-2xl hover:border-indigo-200 transition-all group flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center gap-8">
                       <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-400 uppercase leading-none mb-1">{new Date(analysis.creationDate).toLocaleString('fr-FR', { month: 'short' })}</span>
                          <span className="text-xl font-black text-slate-900 group-hover:text-indigo-600 leading-none">{new Date(analysis.creationDate).getDate()}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-4 mb-1">
                             <h3 className="text-xl font-black text-slate-900 tracking-tight">{analysis.orderNumber}</h3>
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                               analysis.status === 'completed' || analysis.status === 'validated_bio'
                                 ? 'bg-emerald-50 text-emerald-600' 
                                 : 'bg-amber-100/50 text-amber-600'
                             }`}>
                               {analysis.status === 'completed' || analysis.status === 'validated_bio' ? 'Dossier Validé' : 'En cours'}
                             </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
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
                  <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                     <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Activity size={32} />
                     </div>
                     <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucune analyse enregistrée</p>
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
                  <div className="col-span-full text-center py-32 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <TrendingUpIcon size={32} />
                     </div>
                    <p className="text-slate-500 font-bold max-w-sm mx-auto">
                      Pas assez de données pour afficher les tendances.<br />
                      <span className="text-xs font-medium text-slate-400 mt-2 block italic text-center">Les graphiques apparaissent automatiquement lorsqu&apos;un même paramètre est analysé au moins deux fois.</span>
                    </p>
                  </div>
                )}
             </div>
           )}
        </div>
    </div>
  );
}
