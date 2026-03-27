'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  RefreshCw, 
  Shield, 
  User as UserIcon, 
  XCircle,
  Key,
  UserCheck,
  UserX,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';




interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; class: string }> = {
  ADMIN: { label: 'Administrateur', class: 'bg-purple-50 text-purple-600 border-purple-100' },
  MEDECIN: { label: 'Médecin', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  TECHNICIEN: { label: 'Technicien', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  RECEPTIONNISTE: { label: 'Réceptionniste', class: 'bg-slate-50 text-slate-600 border-slate-100' },
};

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Derived state
  const currentUserId = session?.user?.id;
  const adminCount = users.filter(u => u.role === 'ADMIN' && u.isActive).length;


  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'TECHNICIEN',
    password: '',
  });

  // Modal state
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setFormData({ name: '', email: '', role: 'TECHNICIEN', password: '' });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: user.isActive ? 'danger' : 'info',
      icon: user.isActive ? 'deactivate' : 'activate',
      title: user.isActive ? 'Désactiver l\'utilisateur ?' : 'Activer l\'utilisateur ?',
      message: user.isActive 
        ? `Êtes-vous sûr de vouloir désactiver ${user.name} ? Il ne pourra plus se connecter au système.`
        : `Voulez-vous réactiver l'accès pour ${user.name} ?`,
      action: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-active' }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erreur lors de la modification');
          }

          fetchUsers();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erreur de modification');
        }
      }
    });
  };

  const handleResetPassword = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      icon: 'reset',
      title: 'Réinitialiser le mot de passe ?',
      message: `Le mot de passe de ${user.name} sera réinitialisé à "LabCare2024!". L'utilisateur sera forcé de le changer à sa prochaine connexion.`,
      action: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset-password' }),
          });

          if (!response.ok) throw new Error('Erreur lors de la réinitialisation');
          fetchUsers();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erreur de réinitialisation');
        }
      }
    });
  };



  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">Gérer les accès et rôles du personnel du laboratoire.</p>
        </div>

       
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                    <Settings className="w-4 h-4 animate-spin-slow" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]">Mode administrateur</span>
                  </div>
      </div>
      </section>

      <div className="space-y-8">
        
        {/* Section A: User List */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserIcon size={18} className="text-indigo-500" />
                Liste du Personnel
              </h3>
              <button 
                onClick={fetchUsers}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <RefreshCw size={40} className="animate-spin text-indigo-500" />
                  <p className="font-bold uppercase tracking-widest text-xs">Chargement des données...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-50">
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Utilisateur</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Rôle</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Statut</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className={`group transition-colors ${!user.isActive ? 'bg-slate-50/50 grayscale-[0.5] opacity-60' : 'hover:bg-slate-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${user.isActive ? 'bg-white text-indigo-600 border border-slate-100' : 'bg-slate-200 text-slate-400'}`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`status-pill border ${ROLE_CONFIG[user.role]?.class || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {ROLE_CONFIG[user.role]?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Désactivé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleResetPassword(user)}
                              title="Réinitialiser MDP"
                              className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Key size={16} />
                            </button>
                            
                            {/* Protection: Ne pas pouvoir se désactiver soi-même ou le dernier admin */}
                            {!(user.id === currentUserId || (user.role === 'ADMIN' && adminCount <= 1 && user.isActive)) && (
                              <button 
                                onClick={() => handleToggleActive(user)}
                                title={user.isActive ? "Désactiver" : "Activer"}
                                className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                              >
                                {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Create User Form */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <UserPlus size={20} className="text-indigo-500" />
              Nouveau Compte
            </h3>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Nom complet</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-premium h-12"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Email personnel</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-premium h-12"
                  placeholder="j.dupont@labcare.local"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Rôle système</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-premium h-12 appearance-none cursor-pointer"
                  required
                >
                  <option value="TECHNICIEN">Technicien</option>
                  <option value="MEDECIN">Médecin / Biologiste</option>
                  <option value="RECEPTIONNISTE">Réceptionniste</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 ml-1">Mot de passe initial</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="input-premium h-12"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center gap-1">
                  <Shield size={10} />
                  L&apos;utilisateur devra le changer au 1er accès
                </p>
              </div>

              {error && (
                <div className="xl:col-span-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <p className="text-xs font-semibold text-rose-600">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitLoading}
                className="btn-primary-md xl:col-span-2 w-full text-sm font-semibold"
              >
                {submitLoading ? <RefreshCw className="animate-spin mx-auto" size={18} /> : 'Créer le Compte'}
              </button>
            </form>
          </div>
        </div>
      </div>

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
