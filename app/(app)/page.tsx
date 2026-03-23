'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, Activity, Clock, RefreshCw, BarChart3,
  FlaskConical, ArrowRight, Layers, Plus, ChevronRight, Hash, Users, ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { differenceInMinutes } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Analysis as SharedAnalysis } from '@/lib/types';

type Analysis = SharedAnalysis & { isUrgent?: boolean };
interface Stats { total: number; totalToday?: number; pending: number; inProgress: number; completed: number; urgent: number; }

const tatC = (d: string | Date) => {
  const m = differenceInMinutes(new Date(), new Date(d));
  return m >= 60 ? 'text-red-500 font-bold' : m >= 45 ? 'text-amber-500 font-bold' : 'text-slate-400 font-medium';
};

const fmtD = (d: string | Date) => {
  const m = differenceInMinutes(new Date(), new Date(d));
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}min`;
};

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-600' },
  in_progress: { label: 'En cours', classes: 'bg-blue-50 text-blue-600' },
  validated_tech: { label: 'Valid. Tech.', classes: 'bg-indigo-50 text-indigo-600' },
  validated_bio: { label: 'Validé ✓', classes: 'bg-emerald-50 text-emerald-600' },
  completed: { label: 'Validé ✓', classes: 'bg-emerald-50 text-emerald-600' },
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [state, setState] = useState<{ analyses: Analysis[], stats: Stats }>({ 
    analyses: [], 
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0 } 
  });
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        fetch('/api/analyses', { cache: 'no-store' }), 
        fetch('/api/stats', { cache: 'no-store' })
      ]);
      setState({ analyses: await a.json(), stats: await s.json() });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { sync(); }, [sync]);

  const active = state.analyses
    .filter(a => a.status !== 'completed' && a.status !== 'validated_bio')
    .slice(0, 8);

  const role = (session?.user as any)?.role || 'TECHNICIEN';

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bonjour, {session?.user?.name || 'Utilisateur'}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Voici l'état de la paillasse aujourd'hui.</p>
        </div>
        <button onClick={sync} className="btn-secondary group">
          <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-slate-400 group-hover:text-blue-500'} /> 
          <span>Actualiser</span>
        </button>
      </div>

      {/* Bento KPI Row - Hybrid Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KpiCard title="Total du jour" count={state.stats.totalToday ?? state.stats.total} icon={Hash} iconColor="bg-blue-100 text-blue-600" />
        <KpiCard title="En attente" count={state.stats.pending} icon={Clock} iconColor="bg-orange-100 text-orange-600" active />
        <KpiCard title="Anormales (À vérifier)" count={state.stats.urgent} icon={AlertCircle} iconColor="bg-rose-100 text-rose-600" />
        <KpiCard title="Validées" count={state.stats.completed} icon={CheckCircle2} iconColor="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Action Cards Row directly under KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {role !== 'MEDECIN' && (
          <ActionCard label="Nouvelle Analyse" icon={Plus} href="/analyses/nouvelle" primary />
        )}
        <ActionCard label="Ajouter Patient" icon={Users} href="/dashboard/patients" />
        <ActionCard label="Feuille de paillasse" icon={Layers} href="/analyses" />
      </div>


      {/* Main Content Areas */}
      <div className="grid grid-cols-1 gap-8 mt-2">
        
        {/* Dossiers Table inside a Bento Panel */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-blue-500" size={20} /> Dossiers Récents
            </h2>
            <Link href="/analyses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 group">
              Voir tout <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="bento-panel flex flex-col overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-1 text-center">ID</div>
              <div className="col-span-6 pl-4">Patient</div>
              <div className="col-span-2 text-center">N° Commande</div>
              <div className="col-span-3 text-right pr-2">Statut</div>
            </div>

            <div className="divide-y divide-slate-50 flex-1">
              {loading ? <LoadingRegistry /> : active.length > 0 ? active.map((a, idx) => (
                <Link key={a.id} href={`/analyses/${a.id}`} className="grid grid-cols-12 px-6 py-3.5 hover:bg-slate-50/50 transition-colors items-center group">
                  <div className="col-span-1 text-center text-xs font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                    #{idx + 1}
                  </div>
                  <div className="col-span-6 flex items-center gap-3 pl-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.isUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      {a.patientFirstName?.[0]}{a.patientLastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{a.patientFirstName} {a.patientLastName}</div>
                      <div className="text-[11px] text-slate-400 font-medium">TAT : <span className={tatC(a.creationDate)}>{fmtD(a.creationDate)}</span></div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-mono text-xs font-medium text-slate-500 bg-slate-50 py-1 px-2 rounded-lg w-fit mx-auto">
                    {a.orderNumber}
                  </div>
                  <div className="col-span-3 flex justify-end">
                    {(() => {
                      const s = STATUS_MAP[a.status || ''] ?? { label: a.status || '—', classes: 'bg-slate-50 text-slate-500' };
                      return <span className={`status-pill ${s.classes}`}>{s.label}</span>;
                    })()}
                  </div>
                </Link>
              )) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="text-slate-300 w-8 h-8" />
                  </div>
                  <h3 className="text-slate-700 font-bold mb-1">Aucune analyse</h3>
                  <p className="text-sm text-slate-400">Toutes les analyses ont été validées.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small abstracted UI components inside the page for isolation
const KpiCard = ({ title, count, icon: Icon, iconColor, active }: any) => (
  <div className={`bento-panel p-6 transition-all duration-300 flex items-center justify-between ${active ? 'shadow-lg shadow-blue-500/10 ring-2 ring-blue-500 ring-offset-2' : 'hover:-translate-y-1 hover:shadow-lg'}`}>
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-4xl font-black text-slate-800 tracking-tight">{count}</div>
    </div>
    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
      <Icon size={28} strokeWidth={2.5} />
    </div>
  </div>
);

const InsightRow = ({ label, value, trend, good }: any) => (
  <div className="flex items-center justify-between">
    <div className="text-sm font-semibold text-slate-500">{label}</div>
    <div className="flex items-center gap-3">
      <span className="font-bold text-slate-800">{value}</span>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'stable' ? 'bg-slate-100 text-slate-500' : good ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

const ActionCard = ({ label, icon: Icon, href, primary }: any) => (
  <Link href={href} className={`rounded-3xl p-5 flex items-center justify-between group transition-all duration-300 hover:-translate-y-1 ${primary ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg'}`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${primary ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50 transition-colors'}`}>
        <Icon size={20} className={primary ? 'text-white' : 'text-slate-500 group-hover:text-blue-500 transition-colors'} />
      </div>
      <span className={`font-bold ${primary ? 'text-white' : 'text-slate-700'}`}>{label}</span>
    </div>
    <ArrowRight size={18} className={`${primary ? 'text-white/70 group-hover:text-white' : 'text-slate-300 group-hover:text-blue-500'} group-hover:translate-x-1 transition-all`} />
  </Link>
);

const LoadingRegistry = () => (
  Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="px-6 py-4 animate-pulse grid grid-cols-12 gap-6 border-b border-slate-50 last:border-0">
      <div className="col-span-1 h-4 bg-slate-100 rounded-full mx-auto w-6" />
      <div className="col-span-6 flex gap-3 items-center">
        <div className="w-9 h-9 bg-slate-100 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      <div className="col-span-2 h-6 bg-slate-100 rounded" />
      <div className="col-span-3 h-6 bg-slate-100 rounded-full w-20 ml-auto" />
    </div>
  ))
);
