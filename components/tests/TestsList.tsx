'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Beaker, 
  X, 
  Search, 
  Layers,
  Filter,
  RefreshCw,
  Settings2,
  Save,
  Package,
} from 'lucide-react';
import { Test } from '@/lib/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { NotificationToast } from '@/components/ui/notification-toast';
import Link from 'next/link';
import { getCategoryIcon } from '@/lib/category-icons';

export function TestsList() {
  type CategoryOption = {
    id: string;
    name: string;
    rank: number;
    icon?: string | null;
    parentId?: string | null;
  };

  type TestWithInventory = Test & {
    _count?: {
      inventoryRules: number;
    };
  };

  type InventoryItemOption = {
    id: string;
    name: string;
    kind: string;
    unit: string;
    category: string;
    currentStock: number;
  };

  type InventoryRule = {
    id: string;
    quantityPerTest: number;
    isActive: boolean;
    item: InventoryItemOption & { isActive: boolean };
  };

  const [tests, setTests] = useState<TestWithInventory[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [isSexBased, setIsSexBased] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    icon: 'logout' | 'reset' | 'deactivate' | 'activate' | 'warning';
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    type: 'info',
    icon: 'warning',
    title: '',
    message: '',
    action: () => {},
  });

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryTest, setInventoryTest] = useState<Test | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [inventoryRules, setInventoryRules] = useState<InventoryRule[]>([]);
  const [inventoryForm, setInventoryForm] = useState({ itemId: '', quantityPerTest: '' });
  const [editingInventoryRuleId, setEditingInventoryRuleId] = useState<string | null>(null);
  const [labSettings, setLabSettings] = useState<Record<string, string>>({
    sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
    amount_unit: 'DA'
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setLabSettings({
            sample_types: data.sample_types || 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
            amount_unit: data.amount_unit || 'DA'
          });
        }
      })
      .catch(console.error);
  }, []);
  
  const [newTest, setNewTest] = useState<{
    code: string;
    name: string;
    unit: string;
    minValue: string;
    maxValue: string;
    minValueM: string;
    maxValueM: string;
    minValueF: string;
    maxValueF: string;
    decimals: string;
    resultType: string;
    categoryId: string;
    parentId: string;
    options: string;
    isGroup: boolean;
    sampleType: string;
    price: string;
  }>({
    code: '',
    name: '',
    unit: '',
    minValue: '',
    maxValue: '',
    minValueM: '',
    maxValueM: '',
    minValueF: '',
    maxValueF: '',
    decimals: '1',
    resultType: 'numeric',
    categoryId: '',
    parentId: '',
    options: '',
    isGroup: false,
    sampleType: '',
    price: '0'
  });

  const RESULT_TYPES = [
    { value: 'numeric', label: 'Numérique' },
    { value: 'text', label: 'Texte court' },
    { value: 'long_text', label: 'Texte long' },
    { value: 'dropdown', label: 'Liste' },
  ];

  const loadTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTests(data);
    } catch {
      showNotification('error', 'Erreur lors du chargement des tests');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      showNotification('error', 'Erreur lors du chargement des catégories');
    }
  }, [showNotification]);

  useEffect(() => {
    loadTests();
    loadCategories();
  }, [loadCategories, loadTests]);

  const handleEdit = (test: Test) => {
    setEditingTestId(test.id);
    setNewTest({
      code: test.code,
      name: test.name,
      unit: test.unit || '',
      minValue: test.minValue?.toString() || '',
      maxValue: test.maxValue?.toString() || '',
      minValueM: test.minValueM?.toString() || '',
      maxValueM: test.maxValueM?.toString() || '',
      minValueF: test.minValueF?.toString() || '',
      maxValueF: test.maxValueF?.toString() || '',
      decimals: test.decimals?.toString() || '1',
      resultType: test.resultType || 'numeric',
      categoryId: test.categoryId || '',
      parentId: test.parentId || '',
      options: test.options || '',
      isGroup: test.isGroup,
      sampleType: test.sampleType || '',
      price: test.price?.toString() || '0'
    });
    setIsSexBased(!!(test.minValueM || test.maxValueM || test.minValueF || test.maxValueF));
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTestId(null);
    setIsSexBased(false);
    setNewTest({ code: '', name: '', unit: '', minValue: '', maxValue: '', minValueM: '', maxValueM: '', minValueF: '', maxValueF: '', decimals: '1', resultType: 'numeric', categoryId: '', parentId: '', options: '', isGroup: false, sampleType: '', price: '0' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.code || !newTest.name) {
      showNotification('error', 'Code et nom sont obligatoires');
      return;
    }

    const payload = {
      ...newTest,
      minValue: newTest.resultType === 'numeric' && newTest.minValue ? parseFloat(newTest.minValue) : null,
      maxValue: newTest.resultType === 'numeric' && newTest.maxValue ? parseFloat(newTest.maxValue) : null,
      minValueM: newTest.resultType === 'numeric' && isSexBased && newTest.minValueM ? parseFloat(newTest.minValueM) : null,
      maxValueM: newTest.resultType === 'numeric' && isSexBased && newTest.maxValueM ? parseFloat(newTest.maxValueM) : null,
      minValueF: newTest.resultType === 'numeric' && isSexBased && newTest.minValueF ? parseFloat(newTest.minValueF) : null,
      maxValueF: newTest.resultType === 'numeric' && isSexBased && newTest.maxValueF ? parseFloat(newTest.maxValueF) : null,
      decimals: newTest.resultType === 'numeric' ? parseInt(newTest.decimals) : 1
    };

    try {
      const url = '/api/tests';
      const method = editingTestId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestId ? { id: editingTestId, ...payload } : payload)
      });

      if (!response.ok) {
        showNotification('error', 'Erreur lors de l\'enregistrement');
        return;
      }

      await response.json();
      await loadTests();
      if (editingTestId) {
        showNotification('success', 'Test modifié');
      } else {
        showNotification('success', 'Test ajouté');
      }
      handleCloseForm();
    } catch {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = (test: Test) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      icon: 'warning',
      title: 'Supprimer le test ?',
      message: `Êtes-vous sûr de vouloir supprimer "${test.name}" ? Cette action est irréversible.`,
      action: async () => {
        try {
          const res = await fetch(`/api/tests?id=${test.id}`, { method: 'DELETE' });
          if (res.ok) {
            setTests(tests.filter(t => t.id !== test.id));
            showNotification('success', 'Test supprimé');
          } else {
            showNotification('error', 'Erreur lors de la suppression');
          }
        } catch {
          showNotification('error', 'Erreur lors de la suppression');
        }
      }
    });
  };

  const openInventoryModal = async (test: Test) => {
    setInventoryTest(test);
    setShowInventoryModal(true);
    setInventoryLoading(true);
    setEditingInventoryRuleId(null);

    try {
      const res = await fetch(`/api/tests/${test.id}/inventory`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors du chargement des consommations');
        return;
      }

      setInventoryItems(Array.isArray(data.items) ? data.items : []);
      setInventoryRules(Array.isArray(data.rules) ? data.rules : []);
      setInventoryForm({
        itemId: data.items?.[0]?.id || '',
        quantityPerTest: '',
      });
    } catch {
      showNotification('error', 'Erreur lors du chargement des consommations');
    } finally {
      setInventoryLoading(false);
    }
  };

  const closeInventoryModal = () => {
    setShowInventoryModal(false);
    setInventoryTest(null);
    setInventoryItems([]);
    setInventoryRules([]);
    setInventoryForm({ itemId: '', quantityPerTest: '' });
    setEditingInventoryRuleId(null);
    setInventoryLoading(false);
  };

  const handleInventoryRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryTest) return;

    try {
      const isEditing = Boolean(editingInventoryRuleId);
      const res = await fetch(
        isEditing ? `/api/inventory/rules/${editingInventoryRuleId}` : `/api/tests/${inventoryTest.id}/inventory`,
        {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? {} : { itemId: inventoryForm.itemId }),
          quantityPerTest: Number(inventoryForm.quantityPerTest),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      showNotification('success', isEditing ? 'Règle de consommation modifiée' : 'Règle de consommation enregistrée');
      await openInventoryModal(inventoryTest);
      setInventoryForm((prev) => ({ ...prev, quantityPerTest: '' }));
      setEditingInventoryRuleId(null);
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde');
    }
  };

  const handleInventoryRuleDelete = async (ruleId: string) => {
    if (!inventoryTest) return;

    try {
      const res = await fetch(`/api/inventory/rules/${ruleId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors de la suppression');
        return;
      }

      showNotification('success', 'Règle supprimée');
      await openInventoryModal(inventoryTest);
    } catch {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const handleInventoryRuleEdit = (rule: InventoryRule) => {
    setEditingInventoryRuleId(rule.id);
    setInventoryForm({
      itemId: rule.item.id,
      quantityPerTest: String(rule.quantityPerTest),
    });
  };

  const cancelInventoryRuleEdit = () => {
    setEditingInventoryRuleId(null);
    setInventoryForm((prev) => ({
      ...prev,
      quantityPerTest: '',
    }));
  };

  const filteredTests = tests.filter(test =>
    (test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     test.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'all' || test.categoryId === selectedCategory)
  );

  const visibleCategoryMap = new Map<string, { name: string; rank: number; icon?: string | null }>();
  filteredTests.forEach((test) => {
    const categoryId = test.categoryId || 'uncategorized';
    const categoryName = test.categoryRel?.name || 'Divers';
    const categoryRank = test.categoryRel?.rank ?? 9999;
    const categoryIcon = test.categoryRel?.icon || null;

    if (!visibleCategoryMap.has(categoryId)) {
      visibleCategoryMap.set(categoryId, {
        name: categoryName,
        rank: categoryRank,
        icon: categoryIcon,
      });
    }
  });

  const categoriesPresent = Array.from(visibleCategoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.name.localeCompare(b.name)));
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
        <RefreshCw size={48} className="animate-spin text-indigo-500" />
        <p className="font-black uppercase tracking-widest text-xs">Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Search and Filters */}
      <div className="bento-panel p-5 sm:p-6 flex flex-col xl:flex-row items-center gap-4 sm:gap-5">
        <div className="input-premium h-11 flex flex-1 items-center gap-2 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input
            placeholder="Rechercher par code ou nom d'analyse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Rechercher un test"
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 h-11 px-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
             <Filter size={15} className="text-[var(--color-text-soft)]" />
             <select 
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               aria-label="Filtrer les tests par catégorie"
               className="bg-transparent border-none text-sm font-medium text-[var(--color-text)] outline-none cursor-pointer"
             >
               <option value="all">Toutes les catégories</option>
               {categories.map((category) => (
                 <option key={category.id} value={category.id}>{category.name}</option>
               ))}
             </select>
          </div>

          <Link
            href="/tests/ordering"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
          >
            <Settings2 size={16} />
            Catégories
          </Link>

          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary-md whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Nouveau Test</span>
          </button>
        </div>
      </div>

      {/* Categorized Test List */}
      <div className="space-y-10">
        {categoriesPresent.length === 0 ? (
          <div className="bento-panel py-24 text-center flex flex-col items-center opacity-80">
             <div className="w-16 h-16 bg-[var(--color-surface-muted)] text-slate-300 rounded-2xl flex items-center justify-center mb-4">
                <Beaker size={28} />
             </div>
             <h3 className="text-lg font-semibold text-[var(--color-text)]">Aucun test trouvé</h3>
          </div>
        ) : (
          categoriesPresent.map(category => {
            const categoryTests = filteredTests.filter(
              (test) => (test.categoryId || 'uncategorized') === category.id
            );
            if (categoryTests.length === 0) return null;

            const CategoryIcon = getCategoryIcon(category.icon);

            return (
              <div key={category.id} className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                   <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                      <CategoryIcon size={18} />
                   </div>
                   <div>
                      <h2 className="text-lg font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
                         {category.name}
                         <span className="text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-full tracking-normal">{categoryTests.length}</span>
                      </h2>
                   </div>
                   <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>

                 <div className="bento-panel overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide w-24">Code</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide">Analyse</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Échantillon</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Type</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Référence</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Montant</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Conso</th>
                           <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-right w-24">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--color-border)]/60">
                         {categoryTests.map((test) => {
                           const isChild = !!test.parentId;
                           return (
                             <tr 
                               key={test.id} 
                               className={`group transition-colors hover:bg-[var(--color-surface-muted)]/80 ${isChild ? 'bg-[var(--color-surface-muted)]/40' : ''}`}
                             >
                               <td className="px-5 py-3.5 align-middle">
                                 <span className="text-[11px] font-semibold text-[var(--color-accent)] tracking-wide uppercase">
                                   {test.code}
                                 </span>
                               </td>
                               <td className="px-5 py-3.5 align-middle">
                                 <div className="flex flex-col">
                                   <span className={`text-sm font-medium text-[var(--color-text)] ${isChild ? 'pl-3 border-l-2 border-[var(--color-border)] ml-1' : ''}`}>
                                     {test.name}
                                   </span>
                                   {test.isGroup && (
                                     <span className="text-[11px] font-medium text-[var(--color-text-soft)] mt-0.5">
                                       Panel ({tests.filter(t => t.parentId === test.id).length} paramètres)
                                     </span>
                                   )}
                                 </div>
                               </td>
                               <td className="px-5 py-3.5 align-middle text-center">
                                 <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                   {test.sampleType || '—'}
                                 </span>
                               </td>
                               <td className="px-5 py-3.5 align-middle text-center">
                                 <span className={`status-pill ${
                                   test.isGroup ? 'bg-indigo-50 text-indigo-600' : 
                                   test.resultType === 'numeric' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                 }`}>
                                   {test.isGroup ? 'Panel' : test.resultType === 'numeric' ? 'Num' : 'Texte'}
                                 </span>
                               </td>
                               <td className="px-5 py-3.5 align-middle text-center">
                                 {test.isGroup ? (
                                   <Layers size={14} className="mx-auto text-indigo-300" />
                                 ) : test.resultType === 'numeric' ? (
                                   <div className="flex flex-col items-center justify-center gap-1">
                                     {test.minValueM !== null || test.maxValueM !== null || test.minValueF !== null || test.maxValueF !== null ? (
                                       <div className="flex gap-4 text-[11px] font-bold">
                                         <div className="flex items-center gap-1.5">
                                           <span className="w-3 h-3 rounded-[3px] bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-600">H</span>
                                           <span className="text-slate-700">{test.minValueM ?? '0'} — {test.maxValueM ?? '∞'}</span>
                                         </div>
                                         <div className="flex items-center gap-1.5">
                                           <span className="w-3 h-3 rounded-[3px] bg-rose-100 flex items-center justify-center text-[8px] text-rose-600">F</span>
                                           <span className="text-slate-700">{test.minValueF ?? '0'} — {test.maxValueF ?? '∞'}</span>
                                         </div>
                                       </div>
                                     ) : (
                                       <span className="text-sm font-bold text-slate-700">
                                         {test.minValue ?? '0'} — {test.maxValue ?? '∞'}
                                       </span>
                                     )}
                                   </div>
                                 ) : (
                                   <span className="text-slate-300">—</span>
                                 )}
                               </td>
                               <td className="px-5 py-3.5 align-middle text-center">
                                 <span className="text-sm font-semibold text-[var(--color-accent)]">
                                   {test.price?.toLocaleString()} <span className="text-[11px] font-medium text-[var(--color-text-soft)]">{labSettings.amount_unit}</span>
                                 </span>
                               </td>
                               <td className="px-5 py-3.5 align-middle text-center">
                                 <div className="flex items-center justify-center">
                                   {(test._count?.inventoryRules || 0) > 0 ? (
                                     <span className="status-pill status-pill-info">
                                       {test._count?.inventoryRules} règle{(test._count?.inventoryRules || 0) > 1 ? 's' : ''}
                                     </span>
                                   ) : (
                                     <span className="text-xs font-medium text-[var(--color-text-soft)]">Aucune</span>
                                   )}
                                 </div>
                               </td>
                               <td className="px-5 py-3.5 align-middle text-right">
                                 <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <button 
                                     onClick={() => openInventoryModal(test)}
                                     className="p-2 text-slate-400 hover:text-[var(--color-accent)] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-blue-100"
                                     title="Configurer consommation"
                                   >
                                     <Package size={14} />
                                   </button>
                                   <button 
                                     onClick={() => handleEdit(test)} 
                                     className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                     title="Modifier"
                                   >
                                     <Pencil size={14} />
                                   </button>
                                   <button 
                                     onClick={() => handleDelete(test)} 
                                     className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-rose-100"
                                     title="Supprimer"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optimized Form Modal */}
      {showForm && (
        <div className="modal-overlay z-[60] animate-in fade-in duration-300">
          <div 
            className="modal-shell flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header consistent with ConfirmationModal */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${editingTestId ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
                  {editingTestId ? <Settings2 size={22} /> : <Plus size={22} />}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] tracking-tight">
                    {editingTestId ? 'Modifier' : 'Ajouter'} <span className="text-[var(--color-accent)]">test</span>
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Configurez les paramètres de l&apos;analyse biologique.</p>
                </div>
              </div>
              <button 
                onClick={handleCloseForm} 
                className="rounded-xl p-2 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewTest({...newTest, isGroup: false})}
                  className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${!newTest.isGroup ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}
                >
                  Individuel
                </button>
                <button
                  type="button"
                  onClick={() => setNewTest({...newTest, isGroup: true, resultType: 'text', unit: '', minValue: '', maxValue: ''})}
                  className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${newTest.isGroup ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}
                >
                  Panel / Bilan
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Code</label>
                  <input
                    value={newTest.code}
                    onChange={(e) => setNewTest({...newTest, code: e.target.value.toUpperCase()})}
                    placeholder="Ex: HEMO"
                    className="input-premium h-11 bg-white uppercase"
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom complet</label>
                  <input
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                    placeholder="Ex: Hémoglobine Glyquée"
                    className="input-premium h-11 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                  <select
                    value={newTest.categoryId}
                    onChange={(e) => setNewTest({...newTest, categoryId: e.target.value})}
                    className="input-premium h-11 bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Panel Parent</label>
                  <select
                    value={newTest.parentId}
                    onChange={(e) => setNewTest({...newTest, parentId: e.target.value})}
                    className="input-premium h-11 bg-white"
                  >
                    <option value="">-- Racine (Catalogue principal) --</option>
                    {tests.filter(t => t.isGroup).map(panel => (
                      <option key={panel.id} value={panel.id}>
                        {panel.code} - {panel.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!newTest.isGroup && (
                  <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Résultat</label>
                  <select
                    value={newTest.resultType}
                    onChange={(e) => setNewTest({...newTest, resultType: e.target.value})}
                    className="input-premium h-11 bg-white"
                  >
                    {RESULT_TYPES.map(rt => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                </div>
                 )}
                 {newTest.resultType === 'dropdown' && !newTest.isGroup && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options (séparées par virgule)</label>
                  <input
                    value={newTest.options}
                    onChange={(e) => setNewTest({...newTest, options: e.target.value})}
                    placeholder="Ex: Positif, Négatif"
                    className="input-premium h-11 bg-white"
                  />
                </div>
              )}
                  
               
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Échantillon</label>
                  <select
                    value={newTest.sampleType}
                    onChange={(e) => setNewTest({...newTest, sampleType: e.target.value})}
                    className="input-premium h-11 bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {labSettings.sample_types.split(',').map(s => {
                      const val = s.trim();
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant ({labSettings.amount_unit})</label>
                  <input
                    type="number"
                    value={newTest.price}
                    onChange={(e) => setNewTest({...newTest, price: e.target.value})}
                    placeholder="0"
                    className="input-premium h-11 bg-white text-[var(--color-accent)]"
                  />
                </div>
              </div>

              {!newTest.isGroup && newTest.resultType === 'numeric' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paramètres Physico-chimiques</h4>
                    <button 
                      type="button"
                      onClick={() => setIsSexBased(!isSexBased)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all ${isSexBased ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                    >
                      <Layers size={12} />
                      Plages par sexe
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 text-center block">Unité</label>
                      <input value={newTest.unit} onChange={(e) => setNewTest({...newTest, unit: e.target.value})} placeholder="g/L" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 text-center block">Min Std</label>
                      <input step="0.01" type="number" value={newTest.minValue} onChange={(e) => setNewTest({...newTest, minValue: e.target.value})} placeholder="0.00" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 text-center block">Max Std</label>
                      <input step="0.01" type="number" value={newTest.maxValue} onChange={(e) => setNewTest({...newTest, maxValue: e.target.value})} placeholder="∞" className="input-premium h-12 bg-white text-center font-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Déc</label>
                      <select value={newTest.decimals} onChange={(e) => setNewTest({...newTest, decimals: e.target.value})} className="input-premium h-12 bg-white text-center font-black">
                        <option value="0">0</option><option value="1">1</option><option value="2">2</option>
                      </select>
                    </div>

                    {isSexBased && (
                      <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-100/50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-center block">H Min</label>
                          <input step="0.01" type="number" value={newTest.minValueM} onChange={(e) => setNewTest({...newTest, minValueM: e.target.value})} placeholder="Min H" className="input-premium h-12 bg-white text-center font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-center block">H Max</label>
                          <input step="0.01" type="number" value={newTest.maxValueM} onChange={(e) => setNewTest({...newTest, maxValueM: e.target.value})} placeholder="Max H" className="input-premium h-12 bg-white text-center font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 text-center block">F Min</label>
                          <input step="0.01" type="number" value={newTest.minValueF} onChange={(e) => setNewTest({...newTest, minValueF: e.target.value})} placeholder="Min F" className="input-premium h-12 bg-white text-center font-black" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 text-center block">F Max</label>
                          <input step="0.01" type="number" value={newTest.maxValueF} onChange={(e) => setNewTest({...newTest, maxValueF: e.target.value})} placeholder="Max F" className="input-premium h-12 bg-white text-center font-black" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

      
            </form>

            <div className="mt-auto flex justify-end gap-3 border-t border-[var(--color-border)] bg-white p-6">
              <button 
                onClick={handleCloseForm}
                className="btn-secondary-md"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                className="btn-primary-md min-w-[160px] justify-center"
              >
                <Save size={16} /> <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div className="modal-overlay z-[70] animate-in fade-in duration-300" onClick={closeInventoryModal}>
          <div
            className="modal-shell flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] shrink-0">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)] tracking-tight">
                    Consommation liée au test
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {inventoryTest ? `${inventoryTest.code} · ${inventoryTest.name}` : 'Chargement...'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeInventoryModal}
                className="rounded-xl p-2 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">
                    {editingInventoryRuleId ? 'Modifier la règle sélectionnée' : 'Ajouter ou mettre à jour une règle'}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                    Cette quantité sera déduite automatiquement lors de la validation technique.
                  </p>
                </div>

                <form onSubmit={handleInventoryRuleSubmit} className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
                  <label className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Article inventaire</span>
                    <select
                      value={inventoryForm.itemId}
                      onChange={(e) => setInventoryForm((prev) => ({ ...prev, itemId: e.target.value }))}
                      className="input-premium h-11 bg-white"
                      disabled={Boolean(editingInventoryRuleId)}
                    >
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} · {item.currentStock} {item.unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité par analyse</span>
                    <input
                      type="number"
                      step="0.01"
                      value={inventoryForm.quantityPerTest}
                      onChange={(e) => setInventoryForm((prev) => ({ ...prev, quantityPerTest: e.target.value }))}
                      className="input-premium h-11 bg-white"
                      placeholder="0.5"
                      required
                    />
                  </label>

                  <button type="submit" className="btn-primary-md min-w-[140px] justify-center">
                    <Save size={16} />
                    {editingInventoryRuleId ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </form>
                {editingInventoryRuleId && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={cancelInventoryRuleEdit} type="button" className="btn-secondary-sm">
                      Annuler l’édition
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                    Règles actives
                  </h4>
                  <span className="text-xs text-[var(--color-text-soft)]">{inventoryRules.length} règle(s)</span>
                </div>

                {inventoryLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-16 rounded-2xl border bg-[var(--color-surface-muted)] animate-pulse" />
                    ))}
                  </div>
                ) : inventoryRules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-10 text-center">
                    <div className="text-sm font-medium text-[var(--color-text)]">Aucune consommation configurée</div>
                    <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                      Liez ici les réactifs ou consommables utilisés par ce test.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventoryRules.map((rule) => (
                      <div key={rule.id} className="rounded-2xl border bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,31,51,0.04)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-text)]">{rule.item.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-soft)]">
                              <span className="status-pill status-pill-info">
                                {rule.item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                              </span>
                              <span>{rule.item.category}</span>
                              <span>Stock: {rule.item.currentStock} {rule.item.unit}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[var(--color-accent)]">
                              {rule.quantityPerTest} {rule.item.unit} / analyse
                            </span>
                            <button
                              onClick={() => handleInventoryRuleEdit(rule)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[var(--color-accent)] transition-colors hover:bg-blue-100"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleInventoryRuleDelete(rule.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} icon={confirmModal.icon}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
