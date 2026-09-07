import { EVENT_REGISTRY } from '@/content/events';
import { applyStatEffects } from '../stats';
import { getCharacterFlags } from '../traits';
import type { RNG } from '../rng';
import type { Character, LifeEventDef } from '../types';

const MAX_YEARLY_EVENTS = 3;

function isEventEligible(event: LifeEventDef, character: Character, flags: Set<string>): boolean {
  if (character.age < event.minAge || character.age > event.maxAge) return false;
  if (event.requiredFlags && !event.requiredFlags.every((flag) => flags.has(flag))) return false;
  if (event.antiFlags && event.antiFlags.some((flag) => flags.has(flag))) return false;
  return true;
}

export function getEligibleEventsFrom(
  registry: readonly LifeEventDef[],
  character: Character
): LifeEventDef[] {
  const flags = new Set(getCharacterFlags(character));
  return registry.filter((event) => isEventEligible(event, character, flags));
}

export function getEligibleEvents(character: Character): LifeEventDef[] {
  return getEligibleEventsFrom(EVENT_REGISTRY, character);
}

/** Weighted pick with no replacement; returns a new array without the picked item. */
export function pickWeighted(pool: readonly LifeEventDef[], rng: RNG): LifeEventDef {
  if (pool.length === 0) {
    throw new Error('Cannot pick from an empty event pool');
  }
  const totalWeight = pool.reduce((sum, event) => sum + Math.max(0, event.weight), 0);
  if (totalWeight <= 0) {
    throw new Error('Event pool has no positive weight');
  }
  let roll = rng.next() * totalWeight;
  for (const event of pool) {
    roll -= Math.max(0, event.weight);
    if (roll < 0) return event;
  }
  return pool[pool.length - 1];
}

export function drawYearlyEventsFrom(
  registry: readonly LifeEventDef[],
  character: Character,
  rng: RNG
): LifeEventDef[] {
  const eligible = getEligibleEventsFrom(registry, character);
  if (eligible.length === 0) return [];

  const count = rng.rangeInt(0, MAX_YEARLY_EVENTS);
  const pool = [...eligible];
  const drawn: LifeEventDef[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const picked = pickWeighted(pool, rng);
    drawn.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }

  return drawn;
}

export function drawYearlyEvents(character: Character, rng: RNG): LifeEventDef[] {
  return drawYearlyEventsFrom(EVENT_REGISTRY, character, rng);
}

export function resolveEventChoice(character: Character, event: LifeEventDef, choiceId: string) {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown choice "${choiceId}" for event "${event.id}"`);
  }

  applyStatEffects(character, choice.effects);
  character.history.push({
    age: character.age,
    text: `${event.text} ${choice.outcomeText}`.trim(),
    tone: choice.tone,
  });
}