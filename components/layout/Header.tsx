'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, Check, X, Clock, Loader2, Users, FileText, Beaker } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const role = (user as any)?.role || 'TECHNICIEN';
  const roleLabel = ROLE_LABELS[role] || role;
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
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
    <header className="sticky top-0 z-40 h-24 bg-[#F4F7FB]/90 backdrop-blur-xl border-none">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left - Menu + Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => {
              toggle();
              onMobileMenuToggle?.();
            }}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex-1 relative max-w-md" ref={searchRef}>
            <div className="relative group">
              {isSearching ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="Rechercher patient, analyse (Ctrl+K)..."
                className="w-full h-12 pl-12 pr-4 bg-white border-none rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-sm font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
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
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 transition-colors flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 text-slate-400 mt-0.5">
                        {getIconByType(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {result.title}
                        </div>
                        {result.description && (
                          <div className="text-xs text-slate-500 truncate">
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

        {/* Right - Notifications and User */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all group"
            >
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-500 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {unreadCount} nouveau
                    </span>
                  )}
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          !notif.isRead ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            {notif.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {notif.message}
                          </div>
                        </div>
                        {!notif.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-2" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Aucune notification
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 group">
            <div className="text-right hidden sm:flex flex-col">
              <div className="text-xs font-bold text-slate-900">{user?.name || 'Utilisateur'}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{roleLabel}</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400/30 flex items-center justify-center text-white text-sm font-black cursor-pointer shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110 transition-all hover:-translate-y-0.5" title={user?.email || ''}>
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}