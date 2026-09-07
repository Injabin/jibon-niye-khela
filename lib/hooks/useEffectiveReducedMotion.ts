'use client';

import { useEffect, useState } from 'react';
import { settingsStore } from '@/lib/store/settingsStore';

const SYSTEM_REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(SYSTEM_REDUCED_QUERY).matches;
}

/**
 * Single source of truth for the effective reduced-motion preference:
 * Settings toggle (system | reduced | full) combined with the OS query.
 *
 * `MotionProvider` pins the same value into Framer's MotionConfig; avatar
 * overlays and moment stings consult this hook so Lottie playback is skipped
 * under reduced motion (init.md M4 #6).
 */
export function useEffectiveReducedMotion(): boolean {
  const reducedMotionMode = settingsStore((s) => s.reducedMotion);
  const [systemReduced, setSystemReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    settingsStore.getState().hydrate();
    const media = window.matchMedia(SYSTEM_REDUCED_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reducedMotionMode === 'reduced' || (reducedMotionMode === 'system' && systemReduced);
}