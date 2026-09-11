'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';

declare global {
  interface Window {
    __JNK_AUDIO__?: {
      snapshot: () => {
        contextStarted: boolean;
        everPlayed: boolean;
        muted: boolean;
        activeArc: 'early' | 'late' | null;
        sfxPlays: readonly string[];
        musicPlays: readonly string[];
      };
    };
  }
}

/**
 * Global presentation provider (init.md M3 #1/#4, AGENT.md §8).
 *
 * Resolves the effective reduced-motion preference (Settings toggle with a
 * "follow system" default), pins it to Framer's MotionConfig so every
 * animation respects it, and exposes a dataset flag that turns off CSS
 * animations too. Also surfaces a tiny, read-only audio state hook used by
 * the Gate 3 no-autoplay Playwright check.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const effectiveReduced = useEffectiveReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = effectiveReduced ? 'true' : 'false';
    window.__JNK_AUDIO__ = { snapshot: () => soundManager.getDebugState() };
  }, [effectiveReduced]);

  return (
    <MotionConfig reducedMotion={effectiveReduced ? 'always' : 'never'}>{children}</MotionConfig>
  );
}