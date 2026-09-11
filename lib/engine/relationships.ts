import type { Character, Gender, Tone } from './types';
import { clamp } from './stats';
import type { RNG } from './rng';
import { generateId } from './character';
import { generateFictionalName } from './romance';

export interface RelationshipActionResult {
  ok: boolean;
  text: string;
  tone: Tone;
}

export const PEER_RELATIONS = ['classmate', 'coworker'] as const;
export type PeerRelation = (typeof PEER_RELATIONS)[number];

/** School/job peers are surfaced under ActiveMenu, not the classic relationship side. */
export function isPeerRelation(relation: string): boolean {
  return relation === 'classmate' || relation === 'coworker';
}

/** Relationships shown on the classic relationship surfaces (family, romance, friends). */
export function nonPeerRelationships(character: Character): Character['relationships'] {
  return character.relationships.filter((r) => !isPeerRelation(r.relation));
}

/** Living peers of a given kind (classmates or coworkers) for the ActiveMenu sections. */
export function peerRelationships(character: Character, kind: PeerRelation): Character['relationships'] {
  return character.relationships.filter((r) => r.relation === kind && r.alive);
}

/**
 * Universal interaction engine for any person in character.relationships:
 * Parents, Siblings, Children, Friends, Partners, Spouses, Exes.
 * Every action immediately logs an expressive event to character.history for the current year.
 */

export function spendTimeWithPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'আড্ডা দিবার মানুষ কই? গলির মোড়ে চারপাশ ঘুড়া, কে আছে দেখো — কেউ নাই!', tone: 'neutral' };

  rel.meter = clamp(rel.meter + rng.rangeInt(8, 16));
  character.stats.happiness = clamp(character.stats.happiness + rng.rangeInt(5, 12));

  const hangouts = [
    `${rel.name}-এর লগে টংয়ের দোকানে বয়া কড়া লিকারের চা খাইলা আর মন খুইলা আড্ডা দিলা।`,
    `${rel.name}-রে লইয়া পুরান ঢাকার অলিগলিতে ঘুরলা। বাকরখানি আর গরম চা খায়া দারুণ সময় কাটলো!`,
    `${rel.name}-এর লগে বইসা ক্যারাম আর লুডু খেললা। হাসাহাসি আর খুনসুটিতে জমজমাট দুপুর কাটলো!`,
    `${rel.name}-কে সাথে নিয়া বুড়িগঙ্গার পাড়ে বাতাস খাইতে গেলা। নদীর নির্মল বাতাসে প্রাণ জুড়াইয়া গেল!`,
  ];

  const text = rng.pick(hangouts);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function chatWithPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'গল্প-গুজবের মানুষ খুঁইজা পাইলাম না — চায়ের দোকানের ফাঁকা টেবিলে বসা চলবে না!', tone: 'neutral' };

  rel.meter = clamp(rel.meter + rng.rangeInt(5, 12));
  character.stats.happiness = clamp(character.stats.happiness + rng.rangeInt(4, 8));

  const chats = [
    `${rel.name}-এর লগে মহল্লার তাজা খবর আর দেশ-দুনিয়ার রাজনীতি লইয়া জমাইয়া আলাপ মারলা।`,
    `${rel.name}-এর লগে জীবনের সুখ-দুঃখের কথা কইলা। সে মন দিয়া শুনলো আর সাহস দিলো।`,
    `${rel.name}-রে মজার একখান কিচ্ছা শোনাইলা। হাসতে হাসতে তার পেটে খিল ধইরা গেল!`,
    `${rel.name}-এর লগে পুরান দিনের স্মৃতি রোমন্থন কইরা ঘণ্টার পর ঘণ্টা পার কইরা দিলা।`,
  ];

  const text = rng.pick(chats);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function complimentPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'তারিফ-শাহিনার মানুষ কই? সামনে কেউ নাই — আয়নার সামনে গিয়া নিজেরেই বলো!', tone: 'neutral' };

  rel.meter = clamp(rel.meter + rng.rangeInt(10, 18));
  character.stats.happiness = clamp(character.stats.happiness + 6);
  character.reputation.karma = clamp(character.reputation.karma + 3);

  const compliments = [
    `${rel.name}-রে কইলা—"আপনার মতো দিলখোলা আর দিলদরিয়া মানুষ পুরা ঢাকা শহরে দুইটা নাই!" সে খুশিতে পুরাই গদগদ হইয়া গেল!`,
    `${rel.name}-এর সাজগোজ আর কাপড়ের তারিফ করলা: "মাশাল্লাহ, এক্কেবারে নবাবী স্টাইল!" মুখে একগাল হাসি ফুইটা উঠলো!`,
    `${rel.name}-রে কইলা—"তোমার বুদ্ধির প্রশংসা না কইরা পারলাম না, আসল জিনিয়াস তো তুমি!" সে লজ্জা পাইয়া হাসলো।`,
  ];

  const text = rng.pick(compliments);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function insultPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'গালাগালি দিয়া তেজ দেখাইবার মানুষ কই? সামনে মানুষ নাই তো — তেজ ধরার জায়গাও নাই!', tone: 'neutral' };

  rel.meter = clamp(rel.meter - rng.rangeInt(18, 30));
  character.stats.happiness = clamp(character.stats.happiness - 8);
  character.reputation.karma = clamp(character.reputation.karma - 6);

  const insults = [
    `${rel.name}-রে সামনাসামনি খোঁচা মাইরা কইলা—"তোমার মতো ক্যাবলা মার্কা মানুষ জীবনে বড় কিছু করতে পারবো না!" তুমুল ঝগড়া লাইগা গেল!`,
    `${rel.name}-রে কড়া ভাষায় কথা শোনাইলা: "নিজের চেহারা আয়নায় দেখছো কোনোদিন?" সে রাগে গজগজ কইরা চইলা গেল!`,
    `${rel.name}-এর স্বভাব লইয়া সবার সামনে খোঁটা দিলা। সে প্রচণ্ড অপমানিত বোধ করলো!`,
  ];

  const text = rng.pick(insults);
  character.history.push({ age: character.age, text, tone: 'bad' });
  return { ok: true, text, tone: 'bad' };
}

export function askMoneyFromPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'টাকা চাইবার মানুষ কই? চারদিকে তাকাইলাম, কেউ তো সামনে নাই — খালি পায়ের ছায়া!', tone: 'neutral' };

  // Can only ask money from parents, grandparents, spouse, or wealthy partners
  const eligible = ['mother', 'father', 'grandparent', 'spouse', 'partner'].includes(rel.relation);
  if (!eligible) {
    return { ok: false, text: 'এনার কাছে ধারের আবদার বাতিল — এই ঘরের দেয়ালে খাতা-নামা লিখা দেওয়া আছে!', tone: 'neutral' };
  }

  // Acceptance depends on bond meter
  const success = rng.chance(rel.meter / 120);

  if (success) {
    const amount = rng.rangeInt(200, 1500);
    character.money += amount;
    character.stats.happiness = clamp(character.stats.happiness + 10);
    rel.meter = clamp(rel.meter - 4); // minor strain

    const text = `${rel.name}-এর কাছে আবদার কইরা হাত পাতলা। সে একটু বকা দিয়াও হাসিমুখে পকেট থেইকা ৳${amount} তুইলা দিল!`;
    character.history.push({ age: character.age, text, tone: 'good' });
    return { ok: true, text, tone: 'good' };
  }

  rel.meter = clamp(rel.meter - 8);
  character.stats.happiness = clamp(character.stats.happiness - 6);
  const rejectLines = [
    `${rel.name} মুখ বাঁকা কইরা কইলো—"টাকা কি গাছে ধরে? খালি হাত পাতা স্বভাব বাদ দিয়া কাম-কাজে নামো!" এক পয়সাও দিল না!`,
    `${rel.name} চোখ রাঙাইয়া কইলো—"পড়াশোনা আর রুজির খবর নাই, খালি ট্যাকা ওড়ানোর ধান্ধা! ভাগো এহন থিকা!"`,
  ];
  const text = rng.pick(rejectLines);
  character.history.push({ age: character.age, text, tone: 'bad' });
  return { ok: false, text, tone: 'bad' };
}

export function giveMoneyToPerson(
  character: Character,
  relationshipId: string,
  amount: number
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'টাকা দিবার মানুষ কই? হাত পসারবার আগে সামনে কে দাঁড়াইয়া আছে দেখো!', tone: 'neutral' };

  if (character.money < amount) {
    return { ok: false, text: `${rel.name}-রে ৳${amount} হাদিয়া দিবার বাসনা, মাগার পকেটে কড়িও জোড়া লাগতাছে না! আগে রোজগারের চাকা ঘোরান!`, tone: 'neutral' };
  }

  character.money -= amount;
  rel.meter = clamp(rel.meter + Math.min(25, Math.floor(amount / 50)));
  character.reputation.karma = clamp(character.reputation.karma + 6);
  character.stats.happiness = clamp(character.stats.happiness + 6);

  const text = `${rel.name}-রে নিজের পকেট থেইকা ৳${amount} হাদিয়া দিলা। সে দুই হাত তুইলা প্রানভরে দোয়া করলো!`;
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function giveGiftToPerson(
  character: Character,
  relationshipId: string,
  rng: RNG
): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'তোহফা দিবার মানুষ খুঁইজা পাইলাম না — চকবাজারে মিষ্টির ডাব্বা নিয়া মুড়া ফ্যালবো!', tone: 'neutral' };

  const GIFT_COST = 300;
  if (character.money < GIFT_COST) {
    return { ok: false, text: `তোহফা কিনবার ৳${GIFT_COST} জোগাড় হয় নাই — দোকানের বাইর থাইকা সুবাস নিয়া খুশি নও!`, tone: 'neutral' };
  }

  character.money -= GIFT_COST;
  rel.meter = clamp(rel.meter + rng.rangeInt(14, 22));
  character.stats.happiness = clamp(character.stats.happiness + 8);
  character.reputation.karma = clamp(character.reputation.karma + 4);

  const gifts = [
    `${rel.name}-রে চকবাজারের খাঁটি জাফরানি চমচম আর এক হাড়ি মিষ্টি তোহফা দিলা। খুশিতে চোখ চকচক কইরা উঠলো!`,
    `${rel.name}-কে খান্দানি আতর আর বকুল ফুলের তাজা মালা উপহার দিলা। সুবাসে মনটা জুড়াইয়া গেল!`,
    `${rel.name}-রে সুন্দর একখান রেশমি চাদর উপহার দিলা। সে পরম স্নেহে গায়ে জড়াইয়া ধন্যবাদ জানাইলো!`,
  ];

  const text = rng.pick(gifts);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

/**
 * Child-raising actions (init.md M5 #6). Only valid against a live `child`
 * relationship. Every action logs an expressive history entry at the current age.
 */

function requireLiveChild(character: Character, relationshipId: string): { rel?: Character['relationships'][number]; err?: RelationshipActionResult } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { err: { ok: false, text: 'সন্তানের খোঁজে ঘর-দালান চষা, মাগার অস্তিত্বই দূরে — রুমাল ঝাড়লাম, খালি ধুলো উইড়লো!', tone: 'neutral' } };
  if (rel.relation !== 'child') return { err: { ok: false, text: 'এই কারবার খালি নিজের সন্তানের লগে করতে পারবা!', tone: 'neutral' } };
  return { rel };
}

export function praiseChild(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const { rel, err } = requireLiveChild(character, relationshipId);
  if (err || !rel) return err ?? { ok: false, text: 'বাহবা দিবার সন্তান কই? আয়নার সামনে নিজের তারিফ কইরা দেখো — এ-ও একখান থেরাপি!', tone: 'neutral' };

  rel.meter = clamp(rel.meter + rng.rangeInt(12, 20));
  character.stats.happiness = clamp(character.stats.happiness + 8);
  character.reputation.karma = clamp(character.reputation.karma + 3);

  const praises = [
    `${rel.name}রে লইয়া মুরুব্বিদের সামনে বাহবা দিলা—"আমার পোলা/মাইয়া এক্কেবারে আমার লাহান, ভবিষ্যতের বড় মানুষ হইবো!" ছোট্ট মুখে লজ্জা মাখা হাসি ফুইটলো।`,
    `${rel.name}-এর হাতে হাতে নম্বর দেইখা কইলা—"বাহ, তোর লাইগা হইতেছে ঠিকই, জুইস জুইস!" বাচ্চাডা গর্বে বুক তুলা কইরা চইলা গেল!`,
    `${rel.name}-রে আদর করি কইলা—"তুই মহল্লার সবচে ভালো পোলাপাইন, মা-বাপে গর্ব করতাম!" খুশিতে সে ওম বুকের মাঝে আনলো।`,
  ];

  const text = rng.pick(praises);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function buyChildTreat(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const { rel, err } = requireLiveChild(character, relationshipId);
  if (err || !rel) return err ?? { ok: false, text: 'মিষ্টি কিনবার সন্তান কই? ঘরে নাই তো — দোকানের সামনে গিয়া নিজেই খাইয়া ফেলো!', tone: 'neutral' };

  const TREAT_COST = 150;
  if (character.money < TREAT_COST) {
    return { ok: false, text: `ছোট্ট মিষ্টি জিনিসের ৳${TREAT_COST} পকেটে নাই, রাস্তার ফুচকাওয়ালাও ধার দিবো না!`, tone: 'neutral' };
  }

  character.money -= TREAT_COST;
  rel.meter = clamp(rel.meter + rng.rangeInt(10, 16));
  character.stats.happiness = clamp(character.stats.happiness + 10);

  const treats = [
    `${rel.name}-রে হাতে ধরাইয়া লালবাগ জাদুঘরের সামনে ফুচকা-বেলপুরি আর কাচ্চি বিরিয়ানি কিনা দিলা! খাইতে খাইতে মুখ ভরতি হইয়া কইলো—"আব্বা/আম্মা, তুমিই সেরা!"`,
    `${rel.name}-এর খুশিতে পুরান ঢাকার মিষ্টান্ন ভান্ডারে গিয়া রসমালাই আর ছানার গজা কিনা দিলা। সে চোখ বন্ধ করি মজাও করলো, মজাও করলো!`,
    `${rel.name}-রে স্টার কিডসের খেলনার দোকানে নিয়া ট্রেনের সেট কিনা দিলা। খেলার ঘরে সে ব্যস্ত, তুমি খুশি!`,
  ];

  const text = rng.pick(treats);
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

export function disciplineChild(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const { rel, err } = requireLiveChild(character, relationshipId);
  if (err || !rel) return err ?? { ok: false, text: 'শাসন-ভয়ে সন্তান নাই — কী শাড়া কি পেড়ে, শাসনের তেজ কারে দেখাইবো?', tone: 'neutral' };

  // Discipline is a gamble: it usually corrects behaviour (karma up, child's
  // smarts improve) but a rebellious streak can strain the bond.
  const rebellious = rel.meter < 40 && rng.chance(0.35);
  if (rebellious) {
    rel.meter = clamp(rel.meter - rng.rangeInt(12, 20));
    character.stats.happiness = clamp(character.stats.happiness - 8);
    character.reputation.karma = clamp(character.reputation.karma - 2);
    const text = `${rel.name}রে শাসন করতে গিয়া সে ঠোঁট ফুলাইয়া কইলো—"তোমারে চাই না!" আর দৌড় দিয়া দাদির পাশে গিয়া লুকাইলো! শাসন উল্টো ফল দিলো!`;
    character.history.push({ age: character.age, text, tone: 'bad' });
    return { ok: true, text, tone: 'bad' };
  }

  rel.meter = clamp(rel.meter - rng.rangeInt(2, 6));
  character.stats.smarts = Math.min(100, character.stats.smarts + 3);
  character.reputation.karma = clamp(character.reputation.karma + 3);
  character.stats.happiness = clamp(character.stats.happiness + 4);

  const text = `${rel.name}রে কড়া শাসন করলা—"ফাইফরমাশে নাই রে, আগে খাতা খুলো!" একটু মুচমুচে হইলেও কথা শুনলো, এহন পড়বার টেবিলে নাইমা বইলো।`;
  character.history.push({ age: character.age, text, tone: 'neutral' });
  return { ok: true, text, tone: 'neutral' };
}

export function giveChildAllowance(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const { rel, err } = requireLiveChild(character, relationshipId);
  if (err || !rel) return err ?? { ok: false, text: 'ঘরে তো সন্তান-সন্ধানই নাই — কেডার পকেট খরচ দিবা? ফ্যানের বাতাসে ট্যাকা উড়ে!', tone: 'neutral' };

  const amount = rng.rangeInt(50, 200);
  if (character.money < amount) {
    return { ok: false, text: 'পকেটে ছোলনা-পাইসা নাই, খরচ আর বাজার টেইকা সন্তানরে খোরাক দেওয়া কঠিন!', tone: 'neutral' };
  }

  character.money -= amount;
  rel.meter = clamp(rel.meter + rng.rangeInt(8, 14));
  character.stats.happiness = clamp(character.stats.happiness + 6);

  const text = `${rel.name}রে পকেট খরচ বাবদ ৳${amount} ধরাইয়া দিলা। আনন্দে লাফাইয়া সে কইলো—"ঢং, এহন ফুচকাওয়ালার হিসাব আমি নিজেই টানিমু!"`;
  character.history.push({ age: character.age, text, tone: 'good' });
  return { ok: true, text, tone: 'good' };
}

/**
 * Peer population: classmates (school years) and coworkers (job years), the
 * BitLife-style daily contacts that can be befriended or dated later.
 */

/** Realistic working-class job ids handed to random coworkers (C, jobId). */
const COWORKER_JOB_IDS = [
  'job_retail',
  'job_service',
  'job_office',
  'job_tech',
  'job_trade',
  'job_finance',
] as const;

function peerAge(character: Character, rng: RNG, spread: number): number {
  return Math.max(5, Math.min(100, character.age + rng.rangeInt(-spread, spread)));
}

function addPeer(character: Character, rng: RNG, relation: 'classmate' | 'coworker', spread: number, used: Set<string>): void {
  const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
  character.relationships.push({
    id: generateId(rng),
    relation,
    name: generateFictionalName(gender, rng, used, character.religion),
    age: peerAge(character, rng, spread),
    alive: true,
    meter: rng.rangeInt(35, 60),
    metAge: character.age,
    health: rng.rangeInt(70, 95),
    happiness: rng.rangeInt(55, 90),
    lastMetAge: character.age,
    ...(relation === 'coworker' ? { jobId: rng.pick(COWORKER_JOB_IDS) } : {}),
  });
}

/** Ensures the character has the given number of living classmates (school years). */
export function seedClassmates(character: Character, rng: RNG, count: number = 3): number {
  const existing = character.relationships.filter((r) => r.relation === 'classmate' && r.alive).length;
  const needed = Math.max(0, count - existing);
  if (needed === 0) return 0;
  const used = new Set(character.relationships.map((r) => r.name));
  for (let i = 0; i < needed; i++) addPeer(character, rng, 'classmate', 2, used);
  return needed;
}

/** Ensures the character has the given number of living coworkers (employed years). */
export function seedCoworkers(character: Character, rng: RNG, count: number = 3): number {
  const existing = character.relationships.filter((r) => r.relation === 'coworker' && r.alive).length;
  const needed = Math.max(0, count - existing);
  if (needed === 0) return 0;
  const used = new Set(character.relationships.map((r) => r.name));
  for (let i = 0; i < needed; i++) addPeer(character, rng, 'coworker', 6, used);
  return needed;
}

/** Escalates a classmate/coworker into a proper friendship (BitLife-style). */
export function befriendPeer(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'বন্ধু বানাইবার মানুষ কই? ক্লাসে-অফিসে তো সবাই দূর দূর বাঁচতাছে!', tone: 'neutral' };
  if (rel.relation !== 'classmate' && rel.relation !== 'coworker') {
    return { ok: false, text: 'ওই মানুষজনের লগে তো তোমার ক্লাস-অফিসের আলাপই নাই — বন্ধুত্ব করবার আগে আগে চেনা লাগে মিয়া!', tone: 'neutral' };
  }

  rel.meter = clamp(rel.meter + rng.rangeInt(14, 24));
  character.stats.happiness = clamp(character.stats.happiness + 7);

  if (rel.meter >= 70) {
    rel.relation = 'friend';
    const text = `${rel.name}-র লগে খাতির এমন পাকাপোক্ত হইলো যে সে এহন তোমার পাক্কা দোস্ত (friend)! স্কুল-অফিসের মানুষ, তবু মন খোলা বন্ধুত্ব!`;
    character.history.push({ age: character.age, text, tone: 'good' });
    return { ok: true, text, tone: 'good' };
  }

  const text = `${rel.name}-র লগে মিলামিশা আগাইছে, তয় বন্ধু বানানো এত সহজ না। আরেকটু আহামরি আদর-যত্ন লাগবো (খাতির বারে)।`;
  character.history.push({ age: character.age, text, tone: 'neutral' });
  return { ok: true, text, tone: 'neutral' };
}

/** Asks a classmate/coworker out; on high enough meter the peer becomes dating. */
export function askOutPeer(character: Character, relationshipId: string, rng: RNG): RelationshipActionResult {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'প্রেমের ফরমায়েশ করবি কারে? সামনে তো মানুষই নাই — প্রেমের বাজারে কেউ বিক্রি নাই!', tone: 'neutral' };
  if (rel.relation !== 'classmate' && rel.relation !== 'coworker') {
    return { ok: false, text: 'একে তো অরকারে প্রেমের ধান্দা করলা না!', tone: 'neutral' };
  }
  if (character.age < 16) {
    return { ok: false, text: 'এত কচি বয়সে প্রেম-ভালোবাসার চাওআ-পাওআ নাই বাপু!', tone: 'neutral' };
  }

  if (rel.meter >= 60) {
    rel.relation = 'dating';
    rel.romanceStage = 'dating';
    character.stats.happiness = clamp(character.stats.happiness + 12);
    const text = `${rel.name}-র কাছে মন খুলা কইলা—"তুমিতো এতোদিন ধইরা আমার মনের মানুষ!" সে মুচকি হাইসা রাজি হইলো। চুপিচুপি প্রেম শুরু হইলো!`;
    character.history.push({ age: character.age, text, tone: 'good' });
    return { ok: true, text, tone: 'good' };
  }

  rel.meter = clamp(rel.meter - rng.rangeInt(3, 9));
  character.stats.happiness = clamp(character.stats.happiness - 5);
  const text = `${rel.name} লাজে কইলো—"এই ব্যাপারে আমার কোনো আগ্রহ নাই, তুমি আরেক জনের জন্য নাইলে খাতির রাখো!" কইরার পরে চুপচাপ থাকার সিদ্ধান্ত নিলা।`;
  character.history.push({ age: character.age, text, tone: 'bad' });
  return { ok: false, text, tone: 'bad' };
}
