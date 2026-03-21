'use client';

import { MobileMenuProvider, useMobileMenu } from '@/contexts/MobileMenuContext';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import type { ReactNode } from 'react';

function AppShell({ children }: { children: ReactNode }) {
  const { isCollapsed } = useMobileMenu();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Navigation />

      <div
        className="flex-1 flex flex-col transition-all duration-300 min-w-0"
        style={{ marginLeft: isCollapsed ? '80px' : '256px' }}
      >
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MobileMenuProvider>
      <AppShell>{children}</AppShell>
    </MobileMenuProvider>
  );
}