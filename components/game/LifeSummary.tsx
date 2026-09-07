import type { Character } from '@/lib/engine/types';
import { StatBar } from './StatBar';

export function LifeSummary({ character }: { character: Character }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-5 shadow-md"
      data-testid="life-summary"
    >
      <h2 className="text-xl font-semibold tracking-tight text-text">Life over</h2>
      <p className="mt-1 text-sm text-text-muted">
        {character.name} {character.surname} lived for {character.age} years.
      </p>
      <p className="mt-3 text-text">
        Cause of death: <span className="font-medium">{character.causeOfDeath}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </div>

      <p className="mt-5 text-sm text-text-muted">
        A full life summary with your story timeline arrives in a later milestone.
      </p>
    </section>
  );
}