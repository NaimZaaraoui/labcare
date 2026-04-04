'use client';

import { Download, RotateCcw } from 'lucide-react';
import type { BackupItem } from '@/components/database-settings/types';

interface DatabaseFileTableProps {
  title: string;
  subtitle: string;
  items: BackupItem[] | null | undefined;
  loading: boolean;
  restoringFile: string | null;
  onRestore: (fileName: string) => void;
  getDownloadHref: (fileName: string) => string;
  emptyLabel: string;
  formatBytes: (size: number) => string;
}

export function DatabaseFileTable({
  title,
  subtitle,
  items,
  loading,
  restoringFile,
  onRestore,
  getDownloadHref,
  emptyLabel,
  formatBytes,
}: DatabaseFileTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-white shadow-[0_8px_24px_rgba(15,31,51,0.05)]">
      <div className="flex items-center justify-between border-b bg-[var(--color-surface-muted)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">{subtitle}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b bg-white text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Créé le</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Taille</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Chemin</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Chargement...
                </td>
              </tr>
            )}

            {!loading && (!items || items.length === 0) && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  {emptyLabel}
                </td>
              </tr>
            )}

            {!loading &&
              items?.map((item) => (
                <tr key={item.fileName} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[var(--color-text)]">{item.fileName}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(item.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{formatBytes(item.size)}</td>
                  <td className="max-w-[360px] px-5 py-4 text-xs text-[var(--color-text-soft)]">
                    <span className="line-clamp-2">{item.absolutePath}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onRestore(item.fileName)}
                        className="btn-secondary-sm inline-flex"
                        disabled={Boolean(restoringFile)}
                      >
                        <RotateCcw size={16} className={restoringFile === item.fileName ? 'animate-spin' : ''} />
                        {restoringFile === item.fileName ? 'Restauration...' : 'Restaurer'}
                      </button>
                      <a href={getDownloadHref(item.fileName)} className="btn-secondary-sm inline-flex">
                        <Download size={16} />
                        Télécharger
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
