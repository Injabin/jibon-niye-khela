'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { LifeEventDef } from '@/lib/engine/types';
import { motion as motionTokens } from '@/lib/theme';
import { TONE_META } from '@/lib/theme/concepts';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';
import { Icon } from '@/components/ui/Icon';

interface EventCardProps {
  event: LifeEventDef;
  onChoose: (choiceId: string) => void;
}

const TONE_BADGE: Record<
  LifeEventDef['tone'],
  { badge: string; border: string }
> = {
  good: { badge: 'bg-tone-good/10 text-tone-text-good border-tone-good/25', border: 'border-tone-good/30' },
  bad: { badge: 'bg-tone-bad/10 text-tone-text-bad border-tone-bad/25', border: 'border-tone-bad/30' },
  funny: { badge: 'bg-tone-funny/10 text-tone-text-funny border-tone-funny/25', border: 'border-tone-funny/30' },
  neutral: { badge: 'bg-tone-neutral/10 text-tone-text-neutral border-tone-neutral/25', border: 'border-tone-neutral/30' },
};

export function EventCard({ event, onChoose }: EventCardProps) {
  const overlayRef = useRef<HTMLElement>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const toneMeta = TONE_META[event.tone];
  const toneClasses = TONE_BADGE[event.tone];

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a text field
      const target = document.activeElement as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const choiceIndex = parseInt(e.key, 10) - 1;
        if (choiceIndex >= 0 && choiceIndex < event.choices.length) {
          e.preventDefault();
          onChoose(event.choices[choiceIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [event.choices, onChoose]);

  useEffect(() => {
    // Accessible modal focus management: when event card appears, focus the first choice
    const timer = setTimeout(() => {
      const panel = overlayRef.current;
      if (panel) {
        const firstChoice = panel.querySelector<HTMLElement>('button[data-testid^="choice-"]');
        firstChoice?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [event.id]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (['1', '2', '3', '4'].includes(e.key)) {
      const choiceIndex = parseInt(e.key, 10) - 1;
      if (choiceIndex >= 0 && choiceIndex < event.choices.length) {
        e.preventDefault();
        onChoose(event.choices[choiceIndex].id);
        return;
      }
    }

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
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : motionTokens.micro, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 bg-surface-overlay backdrop-blur-md pointer-events-none"
        data-testid="event-backdrop"
        aria-hidden="true"
      />
      <motion.section
        ref={overlayRef as React.Ref<HTMLElement>}
        role="group"
        aria-roledescription="life event"
        aria-label={`জীবনের ঘটনা — ${toneMeta.label}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: reducedMotion ? 0 : motionTokens.quick, ease: 'easeOut' }}
        className={`relative w-full max-w-lg rounded-2xl bg-surface backdrop-blur-xl border ${toneClasses.border} p-6 sm:p-8 shadow-lg pointer-events-auto flex flex-col gap-6`}
        data-testid="event-card"
        data-tone={event.tone}
      >
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${toneClasses.badge}`}
          >
            <Icon name={toneMeta.icon} size={14} />
            <span>{toneMeta.label}</span>
          </div>
          <span className="text-[10px] tracking-widest text-text-muted uppercase">
            সিদ্ধান্ত নিতে হবে
          </span>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-text font-normal">
          {event.text}
        </p>

        <div className="flex flex-col gap-2.5 pt-2">
          {event.choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice.id)}
              data-testid={`choice-${index}`}
              className="group relative flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3.5 text-left text-sm font-medium text-text transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold tabular-nums text-primary-text group-hover:bg-primary/25"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span>{choice.text}</span>
              </div>
              <Icon name="dot" size={16} className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}