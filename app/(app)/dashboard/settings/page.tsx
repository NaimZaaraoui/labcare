'use client';

import { 
  Sparkles, 
  Layers, 
  Beaker, 
  Users, 
  Settings, 
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Database,
  Printer
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role !== 'ADMIN') {
    return null;
  }

  const settingsGroups = [
    {
      title: "Configuration des analyses",
      items: [
        {
          title: "Raccourcis & Bilans",
          description: "Gérez vos groupes de tests rapides et bilans standards",
          icon: Sparkles,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          href: "/dashboard/settings/bilans"
        },
        {
          title: "Catalogue d'analyses",
          description: "Hiérarchie des catégories et ordre d'affichage",
          icon: Layers,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          href: "/tests/ordering"
        },
        {
          title: "Modèles d'Impression",
          description: "Personnalisation des en-têtes et pieds de page",
          icon: Printer,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          href: "/dashboard/settings/print"
        },
        {
          title: "Configuration Métier",
          description: "Types d'échantillons et paramètres financiers",
          icon: Beaker,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          href: "/dashboard/settings/lab"
        },
      ]
    },
    {
      title: "Système & Sécurité",
      items: [
        {
          title: "Gestion du Personnel",
          description: "Contrôle des accès, rôles et comptes utilisateurs",
          icon: Users,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          href: "/dashboard/users"
        },
        {
          title: "Maintenance Base de Données",
          description: "Sauvegardes, imports et nettoyage des logs",
          icon: Database,
          color: "text-rose-600",
          bgColor: "bg-rose-50",
          href: "/dashboard/settings/database"
        },
        {
          title: "Journal d'Audit",
          description: "Historique complet des actions administratives",
          icon: ShieldCheck,
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          href: "/dashboard/settings/audit"
        }
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <button
              onClick={() => router.push('/')}
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
                <ArrowLeft size={16} />
              </span>
              Tableau de bord
            </button>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Paramètres système</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Configurer le fonctionnement global de NexLab CSSB.</p>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-700 lg:flex">
            <Settings className="h-4 w-4 animate-spin-slow" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Mode administrateur</span>
          </div>
        </div>
      </section>

      <div className="grid gap-12">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-6">
            <h2 className="flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span className="w-8 h-[1px] bg-slate-100" />
              {group.title}
              <span className="flex-1 h-[1px] bg-slate-100" />
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => router.push(item.href)}
                  className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border bg-white p-6 text-left shadow-[0_8px_24px_rgba(15,31,51,0.05)] transition-all hover:ring-2 hover:ring-indigo-100"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bgColor} ${item.color} transition-all group-hover:scale-105`}>
                    <item.icon size={24} />
                  </div>
                  
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {item.title}
                    </h3>
                    <p className="pr-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>

                  <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300 shadow-sm transition-all group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white">
                     <ChevronRight size={20} />
                  </div>

                  <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${item.bgColor} opacity-0 group-hover:opacity-20 transition-opacity blur-2xl`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
