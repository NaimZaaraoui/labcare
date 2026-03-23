'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSession } from 'next-auth/react';


export default function ChangePasswordPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur s'est produite.");
      }

      // Synchronize the session token to remove the mustChangePassword flag
      await updateSession({
        mustChangePassword: false
      });

      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-amber-100 mb-6 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">Sécurité de votre compte</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 text-center">
            Mise à jour obligatoire
          </p>
        </div>

        <div className="bento-panel p-10">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 mb-2">Changer votre mot de passe</h2>
            <p className="text-slate-500 font-medium text-sm">
              Pour des raisons de sécurité, vous devez définir un nouveau mot de passe lors de votre première connexion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                Nouveau mot de passe
              </label>
              <div className="relative input-premium flex gap-2 items-center group">
                <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-14 border-none w-full outline-none"
                />

              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                Confirmer le mot de passe
              </label>
              <div className="relative input-premium flex gap-2 items-center group">
                <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-14 border-none w-full outline-none"
                />
              </div>
            </div>
                <button 
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='flex gap-2 items-center text-slate-400 hover:text-blue-500 transition-colors'>
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  {showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                </button>


            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-14 text-base font-black tracking-tight"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Mise à jour...</>
              ) : (
                'Enregistrer le mot de passe'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
