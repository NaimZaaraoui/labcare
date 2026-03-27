'use client';

import { TestsList } from '@/components/tests/TestsList';
import { Beaker, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      <section className="bento-panel px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
                <ArrowLeft size={16} />
              </span>
              Paramètres
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Beaker size={22} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-text)]">Catalogue d&apos;analyses</h1>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                  Gérer les paramètres biologiques et les plages de référence.
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </section>

      <TestsList />
    </div>
  );
}
