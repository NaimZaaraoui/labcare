'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';
import type { AnalysisPrintProps } from '@/components/print/types';
import { buildInvoiceItems, resolvePrintBranding } from '@/components/print/report-helpers';

export const FactureImpression: React.FC<AnalysisPrintProps> = ({ analysis, settings }) => {
    const { LAB_NAME, LAB_SUBTITLE, LAB_ADDRESS, LAB_PHONE, BIO_TITLE, BIO_NAME, BIO_ONMPT, FOOTER_TEXT } = resolvePrintBranding(settings);
    const AMOUNT_UNIT = settings?.amount_unit || 'TND';

    const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
    const dateFacture = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const dateEdition = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

    const invoiceItemsFinal = React.useMemo(() => buildInvoiceItems(analysis.results), [analysis.results]);
    const computedTotal = React.useMemo(
      () => invoiceItemsFinal.reduce((sum, item) => sum + item.price, 0),
      [invoiceItemsFinal]
    );
    const finalTotal = analysis.totalPrice ?? computedTotal;
    const isHighVolume = invoiceItemsFinal.length >= 30;
    const isVeryHighVolume = invoiceItemsFinal.length >= 45;
    const rowPaddingClass = isVeryHighVolume ? 'py-1' : isHighVolume ? 'py-1.5' : 'py-2';
    const rowNameClass = isVeryHighVolume ? 'text-[10px]' : 'text-[11px]';
    const rowPriceClass = isVeryHighVolume ? 'text-[11px]' : 'text-[12px]';

    return (
        <div className="bg-white p-10 text-slate-900 font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
            <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
            <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

            <div className="flex justify-between items-end mb-8 relative z-10 pt-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-black rounded-md">
                        <LucideMicroscope size={40} className="text-white" />
                    </div>
                    <div className="flex flex-col ml-2">
                        <h1 className="text-4xl font-semibold text-slate-900 tracking-[-0.03em] uppercase print:text-black leading-none">
                            {LAB_NAME}
                        </h1>
                        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.24em] mt-1.5 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-indigo-600 print:bg-black"></span>
                            {LAB_SUBTITLE.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="text-right border-r-4 border-indigo-600 pr-6 print:border-black">
                    <h2 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight mb-1 print:text-black">FACTURE</h2>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide print:text-black">Référence: {analysis.orderNumber}</p>
                        {analysis.receiptNumber && (
                            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide print:text-black">Quittance: {analysis.receiptNumber}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 mb-8 relative z-10">
                <div className="col-span-5">
                    <div className="mb-4">
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-[0.2em] print:text-black">Patient</span>
                        <div className="h-px bg-slate-100 mt-1 print:bg-black/10"></div>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-3xl font-semibold text-slate-900 mb-2 print:text-2xl print:text-black">{patientName}</h3>
                        <div className="flex gap-4 text-sm font-medium text-slate-500 print:text-black">
                            <span>{analysis.patientAge} ans</span>
                            <span className="text-slate-200 print:text-black/30">|</span>
                            <span className="uppercase">{analysis.patientGender === 'M' ? 'Homme' : 'Femme'}</span>
                            <span className="text-slate-200 print:text-black/30">|</span>
                            <span>ID: <span className="font-bold font-mono text-slate-900 print:text-black">{analysis.dailyId}</span></span>
                        </div>
                    </div>
                </div>

                <div className="col-span-7 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Date Facture</span>
                        <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">{dateFacture}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Prélèvement</span>
                        <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">{dateEdition}</p>
                    </div>
                    <div className="col-span-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Établissement</span>
                        <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">{LAB_NAME}{LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6 relative z-10">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr className="bg-slate-50/50 print:bg-black/5">
                            <th className="py-2 pl-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 print:text-black w-[72%]">Désignation de l&apos;Analyse</th>
                            <th className="py-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 print:text-black w-[28%]">Prix ({AMOUNT_UNIT})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoiceItemsFinal.map((item, idx) => (
                            <tr key={idx} className="break-inside-avoid">
                                <td className={`${rowPaddingClass} pl-4 ${rowNameClass} font-semibold text-slate-700 uppercase tracking-tight leading-tight`}>
                                    {item.name}
                                </td>
                                <td className={`${rowPaddingClass} pr-4 text-right ${rowPriceClass} font-semibold text-slate-900`}>
                                    {item.price.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-900">
                            <td className="pt-4 pb-2 pl-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-900 print:text-black">Total Net à Payer</td>
                            <td className="pt-4 pb-2 pr-4 text-right text-2xl font-semibold text-slate-900 print:text-2xl print:text-black">
                                {finalTotal?.toLocaleString(undefined, { minimumFractionDigits: 3 })} 
                                <span className="text-[12px] ml-1 font-bold">{AMOUNT_UNIT}</span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="pt-6 border-t-2 border-slate-900 print:border-black footer-content">
                <div className="grid grid-cols-3 gap-12">
                    <div className="col-span-2">
                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Informations</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md print:text-black">
                            Document financier généré électriquement.<br />
                            <span className="text-[8px] font-semibold text-slate-300 uppercase print:text-black/40">ID Document: {analysis.id.substring(0, 8).toUpperCase()}</span>
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black">Signature & Cachet</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div style={{
                                position: 'relative',
                                width: '120px',
                                height: '90px',
                                margin: '0 auto',
                            }}>
                                {settings?.lab_stamp_image && settings?.lab_bio_signature && (
                                    <>
                                        <img
                                            src={settings.lab_stamp_image}
                                            alt="Cachet"
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '90px',
                                                height: '90px',
                                                objectFit: 'contain',
                                                opacity: 0.9,
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '130px',
                                            height: '30px',
                                            backgroundColor: 'hsla(0, 0%, 100%, 0.5)',
                                            paddingBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                        }}>
                                            <img
                                                src={settings.lab_bio_signature}
                                                alt="Signature"
                                                style={{
                                                    width: '120px',
                                                    height: '30px',
                                                    objectFit: 'contain',
                                                    objectPosition: 'center bottom',
                                                    filter: 'contrast(1.15)',
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                {settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                                    <img
                                        src={settings.lab_stamp_image}
                                        alt="Cachet"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '90px',
                                            height: '90px',
                                            objectFit: 'contain',
                                        }}
                                    />
                                )}

                                {!settings?.lab_stamp_image && settings?.lab_bio_signature && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        <img
                                            src={settings.lab_bio_signature}
                                            alt="Signature"
                                            style={{
                                                width: '130px',
                                                height: '30px',
                                                objectFit: 'contain',
                                                objectPosition: 'center bottom',
                                                filter: 'contrast(1.15)',
                                            }}
                                        />
                                        <div style={{
                                            width: '120px',
                                            height: '90px',
                                            border: '1px dashed #cfd2d7ff',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.5,
                                        }}>
                                            <span style={{
                                                fontSize: '7px',
                                                color: '#cfd2d7ff',
                                                textAlign: 'center',
                                                lineHeight: 1.5,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                transform: 'rotate(-15deg)',
                                            }}>
                                                Zone de cachet
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {!settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '120px',
                                        height: '90px',
                                        border: '2px dashed #cfd2d7ff',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.5,
                                    }}>
                                        <span style={{
                                            fontSize: '8px',
                                            color: '#cfd2d7ff',
                                            textAlign: 'center',
                                            lineHeight: 1.6,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.15em',
                                            transform: 'rotate(-15deg)',
                                        }}>
                                            Zone de cachet
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide print:text-black">
                                    {BIO_TITLE && BIO_NAME ? `${BIO_TITLE} ${BIO_NAME}` : 'Biologiste Responsable'}
                                </p>
                                {BIO_ONMPT && <p className="text-[8px] font-bold text-slate-400 print:text-black/60 mt-0.5">ONMPT: {BIO_ONMPT}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {FOOTER_TEXT && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '8px', fontSize: '9px', color: '#94a3b8', textAlign: 'center' }}>
                        {FOOTER_TEXT}
                    </div>
                )}
                <div className="mt-6 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] border-t border-slate-100 pt-8 print:border-black print:text-black">
                    <span>{LAB_NAME}</span>
                    <div className="flex gap-4">
                        {LAB_PHONE && <span>Tél: {LAB_PHONE}</span>}
                    </div>
                    <span className="text-slate-900 print:text-black page-number-container">
                        Page <span className="page-number"></span>
                    </span>
                </div>
            </div>

            <style jsx global>{`
                .break-inside-avoid {
                    break-inside: avoid;
                }
                
                @media print {
                    @page {
                        margin: 12mm 10mm;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        counter-reset: page;
                    }
                    table {
                      page-break-inside: auto;
                    }
                    tr {
                      page-break-inside: avoid;
                      page-break-after: auto;
                    }
                    .footer-content {
                      break-inside: avoid;
                    }
                    .page-number::after {
                        counter-increment: page;
                        content: counter(page);
                    }
                }
            `}</style>
        </div>
    );
};
