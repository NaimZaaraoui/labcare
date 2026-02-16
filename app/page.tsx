'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, FileText, CheckCircle, 
  ArrowRight, Search, Plus,
  TrendingUp, Clock, Play,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    urgent: 0,
    revenue: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analysesRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/analyses')
        ]);
        const statsData = await statsRes.json();
        const analysesData = await analysesRes.json();
        
        setStats({ ...statsData, revenue: 12450 });
        setRecentAnalyses(analysesData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 md:space-y-10 pb-12 animate-fade-in">
      {/* Header & Search Group */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            <span className="text-xs uppercase tracking-widest">Dashboard Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Bonjour, <span className="text-blue-600">Admin</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Voici l&apos;activité de laboratoire pour ce <span className="text-slate-900">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</span>.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/analyses/nouvelle" className="flex-1 md:flex-none">
            <button className="btn-primary-premium w-full md:w-auto">
              <Plus size={20} className="mr-2" />
              Nouvelle Analyse
            </button>
          </Link>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        
        {/* Main Stat: Activity Chart Placeholder - Large Item */}
        <div className="md:col-span-2 lg:col-span-3 bento-card-glass flex flex-row items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-tight">Activité Hebdomadaire</p>
            <h3 className="text-3xl font-black text-slate-900">+24%</h3>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> vs semaine dernière
            </p>
            <div className="mt-8 flex gap-2">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="w-8 bg-blue-100 rounded-lg relative overflow-hidden h-24">
                   <div 
                    className="absolute bottom-0 w-full bg-blue-600 rounded-lg transition-all duration-1000" 
                    style={{ height: `${h}%` }}
                   />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block relative z-10 text-right">
             <div className="w-20 h-20 rounded-3xl bg-white shadow-premium flex items-center justify-center text-blue-600">
                <Activity size={32} />
             </div>
          </div>
        </div>

        {/* Action Quick Bento - Medium Item */}
        <div className="md:col-span-2 lg:col-span-3 bento-card bg-slate-900 text-white flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-2xl">
               <Play size={24} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Quick Actions</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4 leading-tight">Gérez vos analyses <br/> en un clic.</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/analyses" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
                <Search size={18} className="mr-2" />
                <span className="text-xs font-bold">Chercher</span>
              </Link>
              <Link href="/tests" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
                <Settings size={18} className="mr-2" />
                <span className="text-xs font-bold">Config</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Small Bento Items */}
        <div className="md:col-span-1 lg:col-span-2 bento-card flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Clock size={20} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase">En attente</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.pending}</h4>
           </div>
        </div>

        <div className="md:col-span-1 lg:col-span-2 bento-card flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle size={20} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Validées</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.completed}</h4>
           </div>
        </div>

        <div className="md:col-span-2 lg:col-span-2 bento-card flex flex-col justify-between bg-blue-50 border-blue-100">
           <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <FileText size={20} />
           </div>
           <div>
              <p className="text-xs font-bold text-blue-600 uppercase">Total Dossiers</p>
              <h4 className="text-3xl font-black text-slate-900">{stats.total}</h4>
           </div>
        </div>

        {/* Recent Activity: Full Width Bento */}
        <div className="md:col-span-4 lg:col-span-6 bento-card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-xl text-slate-900">Analyses Récentes</h3>
            <Link href="/analyses">
              <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl">
                Voir tout <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAnalyses.map((analysis: any) => (
              <Link 
                key={analysis.id} 
                href={`/analyses/${analysis.id}`}
                className="interactive-row group hover:px-8"
              >
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {(analysis.patientFirstName || analysis.patientLastName) 
                       ? `${analysis.patientFirstName?.[0] || ''}${analysis.patientLastName?.[0] || ''}`.toUpperCase()
                       : '?'}
                  </div>
                  <div>
                    <p className={`font-bold ${!analysis.patientFirstName && !analysis.patientLastName ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                       {(analysis.patientFirstName || analysis.patientLastName)
                          ? `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`
                          : 'Patient Sans Nom'}
                    </p>
                    <p className="text-xs font-mono text-slate-400">#{analysis.orderNumber}</p>
                  </div>
                </div>
                <div className="flex-1 hidden md:block">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{analysis.results.length} Tests</span>
                </div>
                <div className="flex-1 text-right">
                  <span className={`glass-badge ${
                    analysis.status === 'completed' ? 'badge-green' : 'badge-amber'
                  }`}>
                    {analysis.status === 'completed' ? 'Validé' : 'En attente'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
