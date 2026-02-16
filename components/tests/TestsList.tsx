'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Beaker, AlertCircle, Check, X, Search, Microscope, Droplets, FlaskConical, Hash, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Test } from '@/lib/types';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NotificationToast } from '@/components/ui/notification-toast';

export function TestsList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  
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
    isGroup: false
  });

  const CATEGORIES = ['Hématologie', 'Biochimie', 'Sérologie', 'Urologie', 'Microbiologie', 'Hormonologie', 'NFS', 'Divers'];
  const RESULT_TYPES = [
    { value: 'numeric', label: 'Numérique' },
    { value: 'text', label: 'Texte court' },
    { value: 'long_text', label: 'Texte long' },
    { value: 'dropdown', label: 'Liste de choix' },
  ];

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Erreur:', error);
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
        isGroup: test.isGroup
      });
      setShowForm(true);
    };


  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTestId(null);
    setNewTest({ code: '', name: '', unit: '', minValue: '', maxValue: '', minValueM: '', maxValueM: '', minValueF: '', maxValueF: '', decimals: '1', resultType: 'numeric', category: '', parentId: '', options: '', isGroup: false });
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
      minValueM: newTest.resultType === 'numeric' && newTest.minValueM ? parseFloat(newTest.minValueM) : null,
      maxValueM: newTest.resultType === 'numeric' && newTest.maxValueM ? parseFloat(newTest.maxValueM) : null,
      minValueF: newTest.resultType === 'numeric' && newTest.minValueF ? parseFloat(newTest.minValueF) : null,
      maxValueF: newTest.resultType === 'numeric' && newTest.maxValueF ? parseFloat(newTest.maxValueF) : null,
      decimals: newTest.resultType === 'numeric' ? parseInt(newTest.decimals) : 1
    };

    try {
      let response;
      if (editingTestId) {
        response = await fetch('/api/tests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTestId, ...payload })
        });
      } else {
        response = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const error = await response.json();
        showNotification('error', error.error || 'Erreur lors de l\'enregistrement');
        return;
      }

      const savedTest = await response.json();
      
      if (editingTestId) {
        setTests(tests.map(t => t.id === editingTestId ? savedTest : t));
        showNotification('success', 'Test modifié avec succès');
      } else {
        setTests([savedTest, ...tests]);
        showNotification('success', 'Test ajouté avec succès');
      }
      
      handleCloseForm();
    } catch (error) {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    const id = confirmDialog.id;
    setDeletingId(id);
    try {
      await fetch(`/api/tests?id=${id}`, { method: 'DELETE' });
      setTests(tests.filter(t => t.id !== id));
      showNotification('success', 'Test supprimé');
    } catch (error) {
       showNotification('error', 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTests = tests.filter(test =>
    (test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     test.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'all' || test.category === selectedCategory)
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-50 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      {/* Header View */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuration <span className="text-blue-600">Tests</span></h1>
           <p className="text-slate-500 font-medium mt-1">Gérez le catalogue des examens biologiques</p>
        </div>

        <div className="flex flex-col xl:flex-row flex-wrap items-start lg:items-center gap-4 w-full lg:w-auto">
           <div className="relative flex-1 xl:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                placeholder="Rechercher un test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-12 h-14"
              />
           </div>

           <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 h-14 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-blue-100 outline-none"
              >
                <option value="all">Toutes les catégories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn-primary-premium h-14 whitespace-nowrap"
                >
                  <Plus size={20} className="mr-2" /> Nouveau Test
                </button>
              )}
           </div>
        </div>
      </div>

      {/* Modern Add/Edit Form Overlay/Panel */}
      {showForm && (
        <div className="bento-card-glass p-10 border-blue-100 animate-slide-in shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  {editingTestId ? <Pencil size={20} /> : <Plus size={20} />}
               </div>
               {editingTestId ? 'Modifier Paramètre' : 'Nouveau Paramètre'}
            </h2>
            <button onClick={handleCloseForm} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
               <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
             <div className="md:col-span-3">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 w-fit">
                   <button
                     type="button"
                     onClick={() => setNewTest({...newTest, isGroup: false})}
                     className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!newTest.isGroup ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      Test Individuel
                   </button>
                   <button
                     type="button"
                     onClick={() => setNewTest({...newTest, isGroup: true, resultType: 'text', unit: '', minValue: '', maxValue: ''})}
                     className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${newTest.isGroup ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      Groupe / Bilan (Panel)
                   </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                   {newTest.isGroup ? "Un groupe sert de titre et peut contenir plusieurs tests enfants (ex: NFS)" : "Un test standard avec ses propres unités et bornes de référence"}
                </p>
             </div>

             <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Identifiant *</Label>
                <input
                  value={newTest.code}
                  onChange={(e) => setNewTest({...newTest, code: e.target.value.toUpperCase()})}
                  placeholder="EX: NFS, GLY..."
                  className="input-premium h-14 font-mono font-bold"
                  required
                />
             </div>
             <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nom complet de l&apos;examen *</Label>
                <input
                  value={newTest.name}
                  onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                  placeholder="Hémogramme complet (NFS)..."
                  className="input-premium h-14 font-bold"
                  required
                />
             </div>

             <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Catégorie / Discipline</Label>
                <select
                  value={newTest.category}
                  onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                  className="input-premium h-14 font-bold"
                >
                  <option value="">Sélectionner...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
             </div>

             {!newTest.isGroup && (
               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Type de donnée</Label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 h-14">
                     {RESULT_TYPES.map(type => (
                        <button 
                          key={type.value}
                          type="button"
                          onClick={() => setNewTest({...newTest, resultType: type.value})}
                          className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${newTest.resultType === type.value ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           {type.label}
                        </button>
                     ))}
                  </div>
               </div>
             )}

             {/* Sélection du Test Parent - Disponible pour tous les types */}
             <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Test Parent {newTest.isGroup ? '(Pour créer une hiérarchie de bilans)' : '(Ex: NFS, Cytochimie Urinaire)'}
                </Label>
                <select
                  value={newTest.parentId}
                  onChange={(e) => setNewTest({...newTest, parentId: e.target.value})}
                  className="input-premium h-14"
                >
                  <option value="">Aucun (Test Principal)</option>
                  {tests.filter(t => t.id !== editingTestId).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.isGroup ? '📋 ' : '  '}{t.name} {t.isGroup ? '(Bilan)' : ''}
                    </option>
                  ))}
                </select>
                {newTest.parentId && (
                  <p className="text-xs text-slate-500 italic">
                    Ce {newTest.isGroup ? 'bilan' : 'test'} sera affiché sous {tests.find(t => t.id === newTest.parentId)?.name}
                  </p>
                )}
             </div>

             {!newTest.isGroup && newTest.resultType === 'dropdown' && (
               <div className="md:col-span-3 space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Options possibles (séparées par des virgules)</Label>
                  <input
                    value={newTest.options}
                    onChange={(e) => setNewTest({...newTest, options: e.target.value})}
                    placeholder="Positif, Négatif, Traces..."
                    className="input-premium h-14 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-400">Exemple: Positif, Négatif, Indéterminé</p>
               </div>
             )}

             {!newTest.isGroup && newTest.resultType === 'numeric' && (
                <div className="md:col-span-3 space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Paramètres de Référence</Label>
                   <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                         <Label className="text-xs font-bold text-slate-500">Unité</Label>
                         <input value={newTest.unit} onChange={(e) => setNewTest({...newTest, unit: e.target.value})} placeholder="Exemple: g/L" className="input-premium h-12 text-center font-bold" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-xs font-bold text-slate-500">Valeur Min</Label>
                         <input step="0.01" type="number" value={newTest.minValue} onChange={(e) => setNewTest({...newTest, minValue: e.target.value})} placeholder="Min" className="input-premium h-12 text-center font-bold ring-1 ring-emerald-50 focus:ring-emerald-200" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-xs font-bold text-slate-500">Valeur Max</Label>
                         <input step="0.01" type="number" value={newTest.maxValue} onChange={(e) => setNewTest({...newTest, maxValue: e.target.value})} placeholder="Max" className="input-premium h-12 text-center font-bold ring-1 ring-rose-50 focus:ring-rose-200" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-xs font-bold text-slate-500">Décimales</Label>
                         <select value={newTest.decimals} onChange={(e) => setNewTest({...newTest, decimals: e.target.value})} className="input-premium h-12 text-center font-bold ring-1 ring-blue-50 focus:ring-blue-200">
                           <option value="0">0</option>
                           <option value="1">1</option>
                           <option value="2">2</option>
                           <option value="3">3</option>
                         </select>
                      </div>
                   </div>

                   <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Valeurs de Référence par Genre (optionnel)</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-tight">Homme</p>
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500">Min</Label>
                               <input step="0.01" type="number" value={newTest.minValueM} onChange={(e) => setNewTest({...newTest, minValueM: e.target.value})} placeholder="Min" className="input-premium h-10 text-center font-bold text-sm" />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500">Max</Label>
                               <input step="0.01" type="number" value={newTest.maxValueM} onChange={(e) => setNewTest({...newTest, maxValueM: e.target.value})} placeholder="Max" className="input-premium h-10 text-center font-bold text-sm" />
                            </div>
                         </div>
                         <div className="space-y-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                            <p className="text-xs font-bold text-pink-700 uppercase tracking-tight">Femme</p>
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500">Min</Label>
                               <input step="0.01" type="number" value={newTest.minValueF} onChange={(e) => setNewTest({...newTest, minValueF: e.target.value})} placeholder="Min" className="input-premium h-10 text-center font-bold text-sm" />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500">Max</Label>
                               <input step="0.01" type="number" value={newTest.maxValueF} onChange={(e) => setNewTest({...newTest, maxValueF: e.target.value})} placeholder="Max" className="input-premium h-10 text-center font-bold text-sm" />
                            </div>
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Si définis, ces valeurs seront utilisées à la place des valeurs générales pour le genre correspondant.</p>
                   </div>
                </div>
             )}

             <div className="md:col-span-3 flex justify-end gap-4 mt-2">
                <button type="button" onClick={handleCloseForm} className="px-8 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl">Annuler</button>
                <button type="submit" className="btn-primary-premium h-14 px-12">{editingTestId ? 'Modifier' : 'Confirmer l\'ajout'}</button>
             </div>
          </form>
        </div>
      )}

      {/* Grid of Tests Cards */}
      {filteredTests.length === 0 ? (
        <div className="bento-card py-32 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
              <Beaker size={40} />
           </div>
           <h3 className="text-xl font-bold text-slate-900">Aucun test dans le catalogue</h3>
           <button onClick={() => setShowForm(true)} className="text-blue-600 font-bold mt-4 hover:underline">Ajouter le premier test</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const isNum = test.resultType === 'numeric' || !test.resultType;
            return (
              <div key={test.id} className="group bento-card hover:border-blue-200 hover:shadow-premium transition-all relative overflow-hidden bg-white">
                <div className="flex justify-between items-start mb-6">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${test.parentId ? 'ring-2 ring-slate-100' : ''} ${isNum ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-amber-50 text-amber-600'}`}>
                      {test.category === 'Hématologie' ? <Droplets size={24}/> : test.category === 'Biochimie' ? <Microscope size={24}/> : <FlaskConical size={24}/>}
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => handleEdit(test)}
                       className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                     >
                       <Pencil size={18} />
                     </button>
                     <button
                       onClick={() => handleDeleteClick(test.id)}
                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${deletingId === test.id ? 'animate-spin text-slate-300' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-600'}`}
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg inline-block tracking-widest">{test.code}</span>
                          {test.isGroup && (
                             <span className="glass-badge badge-blue bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">GROUPE / BILAN</span>
                          )}

                         {test.parentId && (
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">SOUS-TEST</span>
                         )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{test.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{test.category || 'Catégorie non spécifiée'}</p>
                   </div>

                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      {test.isGroup ? (
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                            <span className="text-sm font-bold text-blue-600 flex items-center gap-2">
                               <Layers size={14} /> {tests.filter(t => t.parentId === test.id).length} paramètres inclus
                            </span>
                         </div>
                      ) : isNum ? (
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeurs de Référence</span>
                            <span className="text-sm font-bold text-slate-700">
                               {test.minValue !== null && test.maxValue !== null ? (
                                 <>{test.minValue} - {test.maxValue} <span className="text-blue-500 ml-1">{test.unit}</span></>
                               ) : test.minValue !== null ? (
                                 <>&gt; {test.minValue} <span className="text-blue-500 ml-1">{test.unit}</span></>
                               ) : test.maxValue !== null ? (
                                 <>&lt; {test.maxValue} <span className="text-blue-500 ml-1">{test.unit}</span></>
                               ) : (
                                 <>? - ? <span className="text-blue-500 ml-1">{test.unit}</span></>
                               )}
                            </span>
                         </div>
                      ) : (
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de Saisie</span>
                            <span className="text-sm font-bold text-amber-600 flex items-center gap-2">
                               <Hash size={14} /> {test.resultType === 'long_text' ? 'Texte libre' : test.resultType === 'dropdown' ? 'Liste de choix' : 'Texte court'}
                            </span>
                         </div>
                      )}
                      
                      <div className="flex items-center text-slate-200 group-hover:text-blue-600 transition-colors">
                         <ChevronRight size={20} />
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Supprimer le test"
        description="Attention : Cette action est irréversible et pourrait affecter les analyses existantes utilisant ce test."
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer"
        variant="destructive"
      />

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}