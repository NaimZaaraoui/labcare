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
  Filter,
  AlertCircle,
  CircleCheckBig,
  Clock3
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
    icon: Activity
  },
  {
    id: 'results',
    label: 'Résultats Détaillés',
    description: 'Valeurs de chaque test avec références et unités',
    icon: FileSpreadsheet
  },
  {
    id: 'daily',
    label: 'Synthèse Journalière',
    description: 'Statistiques agrégées par jour',
    icon: ListOrdered
  },
  {
    id: 'monthly',
    label: 'Synthèse Mensuelle',
    description: 'Statistiques agrégées par mois',
    icon: Calendar
  },
  {
    id: 'by_category',
    label: 'Répartition par Catégorie',
    description: 'Nombre de résultats normaux/anormaux par catégorie',
    icon: BarChart3
  },
  {
    id: 'by_patient',
    label: 'Historique par Patient',
    description: 'Liste des patients avec nombre d\'analyses et dépenses',
    icon: Users
  },
  {
    id: 'patients',
    label: 'Fichier Patients',
    description: 'Coordonnées complètes des patients inscrits',
    icon: Users
  },
  {
    id: 'catalog',
    label: 'Catalogue des Tests',
    description: 'Liste des tests avec tarifs et valeurs de référence',
    icon: Package
  }
] as const;

export default function ExportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportType, setExportType] = useState<ExportType>('analyses');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [quickPreset, setQuickPreset] = useState<'today' | 'month' | 'year' | 'custom'>('month');
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
    if (needsDateRange) {
      if (!dateRange.start || !dateRange.end) {
        setErrorMessage('Veuillez renseigner une date de début et une date de fin.');
        setStatusMessage(null);
        return;
      }

      if (dateRange.start > dateRange.end) {
        setErrorMessage('La date de début doit être antérieure ou égale à la date de fin.');
        setStatusMessage(null);
        return;
      }
    }

    setErrorMessage(null);
    setStatusMessage('Préparation de l’export...');
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
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const data = await response.json();

      if (data && Array.isArray(data)) {
        setStatusMessage('Formatage des données...');
        const formattedData = formatter(data);
        if (!formattedData.length) {
          setErrorMessage('Aucune donnée trouvée pour les filtres sélectionnés.');
          setStatusMessage(null);
          return;
        }
        exportToExcel(formattedData, fileName, sheetName);
        setStatusMessage(
          `Export terminé: ${formattedData.length} ligne${formattedData.length > 1 ? 's' : ''} générée${formattedData.length > 1 ? 's' : ''}.`
        );
      } else {
        setErrorMessage('Format de réponse invalide. Merci de réessayer.');
        setStatusMessage(null);
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Échec de l’export. Vérifiez les filtres puis réessayez.');
      setStatusMessage(null);
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
    setQuickPreset(type);
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
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button 
            onClick={() => router.push('/')}
            className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
               <ArrowLeft size={16} />
            </div>
            <span>Tableau de bord</span>
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
               <DownloadCloud size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Exports de données</h1>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">Générer des rapports Excel personnalisés pour votre gestion.</p>
            </div>
          </div>
        </div>

        
      </div>
      </section>

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
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    exportType === config.id 
                      ? 'bg-[var(--color-accent)] text-white shadow-[0_6px_14px_rgba(31,111,235,0.22)]'
                      : 'bg-[var(--color-surface-muted)] text-[var(--color-accent)]'
                  }`}>
                    <config.icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 text-sm font-bold text-[var(--color-text)]">
                      {config.label}
                    </div>
                    <div className="text-[11px] leading-relaxed text-[var(--color-text-soft)]">
                      {config.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bento-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                {selectedConfig && <selectedConfig.icon size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">{selectedConfig?.label}</h3>
                <p className="text-xs text-[var(--color-text-soft)]">{selectedConfig?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {needsDateRange && (
                <div className="space-y-4">
                  <label className="form-label flex items-center gap-2">
                    <Calendar size={14} /> Période
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1.5">
                    <button 
                      type="button"
                      onClick={() => setQuickRange('today')}
                      className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                        quickPreset === 'today'
                          ? 'bg-white text-[var(--color-text)] shadow-sm'
                          : 'text-[var(--color-text-soft)] hover:bg-white/80'
                      }`}
                    >
                      Aujourd&apos;hui
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickRange('month')}
                      className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                        quickPreset === 'month'
                          ? 'bg-white text-[var(--color-text)] shadow-sm'
                          : 'text-[var(--color-text-soft)] hover:bg-white/80'
                      }`}
                    >
                      Mois
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickRange('year')}
                      className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                        quickPreset === 'year'
                          ? 'bg-white text-[var(--color-text)] shadow-sm'
                          : 'text-[var(--color-text-soft)] hover:bg-white/80'
                      }`}
                    >
                      Année
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="section-label ml-1">Du</span>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => {
                          setDateRange(prev => ({ ...prev, start: e.target.value }));
                          setQuickPreset('custom');
                        }}
                        className="input-premium h-11 !text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="section-label ml-1">Au</span>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => {
                          setDateRange(prev => ({ ...prev, end: e.target.value }));
                          setQuickPreset('custom');
                        }}
                        className="input-premium h-11 !text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {needsCategoryFilter && (
                <div className="space-y-4">
                  <label className="form-label flex items-center gap-2">
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
                  <label className="form-label">
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

            {(statusMessage || errorMessage) && (
              <div
                className={`mt-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
                  errorMessage
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {errorMessage ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CircleCheckBig size={16} className="mt-0.5 shrink-0" />}
                <span>{errorMessage || statusMessage}</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={loading}
              className={`btn-primary-md mt-6 h-14 w-full text-sm font-semibold ${
                loading 
                  ? 'cursor-not-allowed border border-[var(--color-border)] bg-slate-100 text-slate-400 shadow-none'
                  : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Export en cours...
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
          <div className="bento-panel relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-blue-700 p-6 text-white">
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

          <div className="bento-panel p-6">
            <h4 className="form-label mb-4 flex items-center gap-2">
              <Clock3 size={14} />
              Statut export
            </h4>
            <div className="space-y-2 text-xs text-[var(--color-text-soft)]">
              <p>
                Type: <span className="font-semibold text-[var(--color-text)]">{selectedConfig?.label}</span>
              </p>
              {needsDateRange && (
                <p>
                  Période: <span className="font-semibold text-[var(--color-text)]">{dateRange.start} → {dateRange.end}</span>
                </p>
              )}
              <p>
                État: <span className="font-semibold text-[var(--color-text)]">{loading ? 'Traitement...' : 'Prêt à exporter'}</span>
              </p>
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
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-[var(--color-accent)]">
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
