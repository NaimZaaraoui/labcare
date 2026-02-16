
'use client';

import { 
  Sparkles, 
  Layers, 
  Beaker, 
  Users, 
  Settings, 
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const settingsGroups = [
    {
      title: "Configuration des analyses",
      items: [
        {
          title: "Raccourcis & Bilans",
          description: "Gérez vos groupes de tests rapides et bilans standards",
          icon: Sparkles,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          href: "/dashboard/settings/bilans"
        },
        {
          title: "Organisation du Laboratoire",
          description: "Hiérarchie des catégories et ordre d'affichage",
          icon: Layers,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          href: "/tests/ordering"
        },
      ]
    },
    {
      title: "Système & Données",
      items: [
        {
          title: "Tests & Examens",
          description: "Catalogue complet des analyses disponibles",
          icon: Beaker,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          href: "/dashboard/tests" // Assumed path
        },
        {
          title: "Utilisateurs",
          description: "Gestion des accès et du personnel",
          icon: Users,
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          href: "/dashboard/users"
        }
      ]
    }
  ];

  return (
    <div className="p-8 space-y-10 animate-fade-in max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
           <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres</h1>
          <p className="text-slate-500 font-medium">Configuration générale du laboratoire</p>
        </div>
      </div>

      <div className="grid gap-10">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => router.push(item.href)}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all group text-left flex items-center gap-6"
                >
                  <div className={`w-16 h-16 rounded-2xl ${item.bgColor} ${item.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <item.icon size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                     <ChevronRight size={20} />
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
