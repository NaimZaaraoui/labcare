'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error';
  message: string;
}

export function NotificationToast({ type, message }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('✨ NotificationToast mounted:', { type, message });
    
    const timer = setTimeout(() => {
      console.log('✨ NotificationToast fading out');
      setIsVisible(false);
    }, 4700);

    return () => {
      clearTimeout(timer);
      console.log('✨ NotificationToast cleanup');
    };
  }, [type, message]);

  return (
    <div className={`fixed bottom-4 lg:bottom-10 right-4 lg:right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-4 transition-all duration-300 ${
      isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0 pointer-events-none'
    } ${
      type === 'success' ? 'bg-white/90 border-emerald-100 text-emerald-900' : 'bg-white/90 border-rose-100 text-rose-900'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      </div>
      <div>
        <p className="font-black text-sm">{type === 'success' ? 'Succès' : 'Erreur'}</p>
        <p className="font-medium text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
