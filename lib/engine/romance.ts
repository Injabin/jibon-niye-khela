export { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';
import { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';
import type { Character, Gender, Relationship } from './types';
import type { FamilyTree, FamilyMember } from './family';
import { generateId } from './character';
import { clamp } from './stats';
import type { RNG } from './rng';

export interface DatingCandidate {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  archetype: string;
  isCelebrity: boolean;
  looks: number;
  smarts: number;
}

export const FICTIONAL_CELEBRITY_ARCHETYPES = [
  'জনপ্রিয় পপ তারকা',
  'পাড়ার উদীয়মান ক্রিকেটার',
  'ইন্ডি সিনেমা পরিচালক',
  'আইটি স্টার্টআপের উদ্যোক্তা',
  'র‌্যাম্পের সুপার মডেল',
  'পুরস্কারপ্রাপ্ত ঔপন্যাসিক',
  'ডিজে ও সংগীতশিল্পী',
  'নাট্যমঞ্চের জনপ্রিয় অভিনেতা',
  'ভাইরাল ফুড ভ্লগার',
] as const;

export const TEEN_ARCHETYPES = [
  'স্কুলের সহপাঠী',
  'ডিবেট ক্লাবের দলনেতা',
  'চিত্রাঙ্কন ক্লাসের বন্ধু',
  'পাড়ার পরিচিত বন্ধু',
  'লাইব্রেরির নিয়মিত পাঠক',
  'স্কুল নাটকের প্রধান চরিত্র',
] as const;

export const ADULT_ARCHETYPES = [
  'সফটওয়্যার ইঞ্জিনিয়ার',
  'গ্রাফিক্স ডিজাইনার',
  'টং দোকানের চায়ের রসিক',
  'বিশ্ববিদ্যালয়ের প্রভাষক',
  'বুয়েটের স্থপতি',
  'ফিটনেস ট্রেইনার',
  'ব্যাংক কর্মকর্তা',
  'ফ্রিল্যান্স ফটোগ্রাফার',
] as const;

const BANNED_FULL_NAMES = new Set([
  'salman khan',
  'shah rukh khan',
  'aamir khan',
  'saif ali khan',
  'shakib al hasan',
  'mashrafe mortaza',
  'tamim iqbal',
  'mushfiqur rahim',
  'sheikh hasina',
  'khaleda zia',
  'ziaur rahman',
  'sheikh mujibur rahman',
  'humayun ahmed',
  'hero alom',
  'taylor swift',
]);

/** Generates a culturally authentic, 100% fictional name reusing the core name tables. */
export function generateFictionalName(gender: Gender, rng: RNG, usedNames?: Set<string>): string {
  let attempts = 0;
  while (attempts < 50) {
    const first = gender === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
    const last = rng.pick(SURNAMES);
    const full = `${first} ${last}`;
    if (BANNED_FULL_NAMES.has(full.toLowerCase())) {
      attempts++;
      continue;
    }
    if (!usedNames || !usedNames.has(full)) {
      usedNames?.add(full);
      return full;
    }
    attempts++;
  }
  return `${gender === 'male' ? 'Farhan' : 'Tasnim'} ${rng.pick(SURNAMES)}`;
}

/**
 * Generates a fresh dating candidate pool tailored to the character's age.
 * - Under 16: Empty pool (no dating allowed).
 * - Teen (16–17): School-age fictional classmates/crushes (strictly non-sexual, no celebrities).
 * - Adult (18+): Mix of regular professionals and 1–2 fictional celebrity archetypes.
 */
export function generateDatingPool(
  character: Character,
  rng: RNG,
  countOverride?: number
): DatingCandidate[] {
  if (character.age < 16 || !character.alive) return [];

  const isTeen = character.age < 18;
  const count = countOverride ?? (isTeen ? 3 : 4);
  const pool: DatingCandidate[] = [];
  const used = new Set(character.relationships.map((r) => r.name));

  // Determine candidate gender preference (randomized or mixed)
  for (let i = 0; i < count; i++) {
    const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
    const ageOffset = isTeen ? rng.rangeInt(-1, 1) : rng.rangeInt(-4, 6);
    const candAge = Math.max(isTeen ? 13 : 18, character.age + ageOffset);

    let isCelebrity = false;
    let archetype = '';

    if (isTeen) {
      archetype = rng.pick(TEEN_ARCHETYPES);
    } else {
      // 30% chance for an adult candidate to be a fictional celebrity
      if (rng.chance(0.3) && i === count - 1) {
        isCelebrity = true;
        archetype = rng.pick(FICTIONAL_CELEBRITY_ARCHETYPES);
      } else {
        archetype = rng.pick(ADULT_ARCHETYPES);
      }
    }

    pool.push({
      id: generateId(rng),
      name: generateFictionalName(gender, rng, used),
      gender,
      age: candAge,
      archetype,
      isCelebrity,
      looks: isCelebrity ? rng.rangeInt(75, 98) : rng.rangeInt(40, 90),
      smarts: rng.rangeInt(40, 90),
    });
  }

  return pool;
}

/** Asks out a candidate to start dating / crush relationship. */
export function askOutCandidate(
  character: Character,
  candidate: DatingCandidate,
  rng: RNG
): { ok: boolean; text: string; relationship?: Relationship } {
  if (character.age < 13) {
    return { ok: false, text: 'প্রেম করার বয়স তোমার এখনও হয় নাই!' };
  }

  // Acceptance check based on character looks, happiness and celebrity difficulty
  let acceptanceThreshold = candidate.isCelebrity ? 65 : 40;
  if (character.stats.looks > 70) acceptanceThreshold -= 15;
  if (character.reputation.fame > 60 && candidate.isCelebrity) acceptanceThreshold -= 20;

  const roll = rng.rangeInt(1, 100);
  const accepted = roll >= acceptanceThreshold;

  if (!accepted) {
    const rejectTexts = character.age < 18
      ? [
          `${candidate.name} লজ্জা পাইয়া কইলো—"আরে ধুর, আমি তো তোমারে খালি পড়ার দোস্ত ভাবি!" কইয়া দৌড়ে ভাগলো।`,
          `${candidate.name} আমতা আমতা কইরা কইলো—"সামনে এসএসসি পরীক্ষা, এহন আব্বা পিরিতের কথা শুনলে পিঠের চামড়া তুলবো!"`,
          `${candidate.name} হাসিমুখে কইলো—"আমগো বাস আইসা পড়ছে, আমি ভাগলাম!"`,
        ]
      : [
          `${candidate.name} মিষ্টি হাইসা কইলো—"দোস্ত, আমার লাইফে এহন প্রেম করার বিন্দুমাত্র টাইম নাই, সামনে অনেক কাজ!"`,
          `${candidate.name} কইলো—"তোমার লগে আমার মনের মিল হইবো না, তয় ফ্রেন্ড হিসেবে ভালো থাইকো!"`,
          `${candidate.name} মৃদু হাইসা জানাইলো যে সে অলরেডি অন্য কারো লগে সম্পর্কে আছে।`,
        ];

    character.stats.happiness = clamp(character.stats.happiness - 5);
    return { ok: false, text: rng.pick(rejectTexts) };
  }

  const isTeen = character.age < 18;
  const relationRole = isTeen ? 'crush' : 'dating';
  const newRel: Relationship = {
    id: candidate.id,
    relation: relationRole,
    name: candidate.name,
    age: candidate.age,
    alive: true,
    meter: rng.rangeInt(60, 75),
    metAge: character.age,
    romanceStage: relationRole,
    occupation: candidate.archetype,
  };

  character.relationships.push(newRel);
  character.stats.happiness = clamp(character.stats.happiness + 12);
  if (!isTeen && !character.flags.includes('has_partner')) {
    character.flags.push('has_partner');
  }

  const acceptText = isTeen
    ? `ছুটির পর ${candidate.name}-রে (${candidate.archetype}) বিউটি লাচ্ছিতে ফালুদা খাওয়ার দাওয়াত দিলা। সে একগাল হাসি দিয়া রাজি হইয়া গেল!`
    : `${candidate.name}-কে (${candidate.archetype}) নাজিরাবাজারে কাচ্চি খাইতে নিয়া গেলা। সন্ধ্যাটা দারুণ কাটলো এবং তোমরা আনুষ্ঠানিকভাবে ডেটিং শুরু করলা!`;

  character.history.push({
    age: character.age,
    text: acceptText,
    tone: 'good',
  });

  return { ok: true, text: acceptText, relationship: newRel };
}

/** Transitions a dating relationship to an official exclusive partner (girlfriend/boyfriend/partner). */
export function makeOfficialPartner(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  if (character.age < 18) {
    return { ok: false, text: 'অফিসিয়াল পার্টনার বানাইতে হইলে অন্তত ১৮ বছর বয়স হওয়া লাগবো!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.romanceStage !== 'dating' && rel.relation !== 'dating')) {
    return { ok: false, text: 'তুমি তো এই মানুষের লগে ডেটিং করতাছো না!' };
  }

  if (rel.meter < 50) {
    rel.meter = clamp(rel.meter - 5);
    return {
      ok: false,
      text: `${rel.name} কইলো—"এতো তাড়াহুড়ো কিসের মামা? আগে আরেকটু বুঝেশুনে নেই!"`,
    };
  }

  rel.relation = 'partner';
  rel.romanceStage = 'partner';
  rel.meter = clamp(rel.meter + 15);
  const happinessBoost = rng.rangeInt(8, 15);
  character.stats.happiness = clamp(character.stats.happiness + happinessBoost);

  const msg = `${rel.name}-এর লগে মন খুইলা কথা কইয়া সম্পর্কের একটা পাকাপোক্ত নাম দিলা—এহন তোমরা অফিসিয়াল প্রেমিক-প্রেমিকা!`;
  character.history.push({ age: character.age, text: msg, tone: 'good' });
  return { ok: true, text: msg };
}

/** Proposes marriage to an official partner. Requires age 18+, meter 70+, and funds for a ring. */
export function proposeMarriage(
  character: Character,
  familyTree: FamilyTree | null,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  if (character.age < 18) {
    return { ok: false, text: 'বিয়া করার বয়স ১৮ হওয়ার আগে কাজী অফিস তোমারে খেদাইয়া দিবো!' };
  }

  const existingSpouse = character.relationships.find((r) => r.relation === 'spouse' && r.alive);
  if (existingSpouse) {
    return { ok: false, text: 'ঘরে বউ/জামাই থাকতে আবার বিয়ার ধান্দা? চান্দি গরম নাকি!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.romanceStage !== 'partner' && rel.relation !== 'partner')) {
    return { ok: false, text: 'আগে তো অফিসিয়াল প্রেম করবা, হুট কইরা বিয়ার প্রস্তাব দিলে মাইর খাইবা!' };
  }

  const RING_COST = 50;
  if (character.money < RING_COST) {
    return { ok: false, text: `আংটি কেনার মতো ৳${RING_COST} পকেটে নাই, বিয়ার প্রস্তাব দিবা ক্যামনে?` };
  }

  character.money -= RING_COST;

  if (rel.meter < 65) {
    rel.meter = clamp(rel.meter - 20);
    character.stats.happiness = clamp(character.stats.happiness - 15);
    const rejectMsg = `${rel.name} আকাশ থেইকা পইড়া কইলো—"আমি এহনই বিয়া করার জন্য প্রস্তুত না, এতো ফাপড় মারিস না!"`;
    character.history.push({ age: character.age, text: rejectMsg, tone: 'bad' });
    return { ok: false, text: rejectMsg };
  }

  // Marriage succeeds!
  rel.relation = 'spouse';
  rel.romanceStage = 'spouse';
  rel.meter = clamp(rel.meter + 25);
  character.stats.happiness = clamp(character.stats.happiness + 25);
  character.flags.push('is_married');
  if (!character.flags.includes('has_spouse')) {
    character.flags.push('has_spouse');
  }

  // Add spouse to FamilyTree if available
  if (familyTree) {
    const spouseMember: FamilyMember = {
      id: rel.id,
      name: rel.name,
      gender: rng.chance(0.5) ? 'female' : 'male',
      role: 'spouse',
      age: rel.age,
      alive: true,
      bond: rel.meter,
      metAge: rel.metAge,
      lastSpentAge: -1,
    };
    familyTree.members.push(spouseMember);
  }

  const successMsg = `আলো ঝলমলে সন্ধ্যায় লালবাগ কেল্লার সামনে আংটি বাড়াইয়া ${rel.name}-কে বিয়ের প্রস্তাব দিলা! খুশিতে চোখ মুইছা সে কইলো—"হ হ, রাজি!" তোমরা বিবাহবন্ধনে আবদ্ধ হইলা!`;
  character.history.push({ age: character.age, text: successMsg, tone: 'good' });

  return { ok: true, text: successMsg };
}

/**
 * Consequence-driven cheating branch:
 * The player actively chooses to have an affair.
 * Causes severe karma penalty, potential exposure, and relationship-shattering drama.
 */
export function cheatBranch(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string; caught: boolean } {
  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.relation !== 'partner' && rel.relation !== 'spouse')) {
    return { ok: false, text: 'চিটিং করার মতো কোনো জীবনসঙ্গী তো তোমার নাই!', caught: false };
  }

  // Guaranteed heavy karma loss
  character.reputation.karma = clamp(character.reputation.karma - 30);

  // Discovery check: base 55% chance, increased by high fame
  const discoveryChance = 0.55 + (character.reputation.fame > 50 ? 0.25 : 0);
  const caught = rng.chance(discoveryChance);

  if (caught) {
    rel.meter = clamp(rel.meter - 55);
    character.stats.happiness = clamp(character.stats.happiness - 25);
    character.reputation.fame = clamp(character.reputation.fame + 15); // scandalous notoriety

    const caughtMsg = `পরকীয়ার চক্করে ধরা খাইলা! ${rel.name} তোমার ফোনে অন্য কারো রোমান্টিক টেক্সট দেইখা পুরাই তাণ্ডব চালাইলো! কান্নাকাটি আর চিৎকারে মহল্লা মাথায় তুললো!`;
    character.history.push({ age: character.age, text: caughtMsg, tone: 'bad' });

    // If meter collapsed below 20, partner dumps / divorces immediately
    if (rel.meter < 20) {
      rel.relation = 'ex';
      rel.romanceStage = 'ex';
      character.flags = character.flags.filter((f) => f !== 'is_married');
      const breakupMsg = `${rel.name} তল্পিতল্পা গুটাইয়া মুখের ওপর চাবি মাইরা কইলো—"তোর মতো বেইমানের লগে এক ছাদের নিচে আমি আর এক সেকেন্ডও থাকুম না!" সম্পর্ক চিরতরে শেষ!`;
      character.history.push({ age: character.age, text: breakupMsg, tone: 'bad' });
    }

    return { ok: true, text: caughtMsg, caught: true };
  }

  // Not caught, but internal guilt and emotional detachment linger
  rel.meter = clamp(rel.meter - 15);
  character.stats.happiness = clamp(character.stats.happiness - 10);
  const secretMsg = `চিপায় গিয়া পরকীয়া সারলা, আপাততঃ কেউ টের পায় নাই। তয় অন্তরে পাপবোধের খচখচানি কিছুতেই যাইতাছে না!`;
  character.history.push({ age: character.age, text: secretMsg, tone: 'neutral' });

  return { ok: true, text: secretMsg, caught: false };
}

/** Breaks up or divorces an active partner/spouse. Splits assets if married. */
export function breakupOrDivorce(
  character: Character,
  familyTree: FamilyTree | null,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.relation !== 'partner' && rel.relation !== 'spouse' && rel.relation !== 'dating')) {
    return { ok: false, text: 'ভেঙে দেওয়ার মতো কোনো সক্রিয় সম্পর্ক পাওয়া যায় নাই।' };
  }

  const wasSpouse = rel.relation === 'spouse';
  rel.relation = 'ex';
  rel.romanceStage = 'ex';
  const meterDrop = rng.rangeInt(30, 40);
  rel.meter = clamp(rel.meter - meterDrop);
  const happinessDrop = rng.rangeInt(10, 20);
  character.stats.happiness = clamp(character.stats.happiness - happinessDrop);

  if (wasSpouse) {
    character.flags = character.flags.filter((f) => f !== 'is_married' && f !== 'has_spouse');
    if (!character.flags.includes('divorced')) {
      character.flags.push('divorced');
    }
    // Financial settlement: lose 40% of liquid assets
    const settlement = Math.floor(character.money * 0.4);
    character.money = Math.max(0, character.money - settlement);

    if (familyTree) {
      familyTree.members = familyTree.members.filter((m) => m.id !== rel.id);
    }

    const divorceMsg = `কাজী অফিসে গিয়া ${rel.name}-এর লগে তালাকের কাগজ সই করলা। দেনমোহর আর দেনা-পাওনা বাবদ ৳${settlement} পরিশোধ কইরা তোমরা আলাদা হইয়া গেলা।`;
    character.history.push({ age: character.age, text: divorceMsg, tone: 'bad' });
    return { ok: true, text: divorceMsg };
  }

  const breakupMsg = `${rel.name}-এর লগে সম্পর্কের ইতি টানলা। দুইজনে একমত হইয়া আলাদা হইলা, তয় একলা একলা পুরান ঢাকার স্মৃতি মনটা উদাস কইরা দেয়।`;
  character.history.push({ age: character.age, text: breakupMsg, tone: 'neutral' });
  return { ok: true, text: breakupMsg };
}
