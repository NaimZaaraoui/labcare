'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [resBilans, resTests] = await Promise.all([
        fetch('/api/bilans'),
        fetch('/api/tests')
      ]);
      const bilansData = await resBilans.json();
      const testsData = await resTests.json();
      setBilans(bilansData);
      setTests(testsData);
    } catch {
      showNotification('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

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
    } catch {
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
        } catch {
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
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="bento-panel p-5 sm:p-6 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="group flex items-center gap-2 text-[var(--color-text-soft)] font-medium hover:text-[var(--color-accent)] transition-all w-fit"
          >
            <div className="w-8 h-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center group-hover:bg-[var(--color-accent-soft)] transition-all">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-wide">Paramètres</span>
          </button>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">Raccourcis et Bilans</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Gérez vos groupes de tests rapides et bilans standards.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-primary-md"
        >
          <Plus size={16} />
          <span>Nouveau Bilan</span>
        </button>
      </div>

      {loading ? (
        <div className="bento-panel p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <RefreshCw size={40} className="animate-spin text-indigo-500" />
          <p className="font-bold uppercase tracking-widest text-xs">Chargement des bilans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {bilans.map(bilan => (
            <div key={bilan.id} className="bento-panel p-6 group relative overflow-hidden flex flex-col gap-5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors tracking-tight">{bilan.name}</h3>
                    {bilan.code && <span className="text-[11px] font-medium text-[var(--color-text-soft)] uppercase tracking-wide">{bilan.code}</span>}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(bilan)}
                    className="w-9 h-9 flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-muted)] rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(bilan)}
                    className="w-9 h-9 flex items-center justify-center text-[var(--color-text-soft)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[11px] font-medium text-[var(--color-text-soft)] uppercase tracking-wide">{bilan.tests.length} Analyses</p>
                   <div className="h-px flex-1 bg-[var(--color-border)] mx-4" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {bilan.tests.slice(0, 6).map(test => (
                    <span key={test.id} className="px-3 py-1.5 rounded-xl bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] text-xs font-medium border border-[var(--color-border)]">
                      {test.code}
                    </span>
                  ))}
                  {bilan.tests.length > 6 && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-xs font-semibold border border-blue-100">
                      +{bilan.tests.length - 6}
                    </span>
                  )}
                </div>
              </div>

              {/* Decorative Accent */}
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-[var(--color-accent-soft)] opacity-0 group-hover:opacity-40 transition-opacity blur-2xl" />
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
        <div className="modal-overlay z-[60] animate-in fade-in duration-300">
          <div 
            className="modal-shell flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Redesigned like ConfirmationModal */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] tracking-tight">
                    {editingBilan ? 'Modifier le Bilan' : 'Nouveau Bilan'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Gérez vos raccourcis d&apos;analyses pour une saisie rapide.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="rounded-xl p-2 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-6">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom du bilan</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Bilan Pré-opératoire"
                    className="input-premium h-11 bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Code raccourci</label>
                  <input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: PREOP"
                    className="input-premium h-11 bg-white uppercase"
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
                     <label className="text-xs font-medium text-[var(--color-text)] uppercase tracking-wide">Analyses incluses ({selectedTests.length})</label>
                   </div>
                   
                   <div className="relative w-full md:w-80 group">
                     <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                     <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Chercher une analyse..."
                        className="input-premium h-11 pl-12 bg-white"
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
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] shadow-md translate-y-[-2px]' 
                              : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <span className={`block text-sm font-semibold truncate leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{test.code}</span>
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
                       <p className="text-slate-400 italic text-sm font-medium">Aucune analyse trouvée pour &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer - Consistent with ConfirmationModal buttons */}
            <div className="mt-auto flex justify-end gap-3 border-t border-[var(--color-border)] bg-white p-6">
              <button 
                onClick={() => setShowModal(false)}
                className="btn-secondary-md"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmit}
                className="btn-primary-md min-w-[180px] justify-center"
              >
                <Save size={16} /> 
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
