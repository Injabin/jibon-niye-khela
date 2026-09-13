export { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';

export {
  MUSLIM_MALE_NAMES,
  MUSLIM_FEMALE_NAMES,
  MUSLIM_SURNAMES,
  HINDU_MALE_NAMES,
  HINDU_FEMALE_NAMES,
  HINDU_SURNAMES,
} from '@/content/names';
import {
  MUSLIM_MALE_NAMES,
  MUSLIM_FEMALE_NAMES,
  MUSLIM_SURNAMES,
  HINDU_MALE_NAMES,
  HINDU_FEMALE_NAMES,
  HINDU_SURNAMES,
} from '@/content/names';
import type { Character, Gender, LifeEventDef, Relationship, Religion, WeddingStyle } from './types';
import { birthChild, type FamilyTree, type FamilyMember } from './family';
import { generateId } from './character';
import { clamp } from './stats';
import { RNG } from './rng';

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
    return { ok: false, text: 'ইশ্! এতো কচি বয়সে প্রেমের ফরমায়েশ? নিজের প্যান্টের নাটাই আগে সামলাও!' };
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
      lastMetAge: character.age,
      romanceStage: relationRole,
      occupation: candidate.archetype,
      // Vitals derived from the candidate's generated stats so no extra RNG
      // draws perturb deterministic callers of askOutCandidate.
      health: clamp(candidate.looks + 5, 55, 100),
      happiness: clamp(candidate.smarts + 8, 55, 100),
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
    return { ok: false, text: '১৮ বছরের আগে অফিসিয়াল লাইন? কাজী সাব আগে থাইকাই তোরে খেদাইয়া দেওয়ার হুশিয়ারি দিছে!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.romanceStage !== 'dating' && rel.relation !== 'dating')) {
    return { ok: false, text: 'আগে তো এই মানুষটার লগে ডেটিংয়ের গাছটা লাগাও — তারপর পাকা ফলে লোভ দেখাও!' };
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
      text: `আংটি, দাওয়াত আর আনুষ্ঠানিকতায় মোটে ৳${totalCost.toLocaleString()} খরচ লাগবো, মাগার পকেটে আছে খালি ৳${character.money.toLocaleString()}! আগে রোজগারের ধান্দা ধরো মিয়া!`,
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
    return { ok: false, text: 'পরকীয়া সারবার মতো মানুষ কই? আগে একটা প্রেম মনে-প্রাণে ঠিক করা শেখো!', caught: false };
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
    return { ok: false, text: 'ভাঙবার মতো সম্পর্কই নাই — কাঁচা হাতে পুকুরে ছাপড়া মারার লাহান অবস্থা!' };
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
  if (!rel) return { ok: false, text: 'ডেট মারবার মানুষ কই? ফুলের বাগানে মৌমাছির মতো কাউকে তো রেডি পাওয়া গেলো না!' };

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
  if (!rel) return { ok: false, text: 'উপহার দিবার মতো প্রিয়জন কই? হাতে মিষ্টির ডাব্বা নিয়া কিসের অপেক্ষা!' };

  const GIFT_COST = 400;
  if (character.money < GIFT_COST) {
    return { ok: false, text: `উপহার কেনার ট্যাকা ৳${GIFT_COST} পকেটে নাই — নাড়ু না দেখাই যাওয়াই ভালো!` };
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
    return { ok: false, text: 'এহন বাচ্চা লইবার বয়স না — নিজেই তো দই-চিনি খাওয়ার পাত্র!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId && r.alive);
  if (!rel || (rel.relation !== 'spouse' && rel.relation !== 'partner')) {
    return { ok: false, text: 'গোয়ালঘরে বাছুর নাই তো! বাচ্চার খবর পাইতে আগে ঘরে নূতন বউ বা জামাই জোটানো লাগবো!' };
  }

  if (rel.age > 48 || character.age > 55) {
    return { ok: false, text: 'বয়সের কাঁটা পাহাড় ডিঙাইছে — প্রাকৃতিক উপায়ে সন্তানের খবর এখন খালি গল্পের পাতায় পাওয়া যায়!' };
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
    lastMetAge: character.age,
    romanceStage: undefined,
    occupation: 'কোলের শিশু',
    health: 95,
    happiness: 80,
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
    return { ok: false, text: 'প্রাক্তনের নম্বর খুঁইজা পাইলাম না — ফোনবুকে তো খালি নামটাই জ্বলে, মানুষ নাই!' };
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
    return { ok: false, text: 'প্রাক্তনের লগে চিপা মিলামিশার টেক্কা? কেডা? ফোনবুকে তো এই নামের মানুষই নাই!' };
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
    return { ok: false, text: 'ক্ষমা চাইবার মানুষটার খোঁজে ঢাকা চষা গেল, মাগার কেউ পাওয়া গেলো না — সম্পর্কের বাসরঘর ফাঁকা!' };
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
    return { ok: false, text: 'গালাগালি মাইরা দিমু? আগে কাউকে দিস না — প্রাক্তন নামের সড়ক এই পাড়ায়ই নাই!' };
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

// ---------------------------------------------------------------------------
// Part F: romance drama — NPC infidelity and multi-romance detection.
// Detection is deterministic through the shared RNG stream; when it fires, a
// `drama`-tagged LifeEventDef is injected into the year and its choice is
// routed through resolveRomanceDramaChoice instead of stat-only resolution.
// ---------------------------------------------------------------------------

export const MULTI_ROMANCE_YEARS = 3;
export const MULTI_CAUGHT_ANNUAL_CHANCE = 0.3;

/** Multi-caught choice (I): the explicitly chosen partner stays 35% of the time. */
export const MULTI_CAUGHT_STAY_CHANCE = 0.35;

/** Cost of an NPC-proposed kazi-office wedding (ring + ceremony ~ proposeMarriage). */
export const MARRIAGE_COST = 2_050;

/** Bonds a proposal partner must hold for the initiative to be plausible. */
export const EXCLUSIVE_PROPOSAL_METER = 50;
export const MARRIAGE_PROPOSAL_METER = 65;

export type RomanceDrama =
  | { kind: 'npc_affair'; relationshipIds: string[] }
  | { kind: 'multi_caught'; relationshipIds: string[] };

/** Committed romantic ties the player currently holds (alive only). */
export function activeRomances(character: Character): Relationship[] {
  return character.relationships.filter(
    (r) => r.alive && (r.relation === 'dating' || r.relation === 'partner' || r.relation === 'spouse'),
  );
}

/** Highest-bond living official partner; used to resolve partner-initiated wedding proposals. */
function bestAlivePartner(character: Character): Relationship | undefined {
  return character.relationships
    .filter((r) => r.alive && r.relation === 'partner')
    .sort((a, b) => b.meter - a.meter)[0];
}

/** Highest-bond living dating partner; used to resolve exclusivity proposals. */
function bestAliveDating(character: Character): Relationship | undefined {
  const rels = character.relationships.filter((r) => r.alive && r.relation === 'dating');
  rels.sort((a, b) => b.meter - a.meter);
  return rels.find((r) => r.meter >= EXCLUSIVE_PROPOSAL_METER) ?? rels[0];
}

/** Splits a partner/spouse into an ex, keeping marriage flags consistent. */
function severRomance(character: Character, rel: Relationship): void {
  const wasSpouse = rel.relation === 'spouse';
  rel.relation = 'ex';
  rel.romanceStage = 'ex';
  rel.meter = clamp(rel.meter - 15);
  if (wasSpouse) {
    character.flags = character.flags.filter((f) => f !== 'is_married' && f !== 'has_spouse');
    if (!character.flags.includes('divorced')) {
      character.flags.push('divorced');
    }
  }
}

/**
 * Annual romance-drama roll (Part F). Mutates `character` for juggling
 * tracking (illicit.sinceAge) and for silent NPC affairs; returns a drama
 * descriptor when a forced question event must be shown this year.
 */
export function rollRomanceDrama(character: Character, rng: RNG): RomanceDrama | null {
  const partners = activeRomances(character);

  // NPC infidelity: a long-neglected partner is far more likely to stray.
  for (const rel of partners) {
    const affairChance = rel.meter < 35 ? 0.12 : 0.04;
    if (!rng.chance(affairChance)) continue;
    rel.affairCount = (rel.affairCount ?? 0) + 1;
    const discovered = rel.meter < 35 ? rng.chance(0.65) : rng.chance(0.5);
    if (!discovered) {
      // Kept secret: the relationship quietly sours, no drama this year.
      rel.meter = clamp(rel.meter - 8);
      continue;
    }
    return { kind: 'npc_affair', relationshipIds: [rel.id] };
  }

  // Multi-romance: juggling 2+ partners for 3 straight years risks exposure.
  const multiplePartners = partners.length >= 2;
  if (multiplePartners) {
    if (!character.illicit) character.illicit = {};
    if (character.illicit.sinceAge == null) character.illicit.sinceAge = character.age;
    const yearsJuggling = character.age - character.illicit.sinceAge;
    if (yearsJuggling >= MULTI_ROMANCE_YEARS && rng.chance(MULTI_CAUGHT_ANNUAL_CHANCE)) {
      return { kind: 'multi_caught', relationshipIds: partners.map((p) => p.id) };
    }
  } else if (character.illicit) {
    character.illicit.sinceAge = undefined;
  }

  return null;
}

/**
 * Applies the chosen outcome of a `drama`-tagged event (Parts F/H/I).
 * Mirrors resolveEventChoice (mutates + appends history) but performs
 * relationship surgery the generic stat-only resolver cannot express.
 * Returns a descriptor carrying side-effects the store must apply with its
 * familyTree in hand (e.g. a newly added spouse), or null.
 */
export function resolveRomanceDramaChoice(
  character: Character,
  event: LifeEventDef,
  choiceId: string,
  rng?: RNG,
  familyTree?: FamilyTree | null
): { spouseId?: string; childBirthed?: boolean } | null {
  const drama = event.drama;
  if (!drama) return null;
  const byId = (id: string): Relationship | undefined =>
    character.relationships.find((r) => r.id === id);

  if (drama.action === 'npc_affair') {
    const rel = byId(drama.relationshipIds[0]);
    if (!rel) return null;

    if (choiceId === 'affair_forgive') {
      rel.meter = clamp(rel.meter + 15);
      character.stats.happiness = clamp(character.stats.happiness - 10);
      character.reputation.karma = clamp(character.reputation.karma + 6);
      character.history.push({
        age: character.age,
        text: `আহা, বুকের জ্বালা নামাইয়া ${rel.name}-রে ক্ষমা কইরা বুকে টানলা। তয় ভাঙা কাচ আবার জোড়া লাগে না—বিশ্বাসের ফাটলটা থাকলোই, আলতো হাতে টিকাইয়া রাখবার চেষ্টা শুরু করলা।`,
        tone: 'neutral',
      });
    } else if (choiceId === 'affair_end') {
      severRomance(character, rel);
      character.stats.happiness = clamp(character.stats.happiness - 12);
      character.reputation.karma = clamp(character.reputation.karma - 2);
      character.history.push({
        age: character.age,
        text: `${rel.name} চোখের জল আটকাইয়া নিজের থলে-বিছানাপত্র গোছাইয়া বাড়ি ছাড়লো। বিশ্বাস ভাঙা ভালোবাসা আবার জোড়া লাগে না—সম্পর্কের দলিল চিরদিনের মতো ছিঁড়া গেলো।`,
        tone: 'bad',
      });
    } else if (choiceId === 'affair_revenge') {
      rel.meter = clamp(rel.meter - 25);
      character.stats.happiness = clamp(character.stats.happiness - 15);
      character.reputation.karma = clamp(character.reputation.karma - 18);
      character.history.push({
        age: character.age,
        text: `এক চোখের বদলে দুই চোখ! তুমিও গোপনে অরেকজনের লগে ঘোরাঘুরি শুরু করলা—অন্তর্যামী রাগে পুরা সংসার অন্ধকার। প্রতিশোধ মিঠা, তয় বিষ্ঠার দাম বেশি!`,
        tone: 'bad',
      });
    }
    return null;
  }

  if (drama.action === 'multi_caught') {
    const rels = drama.relationshipIds
      .map(byId)
      .filter((r): r is Relationship => Boolean(r));
    if (rels.length === 0) return null;

    const pickSide = (chosenId: string) => {
      const chosen = rels.find((r) => r.id === chosenId);
      if (!chosen) return;
      const stays = rng ? rng.chance(MULTI_CAUGHT_STAY_CHANCE) : false;
      const severedNames: string[] = [];
      for (const r of rels) {
        if (r.id === chosen.id) continue;
        severedNames.push(r.name);
        severRomance(character, r);
      }
      character.stats.happiness = clamp(character.stats.happiness - 12);
      character.reputation.karma = clamp(character.reputation.karma - 5);
      if (stays) {
        chosen.meter = clamp(chosen.meter + 10);
        character.reputation.karma = clamp(character.reputation.karma + 6);
        character.history.push({
          age: character.age,
          text: `${chosen.name}-রে বাছাই করার পর ভাগ্যের দয়ায় পাশে পাইলা! বাকিগুলো (${severedNames.join(' ও ')}) কান্না-কাটাকাটি কইরা বের হইয়া গেলো। এবার হাতে একটা মানুষ, পরানে একটা ভালোবাসা—এইডাই অঙ্গীকার!`,
          tone: 'neutral',
        });
      } else {
        severedNames.push(chosen.name);
        severRomance(character, chosen);
        character.history.push({
          age: character.age,
          text: `${severedNames.join(' ও ')}—ধরা পড়ার পর বাছাই করেও কারো ভালোবাসা টাকা দিয়া কিনতে পারলা না। হেয়াই তোরে ছাইড়া গেলো, আর যারা থাইকা দিলো তারাও বের হইয়া গেলো। পুরা হৃদয় একদিনে খালি!`,
          tone: 'bad',
        });
      }
    };

    if (choiceId === 'multi_stay_one') {
      pickSide(rels[0].id);
    } else if (choiceId === 'multi_stay_two') {
      pickSide(rels[1]?.id ?? rels[0].id);
    } else if (choiceId === 'multi_lie') {
      character.reputation.karma = clamp(character.reputation.karma - 18);
      character.stats.happiness = clamp(character.stats.happiness - 6);
      const names = rels.map((r) => r.name);
      for (const r of rels) severRomance(character, r);
      character.history.push({
        age: character.age,
        text: `জীবনের মোস্ট এক্সপেনসিভ মিছাটা ধরা খাইয়া গেলো! ${names.join(' ও ')}—এক সাইতেই দুই পেয়ে পইড়া খইলো, বাসীর চরম অপমান আর খানাপিনার পয়সা-কড়ি সহ সব ভেস্তা গেলো। মিছা বলতে আবার কিচ্ছু নাই—সত্য কইবার সাহসও নাই!`,
        tone: 'bad',
      });
    }
    return null;
  }

  if (drama.action === 'classmate_interest' || drama.action === 'coworker_interest') {
    resolvePeerInterestChoice(character, drama.relationshipIds[0], choiceId, drama.action);
    return null;
  }

  if (drama.action === 'exclusive_proposal') {
    const rel =
      byId(drama.relationshipIds[0]) ??
      bestAliveDating(character);
    if (!rel) return null;
    if (choiceId === 'ex_accept') {
      rel.relation = 'partner';
      rel.romanceStage = 'partner';
      rel.meter = clamp(rel.meter + 15);
      const boost = clamp((rng ?? new RNG(1)).rangeInt(8, 15) + 3);
      character.stats.happiness = clamp(character.stats.happiness + boost);
      if (!character.flags.includes('has_partner')) character.flags.push('has_partner');
      character.history.push({
        age: character.age,
        text: `${rel.name} কৈলো—"এখন থেকে শুধু তুইই আর আমি!" হাতে হাত রাখলো, পাড়ার চায়ের দোকানেও দুইজনের গল্প শোনা হইলো। অফিসিয়ালি প্রেমিক-প্রেমিকা!`,
        tone: 'good',
      });
    } else {
      rel.meter = clamp(rel.meter - 8);
      character.stats.happiness = clamp(character.stats.happiness - 4);
      character.history.push({
        age: character.age,
        text: `"বেয়াদব!"—${rel.name} রাগে কৈলো আর সামনে না থাইকা চইলা গেলো। সম্পর্ক টিকে থাকলো, তয় পকেটে একটা খচখচানি রইলো।`,
        tone: 'neutral',
      });
    }
    return null;
  }

  if (drama.action === 'marriage_proposal') {
    const rel = byId(drama.relationshipIds[0]) ?? bestAlivePartner(character);
    if (!rel) return null;
    if (choiceId === 'mr_accept') {
      character.money = Math.max(0, character.money - MARRIAGE_COST);
      rel.relation = 'spouse';
      rel.romanceStage = 'spouse';
      rel.meter = clamp(rel.meter + (rng ?? new RNG(1)).rangeInt(15, 25));
      character.stats.happiness = clamp(character.stats.happiness + 25);
      character.flags.push('is_married');
      if (!character.flags.includes('has_spouse')) character.flags.push('has_spouse');
      const spouseLabel = character.gender === 'male' ? 'বউ (স্ত্রী)' : 'বর (স্বামী)';
      const rites =
        character.religion === 'hinduism'
          ? 'হলুদ, সিঁদুর আর মালা বদলের পর বিধিমতে সাত পাকে বেঁধে গেলো সংসার!'
          : 'পরদিন কাজী অফিসে হাজির হইয়া আনুষ্ঠানিকভাবে নিকাহ সম্পন্ন হইলো!';
      character.history.push({
        age: character.age,
        text: `হঠাৎ প্রস্তাব আসলো—আর তুমি হাসিমুখে রাজি! ${rites} ${rel.name} এখন তোমার ${spouseLabel}।`,
        tone: 'good',
      });
      return { spouseId: rel.id };
    }
    // Declined: the would-be spouse is hurt, the bond takes a real hit.
    rel.meter = clamp(rel.meter - 25);
    character.stats.happiness = clamp(character.stats.happiness - 12);
    character.history.push({
      age: character.age,
      text: `${rel.name} আধখোলা মুখে কৈলো—"তাহলে... ঠিক আছে।" কথাটার গভীরে বাসরঘরের স্বপ্ন ভাইঙ্গা গেলো, আর তোর লগে দূরত্ব যেন আরেকটু বইড়া গেলো।`,
      tone: 'bad',
    });
    return null;
  }

  if (drama.action === 'single_askout') {
    const rel = byId(drama.relationshipIds[0]);
    if (!rel || rel.relation === 'dating' || rel.relation === 'partner' || rel.relation === 'spouse') return null;
    if (choiceId === 'askout_yes') {
      rel.relation = 'dating';
      rel.romanceStage = 'dating';
      rel.meter = clamp(rel.meter + 8);
      character.stats.happiness = clamp(character.stats.happiness + 12);
      character.history.push({
        age: character.age,
        text: `${rel.name} স্বপ্নভরা চোখে রাজি হইলো — এতদিনের চেনা-জানা বন্ধুত্ব এবার প্রেমের আখরে লিখা হইলো! সমাজ চাইতে পারে না, তয় মন তো শাসন মানে না।`,
        tone: 'good',
      });
      return null;
    }
    rel.meter = clamp(rel.meter - 12);
    character.stats.happiness = clamp(character.stats.happiness - 5);
    character.history.push({
      age: character.age,
      text: `${rel.name} জোর কইরা হাসিলো — "আরে না না, রসিকতাই করছিলাম, ভাবিস না!" তয় ওই দিন থেকে আড্ডার মাঝে কেমন যেন এক ফ্যাকাসে পর্দা।`,
      tone: 'neutral',
    });
    return null;
  }

  if (drama.action === 'partner_baby_proposal') {
    const rel = byId(drama.relationshipIds[0]) ?? bestAlivePartner(character);
    if (!rel) return null;
    if (choiceId === 'baby_yes') {
      const result = tryForBaby(character, familyTree ?? null, rel.id, rng ?? new RNG(1));
      if (result.ok) return { childBirthed: true };
      character.history.push({ age: character.age, text: result.text, tone: 'neutral' });
      return null;
    }
    rel.meter = clamp(rel.meter - 6);
    character.stats.happiness = clamp(character.stats.happiness - 5);
    character.history.push({
      age: character.age,
      text: `${rel.name} হালকা কইরা হাসিলো — "আজ্ঞে, বুঝলাম। মনে আসলেই ওই কথা হবে।" তয় খানি মুখ আবার ততখানি খোলসা হইলো না, বুকের কোণে যেন একটু দাগ পড়িলো।`,
      tone: 'neutral',
    });
    return null;
  }

  return null;
}

/**
 * PART H — NPC-initiated romantic interest from the existing peer pool.
 *
 * Romance has two origins now: the random dating pool (DatingCandidate) and
 * these events, where an established classmate (aged 16–17) or an existing
 * coworker (while currently employed) initiates. The NPC is never a stranger:
 * eligibility requires a pre-existing bond of at least 50 (lower than the
 * askOutPeer ≥ 60 bar, so established peers act on slightly weaker ties and
 * every shot is plausible), and accepting converts that exact relationship —
 * same id, name, and bond — into a dating romance that flows through the
 * ordinary dating/partner/spouse pipeline.
 */

/** Annual per-eligible-NPC chance that one of them shoots their shot. */
export const PEER_INTEREST_ANNUAL_CHANCE = 0.35;

/** Romance never starts before this floor age (matches askOutPeer). */
export const MIN_PEER_INTEREST_AGE = 16;

/** Compulsory schooling wraps at this age; classmate interest stops there. */
export const SCHOOL_ROMANCE_END_AGE = 17;

export type PeerRomanceInterest = {
  kind: 'classmate_interest' | 'coworker_interest';
  npcId: string;
};

/** Classmates (or classmates a player befriended) during the teen school window. */
function classmateInterestCandidates(character: Character): Relationship[] {
  if (character.age < MIN_PEER_INTEREST_AGE || character.age > SCHOOL_ROMANCE_END_AGE) return [];
  return character.relationships.filter(
    (r) => r.alive && (r.relation === 'classmate' || r.relation === 'friend') && r.meter >= 50
  );
}

/** Coworkers while the player actually holds a job. */
function coworkerInterestCandidates(character: Character): Relationship[] {
  if (!character.career || character.career.jobId == null) return [];
  return character.relationships.filter(
    (r) => r.alive && r.relation === 'coworker' && r.meter >= 50
  );
}

/**
 * Annual peer-interest roll (Part H). Each eligible NPC rolls a flat
 * PEER_INTEREST_ANNUAL_CHANCE; when several are interested, only the one with
 * the strongest pre-existing bond gets their shot (one interest event max per
 * year). Purely a selection — no state is mutated here; acceptance/decline
 * resolve later through resolvePeerInterestChoice.
 */
export function rollPeerRomanceInterest(character: Character, rng: RNG): PeerRomanceInterest | null {
  const candidates = [...classmateInterestCandidates(character), ...coworkerInterestCandidates(character)];
  if (candidates.length === 0) return null;

  const interested = candidates.filter(() => rng.chance(PEER_INTEREST_ANNUAL_CHANCE));
  if (interested.length === 0) return null;

  const npc = interested.sort((a, b) => b.meter - a.meter)[0];
  return { kind: npc.relation === 'coworker' ? 'coworker_interest' : 'classmate_interest', npcId: npc.id };
}

/** Applies the outcome of an NPC-initiated interest event (Part H). */
export function resolvePeerInterestChoice(
  character: Character,
  npcId: string,
  choiceId: string,
  kind: 'classmate_interest' | 'coworker_interest'
): void {
  const rel = character.relationships.find((r) => r.id === npcId && r.alive);
  if (!rel) return;
  if (rel.relation === 'dating' || rel.relation === 'partner' || rel.relation === 'spouse') return;

  if (rel.relation !== 'classmate' && rel.relation !== 'coworker' && rel.relation !== 'friend') return;

  if (choiceId === 'peer_accept') {
    rel.relation = 'dating';
    rel.romanceStage = 'dating';
    character.stats.happiness = clamp(character.stats.happiness + 12);
    const text =
      kind === 'classmate_interest'
        ? `লজ্জা-শরম ভুলা ${rel.name} তোমার হাত ধরিলো — বেঞ্চের পাশে গড়া সোনালি প্রেম, যার সূচনা হয়েছিল ক্লাসের সেই প্রথম হাস্যভরা কটাক্ষে!`
        : `অফিসের চা-বিরতি পেরিয়া ${rel.name}-র লগে চুপিচুপি প্রেমের কারবার! সহকর্মী হওয়া এখন প্রেমিক-প্রেমিকা, তয় অফিসের পাতায় কফির সিস্টেম আগেরই থাকলো।`;
    character.history.push({ age: character.age, text, tone: 'good' });
    return;
  }

  if (choiceId === 'peer_decline') {
    rel.meter = clamp(rel.meter - 10);
    character.stats.happiness = clamp(character.stats.happiness - 4);
    const text =
      kind === 'classmate_interest'
        ? `${rel.name} চোখ অন্যদিকে ঘুরাইয়া কইলো—"আচ্ছা, ঠিক আছে।" কথাটা সেদিনের মতো থেমে গেলো, কিন্তু ক্লাসের সেই সহজ আড্ডাটা আর আগের মতো হইলো না।`
        : `${rel.name} জোর কইরা হাসিলো—"আরে না না, ঠাট্টাই করছিলাম!" তয় চায়ের দাওয়াতটা আর কখনোই উঠিলো না, আর দুজনের মাঝে হালকা এক টানাপোড়েন স্থায়ী হইলো।`;
    character.history.push({ age: character.age, text, tone: 'neutral' });
  }
}

/**
 * PART I — NPC-initiated events from the player's existing entourage.
 *
 * Two kinds: a single, unattached friend/classmate/coworker (never a stranger)
 * finally asks the player out while the player is unattached, and a committed
 * partner with a solid bond proposes trying for the first child. Both are pure
 * selection here — no state is mutated — and resolve later through
 * resolveRomanceDramaChoice so the exact existing NPC keeps its id, name, and
 * bond, and a baby acquisition flows through the real tryForBaby chain.
 */

/** Solo players get a friendly face asking them out from this age on. */
export const SINGLE_ASKOUT_MIN_AGE = 18;

/** Bond a lone NPC must hold to work up the courage to ask. */
export const SINGLE_ASKOUT_BOND = 50;

/** The suitor must be within this many years of the player (no thrill romance). */
export const SINGLE_ASKOUT_AGE_GAP = 12;

/** Annual chance a single player gets one such askout. */
export const SINGLE_ASKOUT_ANNUAL_CHANCE = 0.18;

/** Annual chance a committed, childless couple faces a baby proposal. */
export const BABY_PROPOSAL_ANNUAL_CHANCE = 0.12;

/** Bond a partner must hold before the baby talk feels plausible. */
export const BABY_PROPOSAL_METER = 60;

export type PartnerInitiative =
  | { kind: 'single_askout'; npcId: string }
  | { kind: 'partner_baby_proposal'; partnerId: string };

/** Lone, alive, same-era NPCs the player could plausibly date. */
function singleAskoutCandidates(character: Character): Relationship[] {
  if (character.age < SINGLE_ASKOUT_MIN_AGE) return [];
  if (activeRomances(character).length > 0) return [];
  return character.relationships.filter(
    (r) =>
      r.alive &&
      (r.relation === 'friend' || r.relation === 'classmate' || r.relation === 'coworker') &&
      r.meter >= SINGLE_ASKOUT_BOND &&
      r.age >= SINGLE_ASKOUT_MIN_AGE &&
      Math.abs(r.age - character.age) <= SINGLE_ASKOUT_AGE_GAP
  );
}

/** Highest-bond committed, childless partner within fertile years. */
function babyProposalPartner(character: Character): Relationship | undefined {
  if (character.age < 18 || character.age > 55) return undefined;
  if (character.flags.includes('has_child')) return undefined;
  return character.relationships
    .filter(
      (r) =>
        r.alive &&
        (r.relation === 'partner' || r.relation === 'spouse') &&
        r.meter >= BABY_PROPOSAL_METER &&
        r.age <= 48
    )
    .sort((a, b) => b.meter - a.meter)[0];
}

/**
 * Annual partner-initiative roll (Part I). A single player may be asked out by
 * the highest-bond lone NPC; else a childless committed couple may face a baby
 * proposal. Deterministic through rng; returns a descriptor or null.
 */
export function rollPartnerInitiative(character: Character, rng: RNG): PartnerInitiative | null {
  const askout = singleAskoutCandidates(character);
  if (askout.length > 0 && rng.chance(SINGLE_ASKOUT_ANNUAL_CHANCE)) {
    const npc = askout.sort((a, b) => b.meter - a.meter)[0];
    return { kind: 'single_askout', npcId: npc.id };
  }
  const partner = babyProposalPartner(character);
  if (partner && rng.chance(BABY_PROPOSAL_ANNUAL_CHANCE)) {
    return { kind: 'partner_baby_proposal', partnerId: partner.id };
  }
  return null;
}
