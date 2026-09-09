'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import type { EventChoice, LifeEventDef, StatEffects } from '@/lib/engine/types';
import { motion as motionTokens } from '@/lib/theme';
import { Sparkles, AlertCircle, Smile, HelpCircle, ArrowRight } from 'lucide-react';

function choiceWeight(choice: EventChoice): number {
  const w: StatEffects = choice.effects;
  let total = 0;
  total += Math.abs(w.health ?? 0);
  total += Math.abs(w.happiness ?? 0);
  total += Math.abs(w.smarts ?? 0);
  total += Math.abs(w.looks ?? 0);
  total += Math.abs(w.fame ?? 0);
  total += Math.abs(w.karma ?? 0);
  total += Math.abs(w.money ?? 0) / 100;
  return total;
}

interface EventCardProps {
  event: LifeEventDef;
  onChoose: (choiceId: string) => void;
}

const TONE_CONFIG: Record<
  LifeEventDef['tone'],
  {
    badgeColor: string;
    borderAccent: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  good: {
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderAccent: 'border-emerald-500/30',
    icon: Sparkles,
    label: 'Favorable Turn',
  },
  bad: {
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderAccent: 'border-rose-500/30',
    icon: AlertCircle,
    label: 'Adversity',
  },
  funny: {
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    borderAccent: 'border-violet-500/30',
    icon: Smile,
    label: 'Peculiar Event',
  },
  neutral: {
    badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    borderAccent: 'border-white/10',
    icon: HelpCircle,
    label: 'Life Occurrence',
  },
};

export function EventCard({ event, onChoose }: EventCardProps) {
  const overlayRef = useRef<HTMLElement>(null);
  const toneCfg = TONE_CONFIG[event.tone];
  const ToneIcon = toneCfg.icon;

  const mostConsequentialIndex = event.choices.reduce(
    (best, choice, index, all) => (choiceWeight(choice) > choiceWeight(all[best]) ? index : best),
    0,
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab') return;
    const panel = overlayRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((n) => n.getAttribute('aria-hidden') !== 'true');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeEl = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (activeEl === first || !panel.contains(activeEl)) {
        e.preventDefault();
        last.focus();
      }
    } else if (activeEl === last || !panel.contains(activeEl)) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-none"
        data-testid="event-backdrop"
        aria-hidden="true"
      />
      <motion.section
        ref={overlayRef as React.Ref<HTMLElement>}
        role="group"
        aria-roledescription="life event"
        aria-label={`Life event — ${toneCfg.label}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
        className={`relative w-full max-w-lg rounded-2xl bg-zinc-900/90 backdrop-blur-2xl border ${toneCfg.borderAccent} p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] pointer-events-auto flex flex-col gap-6`}
        data-testid="event-card"
        data-tone={event.tone}
      >
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide uppercase ${toneCfg.badgeColor}`}
          >
            <ToneIcon className="size-3.5" />
            <span>{toneCfg.label}</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            Decision Required
          </span>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-zinc-100 font-normal">
          {event.text}
        </p>

        <div className="flex flex-col gap-2.5 pt-2">
          {event.choices.map((choice, index) => {
            const isPriority = index === mostConsequentialIndex;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose(choice.id)}
                data-testid={`choice-${index}`}
                className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 ${
                  isPriority
                    ? 'bg-[#b23a3b] hover:bg-[#c44344] text-white border-b-2 border-b-[#7a1c1d] active:border-b-0 active:translate-y-0.5 shadow-md shadow-rose-950/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-400 group-hover:text-white">
                    {index + 1}
                  </span>
                  <span>{choice.text}</span>
                </div>
                <ArrowRight className="size-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 text-zinc-400 group-hover:text-white" />
              </button>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}
