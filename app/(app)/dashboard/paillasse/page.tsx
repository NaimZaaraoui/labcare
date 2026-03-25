'use client';

import { useState, useEffect } from 'react';
import { 
  Printer, 
  Calendar, 
  ClipboardList,
  ArrowLeft,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  Beaker,
  Clock
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Test {
  id: string;
  name: string;
  code: string;
  unit?: string;
  category?: string;
  categoryId?: string;
  sampleType?: string;
  price?: number;
  minValue?: number | null;
  maxValue?: number | null;
}

interface Result {
  id: string;
  value?: string;
  unit?: string;
  test?: Test;
}

interface Analysis {
  id: string;
  orderNumber: string;
  dailyId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientAge?: number;
  patientGender?: string;
  isUrgent: boolean;
  creationDate: string;
  status: string;
  results: Result[];
}

interface PaillasseData {
  analyses: Analysis[];
  groupedBySampleType: Record<string, Analysis[]>;
  summary: Record<string, { count: number; total: number }>;
  date: string;
  totalAnalyses: number;
  totalResults: number;
}

interface Category {
  id: string;
  name: string;
}

export default function PaillassePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaillasseData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const cats = await res.json();
          setCategories(cats);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchPaillasse = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        status: selectedStatus
      });
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/paillasse?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching paillasse:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaillasse();
  }, [selectedDate, selectedCategory, selectedStatus]);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickDate = (type: 'today' | 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (type === 'today') {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    } else if (type === 'prev') {
      current.setDate(current.getDate() - 1);
      setSelectedDate(format(current, 'yyyy-MM-dd'));
    } else {
      current.setDate(current.getDate() + 1);
      setSelectedDate(format(current, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-full mx-auto pb-24 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all mb-4"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest">Tableau de bord</span>
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-amber-200 shrink-0">
               <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fiche de Paillasse</h1>
              <p className="text-slate-500 font-medium mt-1">Liste de travail pour le technicien de laboratoire.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={loading || !data}
            className="btn-primary h-12 px-6 shadow-lg shadow-amber-200 flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimer la fiche
          </button>
          <button
            onClick={fetchPaillasse}
            disabled={refreshing}
            className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => handleQuickDate('prev')} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition-all">
            ←
          </button>
          <button onClick={() => handleQuickDate('today')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white'}`}>
            Aujourd&apos;hui
          </button>
          <button onClick={() => handleQuickDate('next')} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition-all">
            →
          </button>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-premium h-11 !text-sm"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-premium h-11 !text-sm min-w-[180px]"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="input-premium h-11 !text-sm min-w-[150px]"
        >
          <option value="pending">En attente</option>
          <option value="validated_tech">Validé Tech</option>
          <option value="in_progress">En cours</option>
          <option value="all">Tous</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.analyses.length === 0 ? (
        <div className="bento-panel p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Aucune analyse trouvée</h3>
          <p className="text-sm text-slate-400">Aucune analyse {selectedStatus !== 'all' ? selectedStatus.replace('_', ' ') : ''} pour cette date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold">
              <ClipboardList size={16} />
              {data.totalAnalyses} analyses
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold">
              <Beaker size={16} />
              {data.totalResults} tests
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold">
              <Clock size={16} />
              {format(new Date(selectedDate), 'EEEE dd MMMM yyyy', { locale: fr })}
            </div>
          </div>

          <div className="bento-panel overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">ID Paill.</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Âge/S</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tests demandés</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20">Résultat</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Unité</th>
                  <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.analyses.map((analysis, idx) => (
                  <>
                    {analysis.results.map((result, rIdx) => (
                      <tr 
                        key={result.id} 
                        className={`${analysis.isUrgent ? 'bg-red-50/50' : ''} ${rIdx === 0 ? '' : ''}`}
                      >
                        {rIdx === 0 && (
                          <>
                            <td rowSpan={analysis.results.length} className="p-4 text-sm font-bold text-slate-400 align-top">
                              {idx + 1}
                            </td>
                            <td rowSpan={analysis.results.length} className="p-4 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-mono font-bold text-slate-700">{analysis.dailyId || '-'}</span>
                                {analysis.isUrgent && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-black uppercase">
                                    <AlertTriangle size={10} /> Urgent
                                  </span>
                                )}
                              </div>
                            </td>
                            <td rowSpan={analysis.results.length} className="p-4 align-top">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-300" />
                                <div>
                                  <div className="text-sm font-bold text-slate-700">
                                    {analysis.patientFirstName} {analysis.patientLastName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {analysis.orderNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td rowSpan={analysis.results.length} className="p-4 align-top text-sm text-slate-600 font-medium">
                              {analysis.patientAge || '?'}/{analysis.patientGender === 'M' ? 'H' : 'F'}
                            </td>
                          </>
                        )}
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-slate-700">{result.test?.name || 'Test'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{result.test?.code}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="h-8 w-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs">
                            ───
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {result.test?.unit || result.unit || '-'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {result.test?.minValue != null && result.test?.maxValue != null
                            ? `${result.test.minValue} - ${result.test.maxValue}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bento-panel p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Beaker size={14} /> Récapitulatif par catégorie
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(data.summary).map(([cat, stats]) => (
                <div key={cat} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-slate-500 mb-1">{cat}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-800">{stats.count}</span>
                    <span className="text-[10px] text-slate-400">tests</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {stats.total.toFixed(2)} DA
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .bento-panel { box-shadow: none !important; border: 1px solid #e2e8f0; }
        }
      `}</style>
    </div>
  );
}
