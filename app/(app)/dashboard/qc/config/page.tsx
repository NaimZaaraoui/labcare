'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { QcLotEditModal } from '@/components/qc/QcLotEditModal';
import { QcMaterialsPanel } from '@/components/qc/QcMaterialsPanel';
import { QcLotsTargetsPanel } from '@/components/qc/QcLotsTargetsPanel';
import {
  EMPTY_TARGET_ROW,
  LEVELS,
  type EditingLot,
  type LotFormState,
  type Material,
  type MaterialFormState,
  type RangeBasis,
  type TargetRow,
  type TestOption,
} from '@/components/qc/config-types';
import { getRangeBasisLabel } from '@/components/qc/qc-config-helpers';

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
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({ name: '', level: LEVELS[0], manufacturer: '' });
  const [lotForm, setLotForm] = useState<LotFormState>({ materialId: '', lotNumber: '', expiryDate: '', openedAt: '' });
  const [editingLot, setEditingLot] = useState<EditingLot | null>(null);
  const [savingLotEdit, setSavingLotEdit] = useState(false);
  const [deleteLotState, setDeleteLotState] = useState<{ id: string; lotNumber: string } | null>(null);
  const [targetRows, setTargetRows] = useState<TargetRow[]>([{ ...EMPTY_TARGET_ROW }]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

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
    setTargetRows([{ ...EMPTY_TARGET_ROW }]);
  };

  const updateLot = async (lotId: string, currentLot: { lotNumber: string; expiryDate: string; openedAt?: string | null }) => {
    setEditingLot({
      id: lotId,
      lotNumber: currentLot.lotNumber,
      expiryDate: currentLot.expiryDate ? new Date(currentLot.expiryDate).toISOString().slice(0, 10) : '',
      openedAt: currentLot.openedAt ? new Date(currentLot.openedAt).toISOString().slice(0, 10) : '',
    });
  };

  const saveEditedLot = async () => {
    if (!editingLot?.lotNumber.trim() || !editingLot.expiryDate) return;

    setSavingLotEdit(true);
    const res = await fetch(`/api/qc/lots/${editingLot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lotNumber: editingLot.lotNumber.trim(),
        expiryDate: editingLot.expiryDate,
        openedAt: editingLot.openedAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la modification du lot QC');
      setSavingLotEdit(false);
      return;
    }
    showNotification('success', 'Lot QC mis à jour');
    setEditingLot(null);
    setSavingLotEdit(false);
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
    setDeleteLotState({ id: lotId, lotNumber });
  };

  const confirmDeleteLot = async () => {
    if (!deleteLotState) return;

    const res = await fetch(`/api/qc/lots/${deleteLotState.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la suppression du lot');
      return;
    }
    showNotification('success', 'Lot QC supprimé');
    setSelectedLotId((prev) => (prev === deleteLotState.id ? '' : prev));
    setDeleteLotState(null);
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
    setTargetRows([{ ...EMPTY_TARGET_ROW }]);
    await loadData();
  };
  const rangeBasisLabel = getRangeBasisLabel(globalRangeBasis);

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
        <QcMaterialsPanel
          materialForm={materialForm}
          materialQuery={materialQuery}
          filteredMaterials={filteredMaterials}
          onMaterialFormChange={setMaterialForm}
          onMaterialQueryChange={setMaterialQuery}
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
        />

        <QcLotsTargetsPanel
          materials={materials}
          filteredMaterials={filteredMaterials}
          tests={tests}
          lotForm={lotForm}
          targetRows={targetRows}
          selectedLotId={selectedLotId}
          expandedMaterialIds={expandedMaterialIds}
          globalRangeBasis={globalRangeBasis}
          rangeBasisLabel={rangeBasisLabel}
          onLoadSubmit={async (event) => {
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
          onLotFormChange={setLotForm}
          onUpdateGlobalRangeBasis={updateGlobalRangeBasis}
          onToggleMaterial={toggleMaterial}
          onSelectLot={handleSelectLot}
          onUpdateLot={updateLot}
          onToggleLot={toggleLot}
          onDeleteLot={deleteLot}
          onTargetRowsChange={setTargetRows}
          onSaveTargets={saveTargets}
        />
      </section>

      <QcLotEditModal
        open={Boolean(editingLot)}
        saving={savingLotEdit}
        lot={editingLot}
        onClose={() => setEditingLot(null)}
        onChange={setEditingLot}
        onSave={saveEditedLot}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteLotState)}
        onClose={() => setDeleteLotState(null)}
        onConfirm={confirmDeleteLot}
        title="Supprimer définitivement le lot"
        message={`Le lot ${deleteLotState?.lotNumber || ''} sera supprimé avec sa configuration liée. Cette action est sensible et doit rester exceptionnelle.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        icon="warning"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
