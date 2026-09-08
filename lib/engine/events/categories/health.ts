/**
 * Health system engine (DESIGN.md §5.7, §11; init.md M5 #2).
 *
 * Age-and-lifestyle-scaled illness/injury incidents plus a supportive mental-
 * health arc that routes toward therapy and support — never toward
 * self-harm, which is not implemented as a player action anywhere (DESIGN.md
 * §11). Incidents are stylized and non-graphic. `visitDoctor` is the
 * restorative action the future Health menu will expose; `tickHealth` is the
 * yearly maintenance that can (rarely) end a life via `checkForDeath`.
 */

import type { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import type { Character, StatEffects, Tone } from '@/lib/engine/types';

export interface HealthOutcome {
  text: string;
  tone: Tone;
}

export interface HealthIncident {
  id: string;
  label: string;
  minAge: number;
  weight: number;
  effects: StatEffects;
  tone: Tone;
}

/** Stylized incident pool — scaled by age; consequences are abstract, never graphic. */
export const INCIDENTS: readonly HealthIncident[] = [
  {
    id: 'cold',
    label: 'A cold settles in for the week and rearranges the furniture.',
    minAge: 0,
    weight: 26,
    effects: { health: -7, happiness: -3, addFlag: 'ill_recovered' },
    tone: 'neutral',
  },
  {
    id: 'winter_flu',
    label: 'A proper flu finds you. Everything tastes faintly of aspirin.',
    minAge: 0,
    weight: 14,
    effects: { health: -12, happiness: -5, addFlag: 'ill_recovered' },
    tone: 'bad',
  },
  {
    id: 'sprain',
    label: 'A stair well you have used a hundred times bites back — a sprain.',
    minAge: 10,
    weight: 12,
    effects: { health: -9, looks: -2, addFlag: 'injury_recovered' },
    tone: 'bad',
  },
  {
    id: 'exhaustion',
    label: 'Exhaustion catches you mid-stride. The battery icon is your spirit animal.',
    minAge: 14,
    weight: 10,
    effects: { health: -5, happiness: -9, addFlag: 'mental_low' },
    tone: 'bad',
  },
  {
    id: 'fracture',
    label: 'A clumsy moment — the fracture heals, but slower than your pride.',
    minAge: 35,
    weight: 8,
    effects: { health: -16, happiness: -4, addFlag: 'injury_recovered' },
    tone: 'bad',
  },
  {
    id: 'hospital',
    label: 'A serious scare lands you in hospital. The ward is calm and very beige.',
    minAge: 55,
    weight: 9,
    effects: { health: -18, happiness: -6, addFlag: 'ill_recovered' },
    tone: 'bad',
  },
];

function hasFlag(character: Character, flag: string): boolean {
  return character.flags.includes(flag);
}

/** Age-scales incident odds; a fitness habit and quitting a bad habit both lower them. */
export function incidentChance(character: Character): number {
  const age = character.age;
  let base = age < 20 ? 0.05 : age < 50 ? 0.07 : age < 65 ? 0.1 : 0.15;
  if (hasFlag(character, 'fitness_good')) base -= 0.02;
  if (hasFlag(character, 'quit_bad_habit')) base -= 0.01;
  return Math.min(0.3, Math.max(0.03, base));
}

function pickIncident(character: Character, rng: RNG): HealthIncident {
  const pool = INCIDENTS.filter((i) => character.age >= i.minAge);
  let total = 0;
  for (const i of pool) total += i.weight;
  let roll = rng.next() * total;
  for (const incident of pool) {
    roll -= incident.weight;
    if (roll < 0) return incident;
  }
  return pool[pool.length - 1];
}

/**
 * The supportive mental-health branch: when happiness is low and the player
 * has not already sought help, offer the therapy route (DESIGN.md §5.7, §11).
 * Pure so the store/menu can call it directly too.
 */
export function mentalSupportIfNeeded(character: Character): HealthOutcome | null {
  if (hasFlag(character, 'went_to_therapy')) return null;
  if (hasFlag(character, 'mental_low')) return null;
  if (character.stats.happiness >= 28 || character.age < 13) return null;
  return {
    text: 'Some weeks sit heavy. A quiet session with a professional helps more than you expected.',
    tone: 'good',
  };
}

export function applyMentalSupport(character: Character): void {
  applyStatEffects(character, {
    happiness: 8,
    addFlag: 'went_to_therapy',
    removeFlag: 'mental_low',
  });
}

/** Yearly maintenance: roll an incident, or route a low-happiness character to support. */
export function tickHealth(character: Character, rng: RNG): HealthOutcome | null {
  if (!character.alive) return null;

  if (rng.chance(incidentChance(character))) {
    const incident = pickIncident(character, rng);
    applyStatEffects(character, incident.effects);
    return { text: incident.label, tone: incident.tone };
  }

  const support = mentalSupportIfNeeded(character);
  if (support) {
    applyMentalSupport(character);
    return support;
  }
  return null;
}

/** Restorative action for the future Health menu: doctor's visit. */
export function visitDoctor(character: Character): HealthOutcome {
  applyStatEffects(character, { health: 15, happiness: 5, money: -50 });
  return {
    text: 'The doctor listens, prescribes sensible rest, and charges you a mysterious fifty.',
    tone: 'good',
  };
}