'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Beaker, 
  Check, 
  X, 
  Search, 
  Microscope, 
  Droplets, 
  FlaskConical, 
  Hash, 
  ChevronRight, 
  Layers,
  Filter,
  RefreshCw,
  Settings2,
  Info,
  Save
} from 'lucide-react';
import { Test } from '@/lib/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { NotificationToast } from '@/components/ui/notification-toast';

export function TestsList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  const [labSettings, setLabSettings] = useState<Record<string, string>>({
    sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
    amount_unit: 'DA'
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

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
    category: string;
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
    category: '',
    parentId: '',
    options: '',
    isGroup: false,
    sampleType: '',
    price: '0'
  });

  const CATEGORIES = ['Hématologie', 'Biochimie', 'Sérologie', 'Urologie', 'Microbiologie', 'Hormonologie', 'NFS', 'Divers'];
  const RESULT_TYPES = [
    { value: 'numeric', label: 'Numérique' },
    { value: 'text', label: 'Texte court' },
    { value: 'long_text', label: 'Texte long' },
    { value: 'dropdown', label: 'Liste' },
  ];

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTests(data);
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des tests');
    } finally {
      setLoading(false);
    }
  };

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
      category: test.category || '',
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
    setNewTest({ code: '', name: '', unit: '', minValue: '', maxValue: '', minValueM: '', maxValueM: '', minValueF: '', maxValueF: '', decimals: '1', resultType: 'numeric', category: '', parentId: '', options: '', isGroup: false, sampleType: '', price: '0' });
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

      const savedTest = await response.json();
      if (editingTestId) {
        setTests(tests.map(t => t.id === editingTestId ? savedTest : t));
        showNotification('success', 'Test modifié');
      } else {
        setTests([savedTest, ...tests]);
        showNotification('success', 'Test ajouté');
      }
      handleCloseForm();
    } catch (error) {
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
        setDeletingId(test.id);
        try {
          const res = await fetch(`/api/tests?id=${test.id}`, { method: 'DELETE' });
          if (res.ok) {
            setTests(tests.filter(t => t.id !== test.id));
            showNotification('success', 'Test supprimé');
          } else {
            showNotification('error', 'Erreur lors de la suppression');
          }
        } catch (error) {
          showNotification('error', 'Erreur lors de la suppression');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const filteredTests = tests.filter(test =>
    (test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     test.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'all' || test.category === selectedCategory)
  );

  const categoriesPresent = Array.from(new Set(filteredTests.map(t => t.category || 'Divers'))).sort();
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
        <RefreshCw size={48} className="animate-spin text-indigo-500" />
        <p className="font-black uppercase tracking-widest text-xs">Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Search and Filters */}
      <div className="bento-panel p-6 flex flex-col xl:flex-row items-center gap-6 shadow-sm border-slate-100">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="Rechercher par code ou nom d'analyse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 shadow-inner-sm"
          />
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
             <Filter size={16} className="text-slate-400" />
             <select 
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
             >
               <option value="all">Toutes les catégories</option>
               {CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 px-8 py-4 h-14 whitespace-nowrap shadow-xl shadow-indigo-100"
          >
            <Plus size={20} />
            <span>Nouveau Test</span>
          </button>
        </div>
      </div>

      {/* Categorized Test List */}
      <div className="space-y-16">
        {categoriesPresent.length === 0 ? (
          <div className="bento-panel py-32 text-center flex flex-col items-center opacity-60">
             <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                <Beaker size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Aucun test trouvé</h3>
          </div>
        ) : (
          categoriesPresent.map(categoryName => {
            const categoryTests = filteredTests.filter(t => (t.category || 'Divers') === categoryName);
            if (categoryTests.length === 0) return null;

            return (
              <div key={categoryName} className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                      {categoryName === 'Hématologie' ? <Droplets size={20}/> : categoryName === 'Biochimie' ? <Microscope size={20}/> : <FlaskConical size={20}/>}
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                         {categoryName}
                         <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg tracking-normal">{categoryTests.length}</span>
                      </h2>
                   </div>
                   <div className="flex-1 h-[1px] bg-slate-100" />
                </div>

                 <div className="bento-panel overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Code</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyse</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Échantillon</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Référence</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Montant</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {categoryTests.map((test) => {
                           const isChild = !!test.parentId;
                           return (
                             <tr 
                               key={test.id} 
                               className={`group transition-colors hover:bg-slate-50/80 ${isChild ? 'bg-slate-50/30' : ''}`}
                             >
                               <td className="px-6 py-4 align-middle">
                                 <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">
                                   {test.code}
                                 </span>
                               </td>
                               <td className="px-6 py-4 align-middle">
                                 <div className="flex flex-col">
                                   <span className={`text-sm font-bold text-slate-900 ${isChild ? 'pl-4 border-l-2 border-slate-200 ml-1' : ''}`}>
                                     {test.name}
                                   </span>
                                   {test.isGroup && (
                                     <span className="text-[10px] font-medium text-indigo-400 uppercase mt-0.5 tracking-tighter">
                                       Panel ({tests.filter(t => t.parentId === test.id).length} paramètres)
                                     </span>
                                   )}
                                 </div>
                               </td>
                               <td className="px-6 py-4 align-middle text-center">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">
                                   {test.sampleType || '—'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 align-middle text-center">
                                 <span className={`status-pill ${
                                   test.isGroup ? 'bg-indigo-50 text-indigo-600' : 
                                   test.resultType === 'numeric' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                 }`}>
                                   {test.isGroup ? 'Panel' : test.resultType === 'numeric' ? 'Num' : 'Texte'}
                                 </span>
                               </td>
                               <td className="px-6 py-4 align-middle text-center">
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
                               <td className="px-6 py-4 align-middle text-center">
                                 <span className="text-sm font-black text-indigo-600">
                                   {test.price?.toLocaleString()} <span className="text-[10px] font-bold text-indigo-400">{labSettings.amount_unit}</span>
                                 </span>
                               </td>
                               <td className="px-6 py-4 align-middle text-right">
                                 <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header consistent with ConfirmationModal */}
            <div className="p-10 pb-6 flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${editingTestId ? 'bg-indigo-600' : 'bg-slate-900'} text-white shadow-indigo-200`}>
                  {editingTestId ? <Settings2 size={32} /> : <Plus size={32} />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingTestId ? 'Modifier' : 'Ajouter'} <span className="text-indigo-600">Test</span>
                  </h3>
                  <p className="text-slate-500 font-medium mt-1">Configurez les paramètres de l'analyse biologique.</p>
                </div>
              </div>
              <button 
                onClick={handleCloseForm} 
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-10 py-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner-sm">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code</label>
                  <input
                    value={newTest.code}
                    onChange={(e) => setNewTest({...newTest, code: e.target.value.toUpperCase()})}
                    placeholder="Ex: HEMO"
                    className="input-premium h-14 bg-white shadow-sm font-black uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                  <select
                    value={newTest.category}
                    onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                    className="input-premium h-14 bg-white shadow-sm font-black"
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                  <input
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                    placeholder="Ex: Hémoglobine Glyquée"
                    className="input-premium h-14 bg-white shadow-sm font-black"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Échantillon</label>
                  <select
                    value={newTest.sampleType}
                    onChange={(e) => setNewTest({...newTest, sampleType: e.target.value})}
                    className="input-premium h-14 bg-white shadow-sm font-black"
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
                    className="input-premium h-14 bg-white shadow-sm font-black text-indigo-600"
                  />
                </div>
              </div>

              {!newTest.isGroup && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paramètres Physico-chimiques</h4>
                    <button 
                      type="button"
                      onClick={() => setIsSexBased(!isSexBased)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${isSexBased ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
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

              {newTest.parentId === '' && (
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                    <Info size={16} className="text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight italic">Test de niveau racine (Catalogue principal)</p>
                 </div>
              )}
            </form>

            <div className="p-10 flex justify-end gap-3 bg-white border-t border-slate-50 mt-auto shadow-inner-white">
              <button 
                onClick={handleCloseForm}
                className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 min-w-[160px] justify-center"
              >
                <Save size={18} /> <span>Enregistrer</span>
              </button>
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