'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface MobileMenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
  open: () => {},
});

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('Menu state changed to:', isOpen);
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      console.log('Toggle: changing from', prev, 'to', !prev);
      return !prev;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <MobileMenuContext.Provider 
      value={{
        isOpen,
        toggle,
        close,
        open,
      }}
    >
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  return context;
}
