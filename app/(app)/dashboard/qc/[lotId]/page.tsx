'use client';

import { use } from 'react';
import { 
  ArrowLeft,
  Printer,
  ChevronRight,
  TrendingDown,
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { LeveyJenningsChart } from '@/components/qc/LeveyJenningsChart';
import { NotificationToast } from '@/components/ui/notification-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQcLot } from '@/components/qc/useQcLot';
import { QcCancelModal } from '@/components/qc/QcCancelModal';

export default function QcLotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const state = useQcLot(resolvedParams.lotId);
  const { lot } = state;

  if (state.loading || !lot) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      
      {/* Header - Print Hidden */}
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)] print:hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <Link href="/dashboard/qc" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                     <ArrowLeft size={12} />
                     Contrôle Qualité
                  </Link>
                  <ChevronRight size={10} />
                  <span>Détails Lot</span>
               </div>
               <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  Lot n° {lot.lotNumber}
                  {!lot.isActive && <span className="status-pill border bg-slate-50 text-slate-600 border-slate-100">Archivé</span>}
               </h1>
            </div>
            
            <button onClick={state.handlePrint} className="btn-secondary-sm">
               <Printer size={16} />
               Imprimer le rapport mensuel
            </button>
         </div>
      </section>

      {/* PRINT HEADER: Visible only on print */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
        <div className="flex justify-between items-end">
           <div>
              <h1 className="text-2xl font-bold font-serif text-slate-900 mb-1">{state.settings?.lab_name || 'NexLab CSSB'}</h1>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Rapport de Contrôle Qualité Interne (CQI)</p>
           </div>
           <div className="text-right text-sm">
              <p><span className="text-slate-500 mr-2">Test:</span><span className="font-bold">{lot.test.name}</span></p>
              <p><span className="text-slate-500 mr-2">Lot:</span><span className="font-bold">{lot.lotNumber}</span></p>
              <p><span className="text-slate-500 mr-2">Généré le:</span><span className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm')}</span></p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
         {/* Main Chart Section */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Target Stats */}
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1">Moyenne (Cible)</p>
                  <p className="text-2xl font-bold text-slate-900">{lot.targetMean}</p>
               </div>
               <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1">Ecart-Type (1 SD)</p>
                  <p className="text-2xl font-bold text-slate-900">{lot.targetSd}</p>
               </div>
               <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1">Niveau</p>
                  <p className="text-2xl font-bold text-slate-900">{lot.level || 'Normal'}</p>
               </div>
            </div>

            {/* Levey-Jennings Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
               <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  Graphe de Levey-Jennings
               </h3>
               {lot.points && lot.points.filter(p => p.isValid).length > 0 ? (
                 <LeveyJenningsChart 
                    title={`Suivi du lot ${lot.lotNumber}`}
                    points={lot.points.filter(p => p.isValid).map(p => {
                      const zScore = lot.targetSd ? (p.value - lot.targetMean) / lot.targetSd : 0;
                      let flag = 'pass';
                      if (Math.abs(zScore) >= 3) flag = 'fail';
                      else if (Math.abs(zScore) >= 2) flag = 'warn';
                      
                      return {
                        id: p.id,
                        performedAt: p.createdAt,
                        performedByName: p.operator?.name || 'Opérateur',
                        measured: p.value,
                        zScore,
                        flag,
                        rule: null,
                        inAcceptanceRange: true,
                      };
                    })}
                    mean={lot.targetMean} 
                    sd={lot.targetSd}
                    controlMode="STATISTICAL"
                    unit={null}
                    minAcceptable={null}
                    maxAcceptable={null}
                 />
               ) : (
                 <div className="flex h-64 items-center justify-center text-sm font-medium text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Aucun point de contrôle enregistré pour ce lot.
                 </div>
               )}
               
               {/* Westgard Rules Legend Container */}
               <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500" />
                     <span className="text-xs font-semibold text-slate-600">En contrôle (&lt; 2SD)</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-amber-400" />
                     <span className="text-xs font-semibold text-slate-600">Alerte (1-2s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-rose-500" />
                     <span className="text-xs font-semibold text-slate-600">Rejet (1-3s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-purple-500 border border-purple-200" />
                     <span className="text-xs font-semibold text-slate-600">Tendance (Trend)</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Sidebar: Historical Data Table */}
         <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[800px] print:max-h-none print:border-none print:shadow-none">
               <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                     <TrendingDown size={18} className="text-slate-400" />
                     Historique des relevés
                  </h3>
               </div>
               
               <div className="overflow-y-auto p-4 space-y-6 print:overflow-visible print:p-0">
                  {state.grouped.activeArray.length === 0 ? (
                     <p className="text-center text-xs text-slate-400 py-10 font-medium">Aucune donnée historique</p>
                  ) : (
                     state.grouped.activeArray.map((day) => (
                        <div key={day.date} className="space-y-3">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block">
                                 {format(new Date(day.date), 'dd MMMM yyyy', { locale: fr })}
                              </h4>
                              <span className="text-xs font-semibold text-slate-500 bg-white px-2 rounded-lg border">
                                 Moyenne: {day.mean.toFixed(2)}
                              </span>
                           </div>
                           
                           <div className="bg-white border rounded-2xl overflow-hidden print:border-slate-300">
                              <table className="w-full text-left border-collapse">
                                 <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                                    {day.points.map((point) => {
                                       const isInvalid = !point.isValid;
                                       const dev = Math.abs(point.value - lot!.targetMean) / lot!.targetSd;
                                       let statusColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
                                       let icon = <CheckCircle2 size={12} className="text-emerald-500" />;
                                       
                                       if (dev >= 3) {
                                          statusColor = 'text-rose-600 bg-rose-50 border-rose-100';
                                          icon = <AlertTriangle size={12} className="text-rose-500" />;
                                       } else if (dev >= 2) {
                                          statusColor = 'text-amber-600 bg-amber-50 border-amber-100';
                                          icon = <AlertTriangle size={12} className="text-amber-500" />;
                                       }
                                       if (isInvalid) {
                                          statusColor = 'text-slate-400 bg-slate-100 border-slate-200 opacity-50';
                                          icon = <Ban size={12} className="text-slate-400" />;
                                       }

                                       return (
                                          <tr key={point.id} className="group hover:bg-slate-50/50 transition-colors">
                                             <td className="py-2.5 px-3 w-[60px]">
                                                <div className="text-[10px] font-semibold text-slate-400">
                                                   {format(new Date(point.createdAt), 'HH:mm')}
                                                </div>
                                             </td>
                                             <td className="py-2.5 px-3">
                                                <div className={`status-pill border ${statusColor} text-[11px] px-2 py-0.5 justify-start w-fit group-hover:scale-105 transition-transform`}>
                                                   {icon}
                                                   <span className={isInvalid ? "line-through text-slate-400" : ""}>{point.value}</span>
                                                </div>
                                             </td>
                                             <td className="py-2.5 px-3 text-right">
                                                <button 
                                                   onClick={() => state.handleToggleValid(point)}
                                                   disabled={state.activeTargetId === point.id}
                                                   className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all print:hidden
                                                      ${isInvalid ? 'text-emerald-500 hover:bg-emerald-50' : 'text-rose-400 hover:bg-rose-50'}`}
                                                   title={isInvalid ? "Réactiver ce point" : "Invalider ce point"}
                                                >
                                                   {state.activeTargetId === point.id ? (
                                                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                                   ) : (
                                                      isInvalid ? <CheckCircle2 size={14} /> : <Ban size={14} />
                                                   )}
                                                </button>
                                                {isInvalid && (
                                                   <div className="text-[9px] font-medium text-rose-500 whitespace-nowrap hidden print:block">
                                                      Point Invalidé
                                                   </div>
                                                )}
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>

      <QcCancelModal 
        isOpen={state.cancelState.isOpen}
        motive={state.cancelState.motive}
        savingCancel={state.savingCancel}
        onClose={state.closeCancelModal}
        onMotiveChange={state.setMotive}
        onConfirm={state.handleConfirmCancel}
      />

      {state.notification && (
        <NotificationToast type={state.notification.type} message={state.notification.message} />
      )}
    </div>
  );
}
