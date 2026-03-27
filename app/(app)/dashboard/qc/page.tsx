'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, ShieldAlert, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { getQcZone } from '@/lib/qc';

type QcValue = {
  id: string;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
  measured: number;
  zScore: number | null;
  inAcceptanceRange: boolean | null;
  flag: string;
  rule: string | null;
};

type QcResult = {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  performedAt: string;
  values: QcValue[];
};

type QcTarget = {
  id: string;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
};

type QcLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  isActive: boolean;
  targets: QcTarget[];
  targetsCount: number;
  resultsCount30d: number;
  lastResult: QcResult | null;
  todayResult: QcResult | null;
};

type QcMaterial = {
  id: string;
  name: string;
  level: string;
  manufacturer: string | null;
  lots: QcLot[];
};

type TodaySummary = {
  allPass: boolean;
  missing: number;
  warn: number;
  fail: number;
};

export default function QcDashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canWrite = ['ADMIN', 'TECHNICIEN'].includes(role);
  const isAdmin = role === 'ADMIN';

  const [materials, setMaterials] = useState<QcMaterial[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<QcLot | null>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [comment, setComment] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatQcNumber = (value: number) => {
    if (!Number.isFinite(value)) return '--';
    return value.toFixed(2);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsRes, todayRes] = await Promise.all([
        fetch('/api/qc', { cache: 'no-store' }),
        fetch('/api/qc/today', { cache: 'no-store' }),
      ]);

      const [materialsData, todayData] = await Promise.all([materialsRes.json(), todayRes.json()]);

      if (materialsRes.ok) {
        setMaterials(materialsData);
      }
      if (todayRes.ok) {
        setTodaySummary(todayData);
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement du contrôle qualité');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const modeSummary = useMemo(() => {
    return materials.reduce(
      (acc, material) => {
        material.lots.forEach((lot) => {
          lot.targets.forEach((target) => {
            if (target.controlMode === 'STATISTICAL') {
              acc.statistical += 1;
            } else {
              acc.acceptance += 1;
            }
          });
        });
        return acc;
      },
      { statistical: 0, acceptance: 0 }
    );
  }, [materials]);

  const overallLabel = useMemo(() => {
    if (!todaySummary) return 'Chargement...';
    if (todaySummary.fail > 0) return `${todaySummary.fail} échec(s)`;
    if (todaySummary.missing > 0) return `${todaySummary.missing} non effectué(s)`;
    if (todaySummary.warn > 0) return `${todaySummary.warn} avertissement(s)`;
    return 'Tous conformes';
  }, [todaySummary]);

  const openEntry = (lot: QcLot) => {
    setSelectedLot(lot);
    setComment('');
    setInstrumentName('');
    setValues(
      Object.fromEntries(
        lot.targets.map((target) => [target.testCode, ''])
      )
    );
    setShowEntry(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLot) return;

    const payload = {
      instrumentName: instrumentName.trim() || null,
      comment: comment.trim() || null,
      values: selectedLot.targets
        .map((target) => ({
          testCode: target.testCode,
          measured: Number(values[target.testCode]),
        }))
        .filter((value) => Number.isFinite(value.measured)),
    };

    const res = await fetch(`/api/qc/lots/${selectedLot.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la saisie QC');
      return;
    }

    setShowEntry(false);
    showNotification(
      data.status === 'fail' ? 'error' : 'success',
      data.status === 'fail' ? 'Contrôle rejeté' : data.status === 'warn' ? 'Contrôle enregistré avec avertissement' : 'Contrôle conforme'
    );
    await loadData();
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Contrôle Qualité</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Suivi quotidien des contrôles, lots actifs, suivi statistique et plages d’acceptation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${todaySummary?.fail ? 'status-pill-error' : todaySummary?.missing || todaySummary?.warn ? 'status-pill-warning' : 'status-pill-success'}`}>
              {overallLabel}
            </span>
            {isAdmin && (
              <Link href="/dashboard/qc/config" className="btn-secondary-md">
                <Plus className="h-4 w-4" />
                Configurer
              </Link>
            )}
          </div>
        </div>
      </section>

      {todaySummary && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Conformes" value={todaySummary.allPass ? 'Oui' : 'Non'} icon={ShieldCheck} tone="success" />
          <SummaryCard label="Manquants" value={String(todaySummary.missing)} icon={TriangleAlert} tone="warning" />
          <SummaryCard label="Avertissements" value={String(todaySummary.warn)} icon={AlertCircle} tone="warning" />
          <SummaryCard label="Échecs" value={String(todaySummary.fail)} icon={ShieldAlert} tone="critical" />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cibles statistiques</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{modeSummary.statistical}</div>
          <div className="mt-2 text-sm text-[var(--color-text-soft)]">Cibles suivies avec SD, z-score et règles Westgard.</div>
        </div>
        <div className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cibles par plage</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{modeSummary.acceptance}</div>
          <div className="mt-2 text-sm text-[var(--color-text-soft)]">Cibles validées par plage d’acceptation min/max.</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loading && Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-card h-[220px]" />)}
        {!loading && materials.map((material) => (
          <article key={material.id} className="bento-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">{material.manufacturer || 'Fabricant non renseigné'}</div>
              </div>
              <span className={`status-pill ${material.level === 'Critique' ? 'status-pill-error' : material.level === 'Pathologique' ? 'status-pill-warning' : 'status-pill-info'}`}>
                {material.level}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {material.lots.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-[var(--color-text-soft)]">
                  Aucun lot actif configuré pour ce matériel.
                </div>
              ) : (
                material.lots.map((lot) => (
                  <div key={lot.id} className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4">
                    {(() => {
                      const lotStatisticalCount = lot.targets.filter((target) => target.controlMode === 'STATISTICAL').length;
                      const lotAcceptanceCount = lot.targets.length - lotStatisticalCount;
                      return (
                        <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text)]">Lot {lot.lotNumber}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                          Expire le {new Date(lot.expiryDate).toLocaleDateString('fr-FR')} · {lot.targetsCount} paramètre(s)
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          {lotStatisticalCount > 0 && (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
                              {lotStatisticalCount} statistique{lotStatisticalCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {lotAcceptanceCount > 0 && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                              {lotAcceptanceCount} plage{lotAcceptanceCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`status-pill ${lot.todayResult?.status === 'fail' ? 'status-pill-error' : lot.todayResult?.status === 'warn' ? 'status-pill-warning' : lot.todayResult ? 'status-pill-success' : 'status-pill-warning'}`}>
                        {lot.todayResult ? (lot.todayResult.status === 'pass' ? 'Conforme' : lot.todayResult.status === 'warn' ? 'Avertissement' : 'Échec') : 'Non effectué'}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-[var(--color-text-soft)]">
                        {lot.lastResult
                          ? `Dernière saisie: ${new Date(lot.lastResult.performedAt).toLocaleString('fr-FR')}`
                          : 'Aucun résultat enregistré'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/qc/${lot.id}`} className="btn-secondary-sm">
                          Voir le graphique
                        </Link>
                        {canWrite && (
                          <button onClick={() => openEntry(lot)} className="btn-primary-sm">
                            Saisir QC
                          </button>
                        )}
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      {showEntry && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowEntry(false)}>
          <div className="modal-shell flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Saisie QC</h2>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">Lot {selectedLot.lotNumber} · {selectedLot.targets.length} paramètre(s)</p>
              </div>
              <button onClick={() => setShowEntry(false)} className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="form-label">Automate / instrument</span>
                    <input className="input-premium h-11 bg-white" value={instrumentName} onChange={(e) => setInstrumentName(e.target.value)} placeholder="Ex: Sysmex XP-300" />
                  </label>
                  <label className="grid gap-1">
                    <span className="form-label">Commentaire</span>
                    <input className="input-premium h-11 bg-white" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observation optionnelle" />
                  </label>
                </div>

                <div className="space-y-3">
                  {selectedLot.targets.map((target) => {
                    const raw = values[target.testCode];
                    const numeric = Number(raw);
                    const zScore =
                      Number.isFinite(numeric) && target.controlMode === 'STATISTICAL' && target.sd && target.sd > 0
                        ? (numeric - target.mean) / target.sd
                        : null;
                    const acceptanceOk =
                      Number.isFinite(numeric) &&
                      target.controlMode === 'ACCEPTANCE_RANGE' &&
                      target.minAcceptable !== null &&
                      target.maxAcceptable !== null
                        ? numeric >= target.minAcceptable && numeric <= target.maxAcceptable
                        : null;
                    const tone =
                      target.controlMode === 'STATISTICAL'
                        ? zScore === null ? 'bg-slate-200' :
                          Math.abs(zScore) > 3 ? 'bg-rose-500' :
                          Math.abs(zScore) > 2 ? 'bg-amber-400' :
                          'bg-emerald-500'
                        : acceptanceOk === null ? 'bg-slate-200' : acceptanceOk ? 'bg-emerald-500' : 'bg-rose-500';

                    return (
                      <div key={target.id} className="grid gap-3 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4 lg:grid-cols-[1.1fr_0.8fr_0.8fr_auto] lg:items-center">
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text)]">{target.testName}</div>
                          <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                            {target.testCode} · Cible {formatQcNumber(target.mean)} {target.unit || ''}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
                              Mode: {target.controlMode === 'STATISTICAL' ? 'Statistique' : 'Plage'}
                            </span>
                            {target.controlMode === 'STATISTICAL' && target.sd ? (
                              <>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
                                  1 SD: {formatQcNumber(target.mean - target.sd)} - {formatQcNumber(target.mean + target.sd)}
                                </span>
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                                  2 SD: {formatQcNumber(target.mean - target.sd * 2)} - {formatQcNumber(target.mean + target.sd * 2)}
                                </span>
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                                  3 SD: {formatQcNumber(target.mean - target.sd * 3)} - {formatQcNumber(target.mean + target.sd * 3)}
                                </span>
                              </>
                            ) : (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                                Plage: {formatQcNumber(target.minAcceptable ?? NaN)} - {formatQcNumber(target.maxAcceptable ?? NaN)}
                              </span>
                            )}
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          className="input-premium h-11 bg-white"
                          value={raw || ''}
                          onChange={(e) => setValues((prev) => ({ ...prev, [target.testCode]: e.target.value }))}
                          placeholder="Valeur mesurée"
                        />
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {target.controlMode === 'STATISTICAL'
                            ? zScore === null ? '—' : `z = ${zScore.toFixed(2)}`
                            : acceptanceOk === null ? '—' : acceptanceOk ? 'Dans la plage' : 'Hors plage'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-3 w-3 rounded-full ${tone}`} />
                          <span className="text-xs font-medium text-[var(--color-text-soft)]">
                            {target.controlMode === 'STATISTICAL'
                              ? zScore === null
                                ? 'En attente'
                                : getQcZone(zScore).label
                              : acceptanceOk === null
                                ? 'En attente'
                                : acceptanceOk
                                  ? 'Conforme a la plage'
                                  : 'Hors plage'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end border-t border-[var(--color-border)] px-6 py-4">
                <button type="submit" className="btn-primary-md px-6">
                  Enregistrer le contrôle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
  tone: 'success' | 'warning' | 'critical';
}) {
  const classes =
    tone === 'critical'
      ? 'bg-rose-50 text-rose-700'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${classes}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{value}</div>
    </div>
  );
}
