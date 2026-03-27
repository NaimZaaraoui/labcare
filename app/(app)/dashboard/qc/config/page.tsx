'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, PencilLine, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';

type Material = {
  id: string;
  name: string;
  level: string;
  manufacturer: string | null;
  isActive?: boolean;
  lots: Array<{
    id: string;
    lotNumber: string;
    expiryDate: string;
    openedAt?: string | null;
    isActive: boolean;
    targets: Array<{
      id: string;
      testId: string | null;
      testCode: string;
      testName: string;
      controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
      mean: number;
      sd: number | null;
      minAcceptable: number | null;
      maxAcceptable: number | null;
      unit: string | null;
    }>;
  }>;
};

type TestOption = {
  id: string;
  code: string;
  name: string;
  unit: string | null;
};

type TargetRow = {
  testId: string;
  testCode: string;
  testName: string;
  mean: string;
  sd: string;
  unit: string;
  inputMode: 'sd' | 'range';
  minValue: string;
  maxValue: string;
};

type RangeBasis = '1sd' | '2sd' | '3sd';

const LEVELS = ['Normal', 'Pathologique', 'Critique'];

export default function QcConfigPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<string[]>([]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [globalRangeBasis, setGlobalRangeBasis] = useState<RangeBasis>('2sd');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [materialForm, setMaterialForm] = useState({ name: '', level: LEVELS[0], manufacturer: '' });
  const [lotForm, setLotForm] = useState({ materialId: '', lotNumber: '', expiryDate: '', openedAt: '' });
  const [targetRows, setTargetRows] = useState<TargetRow[]>([
    { testId: '', testCode: '', testName: '', mean: '', sd: '', unit: '', inputMode: 'range', minValue: '', maxValue: '' },
  ]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const emptyTargetRow: TargetRow = { testId: '', testCode: '', testName: '', mean: '', sd: '', unit: '', inputMode: 'range', minValue: '', maxValue: '' };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsRes, testsRes, settingsRes] = await Promise.all([
        fetch('/api/qc?includeInactive=true', { cache: 'no-store' }),
        fetch('/api/tests?includeGrouped=false', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);
      const [materialsData, testsData, settingsData] = await Promise.all([materialsRes.json(), testsRes.json(), settingsRes.json()]);
      if (materialsRes.ok) {
        setMaterials(materialsData);
        const firstLotId = materialsData.flatMap((material: Material) => material.lots)[0]?.id || '';
        setSelectedLotId((prev) => prev || firstLotId);
        setExpandedMaterialIds((prev) => {
          if (prev.length > 0) return prev;
          return materialsData[0]?.id ? [materialsData[0].id] : [];
        });
      }
      if (testsRes.ok && Array.isArray(testsData)) {
        setTests(testsData);
      }
      if (settingsRes.ok && ['1sd', '2sd', '3sd'].includes(settingsData.qc_range_basis)) {
        setGlobalRangeBasis(settingsData.qc_range_basis as RangeBasis);
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement de la configuration QC');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMaterials = useMemo(() => {
    const query = materialQuery.trim().toLowerCase();
    if (!query) return materials;

    return materials
      .map((material) => {
        const materialMatch =
          material.name.toLowerCase().includes(query) ||
          material.level.toLowerCase().includes(query) ||
          (material.manufacturer || '').toLowerCase().includes(query);

        if (materialMatch) return material;

        const lots = material.lots.filter((lot) => {
          return (
            lot.lotNumber.toLowerCase().includes(query) ||
            lot.targets.some(
              (target) =>
                target.testCode.toLowerCase().includes(query) ||
                target.testName.toLowerCase().includes(query)
            )
          );
        });

        return lots.length > 0 ? { ...material, lots } : null;
      })
      .filter((material): material is Material => material !== null);
  }, [materialQuery, materials]);

  const toggleMaterial = (materialId: string) => {
    setExpandedMaterialIds((prev) =>
      prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId]
    );
  };

  const handleSelectLot = (lotId: string, materialId: string) => {
    setSelectedLotId((prev) => (prev === lotId ? '' : lotId));
    setExpandedMaterialIds((prev) => (prev.includes(materialId) ? prev : [...prev, materialId]));
    setTargetRows([{ ...emptyTargetRow }]);
  };

  const updateLot = async (lotId: string, currentLot: { lotNumber: string; expiryDate: string; openedAt?: string | null }) => {
    const lotNumber = window.prompt('Numéro du lot', currentLot.lotNumber)?.trim();
    if (!lotNumber) return;

    const currentExpiry = currentLot.expiryDate ? new Date(currentLot.expiryDate).toISOString().slice(0, 10) : '';
    const expiryDate = window.prompt('Date d’expiration (YYYY-MM-DD)', currentExpiry)?.trim();
    if (!expiryDate) return;

    const currentOpened = currentLot.openedAt ? new Date(currentLot.openedAt).toISOString().slice(0, 10) : '';
    const openedAt = window.prompt('Date d’ouverture (optionnelle, YYYY-MM-DD)', currentOpened)?.trim() ?? '';

    const res = await fetch(`/api/qc/lots/${lotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lotNumber, expiryDate, openedAt: openedAt || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la modification du lot QC');
      return;
    }
    showNotification('success', 'Lot QC mis à jour');
    await loadData();
  };

  const toggleLot = async (lotId: string) => {
    const res = await fetch(`/api/qc/lots/${lotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-active' }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors du changement de statut du lot');
      return;
    }
    showNotification('success', data.isActive ? 'Lot QC réactivé' : 'Lot QC désactivé');
    await loadData();
  };

  const deleteLot = async (lotId: string, lotNumber: string) => {
    if (!window.confirm(`Supprimer définitivement le lot ${lotNumber} ?`)) return;

    const res = await fetch(`/api/qc/lots/${lotId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la suppression du lot');
      return;
    }
    showNotification('success', 'Lot QC supprimé');
    setSelectedLotId((prev) => (prev === lotId ? '' : prev));
    await loadData();
  };

  const saveTargets = async (lotId: string) => {
    const payload = targetRows
      .map((row) => {
        const mean = Number(row.mean);
        const directSd = Number(row.sd);
        const minValue = Number(row.minValue);
        const maxValue = Number(row.maxValue);
        let computedSd = directSd;
        let controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE' = 'STATISTICAL';
        let minAcceptable: number | null = null;
        let maxAcceptable: number | null = null;

        if (row.inputMode === 'range' && Number.isFinite(minValue) && Number.isFinite(maxValue)) {
          const divisor = globalRangeBasis === '1sd' ? 2 : globalRangeBasis === '3sd' ? 6 : 4;
          computedSd = (maxValue - minValue) / divisor;
          controlMode = 'ACCEPTANCE_RANGE';
          minAcceptable = minValue;
          maxAcceptable = maxValue;
        } else if (row.inputMode === 'sd' && Number.isFinite(directSd) && directSd > 0) {
          minAcceptable = mean - directSd * 2;
          maxAcceptable = mean + directSd * 2;
        }

        return {
          testId: row.testId || null,
          testCode: row.testCode.trim(),
          testName: row.testName.trim(),
          controlMode,
          mean,
          sd: row.inputMode === 'sd' ? computedSd : null,
          minAcceptable,
          maxAcceptable,
          unit: row.unit.trim() || null,
        };
      })
      .filter((row) =>
        row.testCode &&
        row.testName &&
        Number.isFinite(row.mean) &&
        (
          (row.controlMode === 'STATISTICAL' && Number.isFinite(Number(row.sd)) && Number(row.sd) > 0) ||
          (row.controlMode === 'ACCEPTANCE_RANGE' && Number.isFinite(Number(row.minAcceptable)) && Number.isFinite(Number(row.maxAcceptable)))
        )
      );

    const res = await fetch(`/api/qc/lots/${lotId}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la configuration des cibles');
      return;
    }
    showNotification('success', 'Cibles QC enregistrées');
    setTargetRows([{ ...emptyTargetRow }]);
    await loadData();
  };

  const formatQcLimit = (value: string, sd: string, multiplier: number) => {
    const base = Number(value);
    const spread = Number(sd);
    if (!Number.isFinite(base) || !Number.isFinite(spread)) return '--';
    return (base + spread * multiplier).toFixed(2);
  };

  const getEffectiveSd = (row: TargetRow) => {
    if (row.inputMode === 'sd') return row.sd;
    const minValue = Number(row.minValue);
    const maxValue = Number(row.maxValue);
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return '';
    const divisor = globalRangeBasis === '1sd' ? 2 : globalRangeBasis === '3sd' ? 6 : 4;
    return ((maxValue - minValue) / divisor).toFixed(4);
  };

  const rangeBasisLabel =
    globalRangeBasis === '1sd'
      ? '±1 SD'
      : globalRangeBasis === '3sd'
        ? '±3 SD'
        : '±2 SD';

  const updateGlobalRangeBasis = async (value: RangeBasis) => {
    const previous = globalRangeBasis;
    setGlobalRangeBasis(value);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { qc_range_basis: value } }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Impossible de sauvegarder le réglage QC');
      }
    } catch (error) {
      setGlobalRangeBasis(previous);
      console.error(error);
      showNotification('error', error instanceof Error ? error.message : 'Impossible de sauvegarder le réglage QC');
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Accès réservé</div>
        <div className="empty-state-text">Seul l’administrateur peut configurer le contrôle qualité.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Configuration QC</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Matériels, lots et cibles du contrôle qualité.</p>
          </div>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="bento-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Matériels</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const res = await fetch('/api/qc/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialForm),
              });
              const data = await res.json();
              if (!res.ok) {
                showNotification('error', data.error || 'Erreur lors de la création du matériel');
                return;
              }
              setMaterialForm({ name: '', level: LEVELS[0], manufacturer: '' });
              showNotification('success', 'Matériel QC créé');
              await loadData();
            }}
          >
            <input className="input-premium h-11 bg-white" value={materialForm.name} onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nom du matériel QC" required />
            <select className="input-premium h-11 bg-white" value={materialForm.level} onChange={(e) => setMaterialForm((prev) => ({ ...prev, level: e.target.value }))}>
              {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <input className="input-premium h-11 bg-white" value={materialForm.manufacturer} onChange={(e) => setMaterialForm((prev) => ({ ...prev, manufacturer: e.target.value }))} placeholder="Fabricant" />
            <button className="btn-primary-md justify-center" type="submit">
              <Plus className="h-4 w-4" />
              Ajouter le matériel
            </button>
          </form>

          <div className="mt-5">
            <input
              className="input-premium h-11 bg-white"
              value={materialQuery}
              onChange={(e) => setMaterialQuery(e.target.value)}
              placeholder="Rechercher un matériel, un lot ou un test QC"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-soft)]">{material.level} · {material.manufacturer || 'Sans fabricant'}</div>
                  </div>
                  <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                    {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
            {filteredMaterials.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
                Aucun matériel ou lot QC ne correspond à cette recherche.
              </div>
            )}
          </div>
        </article>

        <article className="bento-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Lots et cibles</h2>
          <div className="mt-4 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">Hypothèse globale pour les plages fabricant</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                  Si une fiche QC donne seulement `cible + min/max`, le système convertit cette plage en SD interne selon ce réglage.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['1sd', 'Plage = ±1 SD'],
                  ['2sd', 'Plage = ±2 SD'],
                  ['3sd', 'Plage = ±3 SD'],
                ] as Array<[RangeBasis, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateGlobalRangeBasis(value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      globalRangeBasis === value
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                        : 'border-slate-200 bg-white text-[var(--color-text-soft)] hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            className="mt-4 grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const res = await fetch('/api/qc/lots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lotForm),
              });
              const data = await res.json();
              if (!res.ok) {
                showNotification('error', data.error || 'Erreur lors de la création du lot');
                return;
              }
              setLotForm({ materialId: materials[0]?.id || '', lotNumber: '', expiryDate: '', openedAt: '' });
              showNotification('success', 'Lot QC créé');
              await loadData();
            }}
          >
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Matériel QC</span>
              <select className="input-premium h-11 bg-white" value={lotForm.materialId} onChange={(e) => setLotForm((prev) => ({ ...prev, materialId: e.target.value }))} required>
                <option value="">Sélectionner un matériel</option>
                {materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Numéro du lot</span>
              <input className="input-premium h-11 bg-white" value={lotForm.lotNumber} onChange={(e) => setLotForm((prev) => ({ ...prev, lotNumber: e.target.value }))} placeholder="Ex. QC-2026-041" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Date d’expiration du lot</span>
              <input type="date" className="input-premium h-11 bg-white" value={lotForm.expiryDate} onChange={(e) => setLotForm((prev) => ({ ...prev, expiryDate: e.target.value }))} required />
              <span className="text-xs text-[var(--color-text-soft)]">Date limite indiquée par le fabricant sur le flacon ou la notice du contrôle.</span>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Date d’ouverture / mise en service</span>
              <input type="date" className="input-premium h-11 bg-white" value={lotForm.openedAt} onChange={(e) => setLotForm((prev) => ({ ...prev, openedAt: e.target.value }))} />
              <span className="text-xs text-[var(--color-text-soft)]">Date à laquelle le lot a été ouvert, reconstitué ou commencé au laboratoire.</span>
            </label>
            <div className="rounded-2xl border border-slate-200 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-soft)] md:col-span-2">
              La date d’expiration vient du fournisseur. La date d’ouverture sert au suivi interne du laboratoire après ouverture ou reconstitution du lot.
            </div>
            <div className="md:col-span-2">
              <button className="btn-primary-md" type="submit">
                <Plus className="h-4 w-4" />
                Nouveau lot
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
              {filteredMaterials.map((material) => {
                const isExpanded = expandedMaterialIds.includes(material.id);
                const hasSelectedLot = material.lots.some((lot) => lot.id === selectedLotId);

                return (
                  <div key={material.id} className="overflow-hidden rounded-2xl border bg-white">
                    <button
                      type="button"
                      onClick={() => toggleMaterial(material.id)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        hasSelectedLot ? 'bg-[var(--color-accent-soft)]' : 'bg-[var(--color-surface-muted)] hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                          {material.level} · {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--color-text-soft)]">
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium">
                          {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                        </span>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 border-t px-3 py-3">
                        {material.lots.length > 0 ? (
                          material.lots.map((lot) => (
                            <div key={lot.id} className="overflow-hidden rounded-2xl border bg-white">
                              <button
                                type="button"
                                onClick={() => handleSelectLot(lot.id, material.id)}
                                className={`w-full px-4 py-3 text-left transition-colors ${
                                  selectedLotId === lot.id ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-[var(--color-text)]">Lot {lot.lotNumber}</div>
                                    <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                                      Expire le {new Date(lot.expiryDate).toLocaleDateString('fr-FR')}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!lot.isActive && (
                                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                                        Inactif
                                      </span>
                                    )}
                                    <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                                      {lot.targets.length} cible{lot.targets.length > 1 ? 's' : ''}
                                    </span>
                                    {selectedLotId === lot.id ? (
                                      <ChevronDown className="h-4 w-4 text-[var(--color-text-soft)]" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-[var(--color-text-soft)]" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {selectedLotId === lot.id && (
                                <div className="space-y-4 border-t px-4 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="btn-secondary-sm"
                                      onClick={() => updateLot(lot.id, { lotNumber: lot.lotNumber, expiryDate: lot.expiryDate, openedAt: lot.openedAt })}
                                    >
                                      <PencilLine className="h-4 w-4" />
                                      Modifier le lot
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-secondary-sm"
                                      onClick={() => toggleLot(lot.id)}
                                    >
                                      <Power className="h-4 w-4" />
                                      {lot.isActive ? 'Désactiver' : 'Réactiver'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-secondary-sm text-rose-700"
                                      onClick={() => deleteLot(lot.id, lot.lotNumber)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Supprimer
                                    </button>
                                  </div>
                                  <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                    Cibles configurées pour le lot <span className="font-semibold text-[var(--color-text)]">{lot.lotNumber}</span>
                                  </div>

                                  <div className="space-y-3">
                                    {targetRows.map((row, index) => (
                                      <div key={index} className="grid gap-3 rounded-2xl border bg-white px-4 py-4">
                                        <select
                                          className="input-premium h-11 bg-white"
                                          value={row.testId}
                                          onChange={(e) => {
                                            const test = tests.find((entry) => entry.id === e.target.value);
                                            setTargetRows((prev) =>
                                              prev.map((item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,
                                                      testId: e.target.value,
                                                      testCode: test?.code || '',
                                                      testName: test?.name || '',
                                                      unit: test?.unit || '',
                                                    }
                                                  : item
                                              )
                                            );
                                          }}
                                        >
                                          <option value="">Importer depuis les tests</option>
                                          {tests.map((test) => (
                                            <option key={test.id} value={test.id}>{test.code} · {test.name}</option>
                                          ))}
                                        </select>
                                        <div className="grid gap-3 md:grid-cols-2">
                                          <input className="input-premium h-11 bg-white" value={row.testCode} onChange={(e) => setTargetRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, testCode: e.target.value } : item))} placeholder="Code test" />
                                          <input className="input-premium h-11 bg-white" value={row.testName} onChange={(e) => setTargetRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, testName: e.target.value } : item))} placeholder="Nom du test" />
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                          <input className="input-premium h-11 bg-white" type="number" step="0.01" value={row.mean} onChange={(e) => setTargetRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, mean: e.target.value } : item))} placeholder="Cible" />
                                          <select
                                            className="input-premium h-11 bg-white"
                                            value={row.inputMode}
                                            onChange={(e) =>
                                              setTargetRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                  itemIndex === index ? { ...item, inputMode: e.target.value as 'sd' | 'range' } : item
                                                )
                                              )
                                            }
                                          >
                                            <option value="range">Plage d&apos;acceptation</option>
                                            <option value="sd">Mode statistique (SD)</option>
                                          </select>
                                          <input className="input-premium h-11 bg-white" value={row.unit} onChange={(e) => setTargetRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, unit: e.target.value } : item))} placeholder="Unité" />
                                          <div className="rounded-2xl border border-slate-200 bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">SD retenue</div>
                                            <div className="mt-1 font-semibold text-[var(--color-text)]">{getEffectiveSd(row) || '--'}</div>
                                          </div>
                                        </div>
                                        {row.inputMode === 'sd' ? (
                                          <label className="grid gap-2">
                                            <span className="text-sm font-medium text-[var(--color-text)]">Écart-type (1 SD)</span>
                                            <input
                                              className="input-premium h-11 bg-white"
                                              type="number"
                                              step="0.0001"
                                              value={row.sd}
                                              onChange={(e) =>
                                                setTargetRows((prev) =>
                                                  prev.map((item, itemIndex) => itemIndex === index ? { ...item, sd: e.target.value } : item)
                                                )
                                              }
                                              placeholder="Valeur SD du fabricant"
                                            />
                                            <span className="text-xs text-[var(--color-text-soft)]">
                                              Recommandé si la fiche du contrôle fournit une vraie SD pour le suivi Westgard.
                                            </span>
                                          </label>
                                        ) : (
                                          <div className="grid gap-3 md:grid-cols-2">
                                            <label className="grid gap-2">
                                              <span className="text-sm font-medium text-[var(--color-text)]">Valeur minimale acceptable</span>
                                              <input
                                                className="input-premium h-11 bg-white"
                                                type="number"
                                                step="0.01"
                                                value={row.minValue}
                                                onChange={(e) =>
                                                  setTargetRows((prev) =>
                                                    prev.map((item, itemIndex) => itemIndex === index ? { ...item, minValue: e.target.value } : item)
                                                  )
                                                }
                                                placeholder="Borne basse fabricant"
                                              />
                                            </label>
                                            <label className="grid gap-2">
                                              <span className="text-sm font-medium text-[var(--color-text)]">Valeur maximale acceptable</span>
                                              <input
                                                className="input-premium h-11 bg-white"
                                                type="number"
                                                step="0.01"
                                                value={row.maxValue}
                                                onChange={(e) =>
                                                  setTargetRows((prev) =>
                                                    prev.map((item, itemIndex) => itemIndex === index ? { ...item, maxValue: e.target.value } : item)
                                                  )
                                                }
                                                placeholder="Borne haute fabricant"
                                              />
                                            </label>
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 text-xs">
                                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                                            Mode: {row.inputMode === 'sd' ? 'Statistique / Westgard' : 'Plage d’acceptation'}
                                          </span>
                                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                                            SD retenue: {getEffectiveSd(row) || '--'}
                                          </span>
                                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                                            1 SD: {formatQcLimit(row.mean, getEffectiveSd(row), -1)} / {formatQcLimit(row.mean, getEffectiveSd(row), 1)}
                                          </span>
                                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                                            2 SD: {formatQcLimit(row.mean, getEffectiveSd(row), -2)} / {formatQcLimit(row.mean, getEffectiveSd(row), 2)}
                                          </span>
                                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                                            3 SD: {formatQcLimit(row.mean, getEffectiveSd(row), -3)} / {formatQcLimit(row.mean, getEffectiveSd(row), 3)}
                                          </span>
                                        </div>
                                        {row.inputMode === 'range' && (
                                          <div className="text-xs text-[var(--color-text-soft)]">
                                            Utilisé pour les fiches fabricant qui donnent une plage tolérée. La validation se fait sur min/max, et la SD affichée reste une estimation interne basée sur {rangeBasisLabel}.
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTargetRows((prev) => [...prev, { ...emptyTargetRow }])}
                                      className="btn-secondary-sm"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Ajouter un paramètre
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (targetRows.some((row) => row.testId)) return;
                                        setTargetRows(
                                          tests.slice(0, 5).map((test) => ({
                                            testId: test.id,
                                            testCode: test.code,
                                            testName: test.name,
                                            mean: '',
                                            sd: '',
                                            unit: test.unit || '',
                                            inputMode: 'range',
                                            minValue: '',
                                            maxValue: '',
                                          }))
                                        );
                                      }}
                                      className="btn-secondary-sm"
                                    >
                                      Importer depuis mes tests
                                    </button>
                                    <button type="button" className="btn-primary-md" onClick={() => saveTargets(lot.id)}>
                                      Enregistrer les cibles
                                    </button>
                                  </div>

                                  <div className="rounded-2xl border bg-white">
                                    <div className="border-b px-4 py-3 text-sm font-semibold text-[var(--color-text)]">Cibles actuelles</div>
                                    <div className="divide-y">
                                      {lot.targets.length > 0 ? (
                                        lot.targets.map((target) => (
                                          <div key={target.id} className="grid grid-cols-6 px-4 py-3 text-sm">
                                            <div>{target.testCode}</div>
                                            <div className="col-span-2">{target.testName}</div>
                                            <div>{target.controlMode === 'STATISTICAL' ? 'Statistique' : 'Plage'}</div>
                                            <div>{target.mean}</div>
                                            <div>
                                              {target.controlMode === 'STATISTICAL'
                                                ? `SD ${target.sd ?? '—'}`
                                                : `${target.minAcceptable ?? '—'} - ${target.maxAcceptable ?? '—'}`}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                          Aucune cible n’est encore configurée pour ce lot.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
                            Aucun lot configuré pour ce matériel.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredMaterials.length === 0 && (
                <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
                  Aucun lot QC trouvé pour ce filtre.
                </div>
              )}
          </div>
        </article>
      </section>

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
