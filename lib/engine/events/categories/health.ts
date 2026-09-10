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
/** Stylized incident pool — scaled by age; consequences are abstract, never graphic. */
export const INCIDENTS: readonly HealthIncident[] = [
  {
    id: 'cold',
    label: 'হালকা সর্দি-কাশি লাইগা নাক দিয়া পানি ঝরতাছে। আম্মা গরম আদা চা বানায়া দিল।',
    minAge: 0,
    weight: 26,
    effects: { health: -7, happiness: -3, addFlag: 'ill_recovered' },
    tone: 'neutral',
  },
  {
    id: 'winter_flu',
    label: 'তীব্র ঠাণ্ডা আর সিজনাল ফ্লুতে শরীর কাবু হইয়া গেল! বিছানা থেইকা উঠার তাগদ নাই।',
    minAge: 0,
    weight: 14,
    effects: { health: -12, happiness: -5, addFlag: 'ill_recovered' },
    tone: 'bad',
  },
  {
    id: 'sprain',
    label: 'পুরান ঢাকার ছাদের সিঁড়িতে পিছলা খাইয়া পা মচকাইয়া ফালাইলা! হাঁটাচলা পুরাই বন্ধ।',
    minAge: 10,
    weight: 12,
    effects: { health: -9, looks: -2, addFlag: 'injury_recovered' },
    tone: 'bad',
  },
  {
    id: 'exhaustion',
    label: 'চাকরিবাকরি আর দুনিয়াদারির চাপে চান্দি গরম হইয়া শরীর পুরাই কাইত হইয়া পড়লো।',
    minAge: 14,
    weight: 10,
    effects: { health: -5, happiness: -9, addFlag: 'mental_low' },
    tone: 'bad',
  },
  {
    id: 'fracture',
    label: 'গলিতে দৌড়াদৌড়ি করতে গিয়া আছাড় খাইলা! ডাক্তার কইলো হাত মচকে গেছে, ব্যান্ডেজ লাগবো!',
    minAge: 35,
    weight: 8,
    effects: { health: -16, happiness: -4, addFlag: 'injury_recovered' },
    tone: 'bad',
  },
  {
    id: 'hospital',
    label: 'হঠাৎ বুক ধরফর আর অসুস্থতায় মিটফোর্ড হাসপাতালে ভর্তি হওয়া লাগলো! কড়া ওষুধ চলতাছে।',
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
    text: 'কয়েকটা দিন মনের ওপর দিয়া খুব ধকল গেল। একজন অভিজ্ঞ কাউন্সেলরের লগে বইসা খোলাখুলি কথা কইলা, মনটা অনেক হালকা লাগতাছে!',
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
    text: 'মিটফোর্ড হাসপাতালের অভিজ্ঞ ডাক্তার দেখাইলা। ডাক্তার নাড়ি টিপে বিশ্রাম নেওয়ার প্রেসক্রিপশন দিল আর ফি বাবদ ৫০ ট্যাকা রাখলো।',
    tone: 'good',
  };
}