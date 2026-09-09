'use client';

import { useSyncExternalStore } from 'react';

export type LayoutTier = 'mobile' | 'tablet' | 'desktop';

const TABLET_QUERY = '(min-width: 768px) and (max-width: 1279px)';
const DESKTOP_QUERY = '(min-width: 1280px)';

function subscribeLayoutTier(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mqlTablet = window.matchMedia(TABLET_QUERY);
  const mqlDesktop = window.matchMedia(DESKTOP_QUERY);

  mqlTablet.addEventListener('change', callback);
  mqlDesktop.addEventListener('change', callback);

  return () => {
    mqlTablet.removeEventListener('change', callback);
    mqlDesktop.removeEventListener('change', callback);
  };
}

function getLayoutTierSnapshot(): LayoutTier {
  if (typeof window === 'undefined') return 'mobile';
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet';
  return 'mobile';
}

function getServerSnapshot(): LayoutTier {
  return 'mobile';
}

export function useLayoutTier(): LayoutTier {
  return useSyncExternalStore(subscribeLayoutTier, getLayoutTierSnapshot, getServerSnapshot);
}
