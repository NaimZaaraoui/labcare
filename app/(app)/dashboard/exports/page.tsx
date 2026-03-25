'use client';

import { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Calendar, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  CheckCircle2,
  ArrowLeft,
  Package,
  BarChart3,
  ListOrdered,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  exportToExcel, 
  formatPatientsForExcel, 
  formatAnalysesForExcel, 
  formatResultsForExcel,
  formatTestsForExcel,
  formatDailySummaryForExcel,
  formatMonthlySummaryForExcel,
  formatCategorySummaryForExcel,
  formatPatientAnalysesForExcel
} from '@/lib/excel-utils';

type ExportType = 'analyses' | 'results' | 'daily' | 'monthly' | 'by_category' | 'by_patient' | 'patients' | 'catalog';

interface Category {
  id: string;
  name: string;
  _count?: { tests: number };
}

const EXPORT_CONFIG = [
  {
    id: 'analyses',
    label: 'Liste des Analyses',
    description: 'Export complet des dossiers avec patients et statuts',
    icon: Activity,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600'
  },
  {
    id: 'results',
    label: 'Résultats Détaillés',
    description: 'Valeurs de chaque test avec références et unités',
    icon: FileSpreadsheet,
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600'
  },
  {
    id: 'daily',
    label: 'Synthèse Journalière',
    description: 'Statistiques agrégées par jour',
    icon: ListOrdered,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600'
  },
  {
    id: 'monthly',
    label: 'Synthèse Mensuelle',
    description: 'Statistiques agrégées par mois',
    icon: Calendar,
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600'
  },
  {
    id: 'by_category',
    label: 'Répartition par Catégorie',
    description: 'Nombre de résultats normaux/anormaux par catégorie',
    icon: BarChart3,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  {
    id: 'by_patient',
    label: 'Historique par Patient',
    description: 'Liste des patients avec nombre d\'analyses et dépenses',
    icon: Users,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600'
  },
  {
    id: 'patients',
    label: 'Fichier Patients',
    description: 'Coordonnées complètes des patients inscrits',
    icon: Users,
    color: 'from-rose-500 to-rose-600',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600'
  },
  {
    id: 'catalog',
    label: 'Catalogue des Tests',
    description: 'Liste des tests avec tarifs et valeurs de référence',
    icon: Package,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  }
] as const;

export default function ExportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('analyses');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleExport = async () => {
    setLoading(true);
    try {
      let url = '';
      let fileName = '';
      let formatter: ((data: unknown[]) => Record<string, unknown>[]) | null = null;
      let sheetName = '';

      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : '';

      switch (exportType) {
        case 'patients':
          url = `/api/patients?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Patients';
          formatter = formatPatientsForExcel;
          sheetName = 'Liste_Patients';
          break;
        case 'analyses':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}${statusParam}`;
          fileName = 'Analyses';
          formatter = formatAnalysesForExcel;
          sheetName = 'Liste_Analyses';
          break;
        case 'results':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}&includeResults=true`;
          fileName = 'Resultats_Detailles';
          formatter = formatResultsForExcel;
          sheetName = 'Resultats';
          break;
        case 'catalog':
          url = `/api/tests?includeGrouped=false${categoryParam}`;
          fileName = selectedCategory 
            ? `Catalogue_${categories.find(c => c.id === selectedCategory)?.name || 'Filtre'}`
            : 'Catalogue_Tests';
          formatter = formatTestsForExcel;
          sheetName = 'Catalogue';
          break;
        case 'daily':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Synthese_Journaliere';
          formatter = formatDailySummaryForExcel;
          sheetName = 'Par_Jour';
          break;
        case 'monthly':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Synthese_Mensuelle';
          formatter = formatMonthlySummaryForExcel;
          sheetName = 'Par_Mois';
          break;
        case 'by_category':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}&includeResults=true`;
          fileName = 'Par_Categorie';
          formatter = formatCategorySummaryForExcel;
          sheetName = 'Categories';
          break;
        case 'by_patient':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Par_Patient';
          formatter = formatPatientAnalysesForExcel;
          sheetName = 'Patients';
          break;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data && Array.isArray(data)) {
        const formattedData = formatter(data);
        exportToExcel(formattedData, fileName, sheetName);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (type: 'today' | 'month' | 'year') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const selectedConfig = EXPORT_CONFIG.find(e => e.id === exportType);
  const needsDateRange = !['catalog'].includes(exportType);
  const needsStatusFilter = exportType === 'analyses';
  const needsCategoryFilter = exportType === 'catalog';

  const getColumnsPreview = () => {
    switch (exportType) {
      case 'analyses': return ['N° Commande', 'Patient', 'Statut', 'Prix', 'Date', 'Validé par'];
      case 'patients': return ['Nom', 'Prénom', 'Sexe', 'Âge', 'Téléphone', 'Date Inscription'];
      case 'results': return ['Date', 'N° Dossier', 'Patient', 'Test', 'Résultat', 'Unité', 'Référence'];
      case 'catalog': return ['Code', 'Nom', 'Catégorie', 'Type', 'Unité', 'Référence', 'Prix'];
      case 'daily': return ['Date', 'Nb Analyses', 'Total (DA)', 'Validées', 'En Cours', 'Taux'];
      case 'monthly': return ['Mois', 'Nb Analyses', 'Total (DA)', 'Validées', 'En Cours', 'Taux'];
      case 'by_category': return ['Catégorie', 'Nb Résultats', 'Normaux', 'Anormaux', 'Taux'];
      case 'by_patient': return ['Patient', 'Sexe', 'Âge', 'Nb Analyses', 'Total (DA)', 'Dernière Visite'];
      default: return [];
    }
  };

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 shrink-0">
               <DownloadCloud size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exports de Données</h1>
              <p className="text-slate-500 font-medium mt-1">Générez des rapports Excel personnalisés pour votre gestion.</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Format XLSX</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bento-panel p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPORT_CONFIG.map((config) => (
                <button
                  key={config.id}
                  onClick={() => setExportType(config.id as ExportType)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                    exportType === config.id 
                      ? `border-transparent bg-gradient-to-br ${config.color} text-white shadow-lg` 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    exportType === config.id 
                      ? 'bg-white/20 text-white' 
                      : `${config.bgColor} ${config.textColor}`
                  }`}>
                    <config.icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold text-sm mb-1 ${exportType === config.id ? 'text-white' : 'text-slate-700'}`}>
                      {config.label}
                    </div>
                    <div className={`text-[11px] leading-relaxed ${exportType === config.id ? 'text-white/80' : 'text-slate-400'}`}>
                      {config.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bento-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl ${selectedConfig?.bgColor || 'bg-slate-50'} ${selectedConfig?.textColor || 'text-slate-500'} flex items-center justify-center`}>
                {selectedConfig && <selectedConfig.icon size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedConfig?.label}</h3>
                <p className="text-xs text-slate-400">{selectedConfig?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {needsDateRange && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Période
                  </label>
                  
                  <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setQuickRange('today')} 
                      className="flex-1 py-2 text-[11px] font-bold rounded-lg hover:bg-white transition-all text-slate-600"
                    >
                      Aujourd&apos;hui
                    </button>
                    <button 
                      onClick={() => setQuickRange('month')} 
                      className="flex-1 py-2 text-[11px] font-bold rounded-lg hover:bg-white transition-all text-slate-600"
                    >
                      Mois
                    </button>
                    <button 
                      onClick={() => setQuickRange('year')} 
                      className="flex-1 py-2 text-[11px] font-bold rounded-lg hover:bg-white transition-all text-slate-600"
                    >
                      Année
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Du</span>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="input-premium h-11 !text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Au</span>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="input-premium h-11 !text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {needsCategoryFilter && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14} /> Catégorie de tests
                  </label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-premium h-11 !text-sm"
                    disabled={loadingCategories}
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat._count?.tests ? `(${cat._count.tests})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 italic">
                    Sélectionnez une catégorie pour exporter uniquement les tests de celle-ci.
                  </p>
                </div>
              )}

              {needsStatusFilter && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Statut des analyses
                  </label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-premium h-11 !text-sm"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="validated_tech">Validé Tech</option>
                    <option value="completed">Terminé</option>
                    <option value="validated_bio">Validé Bio</option>
                  </select>
                </div>
              )}

              {!needsDateRange && !needsCategoryFilter && !needsStatusFilter && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Aucune configuration requise</p>
                      <p className="text-xs text-slate-400">Ce type d&apos;export utilise toutes les données disponibles.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className={`w-full mt-6 h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'btn-primary shadow-xl shadow-indigo-200 hover:shadow-indigo-300'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <DownloadCloud size={20} />
                  Télécharger le fichier Excel
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bento-panel p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
            
            <div className="relative">
              <h3 className="text-lg font-black mb-2">Export rapide</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                Sélectionnez un type d&apos;export, configurez les filtres si nécessaire, et téléchargez vos données en un clic.
              </p>
              
              <div className="space-y-2">
                {[
                  'Format XLSX compatible Excel',
                  'Dates au format DD/MM/YYYY',
                  'Colonnes pré-formatées',
                  'Filtres avancés disponibles'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-indigo-100 text-xs font-medium">
                    <CheckCircle2 size={14} className="text-emerald-300 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bento-panel p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              Colonnes incluses
            </h4>
            <div className="flex flex-wrap gap-2">
              {getColumnsPreview().map((col, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="bento-panel p-6 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Conseils
            </h4>
            <ul className="space-y-3">
              {[
                'Utilisez "Mois" pour les statistiques mensuelles',
                'Filtrez par catégorie pour le catalogue',
                'Le statut "Validé Bio" = résultats certifiés'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-indigo-500 shrink-0">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
