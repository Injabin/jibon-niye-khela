export { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';
import {
  MUSLIM_MALE_NAMES,
  MUSLIM_FEMALE_NAMES,
  MUSLIM_SURNAMES,
  HINDU_MALE_NAMES,
  HINDU_FEMALE_NAMES,
  HINDU_SURNAMES,
} from '@/content/names';
import type { Character, Gender, Relationship, Religion, WeddingStyle } from './types';
import { birthChild, type FamilyTree, type FamilyMember } from './family';
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
export function generateFictionalName(
  gender: Gender,
  rng: RNG,
  usedNames?: Set<string>,
  religion?: Religion
): string {
  const malePool = religion === 'hinduism' ? HINDU_MALE_NAMES : MUSLIM_MALE_NAMES;
  const femalePool = religion === 'hinduism' ? HINDU_FEMALE_NAMES : MUSLIM_FEMALE_NAMES;
  const surnamePool = religion === 'hinduism' ? HINDU_SURNAMES : MUSLIM_SURNAMES;

  let attempts = 0;
  while (attempts < 50) {
    const first = gender === 'male' ? rng.pick(malePool) : rng.pick(femalePool);
    const last = rng.pick(surnamePool);
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
  return `${gender === 'male' ? (religion === 'hinduism' ? 'অয়ন' : 'ফারহান') : (religion === 'hinduism' ? 'প্রমা' : 'তাসনিম')} ${rng.pick(surnamePool)}`;
}

/**
 * Generates a fresh dating candidate pool tailored to the character's age.
 * - Heterosexual alignment: male player dates females, female player dates males.
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

  // Heterosexual candidate matching based on character gender
  const candidateGender: Gender = character.gender === 'male' ? 'female' : 'male';

  for (let i = 0; i < count; i++) {
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
      name: generateFictionalName(candidateGender, rng, used, character.religion),
      gender: candidateGender,
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

  // Acceptance check based on character looks, happiness, wealth, and celebrity difficulty
  let acceptanceThreshold = candidate.isCelebrity ? 65 : 45;
  if (character.stats.looks > 70) acceptanceThreshold -= 15;
  if (character.stats.looks < 35) acceptanceThreshold += 20;
  if (character.money > 2000) acceptanceThreshold -= 10;
  if (character.money < 100) acceptanceThreshold += 10;
  if (character.reputation.fame > 60 && candidate.isCelebrity) acceptanceThreshold -= 20;
  if (character.reputation.karma < 30) acceptanceThreshold += 15;

  const roll = rng.rangeInt(1, 100);
  const accepted = roll >= acceptanceThreshold;

  if (!accepted) {
    const rejectTexts = character.age < 18
      ? [
          `${candidate.name} মুখ বাঁকা কইরা কইলো—"তোর মতো ক্যাবলা মার্কা পোলার লগে প্রেম? জীবনেও না, ভাগ!"`,
          `${candidate.name} লজ্জা পাইয়া কইলো—"আরে ধুর, আমি তো তোমারে খালি পড়ার দোস্ত ভাবি!" কইয়া দৌড়ে ভাগলো।`,
          `${candidate.name} আমতা আমতা কইরা কইলো—"সামনে এসএসসি পরীক্ষা, এহন আব্বা পিরিতের কথা শুনলে পিঠের চামড়া তুলবো!"`,
          `${candidate.name} হাসিমুখে কইলো—"আমগো স্কুল বাস আইসা পড়ছে, আমি ভাগলাম!"`,
        ]
      : [
          `${candidate.name} তাচ্ছিল্য কইরা কইলো—"পকেটে ফুটা কড়ি নাই, আইসা পড়ছে প্রেম করতে! আগে নিজের পায়ে দাঁড়াও মিয়া!"`,
          `${candidate.name} মুখ ঝামটা দিয়া কইলো—"হালায় দেখতে মাস্তানের লাহান, তোর লগে প্রেম করুম না, সোজা রাস্তা মাপো!"`,
          `${candidate.name} মিষ্টি হাইসা কইলো—"দোস্ত, আমার লাইফে এহন প্রেম করার বিন্দুমাত্র টাইম নাই, সামনে অনেক কাজ!"`,
          `${candidate.name} কইলো—"তোমার লগে আমার মনের মিল হইবো না, তয় ফ্রেন্ড হিসেবে ভালো থাইকো!"`,
          `${candidate.name} মৃদু হাইসা জানাইলো যে সে অলরেডি অন্য কারো লগে সম্পর্কে আছে।`,
        ];

    character.stats.happiness = clamp(character.stats.happiness - 5);
    return { ok: false, text: rng.pick(rejectTexts) };
  }

  const isTeen = character.age < 18;
  const relationRole = isTeen ? 'crush' : 'dating';

  // Defensive deduplication check: update existing record if already in relationships
  const existingIndex = character.relationships.findIndex(
    (r) => r.id === candidate.id || r.name.toLowerCase() === candidate.name.toLowerCase()
  );

  let targetRel: Relationship;
  if (existingIndex !== -1) {
    targetRel = character.relationships[existingIndex];
    targetRel.relation = relationRole;
    targetRel.romanceStage = relationRole;
    targetRel.meter = clamp(targetRel.meter + 15);
    targetRel.alive = true;
  } else {
    targetRel = {
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
    character.relationships.push(targetRel);
  }

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

  return { ok: true, text: acceptText, relationship: targetRel };
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

/** Proposes marriage to an official partner. Requires age 18+, meter 65+, and funds for the chosen wedding style. */
export function proposeMarriage(
  character: Character,
  familyTree: FamilyTree | null,
  relationshipId: string,
  rng: RNG,
  style: WeddingStyle = 'kazi_office'
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
  const WEDDING_COST: Record<WeddingStyle, number> = {
    kazi_office: 2_000,
    community_center: 8_000,
  };
  const totalCost = RING_COST + WEDDING_COST[style];
  if (character.money < totalCost) {
    return {
      ok: false,
      text: `বিয়ার আংটি ও অনুষ্ঠানের খরচ মোট ৳${totalCost.toLocaleString()} লাগবো, পকেটে আছে মাত্র ৳${character.money.toLocaleString()}। আগে রোজগার করো!`,
    };
  }

  character.money -= totalCost;

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
  rel.meter = clamp(rel.meter + rng.rangeInt(20, 30));
  character.stats.happiness = clamp(character.stats.happiness + 25);
  character.flags.push('is_married');
  if (!character.flags.includes('has_spouse')) {
    character.flags.push('has_spouse');
  }

  // Add spouse to FamilyTree if available
  if (familyTree) {
    const spouseGender: Gender = character.gender === 'male' ? 'female' : 'male';
    const spouseMember: FamilyMember = {
      id: rel.id,
      name: rel.name,
      gender: spouseGender,
      role: 'spouse',
      age: rel.age,
      alive: true,
      bond: rel.meter,
      metAge: rel.metAge,
      lastSpentAge: -1,
    };
    familyTree.members.push(spouseMember);
  }

const roleLabel = character.gender === 'male' ? 'বউ (স্ত্রী)' : 'বর (স্বামী)';
  const successMsg =
    style === 'community_center'
      ? `আলো ঝলমলে সন্ধ্যায় লালবাগ কেল্লার সামনে আংটি বাড়াইয়া ${rel.name}-কে বড়সড় প্রস্তাব দিলা! খুশিতে সে রাজি হইলো। পুরান ঢাকার কমিউনিটি সেন্টারে শত-গোশত অতিথির সামনে গান-বাদ্য, নাচ-গান ও মহাআনন্দে বড়সড় বারা (walima) সহ বিয়া সম্পন্ন হইলো! সে তোমার ${roleLabel} হইলো!`
      : `আলো ঝলমলে সন্ধ্যায় লালবাগ কেল্লার সামনে আংটি বাড়াইয়া ${rel.name}-কে বিয়ের প্রস্তাব দিলা! খুশিতে চোখ মুইছা সে কইলো—"হ হ, রাজি!" পরদিন কাজী অফিসে হাজির হইয়া আনুষ্ঠানিকভাবে নিকাহ সম্পন্ন হইলো এবং সে তোমার ${roleLabel} হইলো!`;
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

/** Takes partner or crush on a date to authentic Dhakaiya spots. */
export function dateCandidateOrPartner(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'কাউকে খুঁজে পাওয়া যায় নাই!' };

  const DATE_COST = 200;
  if (character.money < DATE_COST) {
    return { ok: false, text: `পকেটে ডেট মারার মতো ৳${DATE_COST} নাই! অন্তত ফুচকা খাওয়ার ট্যাকা তো লাগবো!` };
  }

  character.money -= DATE_COST;
  const meterGain = rng.rangeInt(8, 16);
  rel.meter = clamp(rel.meter + meterGain);
  character.stats.happiness = clamp(character.stats.happiness + 10);

  const dateSpots = [
    `${rel.name}-রে নিয়া নাজিরাবাজারের বিউটি লাচ্ছিতে ফালুদা আর কাচ্চি খাইতে গেলা। পেট আর মন দুইটাই ভইরা গেল!`,
    `সন্ধ্যায় লালবাগ কেল্লার সবুজ ঘাসে বইসা ${rel.name}-এর লগে প্রাণখুইলা সুখ-দুঃখের গল্প করলা।`,
    `হাতিরঝিল ওয়াটার ট্যাক্সিতে শীতল বাতাসে ভাইসা ভাইসা ${rel.name}-এর হাত ধইরা রোমান্টিক সময় কাটাইলা।`,
    `চকবাজারের শাহী জিলাপি আর বেইলি রোডের ঝাল ঝাল ফুচকা খাওয়াইয়া ${rel.name}-এর মন পুরাই জয় কইরা নিলা!`,
  ];

  const msg = rng.pick(dateSpots);
  character.history.push({ age: character.age, text: msg, tone: 'good' });
  return { ok: true, text: msg };
}

/** Gives a gift to a romantic partner, crush, or spouse. */
export function giveGiftToPartner(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel) return { ok: false, text: 'উপহার দেওয়ার মতো কাউকে পাওয়া যায় নাই!' };

  const GIFT_COST = 400;
  if (character.money < GIFT_COST) {
    return { ok: false, text: `উপহার কেনার মতো ৳${GIFT_COST} পকেটে নাই!` };
  }

  character.money -= GIFT_COST;
  const meterGain = rng.rangeInt(15, 25);
  rel.meter = clamp(rel.meter + meterGain);
  character.stats.happiness = clamp(character.stats.happiness + 8);

  const gifts = [
    `${rel.name}-রে খাঁটি টাঙ্গাইলের জামদানি শাড়ি উপহার দিলা। সে খুশিতে পুরাই গদগদ হইয়া গেল!`,
    `${rel.name}-রে চকবাজারের খান্দানি সুগন্ধি আতর আর বকুল ফুলের মালা উপহার দিলা।`,
    `${rel.name}-রে এক বাক্স গরম গরম জাফরানি চমচম আর বাখরখানি তোহফা দিলা। মুখে মিষ্টি হাসি ফুইটা উঠলো!`,
  ];

  const msg = rng.pick(gifts);
  character.history.push({ age: character.age, text: msg, tone: 'good' });
  return { ok: true, text: msg };
}

/** Tries to have a baby with a committed partner or spouse. Deterministic through RNG and family tree. */
export function tryForBaby(
  character: Character,
  familyTree: FamilyTree | null,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string; babyMember?: FamilyMember } {
  if (character.age < 18) {
    return { ok: false, text: 'বাচ্চা নেওয়ার মতো বয়স এখনও তোমার হয় নাই!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || (rel.relation !== 'spouse' && rel.relation !== 'partner')) {
    return { ok: false, text: 'বাচ্চা নেওয়ার জন্য একজন বিবাহিত সঙ্গী বা জীবনসঙ্গী দরকার!' };
  }

  if (rel.age > 48 || character.age > 55) {
    return { ok: false, text: 'বয়সের কারণে প্রাকৃতিক উপায়ে সন্তান হওয়া অসম্ভব বললেই চলে।' };
  }

  // Fertility check based on health and randomness
  let fertility = 0.65;
  if (character.stats.health < 40) fertility -= 0.2;
  if (rel.meter < 40) fertility -= 0.15;

  const success = rng.chance(fertility);
  if (!success) {
    character.stats.happiness = clamp(character.stats.happiness - 5);
    const failMsg = `ডাক্তার সাব কইলো—"এহনও সুখবর নাই, দুশ্চিন্তা বাদ দিয়া পুষ্টিকর খাবার খান আর দোয়া করেন।"`;
    return { ok: false, text: failMsg };
  }

  // Baby is born!
  character.stats.happiness = clamp(character.stats.happiness + 25);
  const EXPENSE = 350;
  character.money = Math.max(0, character.money - EXPENSE);

  let newMember: FamilyMember | undefined;
  if (familyTree) {
    const updatedTree = birthChild(familyTree, character, rng);
    familyTree.members = updatedTree.members;
    familyTree.edges = updatedTree.edges;
    newMember = familyTree.members[familyTree.members.length - 1];
  }

  const defaultBabyName = character.religion === 'hinduism'
    ? (rng.chance(0.5) ? 'অয়ন' : 'প্রমা')
    : (rng.chance(0.5) ? 'আবরার' : 'মাইশা');
  const childName = newMember ? newMember.name : defaultBabyName;
  const childId = newMember ? newMember.id : generateId(rng);

  const childRel: Relationship = {
    id: childId,
    relation: 'child',
    name: childName,
    age: 0,
    alive: true,
    meter: 85,
    metAge: character.age,
    romanceStage: undefined,
    occupation: 'কোলের শিশু',
  };

  // Ensure no duplicate in relationships
  if (!character.relationships.some((r) => r.id === childRel.id)) {
    character.relationships.push(childRel);
  }

  if (!character.flags.includes('has_child')) {
    character.flags.push('has_child');
  }

  const birthBlessing = character.religion === 'islam' ? 'আলহামদুলিল্লাহ!' : 'হরিবোল!';
  const birthMsg = `${birthBlessing} তোমার আর ${rel.name}-এর কোল আলো কইরা ফুটফুটে সন্তান "${childName}" দুনিয়ায় আইলো! মহল্লায় গরম গরম জিলাপি আর মিষ্টি বিলানো হইলো!`;
  character.history.push({ age: character.age, text: birthMsg, tone: 'good' });

  return { ok: true, text: birthMsg, babyMember: newMember };
}

/** Calls or texts an ex-partner with authentic Dhakaiya outcomes. */
export function callOrTextEx(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || rel.relation !== 'ex') {
    return { ok: false, text: 'কাউকে খুঁজে পাওয়া যায় নাই!' };
  }

  const roll = rng.rangeInt(1, 100);
  let text = '';
  let tone: 'good' | 'bad' | 'neutral' | 'funny' = 'neutral';

  if (roll <= 40) {
    rel.meter = clamp(rel.meter - 10);
    character.stats.happiness = clamp(character.stats.happiness - 8);
    const insults = [
      `${rel.name} ফোন তুইল্যাই ঝাড়ি মারলো—"তোর লজ্জা-শরম বলতে কিচ্ছু নাই? এতো রাতে ফোন দিয়া জ্বালাস ক্যান? নিজের চরকায় তেল দে, ভাগ!" কইয়া খটাস কইরা লাইন কাইটা দিল!`,
      `${rel.name}-রে টেক্সট পাঠাইলা। সে উত্তর দিলো—"আর একটা মেসেজ দিলে ভাইব্রাদার দিয়া পিটামু, ব্লক খাইলি!"`,
      `${rel.name} বিরক্তি নিয়া কইলো—"মামা, নতুন জীবনে ভালো আছি। আমারে ফোন দিয়া আর ঘাটাবা না!"`,
    ];
    text = rng.pick(insults);
    tone = 'bad';
  } else if (roll <= 65) {
    rel.meter = clamp(rel.meter + 12);
    character.stats.happiness = clamp(character.stats.happiness + 10);
    const nost = [
      `${rel.name} কান্নাভেজা গলায় কইলো—"তোর কথা খুব মনে পড়তেছিল... মাগার আমগো কপালে সুখ সইলো না।" দুইজনে আধা ঘণ্টা পুরান দিনের স্মৃতি লইয়া কথা কইলা।`,
      `${rel.name} নরম সুরে কইলো—"কেমন আছিস রে? সেই লালবাগের বিউটি লাচ্ছির কথা এহনও ভুলি নাই..." মনটা হালকা হইলো।`,
    ];
    text = rng.pick(nost);
    tone = 'good';
  } else if (roll <= 85) {
    character.stats.happiness = clamp(character.stats.happiness - 5);
    text = `${rel.name} ঠান্ডা গলায় কইলো—"অতীত অতীতই। আমার লাইফে এহন অন্য মানুষ আছে, কাজের কথা ছাড়া কোনো ফালতু আলাপ করবা না।"`;
    tone = 'neutral';
  } else {
    rel.meter = clamp(rel.meter + 15);
    character.stats.happiness = clamp(character.stats.happiness + 15);
    text = `${rel.name} কিছুক্ষণ চুপ থাইকা মুচকি হাইসা কইলো—"আইচ্ছা শোন, কাইলকা বিকেলে নাজিরাবাজারে কাচ্চি খাইতে আসিস, সামনাসামনি কথা কমু নে।"`;
    tone = 'funny';
  }

  character.history.push({ age: character.age, text, tone });
  return { ok: true, text };
}

/** Secret rendezvous with an ex-partner. */
export function hookupWithEx(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || rel.relation !== 'ex') {
    return { ok: false, text: 'কাউকে খুঁজে পাওয়া যায় নাই!' };
  }

  const hasCommitted = character.relationships.some(
    (r) => (r.relation === 'spouse' || r.relation === 'partner') && r.alive
  );

  if (hasCommitted) {
    character.reputation.karma = clamp(character.reputation.karma - 20);
    if (rng.chance(0.4)) {
      character.stats.happiness = clamp(character.stats.happiness - 20);
      const msg = `প্রাক্তন ${rel.name}-এর লগে চিপায় গোপন আড্ডা মারতে গেছিলা, মাগার পাড়ার মানুষ দেইখা তোমার বর্তমান সঙ্গীর কানে বিচার লাগাইয়া দিলো! তুলকালাম কাণ্ড শুরু হইলো!`;
      character.history.push({ age: character.age, text: msg, tone: 'bad' });
      return { ok: false, text: msg };
    }
  }

  rel.meter = clamp(rel.meter + 10);
  character.stats.happiness = clamp(character.stats.happiness + 12);
  const successMsg = `প্রাক্তন ${rel.name}-এর লগে গোপন ডেটে গিয়া পুরান ঢাকার মোড়ে ফুচকা খাইলা আর জমাইয়া আড্ডা দিলা। পুরান টান আবার চাঙ্গা হইয়া উঠলো!`;
  character.history.push({ age: character.age, text: successMsg, tone: 'good' });
  return { ok: true, text: successMsg };
}

/** Attempts to rekindle love and reunite with an ex. */
export function begGetBackTogether(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || rel.relation !== 'ex') {
    return { ok: false, text: 'কাউকে খুঁজে পাওয়া যায় নাই!' };
  }

  let chance = (rel.meter / 100) * 0.5;
  if (character.stats.looks > 75) chance += 0.15;
  if (character.money > 3000) chance += 0.1;

  const accepted = rng.chance(Math.min(0.8, Math.max(0.1, chance)));

  if (accepted) {
    rel.relation = character.age < 18 ? 'crush' : 'dating';
    rel.romanceStage = rel.relation;
    rel.meter = clamp(rel.meter + 25);
    character.stats.happiness = clamp(character.stats.happiness + 25);
    if (!character.flags.includes('has_partner') && character.age >= 18) {
      character.flags.push('has_partner');
    }
    const winMsg = `${rel.name}-এর হাত ধইরা ব্যাকুল হইয়া ক্ষমা চাইলা। সে একগাল হাইসা তোমারে বুকে টাইন্যা নিলো—"যাহ, মাফ কইরা দিলাম!" সম্পর্ক আবার নতুন কইরা জোড়া লাগলো!`;
    character.history.push({ age: character.age, text: winMsg, tone: 'good' });
    return { ok: true, text: winMsg };
  }

  rel.meter = clamp(rel.meter - 15);
  character.stats.happiness = clamp(character.stats.happiness - 15);
  character.stats.looks = clamp(character.stats.looks - 5);
  const failMsg = `${rel.name} মুখ ঘুরাইয়া তাচ্ছিল্যের হাসি দিয়া কইলো—"যে পাতা ঝইড়া গেছে, হেইডা গাছে আর জোড়া লাগে না মিয়া! নিজের সম্মান বজায় রাইখা ভাগো!" পুরাই বেইজ্জত হইলা!`;
  character.history.push({ age: character.age, text: failMsg, tone: 'bad' });
  return { ok: false, text: failMsg };
}

/** Insults an ex-partner to settle scores. */
export function insultEx(
  character: Character,
  relationshipId: string,
  rng: RNG
): { ok: boolean; text: string } {
  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || rel.relation !== 'ex') {
    return { ok: false, text: 'কাউকে খুঁজে পাওয়া যায় নাই!' };
  }

  rel.meter = clamp(rel.meter - 25);
  character.reputation.karma = clamp(character.reputation.karma - 10);
  const insults = [
    `প্রাক্তন ${rel.name}-রে সামনাসামনি দেইখা মুখ ভেটকাইয়া কইলা—"তোর মতো গিরগিটির লগে প্রেম কইরা জীবনের সবচেয়ে বড় ভুল করছিলাম!" সে রাগে ফুঁইসা উঠলো!`,
    `${rel.name}-রে ফেসবুকে খোঁচা মাইরা পোস্ট দিলা: "কিছু মানুষের স্বভাব কোনোদিন বদলায় না!" পুরা কমেন্ট বক্সে গ্যাঞ্জাম লাইগা গেল!`,
  ];
  const msg = rng.pick(insults);
  character.history.push({ age: character.age, text: msg, tone: 'bad' });
  return { ok: true, text: msg };
}
