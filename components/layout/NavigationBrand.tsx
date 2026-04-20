'use client';

import { Microscope } from 'lucide-react';

interface NavigationBrandProps {
  sidebarOpen: boolean;
  mobile?: boolean;
}

export function NavigationBrand({ sidebarOpen, mobile = false }: NavigationBrandProps) {
  return (
    <div className={`flex h-16 items-center gap-3 ${mobile ? 'border-b px-4' : 'px-4'}`}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        <Microscope className="h-4.5 w-4.5 text-[var(--color-accent)]" />
      </div>
      {sidebarOpen && (
        <div className="overflow-hidden">
          <h1 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">NexLab</h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-soft)]">CSSB LIMS</p>
        </div>
      )}
    </div>
  );
}
