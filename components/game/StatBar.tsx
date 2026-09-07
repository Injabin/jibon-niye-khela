'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { motion as motionTokens } from '@/lib/theme';

/**
 * DESIGN.md §6 point 3 — "stat bars that fight back":
 * fills animate, drops shake + flash red while the number ticks down, rises
 * glow gold. Js timings come straight from the theme tokens; reduced-motion
 * (system or Settings) turns every animation instant via MotionConfig and the
 * dataset flag.
 */

function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(target);
  const startValue = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    const reducedActive = document.documentElement.dataset.reducedMotion === 'true';
    const from = startValue.current;
    if (from === target) return;
    const started = performance.now();
    const duration = reducedActive ? 0 : motionTokens.quick * 1000;
    const step = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (target - from) * eased);
      setDisplay(next);
      if (p < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        startValue.current = target;
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame.current);
      startValue.current = target;
    };
  }, [target]);

  return display;
}

interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const display = useAnimatedNumber(clamped);

  const prevValue = useRef(value);
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const delta = value - prevValue.current;
    if (delta === 0) return;
    prevValue.current = value;
    setPulse(delta < 0 ? 'down' : 'up');
    setPulseCount((count) => count + 1);
    const timer = window.setTimeout(() => setPulse(null), motionTokens.moment * 1000);
    return () => window.clearTimeout(timer);
  }, [value]);

  const shakeX =
    pulse === 'down' ? [0, -4, 4, -3, 3, -2, 0] : pulse === 'up' ? [0, 1.5, -1, 1, 0] : 0;
  const flashColor = pulse === 'down' ? 'var(--color-danger)' : 'var(--color-success)';
  const flashOpacity = pulse === 'down' ? 0.45 : pulse === 'up' ? 0.3 : 0;

  return (
    <div className="flex items-center gap-3" data-testid={`stat-${label.toLowerCase()}`}>
      <span className="w-24 shrink-0 text-sm text-text-muted">{label}</span>

      <motion.div
        className="relative h-3 flex-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        animate={{ x: shakeX }}
        transition={{ duration: motionTokens.micro, ease: 'easeInOut' }}
      >
        <motion.div
          className="h-3 rounded-full bg-primary"
          data-testid={`stat-fill-${label.toLowerCase()}`}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
        />
        <motion.div
          key={pulseCount}
          className="pointer-events-none absolute inset-0 rounded-full"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: flashOpacity }}
          transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
          style={{ backgroundColor: flashColor }}
        />
      </motion.div>

      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-text">{display}</span>
    </div>
  );
}