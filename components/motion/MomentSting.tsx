/**
 * Moment sting overlay (DESIGN.md §7, init.md M4).
 *
 * Fires a short full-screen Lottie burst when an event tagged with a
 * `moment` milestone kind resolves (plus `tombstone` on death). The overlay
 * is `pointer-events-none` so it never blocks clicks under it, mounts at most
 * one sting at a time, and under reduced motion swaps Lottie for a static
 * badge + gentle fade with no layout shift.
 *
 * The parent remounts this component per trigger (token key), so each
 * instance plays exactly one sting: on mount it plays the cue and schedules
 * its own auto-clear. Nothing reacts to a changing prop on a live instance.
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import { MILESTONE_KINDS } from '@/lib/engine/moments';
import type { MilestoneKind } from '@/lib/engine/types';
import { hapticForSfx } from '@/lib/haptics';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';
import { stingVisualsFor } from '@/lib/motion/moments';
import { LottieMotion } from './dynamicLottie';

/** How long a sting stays on screen before auto-clearing. */
const STING_MS = 2400;

function kindLabel(kind: MilestoneKind): string {
  return MILESTONE_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

interface MomentStingProps {
  /** Milestone kind to celebrate, or null to render nothing. */
  kind: MilestoneKind | null;
  /**
   * Monotonic trigger id. The parent bumps it on every trigger so a repeated
   * kind still remounts (replays) instead of being ignored as an unchanged key.
   */
  token: number;
}

export function MomentSting({ kind, token }: MomentStingProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [cleared, setCleared] = useState(false);

  // One sting per instance: play the cue and auto-clear. `kind` is constant
  // for a given mount (parent keys by token), so this runs once per trigger.
  useEffect(() => {
    if (!kind) return;
    const visuals = stingVisualsFor(kind);
    if (visuals.sfx && soundManager.soundEnabled) {
      soundManager.play(visuals.sfx);
      hapticForSfx(visuals.sfx);
    }
    const timer = window.setTimeout(() => setCleared(true), STING_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!kind || cleared) return null;
  const visuals = stingVisualsFor(kind);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      data-testid="moment-sting"
      data-kind={kind}
    >
      <motion.div
        className="relative flex h-72 w-72 items-center justify-center"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.9] }}
        exit={{ opacity: 0 }}
        transition={{ duration: STING_MS / 1000, times: [0, 0.08, 0.78, 1], ease: 'easeOut' }}
      >
        {/* Screen flash behind the burst. */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${visuals.accent} 0%, transparent 70%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.18, 0] }}
          transition={{ duration: 0.9, times: [0, 0.08, 0.6, 1] }}
          aria-hidden
        />
        {!reducedMotion && (
          <motion.div
            className="absolute inset-0"
            initial={{ x: 0 }}
            animate={{ x: [0, -7, 6, -4, 3, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            aria-hidden
          >
            <div className="absolute inset-0 scale-90" data-testid="moment-sting-visual" data-motion="lottie">
              <LottieMotion src={visuals.file} ariaLabel={`${kindLabel(kind)} moment`} />
            </div>
          </motion.div>
        )}
        {reducedMotion && (
          <div
            className="absolute inset-0 scale-90"
            data-testid="moment-sting-visual"
            data-motion="static"
            aria-hidden
          >
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="flex h-40 w-40 items-center justify-center rounded-full border-4 text-center"
                style={{ borderColor: visuals.accent, color: visuals.accent }}
              >
                <span className="px-3 text-sm font-semibold uppercase tracking-widest">
                  {kindLabel(kind)}
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}