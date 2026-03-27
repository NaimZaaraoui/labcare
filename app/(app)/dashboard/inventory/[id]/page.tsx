'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Beaker,
  Edit3,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { DEFAULT_INVENTORY_CATEGORIES, type InventoryCategoryConfig } from '@/lib/inventory-categories';

type TestRule = {
  id: string;
  quantityPerTest: number;
  isActive: boolean;
  test: {
    id: string;
    name: string;
    code: string;
  };
};

type InventoryLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  remaining: number;
  isActive: boolean;
};

type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  lotNumber: string | null;
  reason: string | null;
  performedBy: string;
  performedAt: string;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  kind: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  reference: string | null;
  storage: string | null;
  supplier: string | null;
  notes: string | null;
  isActive: boolean;
  status: 'ok' | 'low' | 'critical' | 'expired';
  nearestExpiry: string | null;
  daysUntilExpiry: number | null;
  lots: InventoryLot[];
  movements: StockMovement[];
  rules: TestRule[];
};

type TestOption = {
  id: string;
  name: string;
  code: string;
};

const UNIT_OPTIONS = ['mL', 'Tests', 'Boîtes', 'Kits', 'Flacons', 'Unités'];

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id;
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canWrite = ['ADMIN', 'TECHNICIEN'].includes(role);
  const isAdmin = role === 'ADMIN';

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showReceive, setShowReceive] = useState(false);
  const [showConsume, setShowConsume] = useState(false);
  const [showWaste, setShowWaste] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showRule, setShowRule] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ lotNumber: '', expiryDate: '', quantity: '' });
  const [consumeForm, setConsumeForm] = useState({ quantity: '', lotNumber: '', reason: '' });
  const [wasteForm, setWasteForm] = useState({ quantity: '', lotNumber: '', reason: '' });
  const [adjustForm, setAdjustForm] = useState({ newStock: '', reason: '' });
  const [ruleForm, setRuleForm] = useState({ testId: '', quantityPerTest: '' });
  const [editForm, setEditForm] = useState({
    name: '',
    reference: '',
    category: DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
    unit: UNIT_OPTIONS[0],
    minThreshold: '',
    storage: '',
    supplier: '',
    notes: '',
    kind: 'REAGENT',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadItem = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${itemId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
      setItem(data);
      setEditForm({
        name: data.name || '',
        reference: data.reference || '',
        category: data.category || DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
        unit: data.unit || UNIT_OPTIONS[0],
        minThreshold: String(data.minThreshold ?? ''),
        storage: data.storage || '',
        supplier: data.supplier || '',
        notes: data.notes || '',
        kind: data.kind || 'REAGENT',
      });
      setAdjustForm((prev) => ({ ...prev, newStock: String(data.currentStock ?? 0) }));
    } catch (error) {
      console.error(error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/categories', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadTests = async () => {
    try {
      const res = await fetch('/api/tests?includeGrouped=false', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
        if (data.length > 0) {
          setRuleForm((prev) => ({ ...prev, testId: prev.testId || data[0].id }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadItem();
    loadTests();
    loadCategories();
  }, [itemId, loadCategories, loadItem]);

  const statusLabel =
    item?.status === 'expired'
      ? 'Périmé'
      : item?.status === 'critical'
        ? 'Stock critique'
        : item?.status === 'low'
          ? 'Stock faible'
          : 'Conforme';

  const statusClass =
    item?.status === 'expired' || item?.status === 'critical'
      ? 'status-pill-error'
      : item?.status === 'low'
        ? 'status-pill-warning'
        : 'status-pill-success';

  const handleReceive = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lotNumber: receiveForm.lotNumber,
        expiryDate: receiveForm.expiryDate,
        quantity: Number(receiveForm.quantity),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la réception');
      return;
    }

    setShowReceive(false);
    setReceiveForm({ lotNumber: '', expiryDate: '', quantity: '' });
    showNotification('success', 'Lot réceptionné');
    await loadItem();
  };

  const handleConsume = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(consumeForm.quantity),
        lotNumber: consumeForm.lotNumber || null,
        reason: consumeForm.reason || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la consommation');
      return;
    }

    setShowConsume(false);
    setConsumeForm({ quantity: '', lotNumber: '', reason: '' });
    showNotification('success', 'Consommation enregistrée');
    await loadItem();
  };

  const handleAdjust = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStock: Number(adjustForm.newStock),
        reason: adjustForm.reason,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de l’ajustement');
      return;
    }

    setShowAdjust(false);
    setAdjustForm({ newStock: String(data.updatedItem.currentStock), reason: '' });
    showNotification('success', 'Stock ajusté');
    await loadItem();
  };

  const handleWaste = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/waste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(wasteForm.quantity),
        lotNumber: wasteForm.lotNumber || null,
        reason: wasteForm.reason,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la mise au rebut');
      return;
    }

    setShowWaste(false);
    setWasteForm({ quantity: '', lotNumber: '', reason: '' });
    showNotification('success', 'Mise au rebut enregistrée');
    await loadItem();
  };

  const handleRuleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: ruleForm.testId,
        quantityPerTest: Number(ruleForm.quantityPerTest),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la sauvegarde de la règle');
      return;
    }

    setShowRule(false);
    setRuleForm((prev) => ({ ...prev, quantityPerTest: '' }));
    showNotification('success', 'Règle enregistrée');
    await loadItem();
  };

  const handleRuleDelete = async (ruleId: string) => {
    const res = await fetch(`/api/inventory/rules/${ruleId}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la suppression');
      return;
    }

    showNotification('success', 'Règle supprimée');
    await loadItem();
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        ...editForm,
        minThreshold: Number(editForm.minThreshold),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la mise à jour');
      return;
    }

    setShowEdit(false);
    showNotification('success', 'Article mis à jour');
    await loadItem();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-4 pb-16">
        <div className="skeleton-card h-28" />
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
          <div className="skeleton-card h-[480px]" />
          <div className="skeleton-card h-[380px]" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Article introuvable</div>
        <div className="empty-state-text">Le réactif demandé n’existe pas ou n’est plus accessible.</div>
        <Link href="/dashboard/inventory" className="btn-secondary-sm mt-4">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>
    );
  }

  const ratio = item.minThreshold > 0 ? Math.min((item.currentStock / item.minThreshold) * 100, 100) : 0;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/dashboard/inventory" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
              <ArrowLeft className="h-4 w-4" />
              Retour à l’inventaire
            </Link>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">{item.name}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} · {item.category}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
            {isAdmin && (
              <button onClick={() => setShowEdit(true)} className="btn-secondary-sm">
                <Edit3 className="h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-4">
          <article className="bento-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Informations
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                {item.storage && <span className="status-pill status-pill-info">{item.storage}</span>}
                <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Référence" value={item.reference || '—'} />
              <InfoCard label="Fournisseur" value={item.supplier || '—'} />
              <InfoCard label="Unité" value={item.unit} />
              <InfoCard label="Seuil minimum" value={`${item.minThreshold}`} />
              <InfoCard label="Type" value={item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} />
              <InfoCard label="Remarques" value={item.notes || '—'} />
            </div>
          </article>

          <article className="bento-panel overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Lots en cours
              </h2>
              <span className="text-xs text-[var(--color-text-soft)]">{item.lots.length} lot(s)</span>
            </div>
            {item.lots.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucun lot actif.</div>
            ) : (
              <div className="divide-y">
                {item.lots.map((lot) => {
                  const daysLeft = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
                  const lotClass = daysLeft <= 0 ? 'status-pill-error' : daysLeft <= 30 ? 'status-pill-warning' : 'status-pill-success';
                  const lotLabel = daysLeft <= 0 ? 'Expiré' : daysLeft <= 30 ? 'Expire bientôt' : 'Conforme';

                  return (
                    <div key={lot.id} className="grid grid-cols-5 items-center gap-3 px-5 py-3 text-sm">
                      <div className="font-medium text-[var(--color-text)]">{lot.lotNumber}</div>
                      <div className="text-[var(--color-text-secondary)]">{lot.quantity} {item.unit}</div>
                      <div className="text-[var(--color-text-secondary)]">{lot.remaining} {item.unit}</div>
                      <div className="text-[var(--color-text-secondary)]">
                        {new Date(lot.expiryDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex justify-end">
                        <span className={`status-pill ${lotClass}`}>{lotLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="bento-panel overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Règles de consommation
              </h2>
              {isAdmin && (
                <button onClick={() => setShowRule(true)} className="btn-secondary-sm">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              )}
            </div>
            {item.rules.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                Aucun test lié pour l’instant.
              </div>
            ) : (
              <div className="divide-y">
                {item.rules.map((rule) => (
                  <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">
                        {rule.test.name}
                      </div>
                      <div className="text-xs text-[var(--color-text-soft)]">{rule.test.code}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                        {rule.quantityPerTest} {item.unit} / analyse
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleRuleDelete(rule.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="bento-panel overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Historique des mouvements
              </h2>
              <span className="text-xs text-[var(--color-text-soft)]">50 derniers mouvements</span>
            </div>
            {item.movements.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                Aucun mouvement enregistré.
              </div>
            ) : (
              <div className="divide-y">
                {item.movements.map((movement) => (
                  <div key={movement.id} className="grid grid-cols-[1.1fr_0.9fr_0.8fr_1fr_1fr] gap-3 px-5 py-3 text-sm">
                    <div className="text-[var(--color-text-secondary)]">
                      {new Date(movement.performedAt).toLocaleString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 font-medium text-[var(--color-text)]">
                      {movement.type === 'reception' ? (
                        <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                      ) : movement.type === 'consumption' ? (
                        <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                      ) : movement.type === 'waste' ? (
                        <Trash2 className="h-4 w-4 text-slate-600" />
                      ) : (
                        <Settings2 className="h-4 w-4 text-sky-600" />
                      )}
                      <span className="capitalize">{movement.type}</span>
                    </div>
                    <div className={`font-semibold ${movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity} {item.unit}
                    </div>
                    <div className="text-[var(--color-text-soft)]">{movement.lotNumber || '—'}</div>
                    <div className="text-[var(--color-text-soft)]">{movement.performedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="space-y-4">
          <article className="bento-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Stock actuel
            </h2>
            <div className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)]">
              {item.currentStock}
              <span className="ml-2 text-base font-medium text-[var(--color-text-soft)]">{item.unit}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
              <div
                className={`h-full ${
                  item.status === 'critical' || item.status === 'expired'
                    ? 'bg-rose-500'
                    : item.status === 'low'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${ratio}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-soft)]">Seuil</span>
              <span className="text-sm font-medium text-[var(--color-text)]">{item.minThreshold} {item.unit}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-soft)]">Prochaine expiration</span>
              <span className="text-sm font-medium text-[var(--color-text)]">
                {item.nearestExpiry ? new Date(item.nearestExpiry).toLocaleDateString('fr-FR') : '—'}
              </span>
            </div>
            <div className="mt-4">
              <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
            </div>
          </article>

          <article className="bento-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Actions
            </h2>
            <div className="mt-4 grid gap-2">
              {canWrite && (
                <button onClick={() => setShowReceive(true)} className="btn-primary-md justify-start px-4">
                  <Plus className="h-4 w-4" />
                  Réceptionner un lot
                </button>
              )}
              {canWrite && (
                <button onClick={() => setShowConsume(true)} className="btn-secondary-md justify-start px-4">
                  <Beaker className="h-4 w-4" />
                  Enregistrer consommation
                </button>
              )}
              {canWrite && (
                <button onClick={() => setShowWaste(true)} className="btn-secondary-md justify-start px-4">
                  <Trash2 className="h-4 w-4" />
                  Mise au rebut
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowAdjust(true)} className="btn-secondary-md justify-start px-4">
                  <Settings2 className="h-4 w-4" />
                  Ajustement manuel
                </button>
              )}
            </div>
          </article>

          <article className="bento-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Raccourci règle
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-soft)]">
              Les règles configurées ici seront déduites automatiquement lors de la validation technique des analyses.
            </p>
          </article>
        </aside>
      </section>

      {showReceive && (
        <ModalShell title="Réceptionner un lot" onClose={() => setShowReceive(false)}>
          <form onSubmit={handleReceive} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <label className="grid gap-1">
                <span className="form-label">N° de lot</span>
                <input
                  className="input-premium h-11 bg-white"
                  value={receiveForm.lotNumber}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Date d’expiration</span>
                <input
                  type="date"
                  className="input-premium h-11 bg-white"
                  value={receiveForm.expiryDate}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Quantité reçue</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-premium h-11 bg-white"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Valider</button>
            </div>
          </form>
        </ModalShell>
      )}

      {showConsume && (
        <ModalShell title="Enregistrer une consommation" onClose={() => setShowConsume(false)}>
          <form onSubmit={handleConsume} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <label className="grid gap-1">
                <span className="form-label">Quantité consommée</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-premium h-11 bg-white"
                  value={consumeForm.quantity}
                  onChange={(e) => setConsumeForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Lot ciblé</span>
                <select
                  className="input-premium h-11 bg-white"
                  value={consumeForm.lotNumber}
                  onChange={(e) => setConsumeForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
                >
                  <option value="">FEFO automatique</option>
                  {item.lots.filter((lot) => lot.isActive && lot.remaining > 0).map((lot) => (
                    <option key={lot.id} value={lot.lotNumber}>
                      {lot.lotNumber} · {lot.remaining} {item.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="form-label">Motif</span>
                <textarea
                  className="input-premium min-h-[100px] bg-white p-3"
                  value={consumeForm.reason}
                  onChange={(e) => setConsumeForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Analyse patient, contrôle QC..."
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Enregistrer</button>
            </div>
          </form>
        </ModalShell>
      )}

      {showAdjust && (
        <ModalShell title="Ajustement manuel" onClose={() => setShowAdjust(false)}>
          <form onSubmit={handleAdjust} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <label className="grid gap-1">
                <span className="form-label">Nouveau stock total</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-premium h-11 bg-white"
                  value={adjustForm.newStock}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, newStock: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Motif</span>
                <textarea
                  className="input-premium min-h-[100px] bg-white p-3"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </label>
              <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                Variation: {Number(adjustForm.newStock || 0) - item.currentStock > 0 ? '+' : ''}
                {Number(adjustForm.newStock || 0) - item.currentStock} {item.unit}
              </div>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Valider</button>
            </div>
          </form>
        </ModalShell>
      )}

      {showWaste && (
        <ModalShell title="Mise au rebut / retrait de stock" onClose={() => setShowWaste(false)}>
          <form onSubmit={handleWaste} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <label className="grid gap-1">
                <span className="form-label">Quantité à retirer</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-premium h-11 bg-white"
                  value={wasteForm.quantity}
                  onChange={(e) => setWasteForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Lot ciblé</span>
                <select
                  className="input-premium h-11 bg-white"
                  value={wasteForm.lotNumber}
                  onChange={(e) => setWasteForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
                >
                  <option value="">FEFO automatique</option>
                  {item.lots.filter((lot) => lot.isActive && lot.remaining > 0).map((lot) => (
                    <option key={lot.id} value={lot.lotNumber}>
                      {lot.lotNumber} · {lot.remaining} {item.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="form-label">Motif de retrait</span>
                <textarea
                  className="input-premium min-h-[100px] bg-white p-3"
                  value={wasteForm.reason}
                  onChange={(e) => setWasteForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Périmé, flacon cassé, contamination, lot rejeté..."
                  required
                />
              </label>
              <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                Utiliser cette action pour retirer un stock non consommable du circuit.
              </div>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Confirmer le retrait</button>
            </div>
          </form>
        </ModalShell>
      )}

      {showRule && (
        <ModalShell title="Ajouter une règle de consommation" onClose={() => setShowRule(false)}>
          <form onSubmit={handleRuleSave} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <label className="grid gap-1">
                <span className="form-label">Test</span>
                <select
                  className="input-premium h-11 bg-white"
                  value={ruleForm.testId}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, testId: e.target.value }))}
                >
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.code} · {test.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="form-label">Quantité par analyse</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-premium h-11 bg-white"
                  value={ruleForm.quantityPerTest}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, quantityPerTest: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Enregistrer</button>
            </div>
          </form>
        </ModalShell>
      )}

      {showEdit && (
        <ModalShell title="Modifier l’article" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="flex min-h-full flex-col">
            <div className="grid flex-1 gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="form-label">Nom</span>
                  <input
                    className="input-premium h-11 bg-white"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Référence</span>
                  <input
                    className="input-premium h-11 bg-white"
                    value={editForm.reference}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, reference: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Catégorie</span>
                  <select
                  className="input-premium h-11 bg-white"
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {categories.filter((category) => category.isActive).map((option) => (
                    <option key={option.id} value={option.name}>{option.name}</option>
                  ))}
                </select>
              </label>
                <label className="grid gap-1">
                  <span className="form-label">Unité</span>
                  <select
                    className="input-premium h-11 bg-white"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Seuil minimum</span>
                  <input
                    type="number"
                    className="input-premium h-11 bg-white"
                    value={editForm.minThreshold}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, minThreshold: e.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Type</span>
                  <select
                    className="input-premium h-11 bg-white"
                    value={editForm.kind}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, kind: e.target.value }))}
                  >
                    <option value="REAGENT">Réactif</option>
                    <option value="CONSUMABLE">Consommable</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Stockage</span>
                  <input
                    className="input-premium h-11 bg-white"
                    value={editForm.storage}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, storage: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="form-label">Fournisseur</span>
                  <input
                    className="input-premium h-11 bg-white"
                    value={editForm.supplier}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, supplier: e.target.value }))}
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="form-label">Notes</span>
                <textarea
                  className="input-premium min-h-[100px] bg-white p-3"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
              <button className="btn-primary-md px-5" type="submit">Enregistrer</button>
            </div>
          </form>
        </ModalShell>
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--color-text)]">{value}</div>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-shell flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-soft)]"
          >
            <ArrowLeft className="h-4 w-4 rotate-45" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
