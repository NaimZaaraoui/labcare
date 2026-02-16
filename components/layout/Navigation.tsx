'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Beaker, 
  FlaskConical, 
  Settings, 
  LogOut, 
  PlusCircle,
  Users,
  X,
  FileText
} from 'lucide-react';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useEffect, useRef } from 'react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Analyses', icon: FlaskConical, href: '/analyses' },
  { label: 'Patients', icon: Users, href: '/dashboard/patients' },
  { label: 'Nouvelle Analyse', icon: PlusCircle, href: '/analyses/nouvelle' },

  { label: 'Tests', icon: Beaker, href: '/tests' },
  { label: 'Documents', icon: FileText, href: '/dashboard/documents' },
  { label: 'Paramètres', icon: Settings, href: '/dashboard/settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileMenu();
  const prevPathnameRef = useRef(pathname);

  // Close menu only when pathname actually changes (navigation happens)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      close();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, close]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`
        sidebar-floating
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
        p-6 pt-8
      `}>
        {/* Close Button (Mobile Only) */}
        <button
          onClick={close}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center lg:hidden"
        >
          <X size={20} className="text-slate-600" />
        </button>

        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <svg viewBox="0 0 40 40" className="w-7 h-7 fill-none stroke-white" strokeWidth="3">
              <path d="M32 20c0-6.627-5.373-12-12-12S8 13.373 8 20s5.373 12 12 12c3.314 0 6.314-1.343 8.485-3.515" strokeLinecap="round" />
              <path d="M20 14v12M14 20h12" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-slate-900 leading-none">LABCARE</span>
              <span className="text-[9px] uppercase font-bold tracking-[0.15em] mt-1">LIMS Precision</span>
            </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Principal</div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1" />
                )}
              </Link>
            );
          })}
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
          }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: #cbd5e1;
          }
        `}</style>


      </nav>
    </>
  );
}