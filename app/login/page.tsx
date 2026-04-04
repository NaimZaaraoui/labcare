'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Eye, EyeOff, Loader2, MailIcon, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Special case for deactivated account if thrown by authorize()
        if (result.error === "Compte désactivé") {
          setError("Ce compte a été désactivé. Veuillez contacter l'administrateur.");
        } else {
          setError('Email ou mot de passe incorrect.');
        }
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError("Une erreur s'est produite lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200/70 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
            <FlaskConical size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">NexLab</h1>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-[0.2em] mt-2">
            Système de Gestion de Laboratoire
          </p>
        </div>

        {/* Form Card */}
        <div className="auth-card">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Connexion</h2>
            <p className="text-slate-500 font-medium">
              Veuillez saisir vos identifiants pour accéder au LIMS.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="form-label mb-3 ml-1">
                Adresse Email
              </label>
              <div className="relative input-premium flex gap-2 items-center group">
                <MailIcon size={18} className="text-slate-400 group-focus-within:text-indigo-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@nexlab.local"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-14 border-none w-full outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="form-label mb-3 ml-1">
                Mot de passe
              </label>
              <div className="relative input-premium flex gap-2 items-center group">
                <Lock size={18} className="text-slate-400 group-focus-within:text-indigo-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-14 border-none w-full outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors rounded-xl hover:bg-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" role="alert" className="p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-bold text-rose-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-md w-full h-12 text-sm"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Connexion en cours...</>
              ) : (
                'Accéder au Dashboard'
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex flex-col items-center gap-4 opacity-50">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            NexLab v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
