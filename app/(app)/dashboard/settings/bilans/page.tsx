'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Sparkles,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BilanCard } from '@/components/bilans/BilanCard';
import { BilanEditorModal } from '@/components/bilans/BilanEditorModal';
import type { BilanItem, BilanTest } from '@/components/bilans/types';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function BilansPage() {
  const router = useRouter();
  const [bilans, setBilans] = useState<BilanItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<BilanTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBilan, setEditingBilan] = useState<BilanItem | null>(null);
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

  const handleOpenModal = (bilan?: BilanItem) => {
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

  const handleDelete = (bilan: BilanItem) => {
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
          {bilans.map((bilan) => (
            <BilanCard key={bilan.id} bilan={bilan} onEdit={handleOpenModal} onDelete={handleDelete} />
          ))}

          {bilans.length === 0 && (
            <div className="col-span-full bento-panel p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
               <Sparkles size={40} className="text-slate-200" />
               <p className="font-bold uppercase tracking-widest text-xs text-center">Aucun bilan configuré.<br/>Commencez par en créer un nouveau.</p>
            </div>
          )}
        </div>
      )}

      <BilanEditorModal
        mounted={mounted}
        open={showModal}
        editingBilan={editingBilan}
        formData={formData}
        selectedTests={selectedTests}
        searchQuery={searchQuery}
        filteredTests={filteredTests}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        onSearchQueryChange={setSearchQuery}
        onToggleTest={toggleTest}
      />

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
