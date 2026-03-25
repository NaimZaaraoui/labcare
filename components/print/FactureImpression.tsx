'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Analysis, Test } from '@/lib/types';

interface FactureImpressionProps {
  analysis: Analysis;
  settings: any;
}

export const FactureImpression: React.FC<FactureImpressionProps> = ({ analysis, settings }) => {
    const LAB_NAME     = settings?.lab_name     || 'NexLab CSSB';
    const LAB_SUBTITLE = settings?.lab_subtitle || 'Centre de Santé de Services de Base';
    const LAB_PHONE    = settings?.lab_phone    || '';
    const LAB_EMAIL    = settings?.lab_email    || '';
    const LAB_ADDRESS  = settings?.lab_address_1 || '';
    const AMOUNT_UNIT  = settings?.amount_unit  || 'DA';

    const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
    const dateFacture = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    
    // Group tests by category for a cleaner invoice
    const testsByCategory: Record<string, any[]> = {};
    analysis.results?.forEach(res => {
        const cat = res.test?.category || 'Analyses Diverses';
        if (!testsByCategory[cat]) testsByCategory[cat] = [];
        testsByCategory[cat].push(res.test);
    });

    return (
        <div id="invoice-print-area" className="bg-white p-12 text-slate-800 font-sans leading-relaxed min-h-[29.7cm] w-[21cm] mx-auto print:p-8 print:m-0 print:w-full">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{LAB_NAME}</h1>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{LAB_SUBTITLE}</p>
                    <div className="mt-4 text-[11px] font-medium text-slate-500 space-y-0.5">
                        <p>{LAB_ADDRESS}</p>
                        <p>Tél: {LAB_PHONE} {LAB_EMAIL && `| Email: ${LAB_EMAIL}`}</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-lg tracking-wider">
                        FACTURE
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2">
                        DATE: {dateFacture}
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-1">
                        N° FACTURE: <span className="font-mono">{analysis.receiptNumber || analysis.orderNumber}</span>
                    </div>
                </div>
            </div>

            {/* Patient Info Section */}
            <div className="flex justify-between mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Facturé à</h3>
                    <p className="text-xl font-black text-slate-900">{patientName}</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                        Dossier N°: {analysis.dailyId || analysis.orderNumber}
                    </p>
                </div>
                <div className="text-right">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Référence Dossier</h3>
                    <p className="text-sm font-black text-slate-900">{analysis.orderNumber}</p>
                </div>
            </div>

            {/* Details Table */}
            <div className="mb-12">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                            <th className="py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Description des Analyses</th>
                            <th className="py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest pr-2">Montant ({AMOUNT_UNIT})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {Object.entries(testsByCategory).map(([category, items]) => (
                            <React.Fragment key={category}>
                                <tr className="bg-slate-50/50">
                                    <td colSpan={2} className="py-3 px-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">{category}</td>
                                </tr>
                                {items.map((test, idx) => (
                                    <tr key={`${category}-${idx}`} className="group">
                                        <td className="py-4 pl-4 text-sm font-bold text-slate-700">{test.name}</td>
                                        <td className="py-4 pr-4 text-right text-sm font-black text-slate-900">
                                            {test.price?.toLocaleString() || '0'}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total Section */}
            <div className="flex justify-end mt-8">
                <div className="w-full max-w-[300px] space-y-4">
                    <div className="flex justify-between items-center px-4 py-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sous-Total</span>
                        <span className="text-sm font-black text-slate-900">{analysis.totalPrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-6 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Total Net à Payer</span>
                        <span className="text-2xl font-black text-white tracking-tighter">
                            {analysis.totalPrice?.toLocaleString()} <span className="text-[10px] font-bold text-indigo-400 uppercase ml-1 italic">{AMOUNT_UNIT}</span>
                        </span>
                    </div>
                    <p className="text-[9px] text-right font-medium text-slate-400 pr-4 italic">
                        Arrêtée la présente facture à la somme de : <br/>
                        <span className="font-bold text-slate-600 uppercase">
                          {/* Note: Ideally we'd have a number-to-words converter here */}
                          {analysis.totalPrice?.toLocaleString()} {AMOUNT_UNIT}
                        </span>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-20 border-t border-slate-100 flex justify-between items-end italic text-[10px] text-slate-400">
                <div className="space-y-1">
                    <p>NexLab CSSB LIMS - Solution de gestion de laboratoire</p>
                    <p>Généré le {dateFacture}</p>
                </div>
                <div className="text-center w-40">
                    <p className="mb-12 font-bold uppercase tracking-widest">Le Cachet</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                    #invoice-print-area {
                        padding: 1cm !important;
                        width: 100% !important;
                        min-height: 100vh !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
};
