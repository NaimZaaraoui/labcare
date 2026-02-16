
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Test {
  id: string;
  name: string;
  code: string;
  category: string | null;
}

interface Bilan {
  id: string;
  name: string;
  code?: string | null;
  tests: Test[];
}

export default function BilansPage() {
  const router = useRouter();
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBilan, setEditingBilan] = useState<Bilan | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
      open: boolean;
      title: string;
      description: string;
      action: () => void;
    }>({ open: false, title: '', description: '', action: () => {} });

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resBilans, resTests] = await Promise.all([
        fetch('/api/bilans'),
        fetch('/api/tests')
      ]);
      const bilansData = await resBilans.json();
      const testsData = await resTests.json();
      setBilans(bilansData);
      setTests(testsData);
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (bilan?: Bilan) => {
    if (bilan) {
      setEditingBilan(bilan);
      setFormData({ name: bilan.name, code: bilan.code || '' });
      setSelectedTests(bilan.tests.map(t => t.id));
    } else {
      setEditingBilan(null);
      setFormData({ name: '', code: '' });
      setSelectedTests([]);
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showNotification('error', 'Le nom est requis');
      return;
    }

    try {
      const url = editingBilan ? `/api/bilans/${editingBilan.id}` : '/api/bilans';
      const method = editingBilan ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          testIds: selectedTests
        })
      });

      if (res.ok) {
        showNotification('success', editingBilan ? 'Bilan modifié' : 'Bilan créé');
        setShowModal(false);
        fetchData();
      } else {
        showNotification('error', 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
       showNotification('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bilans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Bilan supprimé');
        fetchData();
      } else {
         showNotification('error', 'Erreur lors de la suppression');
      }
    } catch (error) {
        showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <button 
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm border border-slate-200"
              >
                <ArrowLeft size={20} />
              </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Raccourcis & Bilans</h1>
              <p className="text-slate-500 font-medium">Gérez vos groupes de tests rapides</p>
            </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} /> Nouveau Bilan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bilans.map(bilan => (
          <div key={bilan.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{bilan.name}</h3>
                  {bilan.code && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bilan.code}</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(bilan)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Supprimer le bilan',
                      description: `Êtes-vous sûr de vouloir supprimer "${bilan.name}" ?`,
                      action: () => handleDelete(bilan.id)
                  })}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bilan.tests.length} Tests inclus</p>
              <div className="flex flex-wrap gap-2">
                {bilan.tests.slice(0, 5).map(test => (
                  <span key={test.id} className="px-2 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100">
                    {test.code}
                  </span>
                ))}
                {bilan.tests.length > 5 && (
                  <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold border border-slate-100">
                    +{bilan.tests.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                {editingBilan ? 'Modifier le Bilan' : 'Nouveau Bilan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nom du Bilan</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Pré-opératoire"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Code (Optionnel)</label>
                  <input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: PREOP"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sélectionner les tests ({selectedTests.length})</label>
                   <div className="relative w-64">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrer les tests..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border-none text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {filteredTests.map(test => {
                    const isSelected = selectedTests.includes(test.id);
                    return (
                        <button
                          key={test.id}
                          onClick={() => toggleTest(test.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-blue-200'
                          }`}
                        >
                          <div>
                            <span className={`block text-xs font-black ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{test.code}</span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[120px]">{test.name}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-blue-600" />}
                        </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-all flex items-center gap-2"
              >
                <Save size={18} /> Enregistrer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
