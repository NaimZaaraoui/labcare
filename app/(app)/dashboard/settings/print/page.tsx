import { getSettings } from '@/lib/settings';
import { PrintSettingsForm } from './PrintSettingsForm';
import { PageBackLink } from '@/components/ui/PageBackLink';

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
        <PageBackLink href="/dashboard/settings" />
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Modèles d&apos;impression</h1>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Ces informations apparaissent sur chaque rapport et enveloppe imprimée.
        </p>
      </section>

      <PrintSettingsForm initialSettings={settings} />
    </div>
  );
}
