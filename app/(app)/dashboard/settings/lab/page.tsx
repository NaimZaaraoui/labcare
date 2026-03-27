'use client';

import { ArrowLeft, Beaker } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LabSettingsForm } from './LabSettingsForm';

export default function LabSettingsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
                <ArrowLeft size={16} />
              </span>
              Retour aux paramètres
            </button>
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
