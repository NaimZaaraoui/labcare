'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  FileText,
  TestTube2,
  BarChart3,
  Package,
  Settings,
  LogOut,
  Beaker,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}


export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const navigation: NavItem[] = [
    { name: t('common.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('common.patients'), href: '/dashboard/patients', icon: Users },
    { name: t('common.analyses'), href: '/dashboard/analyses', icon: FileText, badge: 12 },
    { name: t('common.results'), href: '/dashboard/results', icon: TestTube2 },
    { name: t('common.qc'), href: '/dashboard/qc', icon: BarChart3, badge: 1 },
    { name: t('common.inventory'), href: '/dashboard/inventory', icon: Package, badge: 3 },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 hidden lg:flex flex-col backdrop-blur-xl ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-400/20">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">
                {t('sidebar.labName')}
              </h1>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-400/20 text-blue-600 border border-blue-400/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && (
                  <>
                    <span className="text-sm flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-100/50 text-red-700 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border space-y-1 bg-muted/20">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">{t('common.settings')}</span>}
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50/20 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">{t('common.logout')}</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-24 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-blue-400 hover:border-blue-400 transition-colors text-muted-foreground hover:text-white shadow-sm backdrop-blur-sm"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${!isOpen && 'rotate-180'}`}
          />
        </button>
      </aside>
    </>
  );
}
