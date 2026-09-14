'use client';

import { MotionConfig } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';
import type { ReactNode } from 'react';

/**
 * Game-route motion context (Gate 6 performance / Gate 3 reduced-motion).
 *
 * `MotionConfig` lives here instead of the root layout so `framer-motion`
 * never ships in the landing page's initial JS payload. The root
 * `MotionProvider` still owns the global dataset flag and audio probe.
 */
export default function PlayLayout({ children }: { children: ReactNode }) {
  const effectiveReduced = useEffectiveReducedMotion();
  return (
    <MotionConfig reducedMotion={effectiveReduced ? 'always' : 'never'}>{children}</MotionConfig>
  );
}