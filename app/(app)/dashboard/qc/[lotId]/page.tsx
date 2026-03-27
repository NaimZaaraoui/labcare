'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Slash } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LeveyJenningsChart } from '@/components/qc/LeveyJenningsChart';
import { getQcZone } from '@/lib/qc';
import { NotificationToast } from '@/components/ui/notification-toast';

type QcValue = {
  id: string;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  measured: number;
  zScore: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  inAcceptanceRange: boolean | null;
  flag: string;
  rule: string | null;
  unit: string | null;
};

type QcResult = {
  id: string;
  performedAt: string;
  status: string;
  values: QcValue[];
};

type QcLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  material: {
    name: string;
    level: string;
  };
  targets: Array<{
    id: string;
    testCode: string;
    testName: string;
    controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
    mean: number;
    sd: number | null;
    minAcceptable: number | null;
    maxAcceptable: number | null;
    unit: string | null;
  }>;
  results: QcResult[];
};

export default function QcLotPage() {
  const params = useParams<{ lotId: string }>();
  const [lot, setLot] = useState<QcLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const loadLot = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/qc/lots/${params.lotId}`, { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setLot(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.lotId) {
      loadLot();
    }
  }, [params.lotId]);

  const refreshLot = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qc/lots/${params.lotId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setLot(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelResult = async (resultId: string) => {
    const reason = window.prompt('Motif d’annulation du contrôle QC');
    if (!reason?.trim()) return;

    const res = await fetch(`/api/qc/results/${resultId}/invalidate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de l’annulation du résultat QC');
      return;
    }
    showNotification('success', 'Résultat QC annulé');
    await refreshLot();
  };

  const grouped = useMemo(() => {
    if (!lot) return [];

    return lot.targets.map((target) => ({
      target,
      points: lot.results
        .map((result) => {
          const value = result.values.find((entry) => entry.testCode === target.testCode);
          if (!value) return null;
          return {
            id: value.id,
            performedAt: result.performedAt,
            measured: value.measured,
            zScore: value.zScore,
            controlMode: value.controlMode,
            minAcceptable: value.minAcceptable,
            maxAcceptable: value.maxAcceptable,
            inAcceptanceRange: value.inAcceptanceRange,
            flag: value.flag,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    }));
  }, [lot]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-4 pb-16">
        <div className="skeleton-card h-28" />
        <div className="skeleton-card h-[420px]" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Lot QC introuvable</div>
        <div className="empty-state-text">Le lot demandé n’existe pas ou n’est plus accessible.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <Link href="/dashboard/qc" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
          <ArrowLeft className="h-4 w-4" />
          Retour au contrôle qualité
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">{lot.material.name}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Lot {lot.lotNumber} · Niveau {lot.material.level}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text-secondary)]">
            <CalendarClock className="h-4 w-4" />
            Expire le {new Date(lot.expiryDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </section>

      <section className="space-y-4">
        {grouped.map(({ target, points }) => (
          <div key={target.id} className="space-y-4">
            <LeveyJenningsChart
              title={`${target.testName} (${target.testCode})`}
              points={points}
              mean={target.mean}
              sd={target.sd}
              unit={target.unit}
              controlMode={target.controlMode}
              minAcceptable={target.minAcceptable}
              maxAcceptable={target.maxAcceptable}
            />
            <div className="overflow-hidden rounded-3xl border bg-white shadow-[0_10px_30px_rgba(15,31,51,0.06)]">
              <div className="grid grid-cols-6 border-b bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
                <div>Date</div>
                <div>Mesuré</div>
                <div>Z-score</div>
                <div>Zone</div>
                <div>Flag</div>
                <div>Règle</div>
              </div>
              <div className="divide-y">
                {points.slice().reverse().slice(0, 10).map((point) => {
                  const zone =
                    point.controlMode === 'STATISTICAL'
                      ? getQcZone(point.zScore)
                      : {
                          label: point.inAcceptanceRange ? 'Dans la plage' : 'Hors plage',
                          tone: point.inAcceptanceRange ? 'status-pill-success' : 'status-pill-error',
                        };
                  return (
                  <div key={point.id} className="grid grid-cols-6 items-center gap-3 px-5 py-3 text-sm">
                    <div className="text-[var(--color-text-secondary)]">{new Date(point.performedAt).toLocaleString('fr-FR')}</div>
                    <div className="font-medium text-[var(--color-text)]">{point.measured} {target.unit || ''}</div>
                    <div className="text-[var(--color-text-secondary)]">
                      {point.controlMode === 'STATISTICAL' ? (point.zScore !== null ? point.zScore.toFixed(2) : '—') : '—'}
                    </div>
                    <div>
                      <span className={`status-pill ${zone.tone}`}>
                        {zone.label}
                      </span>
                    </div>
                    <div>
                      <span className={`status-pill ${point.flag === 'fail' ? 'status-pill-error' : point.flag === 'warn' ? 'status-pill-warning' : 'status-pill-success'}`}>
                        {point.flag === 'fail' ? 'Échec' : point.flag === 'warn' ? 'Avert.' : 'OK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[var(--color-text-secondary)]">
                      <span>{lot.results.flatMap((result) => result.values).find((entry) => entry.id === point.id)?.rule || '—'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const resultId = lot.results.find((result) => result.values.some((entry) => entry.id === point.id))?.id;
                          if (resultId) void cancelResult(resultId);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Slash className="h-3.5 w-3.5" />
                        Annuler
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        ))}
      </section>

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
