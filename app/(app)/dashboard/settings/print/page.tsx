import { getSettings } from '@/lib/settings';
import { PrintSettingsForm } from './PrintSettingsForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SETTINGS_KEYS = [
  'lab_name', 'lab_subtitle', 'lab_parent',
  'lab_address_1', 'lab_address_2', 'lab_phone', 'lab_email',
  'lab_bio_name', 'lab_bio_title', 'lab_bio_onmpt',
  'lab_footer_text', 'lab_stamp_image', 'lab_bio_signature', 'tat_warn', 'tat_alert',
];

export default async function PrintSettingsPage() {
  const settings = await getSettings(SETTINGS_KEYS);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 pb-24">
      <div>
        <Link
          href="/dashboard/settings"
          className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all mb-4"
        >
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
            <ArrowLeft size={16} />
          </div>
          <span className="text-xs uppercase tracking-widest">Paramètres</span>
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Modèles d&apos;impression</h1>
        <p className="text-slate-500 font-medium mt-1">
          Ces informations apparaissent sur chaque rapport et enveloppe imprimés.
        </p>
      </div>

      <PrintSettingsForm initialSettings={settings} />
    </div>
  );
}
