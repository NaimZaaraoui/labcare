'use client';

import { useCallback } from 'react';

export function useDirectPrint() {
  const printUrl = useCallback((url: string) => {
    // Check if iframe already exists
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    // Set src and wait for it to load
    // The target page should have window.print() in its useEffect
    iframe.src = url;
  }, []);

  return { printUrl };
}
