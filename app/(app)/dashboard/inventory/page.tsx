'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, Download, FlaskConical, FolderCog, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { computeReorderSuggestion } from '@/lib/inventory-shared';
import { DEFAULT_INVENTORY_CATEGORIES, type InventoryCategoryConfig } from '@/lib/inventory-categories';

const UNIT_OPTIONS = ['mL', 'Tests', 'Boîtes', 'Kits', 'Flacons', 'Unités'];

type InventoryStatus = 'ok' | 'low' | 'critical' | 'expired';

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  kind: string;
  supplier?: string | null;
  unit: string;
  currentStock: number;
  minThreshold: number;
  status: InventoryStatus;
  nearestExpiry: string | null;
  daysUntilExpiry: number | null;
  consumption30d?: number;
  avgDailyConsumption30d?: number;
};

type InventoryAnalytics = {
  windowDays: number;
  totals: {
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  };
  topConsumedItems: Array<{
    itemId: string;
    name: string;
    unit: string;
    category: string;
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  }>;
  topWastedItems: Array<{
    itemId: string;
    name: string;
    unit: string;
    category: string;
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  }>;
};

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [form, setForm] = useState({
    name: '',
    reference: '',
    category: DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
    unit: UNIT_OPTIONS[0],
    minThreshold: '',
    currentStock: '0',
    storage: '',
    supplier: '',
    notes: '',
    kind: 'REAGENT',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showNotification('error', "Erreur lors du chargement de l'inventaire");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/categories', { cache: 'no-store' });
      const data = await res.json();
      const nextCategories = Array.isArray(data) && data.length > 0 ? data : DEFAULT_INVENTORY_CATEGORIES;
      setCategories(nextCategories);
      setCategoryDrafts(nextCategories);
      setForm((prev) => ({
        ...prev,
        category: nextCategories.some((category) => category.name === prev.category)
          ? prev.category
          : nextCategories[0]?.name || prev.category,
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement des catégories inventaire');
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/analytics', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
    loadAnalytics();
  }, [loadAnalytics, loadCategories, loadItems]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      low: items.filter((item) => item.status === 'low').length,
      critical: items.filter((item) => item.status === 'critical').length,
      expired: items.filter((item) => item.status === 'expired').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!keyword) return true;
      return item.name.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword);
    });
  }, [items, filter, search]);

  const criticalItems = items.filter((item) => item.status === 'critical');
  const lowItems = items.filter((item) => item.status === 'low');
  const expiredItems = items.filter((item) => item.status === 'expired');
  const expiringSoonItems = items.filter(
    (item) => item.daysUntilExpiry !== null && item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30
  );
  const attentionItems = items
    .filter(
      (item) =>
        item.status === 'expired' ||
        item.status === 'critical' ||
        item.status === 'low' ||
        (item.daysUntilExpiry !== null && item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30)
    )
    .sort((a, b) => {
      const aScore = a.status === 'expired' ? 0 : a.status === 'critical' ? 1 : a.status === 'low' ? 2 : 3;
      const bScore = b.status === 'expired' ? 0 : b.status === 'critical' ? 1 : b.status === 'low' ? 2 : 3;
      if (aScore !== bScore) return aScore - bScore;
      return (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999);
    })
    .slice(0, 5);
  const reorderSuggestions = items
    .map((item) => ({
      ...item,
      reorder: computeReorderSuggestion({
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit: item.unit,
        status: item.status,
        daysUntilExpiry: item.daysUntilExpiry,
        avgDailyConsumption30d: item.avgDailyConsumption30d,
      }),
    }))
    .filter((item) => item.reorder.shouldReorder)
    .sort((a, b) => {
      const aRank = itemUrgencyRank(a.reorder.urgency);
      const bRank = itemUrgencyRank(b.reorder.urgency);
      if (aRank !== bRank) return aRank - bRank;
      return b.reorder.suggestedQuantity - a.reorder.suggestedQuantity;
    })
    .slice(0, 6);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        reference: form.reference.trim() || null,
        category: form.category,
        unit: form.unit,
        minThreshold: Number(form.minThreshold),
        currentStock: Number(form.currentStock || 0),
        storage: form.storage.trim() || null,
        supplier: form.supplier.trim() || null,
        notes: form.notes.trim() || null,
        kind: form.kind,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la création');
        return;
      }

      showNotification('success', 'Réactif créé');
      setShowCreate(false);
      setForm({
        name: '',
        reference: '',
        category: categories.find((category) => category.isActive)?.name || DEFAULT_INVENTORY_CATEGORIES[0].name,
        unit: UNIT_OPTIONS[0],
        minThreshold: '',
        currentStock: '0',
        storage: '',
        supplier: '',
        notes: '',
        kind: 'REAGENT',
      });
      await loadItems();
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors de la création');
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Inventaire des réactifs</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Vue d’ensemble des stocks, lots et seuils critiques.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/api/inventory?format=csv&mode=inventory"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-white px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <Download className="h-4 w-4" />
              Export inventaire
            </Link>
            <Link
              href="/api/inventory?format=csv&mode=reorder"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-[var(--color-accent-soft)] px-4 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[#d9ebff]"
            >
              <Download className="h-4 w-4" />
              Export réappro.
            </Link>
            <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Total</div>
              <div className="text-lg font-semibold text-[var(--color-text)]">{items.length}</div>
            </div>
            {role === 'ADMIN' && (
              <>
                <button onClick={() => setShowCategoryManager(true)} className="btn-secondary-md px-4">
                  <FolderCog className="h-4 w-4" />
                  Catégories
                </button>
                <button onClick={() => setShowCreate(true)} className="btn-primary-md px-4">
                  <Plus className="h-4 w-4" />
                  Ajouter un réactif
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="input-premium h-11 flex items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou catégorie"
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'all', label: 'Tous', count: counts.all },
            { key: 'low', label: 'En alerte', count: counts.low },
            { key: 'critical', label: 'Stock critique', count: counts.critical },
            { key: 'expired', label: 'Expirés', count: counts.expired },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                filter === tab.key
                  ? 'border-blue-600/30 bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'bg-white text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Stock critique</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{criticalItems.length}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">Articles à zéro ou indisponibles</div>
        </article>
        <article className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Sous seuil</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{lowItems.length}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">Stock faible avant rupture</div>
        </article>
        <article className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Expire sous 30 j</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{expiringSoonItems.length}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">Lots à anticiper rapidement</div>
        </article>
        <article className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Déjà expirés</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{expiredItems.length}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">À isoler ou remplacer</div>
        </article>
      </section>

      {analytics && (
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="bento-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Consommation des 30 derniers jours
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                  Vue consolidée de la consommation réelle et des pertes enregistrées.
                </p>
              </div>
              <span className="status-pill status-pill-info">{analytics.windowDays} jours</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Consommé</div>
                <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.consumption30d}</div>
              </div>
              <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Rebut</div>
                <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.waste30d}</div>
              </div>
              <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Moyenne / jour</div>
                <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.avgDailyConsumption30d}</div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {analytics.topConsumedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-[var(--color-text-soft)]">
                  Pas encore assez de mouvements pour afficher une tendance.
                </div>
              ) : (
                analytics.topConsumedItems.map((entry) => (
                  <Link
                    key={entry.itemId}
                    href={`/dashboard/inventory/${entry.itemId}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text)]">{entry.name}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                        {entry.category} · {entry.avgDailyConsumption30d} / jour
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[var(--color-accent)]">{entry.consumption30d}</div>
                      <div className="text-[11px] text-[var(--color-text-soft)]">{entry.unit}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className="bento-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Catégories configurables
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                  Organisation actuelle des articles inventaire.
                </p>
              </div>
              <span className="text-xs text-[var(--color-text-soft)]">{categories.filter((c) => c.isActive).length} active(s)</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.filter((category) => category.isActive).map((category) => (
                <span key={category.id} className="status-pill status-pill-info">
                  {category.name}
                </span>
              ))}
            </div>
            {analytics.topWastedItems.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Articles les plus rebutés</div>
                <div className="mt-3 space-y-2">
                  {analytics.topWastedItems.map((entry) => (
                    <Link
                      key={entry.itemId}
                      href={`/dashboard/inventory/${entry.itemId}`}
                      className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-[var(--color-text)]">{entry.name}</span>
                      <span className="text-[var(--color-text-soft)]">{entry.waste30d} {entry.unit}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </section>
      )}

      {attentionItems.length > 0 && (
        <section className="rounded-3xl border border-amber-200/70 bg-amber-50/80 px-5 py-4 shadow-[0_8px_22px_rgba(180,120,20,0.08)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-800">
              Priorités du jour
            </h2>
            <p className="text-sm text-amber-900">
              Vue rapide des articles qui demandent une action avant impact paillasse.
            </p>
          </div>
          <div className="mt-4 grid gap-2">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/inventory/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200/60 bg-white/80 px-3 py-2 transition-colors hover:bg-white"
              >
                <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
                <span className="text-xs text-[var(--color-text-soft)]">{formatAttentionReason(item)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reorderSuggestions.length > 0 && (
        <section className="bento-panel p-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Réapprovisionnement conseillé
            </h2>
            <p className="text-sm text-[var(--color-text-soft)]">
              Suggestions calculées à partir du seuil minimum, du stock courant et des expirations proches.
              Les usages récents sur 30 jours sont pris en compte pour mieux estimer la cible.
            </p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {reorderSuggestions.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/inventory/${item.id}`}
                className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">{item.name}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                      {item.category} · {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                    </div>
                  </div>
                  <span className={`status-pill ${item.reorder.urgency === 'critical' ? 'status-pill-error' : item.reorder.urgency === 'warning' ? 'status-pill-warning' : 'status-pill-info'}`}>
                    {item.reorder.urgency === 'critical' ? 'Urgent' : item.reorder.urgency === 'warning' ? 'À prévoir' : 'Suivi'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border bg-white px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Stock</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.currentStock}</div>
                  </div>
                  <div className="rounded-xl border bg-white px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Commander</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--color-accent)]">+{item.reorder.suggestedQuantity}</div>
                  </div>
                    <div className="rounded-xl border bg-white px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cible</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.reorder.targetStock}</div>
                    </div>
                  </div>
                <div className="mt-3 text-xs text-[var(--color-text-soft)]">
                  {item.reorder.reason} · Usage moyen: {item.avgDailyConsumption30d || 0} / jour · Unité: {item.unit}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bento-panel overflow-hidden">
        <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
          <div className="col-span-3">Réactif</div>
          <div className="col-span-2">Catégorie</div>
          <div className="col-span-2 text-center">Stock actuel</div>
          <div className="col-span-1 text-center">Seuil</div>
          <div className="col-span-2 text-center">Statut</div>
          <div className="col-span-2 text-right">Prochaine expiration</div>
        </div>

        {loading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 w-full rounded-2xl bg-[var(--color-surface-muted)] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state m-5">
            <div className="empty-state-icon">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="empty-state-title">Aucun réactif configuré</div>
            <div className="empty-state-text">Ajoutez le premier réactif pour suivre le stock.</div>
            {role === 'ADMIN' && (
              <button onClick={() => setShowCreate(true)} className="btn-primary-sm mt-4">
                <Plus className="h-4 w-4" />
                Ajouter un réactif
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y">
            {filtered.map((item) => {
              const ratio = item.minThreshold > 0 ? Math.min((item.currentStock / item.minThreshold) * 100, 100) : 0;
              const statusLabel =
                item.status === 'expired'
                  ? 'Périmé'
                  : item.status === 'critical'
                    ? 'Stock critique'
                    : item.status === 'low'
                      ? 'Stock faible'
                      : 'Conforme';
              const statusClass =
                item.status === 'expired'
                  ? 'status-pill-error'
                  : item.status === 'critical'
                    ? 'status-pill-error'
                    : item.status === 'low'
                      ? 'status-pill-warning'
                      : 'status-pill-success';

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/inventory/${item.id}`}
                  className="grid grid-cols-12 items-center px-5 py-3 text-sm transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  <div className="col-span-3">
                    <div className="text-[var(--color-text)] font-semibold">{item.name}</div>
                    <div className="text-xs text-[var(--color-text-soft)]">
                      {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-[var(--color-text-secondary)]">{item.category}</div>
                  <div className="col-span-2 text-center">
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      {item.currentStock} {item.unit}
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
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
                  </div>
                  <div className="col-span-1 text-center text-xs text-[var(--color-text-secondary)]">
                    {item.minThreshold}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="col-span-2 text-right text-xs text-[var(--color-text-secondary)]">
                    {item.nearestExpiry ? (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          item.daysUntilExpiry !== null && item.daysUntilExpiry <= 0
                            ? 'text-[var(--color-critical)] font-semibold'
                            : item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30
                              ? 'text-[var(--color-warning)] font-semibold'
                              : 'text-[var(--color-text-soft)]'
                        }`}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        {new Date(item.nearestExpiry).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div
            className="modal-shell flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Nouveau réactif</h2>
                <p className="text-sm text-[var(--color-text-soft)]">Configurez les informations principales.</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
              <div className="custom-scrollbar grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label">Nom du réactif</label>
                    <input
                      className="input-premium h-11 bg-white"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Référence fabricant</label>
                    <input
                      className="input-premium h-11 bg-white"
                      value={form.reference}
                      onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Catégorie</label>
                    <select
                    className="input-premium h-11 bg-white"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.filter((category) => category.isActive).map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Unité</label>
                    <select
                      className="input-premium h-11 bg-white"
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Seuil minimum</label>
                    <input
                      type="number"
                      className="input-premium h-11 bg-white"
                      value={form.minThreshold}
                      onChange={(e) => setForm((prev) => ({ ...prev, minThreshold: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Stock initial</label>
                    <input
                      type="number"
                      className="input-premium h-11 bg-white"
                      value={form.currentStock}
                      onChange={(e) => setForm((prev) => ({ ...prev, currentStock: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Stockage</label>
                    <input
                      className="input-premium h-11 bg-white"
                      value={form.storage}
                      onChange={(e) => setForm((prev) => ({ ...prev, storage: e.target.value }))}
                      placeholder="Réfrigérateur 2-8°C"
                    />
                  </div>
                  <div>
                    <label className="form-label">Fournisseur</label>
                    <input
                      className="input-premium h-11 bg-white"
                      value={form.supplier}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select
                      className="input-premium h-11 bg-white"
                      value={form.kind}
                      onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value }))}
                    >
                      <option value="REAGENT">Réactif</option>
                      <option value="CONSUMABLE">Consommable</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="input-premium min-h-[110px] bg-white p-3"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
                  <ClipboardList className="h-4 w-4" />
                  Les mouvements seront historisés automatiquement.
                </div>
                <button className="btn-primary-md px-6" type="submit">
                  <Plus className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-shell flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Catégories d’inventaire</h2>
                <p className="text-sm text-[var(--color-text-soft)]">Ajoutez, masquez ou réorganisez les familles d’articles.</p>
              </div>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
              >
                Fermer
              </button>
            </div>
            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {categoryDrafts.map((category, index) => (
                <div key={category.id} className="grid gap-3 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <input
                    className="input-premium h-11 bg-white"
                    value={category.name}
                    onChange={(e) =>
                      setCategoryDrafts((prev) =>
                        prev.map((entry) => (entry.id === category.id ? { ...entry, name: e.target.value } : entry))
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryDrafts((prev) =>
                        prev.map((entry) => (entry.id === category.id ? { ...entry, isActive: !entry.isActive } : entry))
                      )
                    }
                    className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
                      category.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-[var(--color-text-soft)]'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Masquée'}
                  </button>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setCategoryDrafts((prev) => {
                          const next = [...prev];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          return next.map((entry, rank) => ({ ...entry, rank }));
                        })
                      }
                      className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Haut
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryDrafts((prev) => prev.filter((entry) => entry.id !== category.id).map((entry, rank) => ({ ...entry, rank })))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="grid gap-3 rounded-2xl border border-dashed px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <input
                  className="input-premium h-11 bg-white"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nouvelle catégorie"
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newCategoryName.trim();
                    if (!name) return;
                    setCategoryDrafts((prev) => [
                      ...prev,
                      {
                        id: `${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
                        name,
                        rank: prev.length,
                        isActive: true,
                      },
                    ]);
                    setNewCategoryName('');
                  }}
                  className="btn-secondary-md"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <div className="text-xs text-[var(--color-text-soft)]">Ces catégories seront proposées dans la création et l’édition des articles.</div>
              <button
                className="btn-primary-md px-6"
                type="button"
                onClick={async () => {
                  const cleaned = categoryDrafts
                    .map((category, rank) => ({ ...category, name: category.name.trim(), rank }))
                    .filter((category) => category.name);
                  const res = await fetch('/api/inventory/categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categories: cleaned }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    showNotification('error', data.error || 'Erreur lors de la sauvegarde des catégories');
                    return;
                  }
                  setCategories(data);
                  setCategoryDrafts(data);
                  setForm((prev) => ({
                    ...prev,
                    category: data.some((category: InventoryCategoryConfig) => category.name === prev.category)
                      ? prev.category
                      : data[0]?.name || prev.category,
                  }));
                  setShowCategoryManager(false);
                  showNotification('success', 'Catégories inventaire mises à jour');
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}

function formatAttentionReason(item: InventoryItem) {
  if (item.status === 'expired') {
    return 'Lot expiré à traiter immédiatement';
  }
  if (item.status === 'critical') {
    return `Rupture critique: ${item.currentStock} ${item.unit}`;
  }
  if (item.status === 'low') {
    return `Sous seuil: ${item.currentStock}/${item.minThreshold} ${item.unit}`;
  }
  if (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30) {
    return `Expiration proche dans ${item.daysUntilExpiry} jour(s)`;
  }
  return 'Surveillance standard';
}

function itemUrgencyRank(urgency: 'normal' | 'warning' | 'critical') {
  if (urgency === 'critical') return 0;
  if (urgency === 'warning') return 1;
  return 2;
}
