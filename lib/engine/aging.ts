import type { RNG } from './rng';
import { applyYearlyDecay, oldAgeDeathChance } from './stats';
import { applyReputationDrift } from './reputation';
import { tickSystems } from './events/categories';
import { rollToddlerTraits } from './traits';
import { drawYearlyEvents, resolveEventChoice } from './events/registry';
import { createCharacter } from './character';
import type { AgeUpResult, Character, LifeEventDef } from './types';

export const UPPER_AGE_BOUND = 130;

export function killCharacter(character: Character, cause: string): void {
  if (!character.alive) return;
  character.alive = false;
  character.causeOfDeath = cause;
  character.history.push({
    age: character.age,
    text: `Life came to an end at ${character.age} years old. Cause: ${cause}.`,
    tone: 'bad',
  });
}

function applyDeathChecks(character: Character, rng: RNG): void {
  if (character.stats.health <= 0) {
    killCharacter(character, 'health complications');
    return;
  }

  const chance = oldAgeDeathChance(character.age);
  if (character.age >= UPPER_AGE_BOUND) {
    killCharacter(character, 'old age');
    return;
  }
  if (chance > 0 && rng.chance(chance)) {
    killCharacter(character, 'old age');
  }
}

/** Run death checks after a player resolves an event whose effects may be fatal. */
export function checkForDeath(character: Character, rng: RNG): void {
  applyDeathChecks(character, rng);
}

/**
 * Advance one year. A character already dead is a no-op (Gate 1/Test 3).
 * While alive, age strictly increments by exactly 1 per call (Gate 1/Test 4).
 * Drawn events are returned unresolved so the caller (UI or headless sim)
 * can let the player choose before applying effects.
 */
export function ageUp(character: Character, rng: RNG): AgeUpResult {
  if (!character.alive) {
    return { character, firedEvents: [] };
  }

  character.age += 1;
  character.statHistory.push({
    age: character.age,
    health: character.stats.health,
    happiness: character.stats.happiness,
    smarts: character.stats.smarts,
    looks: character.stats.looks,
  });

  // Age every living relationship (children, partners, peers, friends) by
  // exactly one year so the world stays consistent with the character's age.
  for (const rel of character.relationships) {
    if (rel.alive) rel.age = Math.max(0, rel.age + 1);
  }

  rollToddlerTraits(character, rng);
  applyYearlyDecay(character);
  applyReputationDrift(character);
  tickSystems(character, rng);

  applyDeathChecks(character, rng);

  const firedEvents: LifeEventDef[] = [];
  if (character.alive) {
    const drawn = drawYearlyEvents(character, rng);
    for (const event of drawn) {
      firedEvents.push(event);
    }
  }

  return { character, firedEvents };
}

export function simulateLife(seed: number): Character {
  const { character, rng } = createCharacter(seed);
  let guard = 0;
  while (character.alive && guard < UPPER_AGE_BOUND * 2) {
    const { firedEvents } = ageUp(character, rng);
    for (const event of firedEvents) {
      const choice = rng.pick(event.choices);
      resolveEventChoice(character, event, choice.id);
      checkForDeath(character, rng);
    }
    guard += 1;
  }
  return character;
}