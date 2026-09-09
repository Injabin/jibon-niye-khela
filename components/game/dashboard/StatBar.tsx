'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { motion as motionTokens } from '@/lib/theme';
import { STAT_META, type StatKey } from '@/lib/theme/concepts';
import { Heart, Sun, Swords, Shield } from 'lucide-react';

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
  statKey: StatKey;
}

const STAT_THEMES: Record<
  StatKey,
  {
    fillColor: string;
    icon: React.ComponentType<{ className?: string }>;
    textColor: string;
  }
> = {
  health: {
    fillColor: 'bg-[#b23a3b]',
    icon: Heart,
    textColor: 'text-[#e57373]',
  },
  happiness: {
    fillColor: 'bg-[#5a7a94]',
    icon: Sun,
    textColor: 'text-[#8ca8c0]',
  },
  smarts: {
    fillColor: 'bg-[#8a8f96]',
    icon: Swords,
    textColor: 'text-[#a8acb3]',
  },
  looks: {
    fillColor: 'bg-[#d4af37]',
    icon: Shield,
    textColor: 'text-[#e0c04f]',
  },
};

export function StatBar({ label, value, statKey }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const display = useAnimatedNumber(clamped);
  const meta = STAT_META[statKey];
  const theme = STAT_THEMES[statKey];
  const IconComponent = theme.icon;

  const prevValue = useRef(value);
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const delta = value - prevValue.current;
    if (delta === 0) return;
    prevValue.current = value;
    setPulse(delta < 0 ? 'down' : 'up');
    const timer = window.setTimeout(() => setPulse(null), motionTokens.moment * 1000);
    return () => window.clearTimeout(timer);
  }, [value]);

  const shakeX =
    pulse === 'down' ? [0, -3, 3, -2, 2, 0] : pulse === 'up' ? [0, 1.5, -1, 1, 0] : 0;

  return (
    <div className="flex flex-col gap-1.5" data-testid={`stat-${statKey}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <IconComponent className={`size-3.5 ${theme.textColor}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </span>
        </div>
        <span className="text-xs font-semibold tabular-nums text-white">
          {display}
          <span className="text-[10px] font-normal text-zinc-400">/100</span>
        </span>
      </div>

      <motion.div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.05] p-[1px]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={meta.readable}
        animate={{ x: shakeX }}
        transition={{ duration: motionTokens.micro, ease: 'easeInOut' }}
      >
        <motion.div
          className={`h-full rounded-full ${theme.fillColor} transition-all`}
          data-testid={`stat-fill-${statKey}`}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
        />
      </motion.div>
    </div>
  );
}
