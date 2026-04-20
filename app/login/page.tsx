'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlaskConical, MailIcon, Lock, Loader2, ShieldCheck, ArrowRight, Microscope, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen py-6 w-full flex items-center justify-center bg-[var(--color-page)] relative overflow-hidden selection:bg-[var(--color-accent)] selection:text-white">
      {/* Fast Ambient Background using Radial Gradients (No heavy blur) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] px-5 z-10 animate-fade-in">
        
        {/* Top Logo Area */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative group">
             
             <div className="relative w-20 h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Microscope size={36} className="text-[var(--color-accent)]" />
             </div>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-text)] tracking-tight mb-2">NexLab</h1>
          <p className="text-sm font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.2em]">
            Système de Gestion de Laboratoire
          </p>
        </div>

        {/* Bento Login Card */}
        <div className="bg-[var(--color-surface)] rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_60px_rgba(15,31,51,0.08)] border border-[var(--color-border)]/50 ring-1 ring-slate-900/5 dark:ring-white/5 relative overflow-hidden">
          
          {/* Subtle accent line top */}
          

          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Bon retour</h2>
            <p className="text-[var(--color-text-soft)] text-sm font-medium">
              Authentification sécurisée au portail
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="login-email" className="sr-only">Adresse Email</label>
                <div className="relative group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MailIcon size={18} className="text-slate-400 group-focus-within:text-[var(--color-accent)] transition-colors" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse email"
                    required
                    aria-invalid={Boolean(error)}
                    className="h-14 w-full pl-11 pr-4 bg-[var(--color-surface-muted)]/60 hover:bg-[var(--color-surface-muted)] border border-transparent focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] rounded-2xl outline-none text-[var(--color-text)] placeholder:text-slate-400 font-medium transition-all shadow-sm focus:shadow-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">Mot de passe</label>
                <div className="relative group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-[var(--color-accent)] transition-colors" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    required
                    aria-invalid={Boolean(error)}
                    className="h-14 w-full pl-11 pr-12 bg-[var(--color-surface-muted)]/60 hover:bg-[var(--color-surface-muted)] border border-transparent focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] rounded-2xl outline-none text-[var(--color-text)] placeholder:text-slate-400 font-medium transition-all shadow-sm focus:shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[var(--color-text)] transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50 flex items-center gap-3 animate-fade-in">
                <ShieldCheck className="text-rose-500 shrink-0" size={18} />
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400 leading-tight">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative w-full h-14 flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:brightness-110 active:scale-[0.98] text-white font-semibold rounded-2xl transition-all disabled:opacity-70 border border-transparent shadow-[0_8px_20px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span>Connexion</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]/50 text-center">
            <p className="text-xs text-[var(--color-text-soft)] font-medium flex items-center justify-center gap-1">
              <ShieldCheck size={14} /> Connexion chiffrée de bout en bout
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
