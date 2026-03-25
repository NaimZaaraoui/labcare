'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, FlaskConical, Coins, Info } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';

export function LabSettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({
    sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
    amount_unit: 'DA'
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
          amount_unit: data.amount_unit || 'DA'
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
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
    } catch (e) {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sample Types Configuration */}
        <div className="bento-panel p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <FlaskConical size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Types d'Échantillons</h3>
              <p className="text-sm text-slate-500 font-medium">Définissez les options disponibles pour les tests.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Liste des échantillons (séparés par des virgules)</label>
              <textarea
                value={settings.sample_types}
                onChange={(e) => setSettings({ ...settings, sample_types: e.target.value })}
                className="input-premium min-h-[120px] bg-slate-50/50 py-4 font-medium"
                placeholder="Ex: Sang total, Urine, LCR..."
              />
            </div>
            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tight">
                Ces types apparaîtront sous forme de liste déroulante lors de la configuration de vos analyses dans le catalogue.
              </p>
            </div>
          </div>
        </div>

        {/* Currency Configuration */}
        <div className="bento-panel p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Unité Monétaire</h3>
              <p className="text-sm text-slate-500 font-medium">Utilisée pour les tarifs et le recouvrement.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Symbole ou Unité (ex: DA, €, $)</label>
              <input
                value={settings.amount_unit}
                onChange={(e) => setSettings({ ...settings, amount_unit: e.target.value })}
                className="input-premium h-14 bg-slate-50/50 font-black text-center"
                placeholder="DA"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary h-14 px-10 shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          <span className="font-black uppercase tracking-widest text-sm">Enregistrer les réglages</span>
        </button>
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}
