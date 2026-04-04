'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TemperatureReading } from '@/components/temperature/types';

interface TemperatureHistoryChartProps {
  readings: TemperatureReading[];
  min: number;
  max: number;
  unit: string;
}

export function TemperatureHistoryChart({ readings, min, max, unit }: TemperatureHistoryChartProps) {
  if (readings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">
        Aucun point à afficher.
      </div>
    );
  }

  const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const values = sorted.map((item) => item.value);
  const minValue = Math.min(min, ...values);
  const maxValue = Math.max(max, ...values);
  const padding = (maxValue - minValue || 1) * 0.3;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;
  const chartRange = chartMax - chartMin;

  const width = 800;
  const height = 300;
  const margin = 40;

  const getX = (index: number) => margin + (index * (width - margin * 2)) / (sorted.length - 1 || 1);
  const getY = (value: number) => height - margin - ((value - chartMin) * (height - margin * 2)) / chartRange;
  const points = sorted.map((item, index) => `${getX(index)},${getY(item.value)}`).join(' ');

  return (
    <Tooltip.Provider delayDuration={0}>
      <div className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Zone de sécurité: {min} - {max}
                {unit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>{sorted.length} points</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/30 p-4">
          <svg width="100%" height="320" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
            <line x1={margin} y1={getY(min)} x2={width - margin} y2={getY(min)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={margin} y1={getY(max)} x2={width - margin} y2={getY(max)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

            <rect
              x={margin}
              y={getY(max)}
              width={width - margin * 2}
              height={Math.abs(getY(min) - getY(max))}
              fill="rgba(16, 185, 129, 0.05)"
            />

            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              className="drop-shadow-sm"
            />

            {sorted.map((item, index) => (
              <Tooltip.Root key={item.id}>
                <Tooltip.Trigger asChild>
                  <circle
                    cx={getX(index)}
                    cy={getY(item.value)}
                    r="6"
                    className={`cursor-pointer transition-all duration-200 hover:r-8 ${
                      item.isOutOfRange ? 'fill-rose-500 stroke-rose-200' : 'fill-emerald-500 stroke-emerald-200'
                    }`}
                    strokeWidth="4"
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={8}
                    className="z-50 animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 shadow-xl"
                  >
                    <div className="flex min-w-[140px] flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valeur</span>
                        <span className={`text-sm font-black ${item.isOutOfRange ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.value.toFixed(1)}
                          {unit}
                        </span>
                      </div>
                      <div className="my-0.5 h-px bg-slate-800" />
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[9px] font-bold uppercase text-slate-500">{item.period}</span>
                        <span className="text-[10px] font-bold text-slate-300">
                          {format(new Date(item.recordedAt), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      {item.correctiveAction && (
                        <div className="mt-1 border-t border-slate-800 pt-1.5">
                          <span className="mb-0.5 block text-[8px] font-black uppercase tracking-tight text-amber-500">
                            Action corrective:
                          </span>
                          <p className="text-[10px] italic leading-tight text-slate-400">{item.correctiveAction}</p>
                        </div>
                      )}
                    </div>
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </svg>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
