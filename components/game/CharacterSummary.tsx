import type { Character } from '@/lib/engine/types';
import { StatBar } from './StatBar';

export function CharacterSummary({ character }: { character: Character }) {
  const ageLabel = character.alive ? `${character.age} years old` : `Died at ${character.age}`;
  return (
    <section
      className="rounded-lg border border-border bg-surface p-5 shadow-sm"
      data-testid="character-summary"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">
            {character.name} {character.surname}
          </h2>
          <p className="text-sm text-text-muted">
            {character.gender}, born {character.birthYear} · {ageLabel}
          </p>
        </div>
        <p className="text-sm font-medium text-text" data-testid="money" aria-label="Coins">
          Coins: {character.money}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </div>

      <p className="mt-4 text-sm text-text-muted">
        Traits: {character.traits.length ? character.traits.join(', ') : 'none discovered yet'}
      </p>
    </section>
  );
}