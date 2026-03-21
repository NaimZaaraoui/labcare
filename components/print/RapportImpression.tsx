
import React, { forwardRef } from 'react';
import { Analysis } from '@/lib/types';
import { format } from 'date-fns';
import { fr, is } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';
import { getTestReferenceValues, formatReferenceRange } from '@/lib/utils';
import { HistogramView } from '../analyses/HistogramView';
import { getHematologyInterpretations } from '@/lib/interpretations';

interface RapportImpressionProps {
  analysis: Analysis;
  results: Record<string, string>;
  selectedResultIds?: string[];
}

export const RapportImpression = forwardRef<HTMLDivElement, RapportImpressionProps>(
  ({ analysis, results, selectedResultIds = [] }, ref) => {
    const isAbnormal = (value: string, test: any): 'H' | 'L' | null => {
      const val = parseFloat(value.replace(',', '.'));
      if (isNaN(val)) return null;
      const refVals = getTestReferenceValues(test, analysis.patientGender);
      const max = refVals.max;
      const min = refVals.min;
      if (max !== null && val > max) return 'H';
      if (min !== null && val < min) return 'L';
      return null;
    };

    const ElectronicStamp = () => (
      <div className="relative w-48 h-28 border-[1px] border-dashed border-blue-800/80 rounded-2xl flex flex-col items-center justify-center p-2 bg-white/50 backdrop-blur-[1px] shadow-sm print:border-blue-900 print:bg-transparent overflow-hidden">
        {/* Decorative "ink" texture/noise using multiple borders or shadows if needed, but keeping it crisp */}
        <div className="flex flex-col items-center text-center gap-0.5">
          <span className="text-[11px] font-black text-blue-900 uppercase tracking-tight leading-none print:text-blue-900">Hôpital Menzel Bouzaïene</span>
          <span className="text-[16px] font-black text-blue-900 uppercase tracking-tighter leading-none my-0.5 print:text-blue-900">C.S.S.B Gallel</span>
          <span className="text-[12px] font-bold text-blue-800/90 leading-none print:text-blue-900">Service du Laboratoire</span>
        </div>
        
        {/* Subtle stamp "imperfections" to look authentic but clear */}
        <div className="absolute inset-0 bg-blue-800/5 pointer-events-none rounded-xl" />
      </div>
    );

    const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
    const dateEdition = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    const datePrelevement = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });
    const isValidated = analysis.status === 'completed';

    const sortResults = (results: any[]) => {
      const sorted: any[] = [];
      const visited = new Set<string>();

      const addTestAndChildren = (testId: string) => {
        if (visited.has(testId)) return;
        const result = results.find(r => r.testId === testId);
        if (result) {
          sorted.push(result);
          visited.add(testId);
          
          const children = results.filter(r => r.test?.parentId === testId);
          children.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
          children.forEach(child => addTestAndChildren(child.testId));
        }
      };

      // Group results by category
      const categoryGroups: Record<string, any[]> = {};
      const categoriesMeta: Record<string, { rank: number, name: string }> = {};

      results.forEach(res => {
        const catRel = res.test?.categoryRel;
        const catName = catRel?.name || res.test?.category || "Divers";
        const catRank = catRel?.rank ?? 999;
        
        if (!categoryGroups[catName]) {
            categoryGroups[catName] = [];
            categoriesMeta[catName] = { rank: catRank, name: catName };
        }
        categoryGroups[catName].push(res);
      });

      const categories = Object.keys(categoryGroups).sort((a, b) => {
        const metaA = categoriesMeta[a];
        const metaB = categoriesMeta[b];
        if (metaA.rank !== metaB.rank) return metaA.rank - metaB.rank;
        return a.localeCompare(b);
      });

      categories.forEach(cat => {
        const catResults = categoryGroups[cat];
        const topLevel = catResults.filter(r => {
          const parentId = r.test?.parentId;
          return !parentId || !catResults.some(pr => pr.testId === parentId);
        });

        topLevel.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
        topLevel.forEach(r => addTestAndChildren(r.testId));
      });

      // Any remaining
      results.forEach(r => {
        if (!visited.has(r.testId)) {
          sorted.push(r);
          visited.add(r.testId);
        }
      });

      return sorted;
    };

    const filteredResults = analysis.results?.filter(res => {
      if (selectedResultIds.length === 0) return true;
      const test = res.test;
      if (!test) return false;
      if (!test.isGroup) return selectedResultIds.includes(res.id);
      
      const hasSelectedDescendant = (parentId: string): boolean => {
        const children = analysis.results.filter(r => r.test?.parentId === parentId);
        return children.some(child => 
          (!child.test?.isGroup && selectedResultIds.includes(child.id)) || 
          (child.test?.isGroup && hasSelectedDescendant(child.testId))
        );
      };
      return hasSelectedDescendant(res.testId);
    }) || [];

    const categoryGroups: Record<string, any[]> = {};
    filteredResults.forEach(res => {
      const cat = res.test?.category || "Divers";
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(res);
    });

     const allOrderedCategories: string[] = [];
    
    // Ordre préférentiel : Biochimie, puis NFS, puis Hématologie, puis le reste
    if (categoryGroups['Biochimie']) allOrderedCategories.push('Biochimie');
    if (categoryGroups['NFS']) allOrderedCategories.push('NFS');
    if (categoryGroups['Hématologie']) allOrderedCategories.push('Hématologie');
    
    const handled = ['Biochimie', 'NFS', 'Hématologie'];
    const remaining = Object.keys(categoryGroups)
      .filter(cat => !handled.includes(cat))
      .sort((a, b) => a.localeCompare(b));
    
    allOrderedCategories.push(...remaining);

    const renderHeader = () => (
      <thead className="display-table-header-group">
        <tr>
          <td>
              <div className="flex justify-between items-end mb-8 relative z-10 pt-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-black rounded-md">
                       <LucideMicroscope size={40} className="text-white" />
                      </div>
                        <div className="flex flex-col ml-2">
                          <h1 className="text-4xl font-black text-slate-900 tracking-[-0.05em] uppercase print:text-black leading-none">
                            CSSB <span className="text-blue-600 print:text-black">GALLEL</span>
                          </h1>
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-blue-600 print:bg-black"></span>
                            SERVICE DE LABORATOIRE
                          </div>
                        </div>
                    </div>
                
                  <div className="text-right border-r-4 border-blue-600 pr-6 print:border-black">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 print:text-black">RAPPORT D'ANALYSE</h2>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">Référence: {analysis.orderNumber}</p>
                      {analysis.receiptNumber && (
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest print:text-black">Quittance: {analysis.receiptNumber}</p>
                      )}
                    </div>
                  </div>
              </div>

            <div className="grid grid-cols-12 gap-8 mb-8 relative z-10">
              <div className="col-span-7">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] print:text-black">Patient</span>
                  <div className="h-px bg-slate-100 mt-1 print:bg-black/10"></div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-slate-900 mb-2 print:text-2xl print:text-black">{patientName}</h3>
                  <div className="flex gap-4 text-sm font-medium text-slate-500 print:text-black">
                    <span>{analysis.patientAge} ans</span>
                    <span className="text-slate-200 print:text-black/30">|</span>
                    <span className="uppercase">{analysis.patientGender === 'M' ? 'Homme' : 'Femme'}</span>
                    <span className="text-slate-200 print:text-black/30">|</span>
                    <span>ID: <span className="font-bold text-slate-900 print:text-black">{analysis.dailyId}</span></span>
                  </div>
                </div>
              </div>

              <div className="col-span-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Prélèvement</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">{datePrelevement}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Édition</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">{dateEdition}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Établissement</span>
                    <p className="text-sm font-bold text-slate-900 mt-1 print:text-black">CSSB GALLEL - Manzel Bouzaienne</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </thead>
    );

    const renderFooter = (showFull: boolean = true) => (
      <tfoot className="display-table-footer-group">
        <tr>
          <td>
            {showFull ? (
              <div className="pt-6 border-t-2 border-slate-900 print:border-black footer-content">
                <div className="grid grid-cols-3 gap-12">
                  <div className="col-span-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Notes du Biologiste</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md print:text-black">
                      Les résultats indiqués ci-dessus ont été obtenus par des méthodes validées et standardisées. 
                      Une interprétation clinique par votre médecin traitant est nécessaire.<br />
                      <span className="text-[8px] font-black text-slate-300 uppercase print:text-black/40">↑ = Résultat élevé | ↓ = Résultat bas | Antér. = Dernier résultat validé dans notre laboratoire</span>
                    </p>
                    <div className="mt-6 flex gap-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/40">ID Document</span>
                        <span className="text-[11px] font-bold font-mono text-slate-900 print:text-black">{analysis.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/40">Statut</span>
                          <span className={`text-[11px] font-black uppercase ${isValidated ? 'text-blue-600' : 'text-amber-600'} print:text-black`}>
                            {isValidated ? 'Validé' : 'En attente'}
                          </span>
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">Signature & Cachet</span>
                    </div>
                    <div className="text-center relative min-h-[100px] flex flex-col justify-end items-center">
                      
                        <div className="absolute top-0 w-32 h-20 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center opacity-50 print:border-black/10">
                          <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em] rotate-[-15deg] print:text-black/10">Zone de cachet</span>
                        </div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest print:text-black relative z-10 font-black">Biologiste Responsable</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] border-t border-slate-100 pt-8 print:border-black print:text-black">
                  <span>CSSB GALLEL</span>
                  <div className="flex gap-4">
                    <span>Tél: +216 XX XXX XXX</span>
                  </div>
                  <span className="text-slate-900 print:text-black page-number-container">
                    Page <span className="page-number"></span>
                  </span>
                </div>
              </div>
            ) : (
              /* Minimal footer for NFS to save space */
              <div className="mt-4 pt-4 border-t border-slate-100 print:border-black/10 footer-content">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] print:text-black">
                  <span>CSSB GALLEL - Rapport NFS</span>
                  <div className="flex gap-8 items-center">
                    <span className="text-blue-600 font-black">Validé par le Biologiste Responsable</span>
                    <span className="text-slate-900 print:text-black page-number-container">
                      Page <span className="page-number"></span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      </tfoot>
    );

    const renderTableContent = (categories: string[], isNFSLayout: boolean = false) => (
      <tbody className="display-table-row-group">
        <tr>
          <td>
            <div className="mb-6 relative z-10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 print:bg-black/5">
                      <th className="py-2 pl-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Examen / Paramètre</th>
                      <th className="py-2 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Résultat</th>
                      <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black w-20">Antér.</th>
                      <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Unité</th>
                      <th className="py-2 pr-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black">Valeurs de Référence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((categoryName) => {
                        const catResults = sortResults(categoryGroups[categoryName]);
                        const isNFS = categoryName === 'NFS';
                        
                        return (
                          <React.Fragment key={categoryName}>
                                <tr>
                                  <td colSpan={5} className="py-2">
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">
                                        {categoryName === 'NFS' ? 'Hématologie (NFS)' : categoryName}
                                      </span>
                                      <div className="h-[1px] flex-1 bg-slate-100 print:bg-black/5"></div>
                                    </div>
                                  </td>
                                </tr>
                          {catResults.map((res) => {
                              const val = results[res.id] || '';
                              const test = res.test;
                              const isGroup = test?.isGroup;
                              const flag = isAbnormal(val, test);

                              if (isGroup) {
                                return (
                                  <tr key={res.id} className="break-inside-avoid">
                                  <td colSpan={5} className="py-1.75 bg-slate-50/30 print:bg-black/5">
                                      <div className="flex items-center gap-3 px-4">
                                        <span className="text-[12px] font-black text-blue-600 uppercase tracking-tight print:text-black">{test?.name}</span>
                                        <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10"></div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <React.Fragment key={res.id}>
                                <tr className={`group even:bg-slate-50/30 print:even:bg-black/2 transition-colors break-inside-avoid `}>
                                    <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} pl-4`}>
                                      <div className={`flex flex-col ${test?.parentId ? 'pl-6' : 'pl-4'}`}>
                                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight print:text-black">{test?.name}</span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest print:text-black/40">{test?.code}</span>
                                      </div>
                                    </td>
                                    <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} text-start`}>
                                      <div className="flex flex-col items-start gap-0.5">
                                        <div className="flex items-center justify-start gap-2">
                                          <span className={`text-[14px] text-slate-900 ${flag ? 'font-bold' : 'font-semibold'} print:text-black`}>
                                            {val || '—'}
                                          </span>
                                          {flag && (
                                                   <span className="text-[12px] font-black text-slate-900 px-1 py-0.5 min-w-3.5">
                                                     {flag === 'H' ? '↑' : '↓'}
                                                   </span>
                                                 )}
                                        </div>
                                        
                                        {res.notes && (
                                          <span className="text-[9px] font-medium text-slate-500 italic leading-none mt-1 print:text-black/60">
                                            ({res.notes})
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} text-center`}>
                                        <span className="text-xs font-bold text-slate-400 print:text-black/40">
                                            {analysis.previousResults?.[res.testId] || '—'}
                                        </span>
                                    </td>
                                  <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} px-4 text-center text-xs font-bold text-slate-500 print:text-black`}><span dangerouslySetInnerHTML={{ __html: res.unit || test?.unit || '—' }} /></td>
                                  <td className={`${(isNFS || test?.parentId) ? "py-1" : "py-1.25"} pr-4 text-right text-xs font-bold text-slate-400 print:text-black`}>
                                    {test && (() => {
                                      const refVals = getTestReferenceValues(test, analysis.patientGender);
                                      const displayText = formatReferenceRange(refVals.min, refVals.max);
                                      return displayText === 'QUALIT.' ? (
                                        <span className="opacity-10 text-[8px] font-black tracking-widest">SANS RÉF.</span>
                                      ) : (
                                        <span className="text-slate-900 print:text-black">{displayText}</span>
                                      );
                                    })()}
                                  </td>
                                </tr>
                                </React.Fragment>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          </td>
        </tr>
      </tbody>
    );

    return (
      <div ref={ref} className="bg-white p-10 text-slate-900 font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-blue-600 print:bg-black"></div>

        {/* Watermark moved inside loop for multi-page support */}

        {/* Each Category on Separate Page */}
        {allOrderedCategories.map((cat, index) => {
          const isNFS = cat === 'NFS';
          return (
          <div key={cat} className={`${index > 0 ? "print:break-before-page" : ""} relative`}>
            {!isValidated && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] text-slate-500/[0.07] text-[120px] font-black pointer-events-none select-none z-0 tracking-tighter whitespace-nowrap px-12 py-4 rounded-[60px] print:text-black/[0.05] print:border-black/[0.05]">
                 BROUILLON
               </div>
            )}
          <table className="w-full border-collapse border-none mb-4 relative z-10">
            {renderHeader()}
            {renderTableContent([cat], cat === 'NFS')}
            {isNFS ? renderFooter(false) : renderFooter(true)}
          </table>
          </div>
        )
        })}

        {analysis.histogramData && (
          <div className="print:break-before-page mt-8 relative">
            {!isValidated && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] text-slate-500/[0.07] text-[120px] font-black pointer-events-none select-none z-90 tracking-tighter whitespace-nowrap px-12 py-4 rounded-[60px] print:text-black/[0.05] print:border-black/[0.05]">
                 BROUILLON
               </div>
            )}
            <table className="w-full border-collapse border-none mb-4 relative z-10">
                {renderHeader()}
                <tbody>
                    <tr>
                        <td>
                            <div className="mb-8">
                                
                                  <div className="py-1.75 bg-slate-50/30 print:bg-black/5">
                                      <div className="flex items-center gap-3 px-4">
                                        <span className="text-[12px] font-black text-blue-600 uppercase tracking-tight print:text-black">MORPHOLOGIE & HISTOGRAMMES</span>
                                        <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10"></div>
                                      </div>
                                    </div>
                               

                                <div className="mt-8 grid grid-cols-3 gap-8">
                                {(() => {
                                    try {
                                        if (!analysis.histogramData) return null;
                                        const data = JSON.parse(analysis.histogramData);
                                        const pltData = {
                                          bins: data.rbc.bins.slice(0, 60),
                                          markers: data.rbc.markers.filter((m: number) => m < 60)
                                        };

                                        return (
                                          <>
                                              <div className="space-y-4">
                                                  <HistogramView data={data.wbc} title="DISTRIBUTION LEUCOCYTAIRE (WBC)" color="#000000" width={220} height={140} xAxisMax={400} />
                                              </div>
                                              <div className="space-y-4">
                                                  <HistogramView data={data.rbc} title="DISTRIBUTION ÉRYTHROCYTAIRE (RBC)" color="#000000" width={220} height={140} xAxisMax={250} />
                                              </div>
                                              <div className="space-y-4">
                                                  <HistogramView data={pltData} title="DISTRIBUTION PLAQUETTAIRE (PLT)" color="#000000" width={220} height={140} xAxisMax={60} />
                                              </div>
                                          </>
                                        );
                                    } catch (e) {
                                        return null;
                                    }
                                })()}
                                </div>
                            </div>

                            {(() => {
                                try {
                                    const interpretations = getHematologyInterpretations(analysis, results);
                                    if (interpretations.length === 0) return (
                                        
                                            <p className="my-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conclusion Morphologique : Absence d'anomalies majeures détectables</p>
                                        
                                    );
                                    
                                    return (
                                        <div className='p-6'>
                                            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 print:text-black">Interprétations Diagnostiques</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {interpretations.map(flag => (
                                                    <span key={flag} className="px-3 py-1.5 bg-white border border-blue-100 rounded-lg text-[10px] font-medium text-blue-700 print:border-black/80 print:text-black">
                                                        {flag}
                                                    </span>
                                                ))}
                                            </div>
                                            </div>
                                    );
                                } catch (e) { return null; }
                            })()}
                        </td>
                    </tr>
                </tbody>
                {renderFooter(true)}
            </table>
          </div>
        )}

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
                margin: 0 !important;
                padding: 0 !important;
              }
              thead { 
                display: table-header-group;
              }
              tfoot { 
                display: table-footer-group;
              }
              
              .page-number::after {
                counter-increment: page;
                content: counter(page);
              }

              tr {
                break-inside: avoid;
              }

              .break-inside-avoid {
                break-inside: avoid;
              }
          }

          }
        `}</style>
      </div>
    );
  }
);

RapportImpression.displayName = 'RapportImpression';