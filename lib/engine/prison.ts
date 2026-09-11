/**
 * Prison lifecycle engine (D — Phase 3.5).
 *
 * While a character is flagged `in_jail`, the CrimeTab offers jail actions —
 * bail/plea deal, gym, library, fights, good behaviour (parole path) and an
 * escape attempt — each costing one yearly action slot in the store. Release
 * is always serviced through `releaseFromJail` so the flag, the criminal
 * record entry, and the `gone_straight` flag stay consistent with the yearly
 * tick in crime.ts.
 */

import type { RNG } from './rng';
import { applyStatEffects } from './stats';
import type { Character, Tone } from './types';

export interface PrisonActionResult {
  ok: boolean;
  text: string;
  tone: Tone;
  /** True when the action resulted in early release from jail. */
  released?: boolean;
}

const ESCAPE_CHANCE = 0.25;
const PLEA_DEAL_TIMES = 400; // fine per remaining year

function hasFlag(character: Character, flag: string): boolean {
  return character.flags.includes(flag);
}

function setFlag(character: Character, flag: string): void {
  if (!hasFlag(character, flag)) character.flags.push(flag);
}

export function isJailed(character: Character): boolean {
  return hasFlag(character, 'in_jail');
}

/** Newest unserved criminal-record entry (the sentence being served now). */
function currentEntry(character: Character) {
  if (!isJailed(character)) return undefined;
  return [...character.criminalRecord].reverse().find((e) => !e.served);
}

export function remainingSentence(character: Character): number {
  const entry = currentEntry(character);
  return entry ? Math.max(0, entry.sentenceYears) : 0;
}

/** Consistent release: clears the flag, marks the entry served, flags a fresh start. */
function releaseFromJail(character: Character): void {
  const entry = currentEntry(character);
  if (entry) {
    entry.served = true;
    entry.sentenceYears = 0;
  }
  character.flags = character.flags.filter((f) => f !== 'in_jail');
  setFlag(character, 'gone_straight');
}

function notJailed(): PrisonActionResult {
  return { ok: false, text: 'কোনো জেল খাটা তো দূরে থাক, তুই তো এইডাই ধপাস কইরা মুক্ত মানুষ!', tone: 'neutral' };
}

/** জামিন / আপসে ফাইন: pay the sum of the remaining sentence to walk out. */
export function prisonBail(character: Character): PrisonActionResult {
  if (!isJailed(character)) return notJailed();
  const remaining = remainingSentence(character);
  if (remaining <= 0) {
    releaseFromJail(character);
    return { ok: true, text: 'জেলের ডাক্তারি পরীক্ষা শেষে প্রকাশ হইলো তোমার সাজার আর বাকি নাই — আজই খালাস!', tone: 'good', released: true };
  }
  const cost = remaining * PLEA_DEAL_TIMES;
  if (character.money < cost) {
    return {
      ok: false,
      text: `জামিনের টাকা দিবার হাল নাই — আপসে ফাইন লাগবে ৳${cost.toLocaleString()}, তোর গাঁটে আছে ৳${character.money.toLocaleString()}।`,
      tone: 'bad',
    };
  }
  character.money -= cost;
  applyStatEffects(character, { karma: -3 });
  releaseFromJail(character);
  return {
    ok: true,
    text: `অ্যাডভোকেট উকিলের যোগ্যতা কাজে লাগাইয়া ৳${cost.toLocaleString()} জামিন-আপস মীমাংসা করলা। রেজিস্ট্রারের টেবিলে সই দিলেই ফটক খুলা গেল!`,
    tone: 'good',
    released: true,
  };
}

/** জেলের আখড়া: build muscle on prison grounds. */
export function prisonGym(character: Character): PrisonActionResult {
  if (!isJailed(character)) return notJailed();
  applyStatEffects(character, { health: 8, happiness: 5 });
  const text = 'জেলের আঙিনার আখড়ায় ডান্ড-বেলচা চালাইয়া বুক ফুলাইলা! কয়েদিদের মধ্যে তোর শারীরিক আলাদা পৌঁছস্ কেনা হইলো!';
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

/** জেলের লাইব্রেরি: read the few books the ward offers. */
export function prisonLibrary(character: Character): PrisonActionResult {
  if (!isJailed(character)) return notJailed();
  applyStatEffects(character, { smarts: 8, happiness: 3 });
  const text = 'জেলের ক্ষীণ লাইব্রেরিতে আইনকানুন ও গল্পের বই ঘাঁটার জোরে জেলেও মগজের শান কমা নাই!';
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

/** জেলের ভেতর ঝগড়া-মারামারি: a coin-flip brawl inside the barracks. */
export function prisonFight(character: Character, rng: RNG): PrisonActionResult {
  if (!isJailed(character)) return notJailed();
  if (rng.chance(0.5)) {
    applyStatEffects(character, { happiness: 8 });
    const text = 'জেলের ক্যাম্পের মোড়ল কয়েদির লগে পাঞ্জার হাতকড়ার ভেতরে জবরদস্ত চড় থাপ্পড়। ধুন্ধুমার পইড়ে কিন্তু তোরই জিত হইলো!';
    character.history.push({ age: character.age, text, tone: 'good' });
    return { ok: true, text, tone: 'good' };
  }
  applyStatEffects(character, { health: -10, happiness: -8 });
  const text = 'জেলের মারামারিতে দির্ঘ ক্যাপ্টেনের কাঁইচা মারের আঘাতে গাল ফুলাইয়া গেল! হারিসের কাছে কঠোর পাঠ শিখলা।';
  character.history.push({ age: character.age, text, tone: 'bad' });
  return { ok: true, text, tone: 'bad' };
}

/** সদ্ব্যবহার / প্যারোল: good conduct shaves a year off; reaching zero paroles out. */
export function prisonGoodBehavior(character: Character, rng: RNG): PrisonActionResult {
  if (!isJailed(character)) return notJailed();
  const entry = currentEntry(character);
  if (!entry || entry.sentenceYears <= 0) {
    return { ok: false, text: 'সাজার মেয়াদ তো শেষই হইছে, ভালো ব্যবহার দেখাইয়া আর কী ফল পাবা?', tone: 'neutral' };
  }

  if (!rng.chance(0.7)) {
    const text = 'এ বছর ভালো ব্যবহার দিলেও জেল সুপার যথাযথ নোট করে রাখলো না। সাজাহ্রাসের জন্য আবার চেষ্টা করতে হবে।';
    character.history.push({ age: character.age, text, tone: 'neutral' });
    return { ok: true, text, tone: 'neutral' };
  }

  entry.sentenceYears = Math.max(0, entry.sentenceYears - 1);
  if (entry.sentenceYears === 0) {
    setFlag(character, 'gone_straight');
    releaseFromJail(character);
    const text = 'ভালো আচরণের পুরস্কারে প্যারোল বোর্ড তোমার সাজা উপেক্ষা করলো! জেলের ফটক খুললো, দুনিয়ায় ফিরা আইলাস!';
    character.history.push({ age: character.age, text, tone: 'good' });
    return { ok: true, text, tone: 'good', released: true };
  }

  const text = `জেলের ডাইরি খাতায় "ভালো কয়েদি" লেখা ধরলো! সাজা কমাইয়া গেল এক বছর — এহন আরো ${entry.sentenceYears} বছর বাকি।`;
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

/** পলায়ন: a desperate, risky escape bid. */
export function prisonEscape(character: Character, rng: RNG): PrisonActionResult {
  if (!isJailed(character)) return notJailed();

  if (!rng.chance(ESCAPE_CHANCE)) {
    const entry = currentEntry(character);
    if (entry) entry.sentenceYears += 2;
    applyStatEffects(character, { health: -8, happiness: -10 });
    const text = 'মুরগি-পালানোর লা-ইয়ার খাতা জুড়ে রাতের বেলা দেয়াল টপকানোর চেষ্টা! আলোতে ধরা পইড়া জেলরক্ষীরা ধইরা আবার সেলে ফিরাইয়া দিলো — সাজায় আরো ২ বছর যোগ হইলো!';
    character.history.push({ age: character.age, text, tone: 'bad' });
    return { ok: true, text, tone: 'bad' };
  }

  releaseFromJail(character);
  if (!hasFlag(character, 'criminal_record')) setFlag(character, 'criminal_record');
  applyStatEffects(character, { fame: 25, happiness: 20, karma: -5 });
  const text = 'বরফ-ঠান্ডা নারী ডোবা নাই — পলায়নের ছলে এক গভীর রাতের কাজ সফল! জেলের বাইরে বাইরে গা ঢাকিয়া পালাইয়া গেলা। হইলো মহল্লার গল্পের খোরাক!';
  character.history.push({ age: character.age, text, tone: 'funny' });
  return { ok: true, text, tone: 'funny', released: true };
}