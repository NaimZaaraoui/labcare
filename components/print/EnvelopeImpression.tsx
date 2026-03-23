'use client';

import React, { forwardRef } from 'react';
import { LucideMicroscope, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Analysis } from '@/lib/types';

interface EnvelopeImpressionProps {
  analysis?: Analysis;
  settings?: Record<string, string>;
}

/*
  ┌─────────────────────────────────────────────────┐
  │         DIMENSIONS POCHETTE A4 → DL             │
  │  Feuille A4 portrait : 210mm × 297mm            │
  │                                                 │
  │  Rabat   (haut)   : 67mm                        │
  │  Zone doc (centre): 210mm  (= hauteur A4)       │
  │  Fond    (bas)    : 20mm                        │
  │  Total vertical   : 67 + 210 + 20 = 297mm ✅   │
  │                                                 │
  │  Côté gauche      : 66mm (= (210-78)/2)  │
  │  Zone doc (centre): 78mm           │
  │  Côté droit       : 66mm                    │
  │  Total horizontal : 66+78+66=210mm ✅│
  └─────────────────────────────────────────────────┘
*/

export const EnvelopeImpression = forwardRef<HTMLDivElement, EnvelopeImpressionProps>(
  ({ analysis, settings }, ref) => {
    const LAB_NAME     = settings?.lab_name     || 'Laboratoire';
    const LAB_SUBTITLE = settings?.lab_subtitle || 'Service de Laboratoire';
    const LAB_ADDRESS  = [settings?.lab_address_1, settings?.lab_address_2].filter(Boolean).join(', ');
    const LAB_PHONE    = settings?.lab_phone    || '';
    const patientName = analysis
      ? `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim()
      : '................................................';

    const dailyId = analysis?.dailyId || '........';
    const dateStr = analysis
      ? format(new Date(analysis.creationDate), 'dd/MM/yyyy', { locale: fr })
      : '../../....';

    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed overflow-hidden"
      >

        {/* ═══════════════════════════════════════════════════════
            PAGE 1 : FACE EXTÉRIEURE (ce que voit le destinataire)
            La zone visible est le centre : 78mm × 210mm
            Elle commence à left: 66mm, top: 67mm
        ═══════════════════════════════════════════════════════ */}
        <div className="h-[297mm] w-[210mm] relative overflow-hidden border print:border-none">

          {/* ── MESSAGE BONNE SANTÉ — centré dans le rabat ── */}
          {/* Le rabat fait 67mm de haut × 74.25mm de large (zone centrale) */}



         <div
            className="absolute flex flex-col rotate-180 items-center justify-center gap-1.5"
            style={{
              top:    '5mm',
              left:   '67.875mm',
              width:  '74.25mm',
              height: '67mm',
            }}
          >
             
             <div className="border-2 border-slate-200 rounded-full w-24 h-24 flex flex-col items-center justify-center p-2 relative print:border-black/20">
                <div className="absolute inset-1 border border-slate-100 rounded-full print:border-black" />
                <LucideMicroscope size={16} className="text-slate-300 mb-1 print:text-black/40" />
                <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight print:text-black">
                  Prenez soin<br/>de vous
                </p>
                <div className="w-4 h-px bg-slate-200 my-1 print:bg-black/20" />
                <p className="text-[5px] font-medium text-slate-400 uppercase tracking-widest print:text-black">
                  Bon rétablissement
                </p>
             </div>
          </div>


          {/* Zone centrale visible : 78mm de large, 210mm de haut          */}
          {/* On applique une rotation -90° pour que le texte soit horizontal   */}
          {/* après pliage, comme sur une vraie enveloppe.                      */}
          {/* translateX(-100%) recentre après la rotation.                     */}
          <div
            className="absolute flex flex-col justify-between p-8 border-[0.2mm] border-slate-100 print:border-none overflow-hidden"
            style={{
              top:    '67mm',
              left:   '63mm',
              width:  '210mm',   /* becomes the height after rotation */
              height: '84mm', /* becomes the width after rotation */
              transformOrigin: 'top left',
              transform: 'rotate(90deg) translateY(-100%)',
            }}
          >
            {/* ── Background Watermark: CONFIDENTIEL diagonal sur toute la longueur ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
               <span className="text-[4.5rem] font-black text-slate-900 opacity-[0.04] print:opacity-[0.06] print:text-black tracking-[0.3em] whitespace-nowrap -rotate-12 select-none">
                 CONFIDENTIEL • CONFIDENTIEL • CONFIDENTIEL
               </span>
            </div>


            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* ── En-tête : Logo + Nom + Adresse ── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5 w-full">
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-sm print:border-2 print:border-black print:text-black print:bg-transparent">
                    <LucideMicroscope size={28} strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col gap-1 w-full flex-1">
                    <div>
                      <h1 className="text-xl flex gap-7 items-center font-black text-slate-900 tracking-tight leading-none print:text-black">
                        {LAB_NAME}
                        <span className='flex-1 h-1 bg-slate-900'/>
                      </h1>
                      <div className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest mt-0.5 print:text-black">
                        {LAB_SUBTITLE.toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Adresse avec icônes fines */}
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 print:text-black">
                         <MapPin size={10} className="text-slate-400 print:text-black" />
                         <span className="text-[8px] font-bold uppercase tracking-wide">
                           {LAB_ADDRESS || 'El Gallel, Menzel Bouzaïene, Sidi Bouzid'}
                         </span>
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500 print:text-black">
                         <Phone size={10} className="text-slate-400 print:text-black" />
                         <span className="text-[8px] font-bold tracking-wide">
                           {LAB_PHONE || ''}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* ── Info patient (Minimalist & Modern) ── */}
              <div className="ml-12 mr-4 mb-4 relative group">
               
                <div className="relative border-2 border-dashed pl-4 py-2 print:border-black w-[70mm]">
                 
                  
                  {analysis ? (
                    <div className="space-y-1 mt-1">
                      <p className="text-lg font-bold text-slate-900 print:text-black leading-tight uppercase">
                        {patientName}
                      </p>
                      
                      <div className="flex items-center gap-4 text-[9px] text-slate-500 print:text-black font-medium">
                        <span className="flex items-center gap-1">
                          ID: <span className="font-mono font-bold text-slate-900 print:text-black">{dailyId}</span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 print:bg-black/30" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                         {/* Zone de saisie manuelle */}
                         <div className="flex gap-3">
                          <span className="text-[8px] font-bold">NOM:</span>
                          <div className="h-5 border-b border-slate-200 print:border-black/20 w-48" />
                         </div>
                         <div className="flex gap-3">
                            <span className="text-[8px] font-bold">ID:</span>
                            <div className="h-5 border-b border-slate-200 print:border-black/20 w-24" />
                         </div>
                         <div className="flex gap-4">
                            <span className="text-[8px] font-bold">DATE:</span>
                            <div className="h-5 border-b border-slate-200 print:border-black/20 w-32" />
                         </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guides visuels (masqués à l'impression) */}
          {/* Ligne rabat (67mm du haut) */}
          <div className="absolute left-0 right-0 border-t border-dashed border-slate-200 print:hidden" style={{ top: '67mm' }} />
          {/* Ligne fond (20mm du bas = 277mm du haut) */}
          <div className="absolute left-0 right-0 border-t border-dashed border-slate-200 print:hidden" style={{ top: '277mm' }} />
          {/* Ligne côté gauche (66mm) */}
          <div className="absolute top-0 bottom-0 border-l border-dashed border-slate-200 print:hidden" style={{ left: '63mm' }} />
          {/* Ligne côté droit (144mm) */}
          <div className="absolute top-0 bottom-0 border-r border-dashed border-slate-200 print:hidden" style={{ left: '147mm' }} />
        </div>


        {/* ═══════════════════════════════════════════════════════
            PAGE 2 : GABARIT DE PLIAGE (guide mécanique)
        ═══════════════════════════════════════════════════════ */}
        <div className="h-[297mm] w-[210mm] relative overflow-hidden border mt-8 print:border-none print:mt-0 print:break-before-page">
          <div className="absolute inset-0 bg-slate-50/20 print:bg-transparent" />

          {/* 1. Rabat haut — 67mm */}
          <div
            className="absolute top-0 left-0 right-0 border-b-[0.5mm] border-dotted border-slate-300 flex flex-col items-center justify-center print:border-black"
            style={{ height: '67mm' }}
          >
            
          </div>

          {/* 2. Côté gauche — 66mm */}
          <div
            className="absolute border-r-[0.5mm] border-dotted border-slate-300 bg-slate-50/40 print:bg-transparent print:border-black flex items-center justify-center"
            style={{ top: '67mm', bottom: '20mm', left: 0, width: '63mm' }}
          >
           
          </div>

          {/* 3. Côté droit — 66mm */}
          <div
            className="absolute border-l-[0.5mm] border-dotted border-slate-300 bg-slate-50/40 print:bg-transparent print:border-black flex items-center justify-center"
            style={{ top: '67mm', bottom: '20mm', right: 0, width: '63mm' }}
          >
           
          </div>

          {/* 4. Fond bas — 20mm */}
          <div
            className="absolute bottom-0 left-0 right-0 border-t-[0.5mm] border-dotted border-blue-500 bg-blue-50/30 print:bg-transparent print:border-black flex flex-col items-center justify-center"
            style={{ height: '20mm' }}
          >
           
          </div>

          

          {/* Coins à couper / coller */}
          {/* ── ZONES À COUPER : Rabat (haut) ── */}
          {/* Coin haut-gauche ✂ */}
          <div className="absolute top-0 left-0 bg-red-50/60 print:bg-transparent flex flex-col items-center justify-center gap-1"
            style={{ width: '63mm', height: '67mm' }}>
            {/* Ligne de coupe verticale (côté intérieur) */}
            <div className="absolute top-0 right-0 w-[0.4mm] h-full border-r-[0.5mm] border-dashed border-red-400 print:border-black" />
            {/* Ligne de coupe horizontale (bas) */}
            <div className="absolute bottom-0 left-0 h-[0.4mm] w-full border-b-[0.5mm] border-dashed border-red-400 print:border-black" />
            
          </div>
          {/* Coin haut-droit ✂ */}
          <div className="absolute top-0 right-0 bg-red-50/60 print:bg-transparent flex flex-col items-center justify-center gap-1"
            style={{ width: '63mm', height: '67mm' }}>
            {/* Ligne de coupe verticale (côté intérieur) */}
            <div className="absolute top-0 left-0 w-[0.4mm] h-full border-l-[0.5mm] border-dashed border-red-400 print:border-black" />
            {/* Ligne de coupe horizontale (bas) */}
            <div className="absolute bottom-0 left-0 h-[0.4mm] w-full border-b-[0.5mm] border-dashed border-red-400 print:border-black" />
           
          </div>

          {/* ── ZONES À COUPER : Fond (bas) ── */}
          {/* Coin bas-gauche ✂ */}
          <div className="absolute bottom-0 left-0 bg-red-50/60 print:bg-transparent flex flex-col items-center justify-center gap-1"
            style={{ width: '63mm', height: '20mm' }}>
            {/* Ligne de coupe verticale (côté intérieur) */}
            <div className="absolute top-0 right-0 w-[0.4mm] h-full border-r-[0.5mm] border-dashed border-red-400 print:border-black" />
            {/* Ligne de coupe horizontale (haut) */}
            <div className="absolute top-0 left-0 h-[0.4mm] w-full border-t-[0.5mm] border-dashed border-red-400 print:border-black" />
           
          </div>
          {/* Coin bas-droit ✂ */}
          <div className="absolute bottom-0 right-0 bg-red-50/60 print:bg-transparent flex flex-col items-center justify-center gap-1"
            style={{ width: '63mm', height: '20mm' }}>
            {/* Ligne de coupe verticale (côté intérieur) */}
            <div className="absolute top-0 left-0 w-[0.4mm] h-full border-l-[0.5mm] border-dashed border-red-400 print:border-black" />
            {/* Ligne de coupe horizontale (haut) */}
            <div className="absolute top-0 left-0 h-[0.4mm] w-full border-t-[0.5mm] border-dashed border-red-400 print:border-black" />
            
          </div>

          {/* ── ZONE CENTRALE FOND : à coller ── */}
          <div className="absolute bottom-0 flex items-center justify-center"
            style={{ left: '63mm', width: '84mm', height: '20mm' }}>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page {
              margin: 0;
              size: A4 portrait;
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }
);

EnvelopeImpression.displayName = 'EnvelopeImpression';