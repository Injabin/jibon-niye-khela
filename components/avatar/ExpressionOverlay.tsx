'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { expressionMeta } from '@/lib/avatar/expressions';
import type { ExpressionId } from '@/lib/engine/moments';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';
import { EXPRESSION_FILE } from '@/lib/motion/moments';
import { motion as motionTokens } from '@/lib/theme';
import { LottieMotion } from '@/components/motion/dynamicLottie';

/** How long a "tell" plays before auto-hiding (battery/CPU cap, AGENT.md §7). */
const EXPRESSION_MS = 2600;

/**
 * Expression overlay layered over the avatar's head (DESIGN.md §7).
 *
 * Shows a short "tell" (sparkle/tear/think/giggle) that auto-hides. Full
 * motion plays the matching Lottie file (lazy-loaded, single shared chunk);
 * under reduced motion it swaps for the static icon + fade (init.md M4 #6).
 * It is keyed by the parent with the outcome tone so each new outcome
 * replays it.
 */
export function ExpressionOverlay({ expression }: { expression: ExpressionId | null }) {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), EXPRESSION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!expression) return null;

  const meta = expressionMeta(expression);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-testid="avatar-expression"
      data-expression={expression}
      data-motion={reducedMotion ? 'static' : 'lottie'}
      aria-hidden="true"
    >
      <AnimatePresence>
        {visible &&
          (reducedMotion ? (
            <motion.div
              key="fallback"
              className="absolute left-1/2 top-[14%] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-lg"
              style={{ color: meta.color }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: motionTokens.micro }}
              aria-hidden
            >
              {meta.icon}
            </motion.div>
          ) : (
            <motion.div
              key="lottie"
              className="absolute left-1/2 top-[2%] h-16 w-16 -translate-x-1/2"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: motionTokens.micro }}
              aria-hidden
            >
              <LottieMotion src={EXPRESSION_FILE[expression]} ariaLabel={`${meta.label} expression`} loop />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}