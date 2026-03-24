'use client';

import React from 'react';
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
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';



const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isOpen: mobileOpen, close: closeMobile } = useMobileMenu();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const role = (session?.user as any)?.role || 'TECHNICIEN';


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
  // We consider it open if not explicitly collapsed
  const sidebarOpen = isCollapsed === false ? true : !isCollapsed;

  // Filter navigation groups based on visibility
  const filteredGroups = NAVIGATION_GROUPS.map(group => ({
    ...group,
    links: group.links.filter(link => isLinkVisible(link.href))
  })).filter(group => group.links.length > 0);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white z-50 transition-all duration-300 hidden lg:flex flex-col shadow-[4px_0_24px_rgb(0,0,0,0.02)] ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-24 px-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <Microscope className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-slate-800">
                NexLab
              </h1>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CSSB System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {sidebarOpen && (
                <div className="px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  {group.title}
                </div>
              )}
              <div className="space-y-1.5">
                {group.links.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-indigo-50 text-indigo-600 px-4'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-4'
                      } ${!sidebarOpen && 'justify-center px-0'}`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                      {sidebarOpen && (
                        <span className="text-sm flex-1">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 mt-auto">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 py-3 rounded-2xl font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
              !sidebarOpen ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-rose-500" />
            {sidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>


        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-10 w-7 h-7 bg-white shadow-md border border-slate-100 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${!sidebarOpen && 'rotate-180'}`}
          />
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-40 transition-transform lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-24 px-6 flex items-center gap-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <Microscope className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-slate-800">NexLab</h1>
             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CSSB System</p>
          </div>
        </div>

        <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <div className="px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                {group.title}
              </div>
              <div className="space-y-1.5">
                {group.links.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                        active
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <span className="text-sm flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
         <div className="p-4 space-y-2 mt-auto border-t border-slate-100">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-rose-500" />
            <span className="text-sm">Déconnexion</span>
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