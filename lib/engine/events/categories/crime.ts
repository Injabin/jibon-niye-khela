/**
 * Crime & law system engine (DESIGN.md §5.6, init.md M5 #2).
 *
 * A petty → grand → organized ladder with escalating risk/reward. Whether a
 * crime pays or sprays is decided on the harness of karma: the cleaner the
 * reputation, the higher the odds of getting caught — a moral universe, not
 * a mechanical farm. Arrests write `criminalRecord` entries and flag `in_jail`
 * (jail time counts down on the yearly tick per DESIGN.md §5.6). Outcomes are
 * stylized text, never how-to detail (DESIGN.md §11).
 */

import type { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import type { Character, Tone } from '@/lib/engine/types';

export interface CrimeDef {
  id: string;
  label: string;
  tier: 'petty' | 'grand' | 'organized';
  /** Reward in coins if not caught. */
  reward: [number, number];
  /** Jail sentence in years if caught. */
  sentence: [number, number];
  /** Base arrest probability before karma shifts it. */
  risk: number;
}

/** Abstracted crime ladder — flavor, not how-to (DESIGN.md §5.6, §11). */
export const CRIMES: readonly CrimeDef[] = [
  { id: 'shoplift', label: 'দোকানে ছিঁচকে চুরি', tier: 'petty', reward: [20, 80], sentence: [0, 1], risk: 0.2 },
  { id: 'vandalism', label: 'বাসে হাফ পাস নিয়া গ্যাঞ্জাম', tier: 'petty', reward: [30, 120], sentence: [0, 1], risk: 0.25 },
  { id: 'pickpocket', label: 'সদরঘাটের চিপা গলিতে পকেটমারি', tier: 'petty', reward: [40, 150], sentence: [0, 2], risk: 0.3 },
  { id: 'auto_theft', label: 'মোটরবাইক ও রিকশার পার্টস চুরি', tier: 'grand', reward: [500, 2_000], sentence: [1, 3], risk: 0.45 },
  { id: 'burglary', label: 'চকবাজারের গুদামে সিঁধেল চুরি', tier: 'grand', reward: [800, 3_000], sentence: [1, 4], risk: 0.5 },
  { id: 'fraud', label: 'নকল দলিলের জমি জালিয়াতি', tier: 'grand', reward: [1_000, 5_000], sentence: [2, 5], risk: 0.4 },
  { id: 'heist', label: 'তাঁতিবাজারের গহনার দোকানে ডাকাতি', tier: 'organized', reward: [5_000, 20_000], sentence: [3, 7], risk: 0.65 },
  { id: 'racket', label: 'পরিবহন সিন্ডিকেটের তোলাবাজি', tier: 'organized', reward: [10_000, 30_000], sentence: [4, 8], risk: 0.6 },
];

export interface CrimeOutcome {
  arrested: boolean;
  reward: number;
  jailYears: number;
  text: string;
  tone: Tone;
}

function hasFlag(character: Character, flag: string): boolean {
  return character.flags.includes(flag);
}

function setFlag(character: Character, flag: string): void {
  if (!hasFlag(character, flag)) character.flags.push(flag);
}

export function isJailed(character: Character): boolean {
  return hasFlag(character, 'in_jail');
}

/** Karma shifts the arrest odds: a cleaner record means higher risk of a lesson. */
export function arrestChanceFor(crime: CrimeDef, karma: number): number {
  const shifted = crime.risk + (karma - 50) * 0.005;
  return Math.min(0.95, Math.max(0.02, shifted));
}

export function commitCrime(character: Character, rng: RNG, crimeId: string): CrimeOutcome {
  if (!character.alive) {
    return { arrested: false, reward: 0, jailYears: 0, text: 'গোরস্তানের নিচে পা নাই, অপরাধ করবো কিসের? ভূতের ভাজা সপ্ন দেইখো না!', tone: 'bad' };
  }
  const crime = CRIMES.find((c) => c.id === crimeId);
  if (!crime) {
    return { arrested: false, reward: 0, jailYears: 0, text: 'এমন অপরাধের কথা পুলিশও শুনে নাই!', tone: 'neutral' };
  }
  if (isJailed(character)) {
    return { arrested: false, reward: 0, jailYears: 0, text: 'তুমি তো অলরেডি জেলের ঘানি টানতাছো (already inside), বাইরে আসবা ক্যামনে?', tone: 'neutral' };
  }

  const caught = rng.chance(arrestChanceFor(crime, character.reputation.karma));
  if (caught) {
    const sentenceYears = rng.rangeInt(crime.sentence[0], crime.sentence[1]);
    character.criminalRecord.push({
      offense: crime.id,
      age: character.age,
      sentenceYears,
      served: false,
    });
    setFlag(character, 'criminal_record');
    setFlag(character, 'in_jail');
    applyStatEffects(character, { karma: -6 });
    return {
      arrested: true,
      reward: 0,
      jailYears: sentenceYears,
      text: sentenceYears > 0
        ? `${crime.label} করতে গিয়া ধরা খাইলা! পুলিশ ধইরা চালান দিল, ম্যাজিস্ট্রেট তোমারে ${sentenceYears} বছরের সশ্রম কারাদণ্ড দিয়া জেলে পাঠাইলো!`
        : `${crime.label} করতে গিয়া হাতেনাতে ধরা খাইলা! পুলিশ কান ধইরা চরম ধমক দিয়া ছাড়লো, তয় খাতায় নাম উইঠা গেল!`,
      tone: 'bad',
    };
  }

  const reward = rng.rangeInt(crime.reward[0], crime.reward[1]);
  applyStatEffects(character, { money: reward, karma: -3 });
  return {
    arrested: false,
    reward,
    jailYears: 0,
    text: `${crime.label} এক্কেরে পানির লাহান সফল! সটকে পইড়া পকেট গরম করলা, লাভ হইলো ৳${reward.toLocaleString()}!`,
    tone: 'funny',
  };
}

/**
 * Yearly maintenance while jailed: count the remaining sentence down on the
 * newest unserved entry; on release, mark it served and flag a fresh start.
 */
export function tickCrime(character: Character): CrimeOutcome | null {
  if (!isJailed(character)) return null;
  const entry = [...character.criminalRecord].reverse().find((e) => !e.served);
  if (!entry) {
    // Inconsistent state: the flag says jailed but no unserved entry remains.
    character.flags = character.flags.filter((f) => f !== 'in_jail');
    return null;
  }
  entry.sentenceYears -= 1;
  if (entry.sentenceYears <= 0) {
    entry.served = true;
    entry.sentenceYears = 0;
    character.flags = character.flags.filter((f) => f !== 'in_jail');
    setFlag(character, 'gone_straight');
    return { arrested: false, reward: 0, jailYears: 0, text: 'সাজার মেয়াদ শেষ! জেলের ফটক খুইলা তোমারে খালাস দিল। দুনিয়ায় আইসা বুক ভইরা নিশ্বাস নিলা!', tone: 'good' };
  }
  return {
    arrested: false,
    reward: 0,
    jailYears: entry.sentenceYears,
    text: `${entry.offense} অপরাধের জেল এখনো ${entry.sentenceYears} বছর বাকি রইছে। জেলের ডাল-ভাত খাইয়া দিন কাটতাছে।`,
    tone: 'neutral',
  };
}