'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Building2, UserCog, Database, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

type Step = 'welcome' | 'lab' | 'admin' | 'demo' | 'complete';

interface LabData {
  labName: string;
  labSubtitle: string;
  labParent: string;
  labAddress1: string;
  labAddress2: string;
  labPhone: string;
  labEmail: string;
  labBioName: string;
  labBioTitle: string;
}

interface AdminData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: 'welcome', title: 'Bienvenue', icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'lab', title: 'Laboratoire', icon: <Building2 className="w-5 h-5" /> },
  { id: 'admin', title: 'Administrateur', icon: <UserCog className="w-5 h-5" /> },
  { id: 'demo', title: 'Données', icon: <Database className="w-5 h-5" /> },
  { id: 'complete', title: 'Terminé', icon: <CheckCircle2 className="w-5 h-5" /> },
];

const inputClass = 'w-full px-4 py-3 bg-[var(--color-surface)]/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:bg-[var(--color-surface)]/15 transition-colors';

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  const [labData, setLabData] = useState<LabData>({
    labName: '',
    labSubtitle: 'Service de Laboratoire',
    labParent: '',
    labAddress1: '',
    labAddress2: '',
    labPhone: '',
    labEmail: '',
    labBioName: '',
    labBioTitle: 'Docteur',
  });

  const [adminData, setAdminData] = useState<AdminData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [includeDemo, setIncludeDemo] = useState(true);

  // 🔒 Guard: check if setup was already done and redirect if so
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/setup');
        const data = await res.json();
        if (data.setupDone) {
          router.replace('/login');
        }
      } catch {
        // If check fails, allow wizard to proceed — API will still block if needed
      } finally {
        setChecking(false);
      }
    }
    checkSetup();
  }, [router]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  async function handleNext() {
    setError('');

    if (currentStep === 'welcome') {
      setCurrentStep('lab');
    } else if (currentStep === 'lab') {
      if (!labData.labName.trim()) {
        setError('Le nom du laboratoire est requis.');
        return;
      }
      setCurrentStep('admin');
    } else if (currentStep === 'admin') {
      if (!adminData.name.trim() || !adminData.email.trim() || !adminData.password.trim()) {
        setError('Tous les champs sont requis.');
        return;
      }
      if (adminData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (adminData.password !== adminData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      setCurrentStep('demo');
    } else if (currentStep === 'demo') {
      setLoading(true);
      try {
        // ✅ Single atomic POST — all or nothing
        const res = await fetch('/api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...labData,
            adminName: adminData.name,
            adminEmail: adminData.email,
            adminPassword: adminData.password,
            includeDemo,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erreur lors de la configuration.');
          return;
        }

        setCurrentStep('complete');
      } catch {
        setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
      setError('');
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)]/10  rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg rotate-3">
          <FlaskConical size={32} className="text-white" />
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              idx <= currentStepIndex
                ? 'bg-indigo-600 text-white'
                : 'bg-[var(--color-surface)]/20 text-white/50'
            }`}>
              {idx < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 transition-colors ${idx < currentStepIndex ? 'bg-indigo-600' : 'bg-[var(--color-surface)]/20'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Welcome */}
      {currentStep === 'welcome' && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Configuration de NexLab</h1>
          <p className="text-white/70 mb-6">
            Ce guide va vous aider à configurer votre laboratoire en quelques étapes simples.
          </p>
          <div className="text-left bg-[var(--color-surface)]/5 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Informations du laboratoire</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <UserCog className="w-4 h-4 text-indigo-400" />
              <span>Compte administrateur principal</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Données de démonstration (optionnel)</span>
            </div>
          </div>
        </div>
      )}

      {/* Step: Lab */}
      {currentStep === 'lab' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white text-center mb-4">Informations du Laboratoire</h2>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Nom du laboratoire <span className="text-red-400">*</span></label>
            <input type="text" value={labData.labName} onChange={(e) => setLabData({ ...labData, labName: e.target.value })} className={inputClass} placeholder="ex: CSSB GALLEL" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Sous-titre</label>
            <input type="text" value={labData.labSubtitle} onChange={(e) => setLabData({ ...labData, labSubtitle: e.target.value })} className={inputClass} placeholder="ex: Service de Laboratoire" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Structure parente</label>
            <input type="text" value={labData.labParent} onChange={(e) => setLabData({ ...labData, labParent: e.target.value })} className={inputClass} placeholder="ex: Hôpital Menzel Bouzaïene" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Adresse</label>
              <input type="text" value={labData.labAddress1} onChange={(e) => setLabData({ ...labData, labAddress1: e.target.value })} className={inputClass} placeholder="Rue, Quartier" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Ville / Gouvernorat</label>
              <input type="text" value={labData.labAddress2} onChange={(e) => setLabData({ ...labData, labAddress2: e.target.value })} className={inputClass} placeholder="Sfax, Tunis..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Téléphone</label>
              <input type="text" value={labData.labPhone} onChange={(e) => setLabData({ ...labData, labPhone: e.target.value })} className={inputClass} placeholder="+216 XX XXX XXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input type="email" value={labData.labEmail} onChange={(e) => setLabData({ ...labData, labEmail: e.target.value })} className={inputClass} placeholder="lab@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Nom du biologiste</label>
              <input type="text" value={labData.labBioName} onChange={(e) => setLabData({ ...labData, labBioName: e.target.value })} className={inputClass} placeholder="Prénom NOM" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Titre</label>
              <select value={labData.labBioTitle} onChange={(e) => setLabData({ ...labData, labBioTitle: e.target.value })} className={inputClass}>
                <option value="Docteur" className="text-black">Docteur</option>
                <option value="Professeur" className="text-black">Professeur</option>
                <option value="Dr." className="text-black">Dr.</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step: Admin */}
      {currentStep === 'admin' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white text-center mb-4">Compte Administrateur</h2>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Nom complet <span className="text-red-400">*</span></label>
            <input type="text" value={adminData.name} onChange={(e) => setAdminData({ ...adminData, name: e.target.value })} className={inputClass} placeholder="Votre nom" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email <span className="text-red-400">*</span></label>
            <input type="email" value={adminData.email} onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} className={inputClass} placeholder="admin@laboratoire.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Mot de passe <span className="text-red-400">*</span></label>
            <input type="password" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} className={inputClass} placeholder="Minimum 6 caractères" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Confirmer le mot de passe <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={adminData.confirmPassword}
              onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
              className={`${inputClass} ${adminData.confirmPassword && adminData.password !== adminData.confirmPassword ? 'border-red-400/70' : ''}`}
              placeholder="Répétez le mot de passe"
            />
            {adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
              <p className="text-xs text-red-300 mt-1">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <p className="text-xs text-white/50">
            Vous devrez changer ce mot de passe lors de la première connexion.
          </p>
        </div>
      )}

      {/* Step: Demo */}
      {currentStep === 'demo' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white text-center mb-4">Données de Démarrage</h2>

          <div className="bg-[var(--color-surface)]/5 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="w-5 h-5 rounded border-white/30 bg-[var(--color-surface)]/10 text-[var(--color-accent)] focus:ring-indigo-500"
              />
              <div>
                <span className="text-white font-medium">Inclure les données de démonstration</span>
                <p className="text-xs text-white/50">
                  Crée un catalogue de tests (NFS, Biochimie) pour démarrer rapidement.
                </p>
              </div>
            </label>
          </div>

          {includeDemo && (
            <div className="bg-indigo-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-sm text-white/80 font-medium">Inclus :</p>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• 2 catégories : Hématologie, Biochimie</li>
                <li>• 6 tests : Hémoglobine, Leucocytes, Plaquettes, Glycémie, Urée, Créatinine</li>
                <li>• Valeurs normales par sexe préconfigurées</li>
              </ul>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4">
            <p className="text-sm text-amber-200/80">
              ⚠️ Cette étape est irréversible. Vérifiez bien vos informations avant de continuer.
            </p>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {currentStep === 'complete' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">NexLab est prêt !</h2>
          <p className="text-white/70 mb-6">
            Votre laboratoire a été configuré avec succès.
          </p>
          <div className="bg-[var(--color-surface)]/5 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-white/60 mb-1">Compte administrateur :</p>
            <p className="text-white font-mono text-sm">{adminData.email}</p>
            <p className="text-xs text-amber-300/70 mt-2">
              Pensez à changer votre mot de passe lors de la première connexion.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-colors flex items-center gap-2 mx-auto"
          >
            Se connecter
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      {currentStep !== 'complete' && (
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${
              currentStepIndex === 0
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white hover:bg-[var(--color-surface)]/10'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Configuration en cours...
              </>
            ) : (
              <>
                {currentStep === 'demo' ? 'Lancer la configuration' : 'Continuer'}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}