'use client';

import { 
  RefreshCw, 
  User as UserIcon, 
  Key,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { useUsersManager } from '@/components/users/useUsersManager';
import { UserCreateForm } from '@/components/users/UserCreateForm';

const ROLE_CONFIG: Record<string, { label: string; class: string }> = {
  ADMIN: { label: 'Administrateur', class: 'bg-purple-50 text-purple-600 border-purple-100' },
  MEDECIN: { label: 'Médecin', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  TECHNICIEN: { label: 'Technicien', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  RECEPTIONNISTE: { label: 'Réceptionniste', class: 'bg-slate-50 text-slate-600 border-slate-100' },
};

export default function UsersManagementPage() {
  const state = useUsersManager();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <PageBackLink href="/" />
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
                onClick={state.fetchUsers}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
              >
                <RefreshCw size={16} className={state.loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {state.loading ? (
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
                    {state.users.map((user) => (
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
                              onClick={() => state.handleResetPassword(user)}
                              title="Réinitialiser MDP"
                              className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Key size={16} />
                            </button>
                            
                            {/* Protection: Ne pas pouvoir se désactiver soi-même ou le dernier admin */}
                            {!(user.id === state.currentUserId || (user.role === 'ADMIN' && state.adminCount <= 1 && user.isActive)) && (
                              <button 
                                onClick={() => state.handleToggleActive(user)}
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
          <UserCreateForm onUserCreated={state.fetchUsers} />
        </div>
      </div>

      <ConfirmationModal
        isOpen={state.confirmModal.isOpen}
        onClose={state.closeConfirmModal}
        onConfirm={state.confirmModal.action}
        title={state.confirmModal.title}
        message={state.confirmModal.message}
        type={state.confirmModal.type}
        icon={state.confirmModal.icon}
      />
    </div>
  );
}
