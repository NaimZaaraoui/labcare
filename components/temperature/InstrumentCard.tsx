'use client';

import { Edit3, Printer, Thermometer } from 'lucide-react';
import { ReadingSlot } from '@/components/temperature/ReadingSlot';
import type { Instrument, TemperaturePeriod } from '@/components/temperature/types';

interface InstrumentCardProps {
  instrument: Instrument;
  canManage: boolean;
  onOpenRecord: (instrument: Instrument, period: TemperaturePeriod) => void;
  onOpenHistory: (instrumentId: string) => void;
  onOpenEdit: (instrument: Instrument) => void;
  onPrint: (instrumentId: string) => void;
}

export function InstrumentCard({
  instrument,
  canManage,
  onOpenRecord,
  onOpenHistory,
  onOpenEdit,
  onPrint,
}: InstrumentCardProps) {
  const morningReading = instrument.todayReadings.find((reading) => reading.period === 'matin') || null;
  const eveningReading = instrument.todayReadings.find((reading) => reading.period === 'soir') || null;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-indigo-100 hover:shadow-[0_12px_40px_rgba(79,70,229,0.06)] ${
        instrument.isActive === false ? 'opacity-70 grayscale' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black tracking-tight text-slate-800">{instrument.name}</h3>
            {instrument.todayStatus === 'alert' && <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg border border-indigo-100/50 bg-indigo-50/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
              {instrument.type}
            </span>
            {instrument.isActive === false && (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Inactif
              </span>
            )}
            {instrument.location && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{instrument.location}</span>
            )}
          </div>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
            instrument.todayStatus === 'alert'
              ? 'bg-rose-50 text-rose-500'
              : instrument.todayStatus === 'missing' || instrument.todayStatus === 'empty'
                ? 'bg-amber-50 text-amber-500'
                : 'bg-emerald-50 text-emerald-500'
          }`}
        >
          <Thermometer className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plage de sécurité</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">
              {instrument.targetMin}
              {instrument.unit}
            </span>
            <span className="h-px w-3 bg-slate-300" />
            <span className="text-sm font-black text-slate-900">
              {instrument.targetMax}
              {instrument.unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ReadingSlot
            label="Matin"
            reading={morningReading}
            unit={instrument.unit}
            onClick={() => !instrument.morningDone && instrument.isActive !== false && onOpenRecord(instrument, 'matin')}
          />
          <ReadingSlot
            label="Soir"
            reading={eveningReading}
            unit={instrument.unit}
            onClick={() => !instrument.eveningDone && instrument.isActive !== false && onOpenRecord(instrument, 'soir')}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-50 pt-4">
        <button
          className="btn-secondary-sm flex-1 !border-none !bg-slate-50 !text-slate-600 hover:!bg-indigo-50 hover:!text-indigo-600"
          onClick={() => onOpenHistory(instrument.id)}
        >
          Historique
        </button>
        {canManage && (
          <button
            className="rounded-xl border border-slate-100 p-2.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => onOpenEdit(instrument)}
            title="Modifier"
          >
            <Edit3 size={16} />
          </button>
        )}
        <button
          className="rounded-xl border border-slate-100 p-2.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          onClick={() => onPrint(instrument.id)}
          title="Imprimer rapport mensuel"
        >
          <Printer size={16} />
        </button>
      </div>
    </article>
  );
}
