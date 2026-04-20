'use client';

import {
  Sparkles,
  Layers,
  Beaker,
  Users,
  Settings,
  ChevronRight,
  ShieldCheck,
  Database,
  Printer,
  Key,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, role, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') {
    return null;
  }

  const settingsGroups = [
    {
      title: 'Configuration des analyses',
      items: [
        {
          title: 'Raccourcis & Bilans',
          description: 'Gérez vos groupes de tests rapides et bilans standards',
          icon: Sparkles,
          href: '/dashboard/settings/bilans',
        },
        {
          title: "Catalogue d'analyses",
          description: "Hiérarchie des catégories et ordre d'affichage",
          icon: Layers,
          href: '/tests/ordering',
        },
        {
          title: "Modèles d'Impression",
          description: 'Personnalisation des en-têtes et pieds de page',
          icon: Printer,
          href: '/dashboard/settings/print',
        },
        {
          title: 'Configuration Métier',
          description: "Types d'échantillons et paramètres financiers",
          icon: Beaker,
          href: '/dashboard/settings/lab',
        },
      ],
    },
    {
      title: 'Système & Sécurité',
      items: [
        {
          title: 'Gestion du Personnel',
          description: 'Contrôle des accès, rôles et comptes utilisateurs',
          icon: Users,
          href: '/dashboard/users',
        },
        {
          title: 'Maintenance Base de Données',
          description: 'Sauvegardes, imports et nettoyage des logs',
          icon: Database,
          href: '/dashboard/settings/database',
        },
        {
          title: "Journal d'Audit",
          description: 'Historique complet des actions administratives',
          icon: ShieldCheck,
          href: '/dashboard/settings/audit',
        },
        {
          title: 'Licence NexLab',
          description: 'Status et renouvellement (Abonnement)',
          icon: Key, // Need to import Key from lucide-react
          href: '/dashboard/settings/license',
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageBackLink href="/" />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Paramètres système</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Configurer le fonctionnement global de NexLab CSSB.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-slate-700 lg:flex">
            <Settings className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Mode administrateur</span>
          </div>
        </div>
      </section>

      <div className="grid gap-10">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-5">
            <h2 className="flex items-center gap-3 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span className="h-px w-8 bg-slate-200" />
              {group.title}
              <span className="h-px flex-1 bg-slate-200" />
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="group relative flex flex-col gap-5 rounded-xl border bg-[var(--color-surface)] p-5 text-left shadow-[0_2px_8px_rgba(15,31,51,0.03)] transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-700">
                    <item.icon size={20} />
                  </div>

                  <div>
                    <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">{item.title}</h3>
                    <p className="pr-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>

                  <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-slate-400 transition-colors group-hover:bg-[var(--color-surface-muted)] group-hover:text-slate-700">
                    <ChevronRight size={18} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
