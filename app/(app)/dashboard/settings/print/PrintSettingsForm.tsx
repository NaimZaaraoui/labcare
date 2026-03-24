'use client';

import { useState } from 'react';
import { Save, Loader2, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

export function PrintSettingsForm({ initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stampUrl, setStampUrl] = useState(initialSettings.lab_stamp_image || '');
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [stampError, setStampError] = useState('');
  const [signatureUrl, setSignatureUrl] = useState(initialSettings.lab_bio_signature || '');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [initialValues, setInitialValues] = useState<Record<string, string>>(initialSettings);

  const isDirty = Object.keys(values).some(k => values[k] !== initialValues[k]);

  const set = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde.');
        return;
      }
      setValues(data);
      setInitialValues(data);
      setSuccess(true);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const handleStampUpload = async (file: File) => {
    setUploadingStamp(true);
    setStampError('');
    try {
      const fd = new FormData();
      fd.append('stamp', file);
      const res = await fetch('/api/settings/stamp', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setStampError(data.error || 'Erreur lors du chargement');
        return;
      }
      const newUrl = data.url + '?t=' + Date.now();
      setStampUrl(newUrl);
      const newValues = { ...values, lab_stamp_image: newUrl };
      setValues(newValues);
    } catch {
      setStampError('Erreur réseau lors de l\'upload');
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleStampDelete = async () => {
    try {
      const res = await fetch('/api/settings/stamp', { method: 'DELETE' });
      if (res.ok) {
        setStampUrl('');
        setValues(prev => ({ ...prev, lab_stamp_image: '' }));
      }
    } catch (e) {
      console.error('Erreur suppression cachet:', e);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    setUploadingSignature(true);
    setSignatureError('');
    try {
      const fd = new FormData();
      fd.append('signature', file);
      const res = await fetch('/api/settings/signature', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setSignatureError(data.error || 'Erreur lors du chargement');
        return;
      }
      const newUrl = data.url + '?t=' + Date.now();
      setSignatureUrl(newUrl);
      const newValues = { ...values, lab_bio_signature: newUrl };
      setValues(newValues);
    } catch {
      setSignatureError('Erreur réseau lors de l\'upload');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSignatureDelete = async () => {
    try {
      const res = await fetch('/api/settings/signature', { method: 'DELETE' });
      if (res.ok) {
        setSignatureUrl('');
        setValues(prev => ({ ...prev, lab_bio_signature: '' }));
      }
    } catch (e) {
      console.error('Erreur suppression signature:', e);
    }
  };

  const inputClass = 'input-premium w-full';

  return (
    <div className="space-y-6">
      {/* Section 0 — Cachet Officiel */}
      <div className="bento-panel p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-100" />
          Cachet officiel du laboratoire
          <span className="flex-1 h-[1px] bg-slate-100" />
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative group">
            {stampUrl ? (
              <div className="relative group">
                <img 
                  src={stampUrl} 
                  alt="Cachet actuel"
                  className="w-32 h-32 object-contain bg-slate-50 border border-slate-200 rounded-2xl p-2 shadow-inner"
                />
                <button
                  onClick={handleStampDelete}
                  className="absolute -top-2 -right-2 p-1.5 bg-rose-100 text-rose-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200"
                  title="Supprimer le cachet"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-2">
                <ImageIcon size={32} strokeWidth={1.5} />
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Aucun<br/>cachet</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div 
              className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${uploadingStamp ? 'bg-slate-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30'}
              `}
              onClick={() => document.getElementById('stamp-upload')?.click()}
            >
              <input 
                id="stamp-upload"
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleStampUpload(file);
                }}
              />
              <div className="flex flex-col items-center gap-2">
                {uploadingStamp ? (
                  <>
                    <Loader2 size={24} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-indigo-600">Chargement en cours...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-900">Cliquez ou glissez votre cachet ici</p>
                    <p className="text-[10px] text-slate-400 font-medium">JPG, PNG ou WebP — Max 2MB</p>
                  </>
                )}
              </div>
            </div>
            
            {stampError && (
              <p className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                ⚠️ {stampError}
              </p>
            )}

            <p className="text-[11px] text-slate-400 font-medium italic">
              Si aucun cachet n'est chargé, un espace vide sera réservé 
              sur le rapport pour l'apposition manuelle du cachet.
            </p>
          </div>
        </div>
      </div>

      {/* Section 0.5 — Signature Officielle */}
      <div className="bento-panel p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-100" />
          Signature du biologiste
          <span className="flex-1 h-[1px] bg-slate-100" />
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative group">
            {signatureUrl ? (
              <div className="relative group">
                <img 
                  src={signatureUrl} 
                  alt="Signature actuelle"
                  className="w-32 h-32 object-contain bg-slate-50 border border-slate-200 rounded-2xl p-2 shadow-inner"
                />
                <button
                  onClick={handleSignatureDelete}
                  className="absolute -top-2 -right-2 p-1.5 bg-rose-100 text-rose-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200"
                  title="Supprimer la signature"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-2">
                <ImageIcon size={32} strokeWidth={1.5} />
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Aucune<br/>signature</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div 
              className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${uploadingSignature ? 'bg-slate-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30'}
              `}
              onClick={() => document.getElementById('signature-upload')?.click()}
            >
              <input 
                id="signature-upload"
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSignatureUpload(file);
                }}
              />
              <div className="flex flex-col items-center gap-2">
                {uploadingSignature ? (
                  <>
                    <Loader2 size={24} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-indigo-600">Chargement en cours...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-900">Cliquez ou glissez votre signature ici</p>
                    <p className="text-[10px] text-slate-400 font-medium">JPG, PNG ou WebP — Max 2MB</p>
                  </>
                )}
              </div>
            </div>
            
            {signatureError && (
              <p className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                ⚠️ {signatureError}
              </p>
            )}

            <p className="text-[11px] text-slate-400 font-medium italic">
              Cette signature sera superposée au cachet officiel sur tous les rapports validés.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 — Identité */}
      <div className="bento-panel p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-100" />
          Identité du laboratoire
          <span className="flex-1 h-[1px] bg-slate-100" />
        </h2>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Nom du laboratoire <span className="text-rose-400">*</span>
          </label>
          <input
            className={inputClass}
            value={values.lab_name ?? ''}
            onChange={e => set('lab_name', e.target.value)}
            placeholder="CSSB GALLEL"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sous-titre</label>
          <input
            className={inputClass}
            value={values.lab_subtitle ?? ''}
            onChange={e => set('lab_subtitle', e.target.value)}
            placeholder="Service de Biologie Médicale"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Établissement parent</label>
          <input
            className={inputClass}
            value={values.lab_parent ?? ''}
            onChange={e => set('lab_parent', e.target.value)}
            placeholder="Hôpital / Clinique (optionnel)"
          />
        </div>
      </div>

      {/* Section 2 — Coordonnées */}
      <div className="bento-panel p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-100" />
          Coordonnées
          <span className="flex-1 h-[1px] bg-slate-100" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Adresse ligne 1</label>
            <input className={inputClass} value={values.lab_address_1 ?? ''} onChange={e => set('lab_address_1', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Adresse ligne 2</label>
            <input className={inputClass} value={values.lab_address_2 ?? ''} onChange={e => set('lab_address_2', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Téléphone</label>
            <input className={inputClass} value={values.lab_phone ?? ''} onChange={e => set('lab_phone', e.target.value)} placeholder="+216 XX XXX XXX" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
            <input className={inputClass} type="email" value={values.lab_email ?? ''} onChange={e => set('lab_email', e.target.value)} placeholder="labo@example.com" />
          </div>
        </div>
      </div>

      {/* Section 3 — Biologiste */}
      <div className="bento-panel p-6 space-y-4">
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-3">
            <span className="w-6 h-[1px] bg-slate-100" />
            Biologiste responsable
            <span className="flex-1 h-[1px] bg-slate-100" />
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-4">Apparaît comme signataire sur chaque rapport.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Titre</label>
            <select className={inputClass} value={values.lab_bio_title ?? 'Docteur'} onChange={e => set('lab_bio_title', e.target.value)}>
              <option value="Docteur">Docteur</option>
              <option value="Professeur">Professeur</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nom complet</label>
            <input className={inputClass} value={values.lab_bio_name ?? ''} onChange={e => set('lab_bio_name', e.target.value)} placeholder="Prénom NOM" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">N° ONMPT</label>
            <input className={inputClass} value={values.lab_bio_onmpt ?? ''} onChange={e => set('lab_bio_onmpt', e.target.value)} placeholder="Numéro d'inscription à l'Ordre" />
          </div>
        </div>
      </div>

      {/* Section 4 — Rapport */}
      <div className="bento-panel p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-100" />
          Rapport
          <span className="flex-1 h-[1px] bg-slate-100" />
        </h2>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pied de page</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={values.lab_footer_text ?? ''}
            onChange={e => set('lab_footer_text', e.target.value)}
            placeholder="Texte affiché en bas de chaque rapport"
          />
        </div>
      </div>

      {/* Section 5 — Seuils TAT */}
      <div className="bento-panel p-6 space-y-4">
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-3">
            <span className="w-6 h-[1px] bg-slate-100" />
            Seuils TAT
            <span className="flex-1 h-[1px] bg-slate-100" />
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-4">Contrôlent les alertes de délai sur le tableau de bord.</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5">Seuil avertissement</label>
            <div className="relative">
              <input
                className={`${inputClass} pr-14`}
                type="number"
                min="1"
                max="480"
                value={values.tat_warn ?? '45'}
                onChange={e => set('tat_warn', e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-amber-500">min</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-rose-500 uppercase tracking-widest mb-1.5">Seuil dépassement</label>
            <div className="relative">
              <input
                className={`${inputClass} pr-14`}
                type="number"
                min="1"
                max="480"
                value={values.tat_alert ?? '60'}
                onChange={e => set('tat_alert', e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-rose-500">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col gap-3 sticky bottom-6">
        {isDirty && !success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-bold self-start">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Modifications non enregistrées
          </div>
        )}
        {error && (
          <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2">
            ✓ Paramètres enregistrés
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-primary w-full h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer les paramètres</>}
        </button>
      </div>
    </div>
  );
}
