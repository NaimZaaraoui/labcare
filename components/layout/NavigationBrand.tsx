'use client';

import { Microscope } from 'lucide-react';

interface NavigationBrandProps {
  sidebarOpen: boolean;
  mobile?: boolean;
}

export function NavigationBrand({ sidebarOpen, mobile = false }: NavigationBrandProps) {
  return (
    <div className={`flex h-20 items-center gap-3 ${mobile ? 'border-b px-5' : 'px-5'}`}>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-700/20 bg-[var(--color-accent)] shadow-[0_8px_22px_rgba(31,111,235,0.34)]">
        <Microscope className="h-5 w-5 text-white drop-shadow-sm" />
      </div>
      {sidebarOpen && (
        <div className="overflow-hidden">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">NexLab</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">CSSB LIMS</p>
        </div>
      )}
    </div>
  );
}
