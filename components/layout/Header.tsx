'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, Check, X, Clock, Loader2, Users, FileText, Beaker, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useSession } from 'next-auth/react';
import { ROLE_LABELS } from '@/lib/constants';

interface SearchResult {
  id: string;
  title: string;
  type: 'patient' | 'analysis' | 'result';
  description?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  analysisId?: string;
  createdAt: Date;
}

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toggle } = useMobileMenu();

  const user = session?.user;
  const role = user?.role || 'TECHNICIEN';
  const roleLabel = ROLE_LABELS[role] || role;
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [qcSummary, setQcSummary] = useState<{ allPass: boolean; missing: number; warn: number; fail: number } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.results || []);
            setShowSearchResults(true);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadQcStatus = async () => {
      try {
        const res = await fetch('/api/qc/today');
        if (res.ok) {
          const data = await res.json();
          setQcSummary(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadQcStatus();
    const interval = setInterval(loadQcStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    try {
      const notif = notifications.find(n => n.id === notificationId);
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (notif?.analysisId) {
        router.push(`/analyses/${notif.analysisId}`);
        setShowNotifications(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIconByType = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      patient: <Users className="w-4 h-4" />,
      analysis: <FileText className="w-4 h-4" />,
      result: <Beaker className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      success: <Check className="w-4 h-4 text-emerald-600" />,
      warning: <Clock className="w-4 h-4 text-amber-600" />,
      error: <X className="w-4 h-4 text-rose-600" />,
      info: <Bell className="w-4 h-4 text-indigo-600" />,
    };
    return icons[type] || icons['info'];
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-page)]/95 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 lg:px-6 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => {
              toggle();
              onMobileMenuToggle?.();
            }}
            className="rounded-xl border bg-white p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="relative max-w-xl flex-1" ref={searchRef}>
            <div className="relative group">
              {isSearching ? (
                <Loader2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-accent)]" />
              ) : (
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors group-focus-within:text-[var(--color-accent)]" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="Rechercher patient, analyse (Ctrl+K)..."
                className="h-11 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm font-medium text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border bg-white shadow-xl">
                <div className="max-h-[420px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        const baseUrl = result.type === 'patient' ? '/dashboard/patients' : 
                                      result.type === 'analysis' ? '/analyses' : '/tests';
                        router.push(`${baseUrl}/${result.id}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--color-accent-soft)]/50"
                    >
                      <div className="mt-0.5 flex-shrink-0 text-[var(--color-text-soft)]">
                        {getIconByType(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--color-text)]">
                          {result.title}
                        </div>
                        {result.description && (
                          <div className="truncate text-xs text-[var(--color-text-soft)]">
                            {result.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/dashboard/qc')}
            title={
              !qcSummary
                ? 'Chargement du contrôle qualité'
                : qcSummary.allPass && qcSummary.missing === 0
                  ? 'Tous les contrôles sont conformes'
                  : qcSummary.fail > 0
                    ? `${qcSummary.fail} contrôle(s) en échec`
                    : qcSummary.missing > 0
                      ? `${qcSummary.missing} contrôle(s) non effectué(s) aujourd'hui`
                      : `${qcSummary.warn} contrôle(s) en avertissement`
            }
            className={`hidden rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors md:inline-flex md:items-center md:gap-2 ${
              !qcSummary || (qcSummary.allPass && qcSummary.missing === 0)
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : qcSummary.fail > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {!qcSummary
                ? 'QC...'
                : qcSummary.fail > 0
                  ? `QC ${qcSummary.fail} échec(s)`
                  : qcSummary.missing > 0
                    ? `QC ${qcSummary.missing} manquant(s)`
                    : qcSummary.warn > 0
                      ? `QC ${qcSummary.warn} avert.`
                      : 'QC conforme'}
            </span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="group relative rounded-2xl border bg-white p-2.5 transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <Bell className="h-[18px] w-[18px] text-[var(--color-text-soft)] transition-colors group-hover:text-[var(--color-accent)]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
                        {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await fetch('/api/notifications/read-all', { method: 'POST' });
                          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                          setUnreadCount(0);
                        }}
                        className="text-xs font-medium text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
                      >
                        Tout lu
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-[420px] divide-y overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted)] ${
                          !notif.isRead ? 'bg-[var(--color-accent-soft)]/35' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text)]">
                            {notif.title}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)]">
                            {notif.message}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-text-soft)]">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                          </div>
                        </div>
                        {!notif.isRead && (
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-accent)]" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-[var(--color-text-soft)]">
                      Aucune notification
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="group flex items-center gap-2.5 rounded-2xl border bg-white px-2.5 py-1.5">
            <div className="hidden text-right sm:flex sm:flex-col">
              <div className="text-xs font-semibold text-[var(--color-text)]">{user?.name || 'Utilisateur'}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">{roleLabel}</div>
            </div>
            <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-blue-700/20 bg-[var(--color-accent)] text-xs font-black text-white shadow-[0_8px_18px_rgba(31,111,235,0.35)] transition-all group-hover:brightness-105" title={user?.email || ''}>
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
