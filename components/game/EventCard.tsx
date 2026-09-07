import type { LifeEventDef, Tone } from '@/lib/engine/types';
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

interface EventCardProps {
  event: LifeEventDef;
  onChoose: (choiceId: string) => void;
}

export function EventCard({ event, onChoose }: EventCardProps) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-5 shadow-md"
      data-testid="event-card"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-muted">
        Age {event.minAge}–{event.maxAge} · <span className={toneClass[event.tone]}>{toneLabel[event.tone]}</span>
      </p>
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
    </section>
  );
}