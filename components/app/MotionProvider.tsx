'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import { settingsStore } from '@/lib/store/settingsStore';

const SYSTEM_REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(SYSTEM_REDUCED_QUERY).matches;
}

declare global {
  interface Window {
    __JNK_AUDIO__?: { snapshot: () => { contextStarted: boolean; everPlayed: boolean; muted: boolean } };
  }
}

/**
 * Global presentation provider (init.md M3 #1/#4, AGENT.md §8).
 *
 * Resolves the effective reduced-motion preference (Settings toggle with a
 * "follow system" default) and pins it to Framer's MotionConfig so every
 * animation respects it, plus a dataset flag that turns off CSS animations
 * too. Also exposes a tiny, read-only audio state hook used by the Gate 3
 * no-autoplay Playwright check.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotionMode = settingsStore((s) => s.reducedMotion);
  const [systemReduced, setSystemReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    settingsStore.getState().hydrate();
    const media = window.matchMedia(SYSTEM_REDUCED_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const effectiveReduced =
    reducedMotionMode === 'reduced' || (reducedMotionMode === 'system' && systemReduced);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = effectiveReduced ? 'true' : 'false';
    window.__JNK_AUDIO__ = { snapshot: () => soundManager.getDebugState() };
  }, [effectiveReduced]);

  return (
    <MotionConfig reducedMotion={effectiveReduced ? 'always' : 'never'}>{children}</MotionConfig>
  );
}