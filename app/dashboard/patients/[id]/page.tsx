
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
  Edit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendChart } from '@/components/patients/TrendChart';

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
       {/* Header / Back */}
       <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-4"
       >
         <ArrowLeft size={20} /> Retour
       </button>

       {/* Patient Card */}
       <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex gap-6">
             <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black ${
                 patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
             }`}>
                {patient.firstName[0]}{patient.lastName[0]}
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.lastName} {patient.firstName}</h1>
                <div className="flex flex-wrap gap-4 mt-2">
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <User size={16} />
                      <span>{patient.gender === 'M' ? 'Homme' : 'Femme'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Activity size={16} />
                      <span>{calculateAge(patient.birthDate)} ans ({patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'N/A'})</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-3 w-full md:w-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Phone size={16} className="text-slate-400" />
                {patient.phoneNumber || 'Téléphone non renseigné'}
             </div>
             <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Mail size={16} className="text-slate-400" />
                {patient.email || 'Email non renseigné'}
             </div>
             <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                {patient.address || 'Adresse non renseignée'}
             </div>
          </div>
       </div>

        {/* Tabs / Actions Section */}
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Historique
                </button>
                <button 
                  onClick={() => setActiveTab('trends')}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'trends' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <TrendingUpIcon size={14} /> Tendances
                </button>
              </div>

              <button 
                 onClick={() => router.push(`/dashboard/patients/${id}/edit`)}
                 className="px-6 py-3 bg-white text-slate-700 rounded-xl text-sm font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm hover:shadow-md"
              >
                <Edit size={16} /> Modifier
              </button>

              <button 
                 onClick={() => router.push(`/analyses/nouvelle?patientId=${id}`)}
                 className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Nouvelle Analyse
              </button>
           </div>

           {activeTab === 'history' ? (
             <div className="grid gap-4">
                {patient.analyses.map(analysis => (
                  <Link 
                    href={`/analyses/${analysis.id}`}
                    key={analysis.id} 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-col flex-col items-center justify-center border border-slate-100">
                          <span className="text-xs font-black text-slate-400 uppercase">{new Date(analysis.creationDate).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-xl font-black text-slate-900">{new Date(analysis.creationDate).getDate()}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <h3 className="text-lg font-black text-slate-900">{analysis.orderNumber}</h3>
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                               analysis.status === 'validated' 
                                 ? 'bg-emerald-50 text-emerald-600' 
                                 : 'bg-amber-50 text-amber-600'
                             }`}>
                               {analysis.status === 'validated' ? 'Validé' : 'En cours'}
                             </span>
                          </div>
                          <p className="text-sm font-medium text-slate-400">
                             {analysis.results.length} Paramètres analysés
                          </p>
                       </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <ArrowRight size={20} />
                    </div>
                  </Link>
                ))}
                
                {patient.analyses.length === 0 && (
                  <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                     <p className="text-slate-400 font-medium">Aucune analyse enregistrée pour ce patient</p>
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
                  <div className="col-span-full text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <TrendingUpIcon size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-400 font-medium max-w-sm mx-auto">
                      Pas assez de données pour afficher les tendances. 
                      Les graphiques apparaissent automatiquement lorsqu&apos;un même paramètre est analysé au moins deux fois.
                    </p>
                  </div>
                )}
             </div>
           )}
        </div>
    </div>
  );
}
