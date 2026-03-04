'use client';

import React from 'react';
import { FileText, Mail, Printer, TicketCheck } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
       {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Documents & Papeterie
          </h1>
          <p className="text-slate-500 mt-1">
            Gérez et imprimez vos documents administratifs et modèles.
          </p>
        </div>
      </div>

      {/* Grid des documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Carte : Enveloppe Générique */}
        <Link href="/print/envelope" className="group block h-full">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail size={24} />
                    </div>
                    <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        A4 Portrait
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Enveloppe (Gabarit)
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                    Modèle d&apos;enveloppe "Pochette" verticale avec champs vides pour écriture manuelle. Format A4 standard.
                </p>

                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:gap-3 transition-all">
                    <Printer size={16} />
                    <span>Imprimer le modèle</span>
                </div>
            </div>
        </Link>
        
        {/* Carte : Bons de Retrait Génériques */}
        <Link href="/print/recu-generique" className="group block h-full">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TicketCheck size={24} />
                    </div>
                    <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        6 / A4
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    Bons de Retrait (Génériques)
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                    6 bons vierges par page A4 à remplir manuellement — Nom du patient, ID paillasse, date et examens.
                </p>

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:gap-3 transition-all">
                    <Printer size={16} />
                    <span>Imprimer les bons</span>
                </div>
            </div>
        </Link>

      </div>
    </div>
  );
}
