'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION_GROUPS } from '@/lib/constants';
import {
  LogOut,
  Microscope,
  ChevronLeft,
} from 'lucide-react';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

import { useSession, signOut } from 'next-auth/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';



const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isOpen: mobileOpen, close: closeMobile } = useMobileMenu();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const role = session?.user?.role || 'TECHNICIEN';

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);


  const isLinkVisible = (href: string) => {
    if (role === 'ADMIN') return true;
    if (role === 'MEDECIN' && BLOCKED_MEDECIN.some(p => href.startsWith(p))) return false;
    if (role === 'RECEPTIONNISTE' && BLOCKED_RECEPTIONNISTE.some(p => href.startsWith(p))) return false;
    if (role !== 'ADMIN' && ADMIN_ONLY.some(p => href.startsWith(p))) return false;
    return true;
  };

  const isActive = (href: string) => {
    if (href === '/' || href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleNavClick = () => closeMobile();
  const sidebarOpen = !isCollapsed;

  // Filter navigation groups based on visibility
  const filteredGroups = NAVIGATION_GROUPS.map(group => ({
    ...group,
    links: group.links.filter(link => isLinkVisible(link.href))
  })).filter(group => group.links.length > 0);

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[8px_0_36px_rgba(15,31,51,0.08)] backdrop-blur-sm transition-all duration-300 lg:flex ${
          sidebarOpen ? 'w-[var(--shell-nav-width)]' : 'w-[var(--shell-nav-width-collapsed)]'
        }`}
      >
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-700/20 bg-[var(--color-accent)] shadow-[0_8px_22px_rgba(31,111,235,0.34)]">
            <Microscope className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-[var(--color-text)]">NexLab</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">CSSB LIMS</p>
            </div>
          )}
        </div>
        <div className="mx-4 border-b border-[var(--color-border)]" />

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {sidebarOpen && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.links.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!sidebarOpen ? item.name : undefined}
                      className={`group flex items-center gap-3 rounded-2xl py-2.5 font-medium transition-all duration-200 ${
                        active
                          ? 'border border-blue-600/20 bg-[var(--color-accent-soft)] px-3 text-[var(--color-accent)]'
                          : 'border border-transparent px-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
                      } ${!sidebarOpen && 'justify-center px-0'}`}
                    >
                      <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-soft)] group-hover:text-[var(--color-text-secondary)]'}`} />
                      {sidebarOpen && (
                        <span className="flex-1 text-[13px]">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2 p-3">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`group w-full rounded-2xl py-2.5 font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-rose-50 hover:text-rose-700 ${
              !sidebarOpen ? 'px-0' : 'px-4'
            }`}
          >
            <span className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-[var(--color-text-soft)] group-hover:text-rose-600" />
              {sidebarOpen && <span className="text-[13px]">Déconnexion</span>}
            </span>
          </button>
        </div>

        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-[var(--color-text-soft)] shadow-md transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${!sidebarOpen && 'rotate-180'}`}
          />
        </button>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[88vw] max-w-[320px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform shadow-2xl lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b px-5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-700/20 bg-[var(--color-accent)] shadow-[0_8px_22px_rgba(31,111,235,0.34)]">
            <Microscope className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-semibold text-[var(--color-text)]">NexLab</h1>
             <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">CSSB LIMS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto p-4 pb-2">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.links.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 font-medium transition-all ${
                        active
                          ? 'border border-blue-600/20 bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'border border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-soft)] group-hover:text-[var(--color-text-secondary)]'}`} />
                      <span className="flex-1 text-[13px]">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
         <div className="mt-auto space-y-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-[var(--color-text-soft)] group-hover:text-rose-600" />
            <span className="text-[13px]">Déconnexion</span>
          </button>
        </div>
      </aside>
      
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => signOut()}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir quitter votre session ? Vous devrez vous reconnecter pour accéder au laboratoire."
        confirmText="Déconnexion"
        type="danger"
        icon="logout"
      />
    </>

  );
}
