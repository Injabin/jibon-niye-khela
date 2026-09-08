'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker (init.md M6 #3). Runs in every
 * browser that supports SWs; failures are swallowed silently so a blocked
 * third-party context never breaks the game.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // No offline support in this browser/context — the game still works.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}