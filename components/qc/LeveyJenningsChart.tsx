import * as Tooltip from '@radix-ui/react-tooltip';

type ChartPoint = {
  id: string;
  performedAt: string;
  performedByName?: string;
  measured: number;
  zScore: number | null;
  flag: string;
  rule?: string | null;
  inAcceptanceRange?: boolean | null;
};

const WIDTH = 720;
const HEIGHT = 240;
const PADDING_X = 42;
const PADDING_Y = 22;

function yToPx(value: number, minValue: number, maxValue: number) {
  const safeMin = Number.isFinite(minValue) ? minValue : 0;
  const safeMax = Number.isFinite(maxValue) && maxValue > safeMin ? maxValue : safeMin + 1;
  const clamped = Math.min(Math.max(value, safeMin), safeMax);
  const normalized = (safeMax - clamped) / (safeMax - safeMin);
  return PADDING_Y + normalized * (HEIGHT - PADDING_Y * 2);
}

function xToPx(index: number, total: number) {
  if (total <= 1) return WIDTH / 2;
  return PADDING_X + (index / (total - 1)) * (WIDTH - PADDING_X * 2);
}

export function LeveyJenningsChart({
  title,
  points,
  mean,
  sd,
  unit,
  controlMode,
  minAcceptable,
  maxAcceptable,
}: {
  title: string;
  points: ChartPoint[];
  mean: number;
  sd: number | null;
  unit?: string | null;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  minAcceptable: number | null;
  maxAcceptable: number | null;
}) {
  const ordered = [...points].slice(0, 30).reverse();

  const statistical = controlMode === 'STATISTICAL' && sd && sd > 0;
  const rangeMin = statistical
    ? mean - sd * 3.5
    : Math.min(
        ...(ordered.map((point) => point.measured)),
        minAcceptable ?? mean,
        mean
      ) - 1;
  const rangeMax = statistical
    ? mean + sd * 3.5
    : Math.max(
        ...(ordered.map((point) => point.measured)),
        maxAcceptable ?? mean,
        mean
      ) + 1;

  const path = ordered
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xToPx(index, ordered.length)} ${yToPx(point.measured, rangeMin, rangeMax)}`)
    .join(' ');

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-[0_8px_22px_rgba(15,31,51,0.04)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
          {statistical ? 'Levey-Jennings sur les 30 derniers points' : "Courbe de tendance sur les 30 derniers points"}
        </p>
        <div className="mt-3 grid gap-2 text-xs text-[var(--color-text-soft)] md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-[var(--color-surface-muted)] px-3 py-2">
            <span className="font-semibold text-[var(--color-text)]">Cible</span> {mean.toFixed(2)} {unit || ''}
          </div>
          {statistical ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Zone ±1 SD</span> {(mean - sd).toFixed(2)} - {(mean + sd).toFixed(2)} {unit || ''}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Zone ±2 SD</span> {(mean - sd * 2).toFixed(2)} - {(mean + sd * 2).toFixed(2)} {unit || ''}
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Zone ±3 SD</span> {(mean - sd * 3).toFixed(2)} - {(mean + sd * 3).toFixed(2)} {unit || ''}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Min acceptable</span> {(minAcceptable ?? mean).toFixed(2)} {unit || ''}
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Max acceptable</span> {(maxAcceptable ?? mean).toFixed(2)} {unit || ''}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <span className="font-semibold text-[var(--color-text)]">Lecture</span> Conforme si la valeur reste dans la plage
              </div>
            </>
          )}
          {statistical && (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 md:col-span-4">
              <span className="font-semibold text-[var(--color-text)]">Lecture</span> ±2 SD = alerte, ±3 SD = rejet
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto relative pb-8">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[640px] overflow-visible">
          {statistical ? (
            [-3, -2, -1, 0, 1, 2, 3].map((line) => {
              const y = yToPx(mean + line * sd, rangeMin, rangeMax);
              const color =
                Math.abs(line) === 3 ? '#dc2626' :
                Math.abs(line) === 2 ? '#d97706' :
                line === 0 ? '#2563eb' :
                '#cbd5e1';
              const dash = line === 0 ? undefined : '6 6';
              return (
                <g key={line}>
                  <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} stroke={color} strokeWidth="1.5" strokeDasharray={dash} />
                  <text x="6" y={y + 4} fontSize="10" fill="#64748b">
                    {line === 0 ? 'X̄' : `${line > 0 ? '+' : ''}${line}SD`}
                  </text>
                </g>
              );
            })
          ) : (
            <>
              {[
                { label: 'Max', value: maxAcceptable ?? mean, color: '#16a34a' },
                { label: 'Cible', value: mean, color: '#2563eb' },
                { label: 'Min', value: minAcceptable ?? mean, color: '#16a34a' },
              ].map((line) => {
                const y = yToPx(line.value, rangeMin, rangeMax);
                const dash = line.label === 'Cible' ? undefined : '6 6';
                return (
                  <g key={line.label}>
                    <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} stroke={line.color} strokeWidth="1.5" strokeDasharray={dash} />
                    <text x="6" y={y + 4} fontSize="10" fill="#64748b">
                      {line.label}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {ordered.length > 1 && (
            <path d={path} fill="none" stroke="#0f172a" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          )}

          <Tooltip.Provider>
            {ordered.map((point, index) => {
              const cx = xToPx(index, ordered.length);
              const cy = yToPx(point.measured, rangeMin, rangeMax);
              
              const fill =
                point.flag === 'fail' ? '#dc2626' :
                point.flag === 'warn' ? '#d97706' :
                '#16a34a';

              return (
                <Tooltip.Root key={point.id} delayDuration={0}>
                  <Tooltip.Trigger asChild>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={point.flag === 'fail' ? 5.2 : 4.2}
                      fill={fill}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all hover:r-[7px] outline-none focus-visible:stroke-indigo-600 focus-visible:stroke-[3]"
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      align="center"
                      sideOffset={5}
                      className="z-[100] animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs min-w-[200px] border border-slate-700 relative">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                           <span className="font-bold">{new Date(point.performedAt).toLocaleString('fr-FR')}</span>
                           <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                             point.flag === 'fail' ? 'bg-rose-500' : point.flag === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                           }`}>
                             {point.flag === 'fail' ? 'Échec' : point.flag === 'warn' ? 'Alerte' : 'Conforme'}
                           </span>
                        </div>
                        <div className="grid gap-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Valeur:</span>
                            <span className="font-black text-white">{point.measured} {unit || ''}</span>
                          </div>
                          {statistical ? (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Z-Score:</span>
                              <span className="font-black text-white">{point.zScore?.toFixed(2) ?? '—'}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Zone:</span>
                              <span className="font-black text-white">{point.inAcceptanceRange ? 'Dans la plage' : 'Hors plage'}</span>
                            </div>
                          )}
                          {point.rule && (
                            <div className="flex justify-between mt-1 pt-1 border-t border-slate-700">
                              <span className="text-slate-400">Règle violée:</span>
                              <span className="font-black text-rose-400">{point.rule}</span>
                            </div>
                          )}
                          {point.performedByName && (
                            <div className="flex justify-between mt-1 pt-1 border-t border-slate-700">
                              <span className="text-slate-400">Opérateur:</span>
                              <span className="font-medium text-slate-300">{point.performedByName}</span>
                            </div>
                          )}
                        </div>
                        <Tooltip.Arrow className="fill-slate-900 border-slate-700" width={12} height={6} />
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </Tooltip.Provider>
        </svg>

      </div>
    </div>
  );
}
