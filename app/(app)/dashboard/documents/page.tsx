'use client';

import React from 'react';
import { FileText, Mail, Printer } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Documents & papeterie</h1>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Gérer et imprimer les modèles administratifs du laboratoire.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/print/envelope" className="group block h-full">
          <div className="flex h-full flex-col gap-5 rounded-3xl border bg-white p-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)] transition-all hover:border-indigo-200 hover:bg-[var(--color-surface-muted)]">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition-transform group-hover:scale-105">
                <Mail size={24} />
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                A4 Portrait
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold uppercase leading-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                Enveloppe (Gabarit)
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Modèle d&apos;enveloppe &quot;Pochette&quot; verticale avec champs vides pour écriture manuelle. Format A4 standard.
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 transition-all group-hover:gap-3">
                <Printer size={16} />
                <span>Imprimer le modèle</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                <Printer size={18} />
              </div>
            </div>
          </div>
        </Link>

        <div className="flex cursor-not-allowed flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-[var(--color-surface-muted)] p-8 text-center opacity-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileText size={24} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
            D&apos;autres documents bientôt...
          </p>
        </div>
      </section>
    </div>
  );
}
