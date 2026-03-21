import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, LogOut, Check, ExternalLink, X, Clock, Loader2, Users, FileText, Beaker } from 'lucide-react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { searchApi, notificationsApi, SearchResult, Notification } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Globe } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

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

  // Keyboard shortcut Ctrl+K to search
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

  // Click outside to close
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

  // Search logic (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const data = await searchApi.global(searchQuery);
          setSearchResults(data.results);
          setShowSearchResults(true);
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

  // Notifications logic
  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id?: number, all = false) => {
    try {
      await notificationsApi.markAsRead(id, all);
      fetchNotifications();
      if (all) toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to update notification');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 border-b border-border backdrop-blur-xl">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-blue-600"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative" ref={searchRef}>
          <div className="relative group">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              placeholder={t('header.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all backdrop-blur-sm"
            />
          </div>

          <AnimatePresence>
            {showSearchResults && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] flex flex-col"
              >
                <div className="p-2 border-b border-border bg-muted/20 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-2">{t('common.search')}</span>
                  <button onClick={() => setShowSearchResults(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            result.type === 'PATIENT' ? 'bg-blue-100 text-blue-600' :
                            result.type === 'ANALYSIS' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {result.type === 'PATIENT' ? <Users className="w-5 h-5" /> :
                             result.type === 'ANALYSIS' ? <FileText className="w-5 h-5" /> :
                             <Beaker className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-semibold text-foreground truncate">{result.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">{t('header.noResults')} "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
             <button 
                onClick={() => router.push(pathname, { locale: 'en' })}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${locale === 'en' ? 'bg-card text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
                EN
             </button>
             <button 
                onClick={() => router.push(pathname, { locale: 'fr' })}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${locale === 'fr' ? 'bg-card text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
                FR
             </button>
             <button 
                onClick={() => router.push(pathname, { locale: 'ar' })}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${locale === 'ar' ? 'bg-card text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
                AR
             </button>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-muted-foreground hover:text-blue-600 hover:bg-muted rounded-lg transition-colors group"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card animate-pulse group-hover:bg-red-600"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h3 className="text-sm font-bold text-foreground">{t('common.notifications')}</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => handleMarkAsRead(undefined, true)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter"
                      >
                        {t('header.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-border/50">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-4 hover:bg-muted/30 transition-colors relative group ${!notif.isRead ? 'bg-blue-50/10' : ''}`}
                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                          >
                            {!notif.isRead && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                notif.type === 'ERROR' ? 'bg-red-500' :
                                notif.type === 'WARNING' ? 'bg-amber-500' :
                                notif.type === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <h4 className={`text-sm ${!notif.isRead ? 'font-bold' : 'font-medium'} text-foreground leading-tight mb-1`}>{notif.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notif.message}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notif.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600 transition-all"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                           <Bell className="w-6 h-6 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{t('header.noNotifications')}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-border bg-muted/20 text-center">
                    <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                      {t('header.viewAll')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border"></div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">Dr. Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">{t('roles.manager')}</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-sm text-white cursor-pointer hover:shadow-lg hover:shadow-blue-400/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50">
              SJ
            </button>
            <button className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50/20 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
