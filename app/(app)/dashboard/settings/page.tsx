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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if ((session?.user as any)?.role !== 'ADMIN') {
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
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-all mb-4"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 shadow-sm transition-all group-hover:border-indigo-100">
               <ArrowLeft size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest">Tableau de bord</span>
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres Système</h1>
          <p className="text-slate-500 font-medium mt-1">Configurez le fonctionnement global de NexLab CSSB.</p>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
          <Settings className="w-4 h-4 animate-spin-slow" />
          <span className="text-xs font-black uppercase tracking-wider">Mode Administrateur</span>
        </div>
      </div>

      <div className="grid gap-12">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-slate-100" />
              {group.title}
              <span className="flex-1 h-[1px] bg-slate-100" />
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => router.push(item.href)}
                  className="bento-panel p-8 group text-left flex flex-col gap-6 relative overflow-hidden transition-all hover:ring-2 hover:ring-indigo-100"
                >
                  <div className={`w-14 h-14 rounded-2xl ${item.bgColor} ${item.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                    <item.icon size={28} />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed pr-6">
                      {item.description}
                    </p>
                  </div>

                  <div className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm">
                     <ChevronRight size={20} />
                  </div>

                  {/* Subtle Background Accent */}
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
