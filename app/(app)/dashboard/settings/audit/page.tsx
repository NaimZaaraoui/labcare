'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, Search, RefreshCw, Download, X, Archive } from 'lucide-react';

type AuditItem = {
  id: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuditResponse = {
  items: AuditItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [entity, setEntity] = useState('');
  const [severity, setSeverity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);
  const [retentionDays, setRetentionDays] = useState('730');
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionMessage, setRetentionMessage] = useState('');

  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && role !== 'ADMIN') router.push('/');
  }, [status, role, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query.trim()) params.set('query', query.trim());
      if (action) params.set('action', action);
      if (moduleName) params.set('module', moduleName);
      if (entity) params.set('entity', entity);
      if (severity) params.set('severity', severity);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const response = await fetch(`/api/audit-logs?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load');
      const json = (await response.json()) as AuditResponse;
      setData(json);
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      setData({ items: [], total: 0, page: 1, limit: pageSize, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [action, entity, from, moduleName, page, pageSize, query, severity, to]);

  useEffect(() => {
    if (status === 'authenticated' && role === 'ADMIN') {
      fetchLogs();
    }
  }, [status, role, fetchLogs]);

  const visibleItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const detailsPreview = useMemo(() => {
    return (value: string | null) => {
      if (!value) return '—';
      return value.length > 100 ? `${value.slice(0, 100)}...` : value;
    };
  }, []);

  const csvExportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (action) params.set('action', action);
    if (moduleName) params.set('module', moduleName);
    if (entity) params.set('entity', entity);
    if (severity) params.set('severity', severity);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('format', 'csv');
    return `/api/audit-logs?${params.toString()}`;
  }, [action, entity, from, moduleName, query, severity, to]);

  const severityBadgeClass = (level: string) => {
    if (level === 'CRITICAL') return 'status-pill status-pill-error';
    if (level === 'WARN') return 'status-pill status-pill-warning';
    return 'status-pill status-pill-info';
  };

  const applyRetention = async () => {
    setRetentionLoading(true);
    setRetentionMessage('');
    try {
      const response = await fetch('/api/audit-logs/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: Number(retentionDays || '730') }),
      });
      const payload = (await response.json()) as { archived?: number; deleted?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Échec rétention');
      setRetentionMessage(`Archivage OK: ${payload.archived ?? 0} archivés, ${payload.deleted ?? 0} purgés.`);
      fetchLogs();
    } catch (error) {
      setRetentionMessage(error instanceof Error ? error.message : 'Erreur rétention');
    } finally {
      setRetentionLoading(false);
    }
  };

  const formatDetails = (value: string | null) => {
    if (!value) return 'Aucun détail.';
    try {
      const parsed = JSON.parse(value) as unknown;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
            <ArrowLeft size={16} />
          </span>
          Paramètres
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Journal d&apos;audit</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Historique des actions critiques réalisées dans le système.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/settings/audit/archive')}
              className="btn-secondary-sm"
            >
              <Archive size={14} />
              Archives
            </button>
            <div className="hidden items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-700 lg:flex">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">Traçabilité active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bento-panel p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-8">
          <label className="xl:col-span-2">
            <span className="form-label mb-1.5">Recherche</span>
            <div className="input-premium flex h-11 items-center gap-2">
              <Search size={16} className="text-[var(--color-text-soft)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Utilisateur, action, ID..."
                className="w-full border-none bg-transparent outline-none"
              />
            </div>
          </label>
          <label>
            <span className="form-label mb-1.5">Module</span>
            <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="input-premium h-11">
              <option value="">Tous</option>
              <option value="qc">QC</option>
              <option value="inventory">Inventaire</option>
              <option value="analyses">Analyses</option>
              <option value="patients">Patients</option>
              <option value="tests">Tests</option>
              <option value="users">Utilisateurs</option>
              <option value="settings">Paramètres</option>
            </select>
          </label>
          <label>
            <span className="form-label mb-1.5">Action</span>
            <input value={action} onChange={(e) => setAction(e.target.value)} className="input-premium h-11" placeholder="ex: user.create" />
          </label>
          <label>
            <span className="form-label mb-1.5">Entité</span>
            <input value={entity} onChange={(e) => setEntity(e.target.value)} className="input-premium h-11" placeholder="ex: user" />
          </label>
          <label>
            <span className="form-label mb-1.5">Criticité</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-premium h-11">
              <option value="">Toutes</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            <span className="form-label mb-1.5">Du</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-premium h-11" />
          </label>
          <label>
            <span className="form-label mb-1.5">Au</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-premium h-11" />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">Par page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="input-premium h-10 w-24"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setPage(1);
              fetchLogs();
            }}
            className="btn-primary-sm"
          >
            <Search size={16} />
            Filtrer
          </button>
          <button
            onClick={() => {
              setQuery('');
              setAction('');
              setModuleName('');
              setEntity('');
              setSeverity('');
              setFrom('');
              setTo('');
              setPage(1);
              fetchLogs();
            }}
            className="btn-secondary-sm"
          >
            <RefreshCw size={16} />
            Réinitialiser
          </button>
          <a href={csvExportHref} className="btn-secondary-sm">
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </section>

      <section className="bento-panel p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Rétention et archivage</h3>
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
          Les logs plus anciens que la période choisie sont déplacés vers l&apos;archive puis retirés de la table active.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label>
            <span className="form-label mb-1.5">Conserver (jours)</span>
            <input
              type="number"
              min={30}
              max={3650}
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="input-premium h-11 w-40"
            />
          </label>
          <button
            onClick={applyRetention}
            disabled={retentionLoading}
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retentionLoading ? 'Traitement...' : 'Appliquer la rétention'}
          </button>
          {retentionMessage && <span className="text-xs text-[var(--color-text-secondary)]">{retentionMessage}</span>}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Date</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Criticité</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Utilisateur</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Action</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Entité</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Détails</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">Chargement...</td>
                </tr>
              )}
              {!loading && visibleItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucun log trouvé.</td>
                </tr>
              )}
              {!loading &&
                visibleItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-muted)]/50">
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                      {new Date(item.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={severityBadgeClass(item.severity)}>{item.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                      <div className="font-semibold text-[var(--color-text)]">{item.userName || 'Système'}</div>
                      <div>{item.userEmail || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)]">{item.action}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                      {item.entity}
                      {item.entityId ? ` (${item.entityId})` : ''}
                    </td>
                    <td className="max-w-[340px] px-4 py-3 text-xs text-[var(--color-text-soft)]">
                      <div className="truncate">{detailsPreview(item.details)}</div>
                      {item.details && (
                        <button
                          onClick={() => setSelectedLog(item)}
                          className="mt-1 text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
                        >
                          Voir
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-soft)]">{item.ipAddress || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-soft)]">
          Total: <span className="font-semibold text-[var(--color-text)]">{data?.total ?? 0}</span>
          {data && data.total > 0 && (
            <>
              {' '}
              • Affichage{' '}
              <span className="font-semibold text-[var(--color-text)]">
                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.total)}
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Page {page} / {totalPages}
          </span>
          <button
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-shell w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Détails du log</h3>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR')} • {selectedLog.action}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4">
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words text-xs text-[var(--color-text-secondary)]">
                {formatDetails(selectedLog.details)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
