'use client';

import { motion } from 'framer-motion';
import type { LifeEventDef, Tone } from '@/lib/engine/types';
import { motion as motionTokens } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

const toneLabel: Record<Tone, string> = {
  good: 'Good break',
  bad: 'Tough beat',
  neutral: 'Just life',
  funny: 'Funny moment',
};

const toneClass: Record<Tone, string> = {
  good: 'bg-tone-good/15 text-tone-good',
  bad: 'bg-tone-bad/15 text-tone-bad',
  neutral: 'bg-tone-neutral/15 text-tone-neutral',
  funny: 'bg-tone-funny/15 text-tone-funny',
};

const toneBar: Record<Tone, string> = {
  good: 'bg-tone-good',
  bad: 'bg-tone-bad',
  neutral: 'bg-tone-neutral',
  funny: 'bg-tone-funny',
};

const toneDot: Record<Tone, string> = {
  good: 'bg-tone-good',
  bad: 'bg-tone-bad',
  neutral: 'bg-tone-neutral',
  funny: 'bg-tone-funny',
};

interface EventCardProps {
  event: LifeEventDef;
  onChoose: (choiceId: string) => void;
}

/**
 * DESIGN.md §6 point 1 — a reactive event card, not a text dump:
 * slides in (AnimatePresence in GameHub), carries a mood-colored accent bar
 * and a softly pulsing icon dot that animates in. Exit is handled by the
 * shared AnimatePresence.
 */
export function EventCard({ event, onChoose }: EventCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-md"
      data-testid="event-card"
      data-tone={event.tone}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${toneBar[event.tone]}`} aria-hidden="true" />

      <div className="mb-1 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest ${toneClass[event.tone]}`}
        >
          <motion.span
            className={`inline-block size-1.5 rounded-full ${toneDot[event.tone]}`}
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
          />
          {toneLabel[event.tone]}
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Age {event.minAge}–{event.maxAge}
        </span>
      </div>

      <p className="mb-4 text-lg leading-relaxed text-text">{event.text}</p>

      <div className="flex flex-col gap-2">
        {event.choices.map((choice, index) => (
          <Button
            key={choice.id}
            variant="secondary"
            onClick={() => onChoose(choice.id)}
            data-testid={`choice-${index}`}
            className="w-full justify-start text-left"
          >
            {choice.text}
          </Button>
        ))}
      </div>
    </motion.section>
  );
}