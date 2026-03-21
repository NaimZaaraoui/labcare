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
  X,
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border backdrop-blur-xl z-40 transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 border-b border-border flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">
                {t('sidebar.labName')}
              </h1>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-400/20 text-blue-600 border border-blue-400/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-bold bg-red-100/50 text-red-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-1 bg-muted/20">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{t('common.settings')}</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50/20 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{t('common.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
