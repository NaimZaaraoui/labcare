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
    <div className="mx-auto max-w-[1100px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <Link
          href="/dashboard/settings"
          className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
            <ArrowLeft size={16} />
          </div>
          <span>Paramètres</span>
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Modèles d&apos;impression</h1>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Ces informations apparaissent sur chaque rapport et enveloppe imprimée.
        </p>
      </section>

      <PrintSettingsForm initialSettings={settings} />
    </div>
  );
}
