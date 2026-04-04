'use client';

import { Beaker } from 'lucide-react';
import { LabSettingsForm } from './LabSettingsForm';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function LabSettingsPage() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href="/dashboard/settings" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Beaker size={22} />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                Configuration <span className="text-[var(--color-accent)]">métier</span>
              </h1>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Gérer les types d&apos;échantillons et les paramètres financiers.
            </p>
          </div>
        </div>
      </section>

      <LabSettingsForm />
    </div>
  );
}
