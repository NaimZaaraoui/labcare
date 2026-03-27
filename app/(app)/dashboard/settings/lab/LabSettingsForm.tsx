'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, FlaskConical, Coins, Info, Building2, MapPin, UserCheck, Clock } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';

export function LabSettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({
    sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
    amount_unit: 'DA',
    lab_name: '',
    lab_subtitle: '',
    lab_parent: '',
    lab_address_1: '',
    lab_address_2: '',
    lab_phone: '',
    lab_email: '',
    lab_bio_title: 'Docteur',
    lab_bio_name: '',
    lab_bio_onmpt: '',
    tat_warn: '45',
    tat_alert: '60'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          sample_types: data.sample_types || 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
          amount_unit: data.amount_unit || 'DA',
          lab_name: data.lab_name || '',
          lab_subtitle: data.lab_subtitle || '',
          lab_parent: data.lab_parent || '',
          lab_address_1: data.lab_address_1 || '',
          lab_address_2: data.lab_address_2 || '',
          lab_phone: data.lab_phone || '',
          lab_email: data.lab_email || '',
          lab_bio_title: data.lab_bio_title || 'Docteur',
          lab_bio_name: data.lab_bio_name || '',
          lab_bio_onmpt: data.lab_bio_onmpt || '',
          tat_warn: data.tat_warn || '45',
          tat_alert: data.tat_alert || '60'
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Paramètres enregistrés avec succès' });
      } else {
        const data = await res.json();
        setNotification({ type: 'error', message: data.error || 'Erreur lors de l\'enregistrement' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Erreur réseau' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const inputClass = 'input-premium h-11 w-full';

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: Identité et Coordonnées */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
        
        {/* Identité du laboratoire */}
        <div className="rounded-3xl border bg-white p-6 sm:p-7 space-y-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Identité du laboratoire</h3>
              <p className="text-sm text-slate-500">Informations principales sur l&apos;établissement.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="form-label mb-1.5">
                Nom du laboratoire <span className="text-rose-400">*</span>
              </label>
              <input
                className={inputClass}
                value={settings.lab_name}
                onChange={e => setSettings({ ...settings, lab_name: e.target.value })}
                placeholder="CSSB GALLEL"
              />
            </div>
            <div>
              <label className="form-label mb-1.5">Sous-titre</label>
              <input
                className={inputClass}
                value={settings.lab_subtitle}
                onChange={e => setSettings({ ...settings, lab_subtitle: e.target.value })}
                placeholder="Service de Biologie Médicale"
              />
            </div>
            <div>
              <label className="form-label mb-1.5">Établissement parent</label>
              <input
                className={inputClass}
                value={settings.lab_parent}
                onChange={e => setSettings({ ...settings, lab_parent: e.target.value })}
                placeholder="Hôpital / Clinique (optionnel)"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="rounded-3xl border bg-white p-6 sm:p-7 space-y-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Coordonnées</h3>
              <p className="text-sm text-slate-500">Adresse et moyens de contact.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="form-label mb-1.5">Adresse ligne 1</label>
              <input className={inputClass} value={settings.lab_address_1} onChange={e => setSettings({ ...settings, lab_address_1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label mb-1.5">Adresse ligne 2</label>
              <input className={inputClass} value={settings.lab_address_2} onChange={e => setSettings({ ...settings, lab_address_2: e.target.value })} />
            </div>
            <div>
              <label className="form-label mb-1.5">Téléphone</label>
              <input className={inputClass} value={settings.lab_phone} onChange={e => setSettings({ ...settings, lab_phone: e.target.value })} placeholder="+216 XX XXX XXX" />
            </div>
            <div>
              <label className="form-label mb-1.5">Email</label>
              <input className={inputClass} type="email" value={settings.lab_email} onChange={e => setSettings({ ...settings, lab_email: e.target.value })} placeholder="labo@example.com" />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: Settings Métier */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
        
        {/* Sample Types Configuration */}
        <div className="rounded-3xl border bg-white p-6 sm:p-7 space-y-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <FlaskConical size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Types d&apos;échantillons</h3>
              <p className="text-sm text-slate-500">Définir les options disponibles pour les tests.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="section-label ml-1">Liste (séparés par des virgules)</label>
              <textarea
                value={settings.sample_types}
                onChange={(e) => setSettings({ ...settings, sample_types: e.target.value })}
                className="input-premium min-h-[130px] bg-slate-50/50 py-4 font-medium"
                placeholder="Ex: Sang total, Urine, LCR..."
              />
            </div>
            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold text-indigo-700 leading-relaxed uppercase tracking-tight">
                Ces types apparaîtront sous forme de liste déroulante lors de la configuration de vos analyses dans le catalogue.
              </p>
            </div>
          </div>
        </div>

        {/* Biologiste & TAT & Monnaie */}
        <div className="flex flex-col gap-8">
          
          <div className="rounded-3xl border bg-white p-6 sm:p-7 space-y-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Biologiste responsable</h3>
                <p className="text-sm text-slate-500">Pour les rapports et l&apos;affichage global.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div>
                <label className="form-label mb-1.5">Titre</label>
                <select className={inputClass} value={settings.lab_bio_title} onChange={e => setSettings({ ...settings, lab_bio_title: e.target.value })}>
                  <option value="Docteur">Docteur</option>
                  <option value="Professeur">Professeur</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label mb-1.5">Nom complet</label>
                <input className={inputClass} value={settings.lab_bio_name} onChange={e => setSettings({ ...settings, lab_bio_name: e.target.value })} placeholder="Prénom NOM" />
              </div>
              <div className="md:col-span-3">
                <label className="form-label mb-1.5">N° ONMPT</label>
                <input className={inputClass} value={settings.lab_bio_onmpt} onChange={e => setSettings({ ...settings, lab_bio_onmpt: e.target.value })} placeholder="Numéro d&apos;inscription à l&apos;Ordre" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {/* Seuils TAT */}
            <div className="rounded-3xl border bg-white p-6 space-y-5 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Seuils TAT</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-amber-500 uppercase tracking-[0.12em] mb-1.5">Avertissement</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-14`} type="number" min="1" max="480" value={settings.tat_warn} onChange={e => setSettings({ ...settings, tat_warn: e.target.value })} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-amber-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-rose-500 uppercase tracking-[0.12em] mb-1.5">Dépassement</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-14`} type="number" min="1" max="480" value={settings.tat_alert} onChange={e => setSettings({ ...settings, tat_alert: e.target.value })} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-rose-500">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Configuration */}
            <div className="rounded-3xl border bg-white p-6 space-y-5 shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Monnaie</h3>
                </div>
              </div>

              <div>
                <label className="section-label ml-1">Symbole ou unité</label>
                <input
                  value={settings.amount_unit}
                  onChange={(e) => setSettings({ ...settings, amount_unit: e.target.value })}
                  className="input-premium mt-1.5 h-11 bg-slate-50/50 text-center font-semibold"
                  placeholder="DA"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="sticky bottom-8 flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex h-12 items-center gap-2 px-8 transition-all active:scale-95"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="text-sm font-semibold uppercase tracking-[0.12em]">Enregistrer les réglages</span>
        </button>
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}
