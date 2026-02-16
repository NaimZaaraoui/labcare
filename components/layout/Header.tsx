'use client';

import { useState } from 'react';
import { Search, Bell, User, Command, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useRouter } from 'next/navigation';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { toggle } = useMobileMenu();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/analyses?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const today = new Date();

  return (
    <header className="h-16 lg:h-20 px-4 md:px-8 flex items-center justify-between z-10 sticky top-0 bg-white/40 backdrop-blur-xl border-b border-white/40">
      {/* Mobile Menu Button */}
      <button
        onClick={toggle}
        className="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 mr-2"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Rechercher..." 
            className="w-full h-10 lg:h-12 bg-white/60 border border-slate-200/50 rounded-2xl pl-12 pr-4 lg:pr-12 text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
          <div className="hidden lg:flex absolute inset-y-0 right-4 items-center">
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
               <Command size={10} className="text-slate-400" />
               <span className="text-[10px] font-black text-slate-400">K</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6 ml-3 lg:ml-0">
        <div className="hidden md:block text-xs lg:text-sm text-slate-500">
          {format(today, "dd MMM", { locale: fr })}
        </div>

        <button className="relative w-9 h-9 lg:w-11 lg:h-11 bg-white rounded-xl lg:rounded-2xl border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-premium transition-all">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="hidden md:block h-8 lg:h-10 w-px bg-slate-100 mx-1 lg:mx-2" />

        <div className="hidden md:flex items-center gap-3 lg:gap-4 group cursor-pointer">
          <div className="hidden lg:flex flex-col items-end">
            <p className="text-sm font-black text-slate-900 leading-none">Mr. Naim</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Technicien</p>
          </div>
          <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform overflow-hidden relative">
             <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
             <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}