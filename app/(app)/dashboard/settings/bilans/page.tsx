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
  ArrowLeft,
  RefreshCw,
  Filter
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

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

  const handleDelete = (bilan: Bilan) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      icon: 'warning',
      title: 'Supprimer le bilan ?',
      message: `Êtes-vous sûr de vouloir supprimer "${bilan.name}" ? Cette action est irréversible.`,
      action: async () => {
        try {
          const res = await fetch(`/api/bilans/${bilan.id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification('success', 'Bilan supprimé');
            fetchData();
          } else {
            showNotification('error', 'Erreur lors de la suppression');
          }
        } catch (error) {
          showNotification('error', 'Erreur lors de la suppression');
        }
      }
    });
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
    <div className="p-8 space-y-10 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest">Paramètres</span>
          </button>
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Raccourcis & Bilans</h1>
            <p className="text-slate-500 font-medium mt-1">Gérez vos groupes de tests rapides et bilans standards.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 px-6 py-4 shadow-xl shadow-indigo-100 h-14"
        >
          <Plus size={20} />
          <span>Nouveau Bilan</span>
        </button>
      </div>

      {loading ? (
        <div className="bento-panel p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <RefreshCw size={40} className="animate-spin text-indigo-500" />
          <p className="font-bold uppercase tracking-widest text-xs">Chargement des bilans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bilans.map(bilan => (
            <div key={bilan.id} className="bento-panel p-8 group relative overflow-hidden flex flex-col gap-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{bilan.name}</h3>
                    {bilan.code && <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{bilan.code}</span>}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(bilan)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(bilan)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bilan.tests.length} Analyses</p>
                   <div className="h-[1px] flex-1 bg-slate-50 mx-4" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {bilan.tests.slice(0, 6).map(test => (
                    <span key={test.id} className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100 shadow-sm">
                      {test.code}
                    </span>
                  ))}
                  {bilan.tests.length > 6 && (
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">
                      +{bilan.tests.length - 6}
                    </span>
                  )}
                </div>
              </div>

              {/* Decorative Accent */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-indigo-50 opacity-0 group-hover:opacity-30 transition-opacity blur-2xl" />
            </div>
          ))}

          {bilans.length === 0 && (
            <div className="col-span-full bento-panel p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Sparkles size={40} className="text-slate-200" />
               <p className="font-bold uppercase tracking-widest text-xs text-center">Aucun bilan configuré.<br/>Commencez par en créer un nouveau.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Redesigned like ConfirmationModal */}
            <div className="p-10 pb-6 flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingBilan ? 'Modifier le Bilan' : 'Nouveau Bilan'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-1">Gérez vos raccourcis d'analyses pour une saisie rapide</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-10 py-6 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-50">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nom du Bilan</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Bilan Pré-opératoire"
                    className="input-premium h-14 bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Code Raccourci</label>
                  <input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: PREOP"
                    className="input-premium h-14 bg-white shadow-sm uppercase font-black"
                  />
                </div>
              </div>

              {/* Selection Section */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Filter size={16} />
                     </div>
                     <label className="text-xs font-black text-slate-900 uppercase tracking-widest">analyses incluses ({selectedTests.length})</label>
                   </div>
                   
                   <div className="relative w-full md:w-80 group">
                     <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                     <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Chercher une analyse..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-100 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 scroll-smooth">
                  {filteredTests.map(test => {
                    const isSelected = selectedTests.includes(test.id);
                    return (
                        <button
                          key={test.id}
                          onClick={() => toggleTest(test.id)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between h-full group ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 translate-y-[-2px]' 
                              : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <span className={`block text-sm font-black truncate leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{test.code}</span>
                            <span className={`text-[10px] truncate block opacity-60 font-medium ${isSelected ? 'text-indigo-50' : 'text-slate-500 italic'}`}>{test.name}</span>
                          </div>
                          
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-transparent'
                          }`}>
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </button>
                    );
                  })}
                  {filteredTests.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                       <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-200">
                          <Search size={32} />
                       </div>
                       <p className="text-slate-400 italic text-sm font-medium">Aucune analyse trouvée pour "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer - Consistent with ConfirmationModal buttons */}
            <div className="p-10 flex justify-end gap-3 bg-white border-t border-slate-50 mt-auto">
              <button 
                onClick={() => setShowModal(false)}
                className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest bg-slate-50/50"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 min-w-[180px] justify-center"
              >
                <Save size={18} /> 
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        icon={confirmModal.icon}
      />
    </div>
  );
}
