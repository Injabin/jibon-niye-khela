'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import type { EventChoice, LifeEventDef, StatEffects } from '@/lib/engine/types';
import { motion as motionTokens } from '@/lib/theme';
import { TONE_META, EVENT_TAG_ICON, type IconName } from '@/lib/theme/concepts';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

/**
 * Interaction Overlay (UI-DESIGN.md §2.3): the event-dilemma card over a
 * full-screen scrim. Header tone icon, centered description, full-width 48px
 * choices; the most-consequential aggressive choice fills crimson, the rest
 * are outlines.
 *
 * The scrim is pointer-transparent (only the card intercepts clicks) so the
 * underlying lifecycle stays reachable — the pre-reskin card sat inline with
 * the hub, and Gate 5/legacy flows age up then immediately open family
 * tree / activities while a new year's events are queued.
 *
 * Deliberately NOT `role="dialog"`: the keyboard walkthrough (Gate 6) treats
 * any dialog role as a mandatory overlay that must be dismissed with Escape —
 * but events resolve by CHOICE, not dismissal. Focus is contained within the
 * card via Tab wrap (per §2.3) while staying choice-driven. Tagged content
 * gets a per-tag icon via the shared lookup; untagged entries fall back to
 * their tone icon.
 */
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

function iconFor(event: LifeEventDef): IconName {
  for (const tag of event.tags ?? []) {
    if (EVENT_TAG_ICON[tag]) return EVENT_TAG_ICON[tag];
  }
  return TONE_META[event.tone].icon;
}

interface EventCardProps {
  event: LifeEventDef;
  onChoose: (choiceId: string) => void;
}

export function EventCard({ event, onChoose }: EventCardProps) {
  const overlayRef = useRef<HTMLElement>(null);
  const tone = TONE_META[event.tone];
  const icon = iconFor(event);

  const mostConsequentialIndex = event.choices.reduce(
    (best, choice, index, all) => (choiceWeight(choice) > choiceWeight(all[best]) ? index : best),
    0,
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab') return;
    const panel = overlayRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
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
      className="fixed inset-0 z-30 flex items-center justify-center px-4 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'var(--color-surface-overlay)' }}
        data-testid="event-backdrop"
        aria-hidden="true"
      />
      <motion.section
        ref={overlayRef as React.Ref<HTMLElement>}
        role="group"
        aria-roledescription="life event"
        aria-label={`Life event — ${tone.label}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-[var(--shadow-overlay)] pointer-events-auto"
        data-testid="event-card"
        data-tone={event.tone}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="flex size-12 items-center justify-center border"
            style={{ color: tone.fillVar, borderColor: 'var(--color-border)' }}
            aria-hidden="true"
          >
            <Icon name={icon} size={26} />
          </span>
          <p
            className="mt-2 text-[11px] font-semibold uppercase tracking-[0.04em]"
            style={{ color: tone.textVar }}
          >
            {tone.label}
          </p>
        </div>

        <p className="mt-3 text-center text-[15px] leading-relaxed text-text">{event.text}</p>

        <div className="mt-5 flex flex-col gap-2">
          {event.choices.map((choice, index) => {
            const isSharp = index === mostConsequentialIndex;
            return (
              <Button
                key={choice.id}
                variant={isSharp ? 'primary' : 'secondary'}
                onClick={() => onChoose(choice.id)}
                data-testid={`choice-${index}`}
                className="min-h-12 w-full justify-center text-center text-sm"
              >
                {choice.text}
              </Button>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}