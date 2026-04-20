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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 0 — Cachet Officiel */}
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-3">
            <span className="w-6 h-[1px] bg-[var(--color-surface-muted)]" />
            Cachet officiel du laboratoire
            <span className="flex-1 h-[1px] bg-[var(--color-surface-muted)]" />
          </h2>

          <div className="flex flex-col gap-6 items-center">
            <div className="relative group">
              {stampUrl ? (
                <div className="relative group">
                  <img 
                    src={stampUrl} 
                    alt="Cachet actuel"
                    className="h-48 w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2 object-contain"
                  />
                  <button
                    onClick={handleStampDelete}
                    className="absolute -right-2 -top-2 rounded-full bg-rose-100 p-1.5 text-rose-600 opacity-0 transition-opacity hover:bg-rose-200 group-hover:opacity-100"
                    title="Supprimer le cachet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-300">
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-center px-4">Aucun cachet configuré</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-4">
              <div 
                className={`
                  relative cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-all
                  ${uploadingStamp ? 'border-slate-300 bg-[var(--color-surface-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-400 hover:bg-slate-50'}
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
                      <Loader2 size={24} className="animate-spin text-slate-600" />
                      <p className="text-xs font-semibold text-slate-700">Chargement en cours...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={24} className="text-slate-400" />
                      <p className="text-xs font-semibold text-[var(--color-text)]">Cliquez ou glissez votre cachet ici</p>
                      <p className="text-[10px] text-slate-400 font-medium">JPG, PNG ou WebP — Max 2MB</p>
                    </>
                  )}
                </div>
              </div>
              
              {stampError && (
                <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-500">
                  ⚠️ {stampError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 font-medium italic text-center text-balance mx-auto">
                Si aucun cachet n&apos;est chargé, un espace vide sera réservé sur le rapport pour l&apos;apposition manuelle du cachet.
              </p>
            </div>
          </div>
        </div>

        {/* Section 0.5 — Signature Officielle */}
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-3">
            <span className="w-6 h-[1px] bg-[var(--color-surface-muted)]" />
            Signature du biologiste
            <span className="flex-1 h-[1px] bg-[var(--color-surface-muted)]" />
          </h2>

          <div className="flex flex-col gap-6 items-center">
            <div className="relative group">
              {signatureUrl ? (
                <div className="relative group">
                  <img 
                    src={signatureUrl} 
                    alt="Signature actuelle"
                    className="h-48 w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2 object-contain"
                  />
                  <button
                    onClick={handleSignatureDelete}
                    className="absolute -right-2 -top-2 rounded-full bg-rose-100 p-1.5 text-rose-600 opacity-0 transition-opacity hover:bg-rose-200 group-hover:opacity-100"
                    title="Supprimer la signature"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-300">
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-center px-4">Aucune signature configurée</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-4">
              <div 
                className={`
                  relative cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-all
                  ${uploadingSignature ? 'border-slate-300 bg-[var(--color-surface-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-400 hover:bg-slate-50'}
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
                      <Loader2 size={24} className="animate-spin text-slate-600" />
                      <p className="text-xs font-semibold text-slate-700">Chargement en cours...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={24} className="text-slate-400" />
                      <p className="text-xs font-semibold text-[var(--color-text)]">Cliquez ou glissez votre signature ici</p>
                      <p className="text-[10px] text-slate-400 font-medium">JPG, PNG ou WebP — Max 2MB</p>
                    </>
                  )}
                </div>
              </div>
              
              {signatureError && (
                <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-500">
                  ⚠️ {signatureError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 font-medium italic text-center text-balance mx-auto">
                Cette signature sera superposée au cachet officiel sur tous les rapports validés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 — Rapport */}
      <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-3">
          <span className="w-6 h-[1px] bg-[var(--color-surface-muted)]" />
          Rapport
          <span className="flex-1 h-[1px] bg-[var(--color-surface-muted)]" />
        </h2>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.12em] mb-1.5">Pied de page global</label>
          <textarea
            className={`${inputClass} resize-none h-32`}
            value={values.lab_footer_text ?? ''}
            onChange={e => set('lab_footer_text', e.target.value)}
            placeholder="Texte affiché en bas de chaque rapport. Parfait pour les avertissements légaux ou notes aux patients."
          />
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col gap-3 sticky bottom-6">
        {isDirty && !success && (
          <div className="flex items-center gap-2 self-start rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Modifications non enregistrées
          </div>
        )}
        {error && (
          <p className="rounded-md border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>
        )}
        {success && (
          <p className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
            ✓ Paramètres d&apos;impression enregistrés
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-primary w-full h-14 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer les paramètres</>}
        </button>
      </div>
    </div>
  );
}
