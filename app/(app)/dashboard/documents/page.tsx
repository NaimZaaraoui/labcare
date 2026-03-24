'use client';

import React from 'react';
import { FileText, Mail, Printer, Files } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Documents & Papeterie</h1>
        <p className="text-slate-500 font-medium mt-1">Gérez et imprimez vos documents administratifs et modèles.</p>
      </div>

      {/* Grille des documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Carte : Enveloppe Générique */}
        <Link href="/print/envelope" className="group block h-full">
          <div className="bento-panel p-8 group flex flex-col gap-6 relative overflow-hidden bg-white hover:shadow-2xl hover:border-indigo-100 transition-all h-full">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Mail size={28} />
              </div>
              <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                A4 Portrait
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase leading-tight">
                Enveloppe (Gabarit)
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Modèle d&apos;enveloppe &quot;Pochette&quot; verticale avec champs vides pour écriture manuelle. Format A4 standard.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-sm font-black text-indigo-600 group-hover:gap-3 transition-all">
                <Printer size={16} />
                <span>Imprimer le modèle</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                <Printer size={18} />
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-indigo-100 opacity-0 group-hover:opacity-20 transition-opacity blur-3xl pointer-events-none" />
          </div>
        </Link>
        
        {/* Placeholder pour futures documents */}
        <div className="bento-panel p-8 border-dashed border-2 flex flex-col items-center justify-center text-center gap-4 opacity-40 cursor-not-allowed bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FileText size={28} />
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">D&apos;autres documents bientôt...</p>
        </div>

      </div>
    </div>
  );
}
