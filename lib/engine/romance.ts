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
  'Rising Pop Star',
  'Local Cricket Sensation',
  'Indie Film Director',
  'Tech Startup Founder',
  'Haute Couture Model',
  'Award-Winning Novelist',
  'Underground DJ',
  'Acclaimed Playwright',
  'Viral Food Critic',
] as const;

export const TEEN_ARCHETYPES = [
  'High School Classmate',
  'Debate Club Captain',
  'Art Class Partner',
  'Neighborhood Friend',
  'Library Regular',
  'Drama Club Lead',
] as const;

export const ADULT_ARCHETYPES = [
  'Software Engineer',
  'Graphic Designer',
  'Tea Stall Connoisseur',
  'University Lecturer',
  'Architect',
  'Fitness Trainer',
  'Bank Analyst',
  'Freelance Photographer',
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
    return { ok: false, text: 'You are too young to date.' };
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
          `${candidate.name} blushed, said they only see you as a study buddy, and hurried away.`,
          `${candidate.name} laughed nervously and pretended their bus had just arrived.`,
          `${candidate.name} said they are focusing on their SSC exams right now.`,
        ]
      : [
          `${candidate.name} politely declined, stating their schedule is too hectic right now.`,
          `${candidate.name} said there is no romantic spark, but wished you the best.`,
          `${candidate.name} smiled apologetically and mentioned they are currently seeing someone.`,
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
    ? `You asked ${candidate.name} (${candidate.archetype}) to share an ice cream after school. They beamed and said yes!`
    : `You took ${candidate.name} (${candidate.archetype}) out for dinner. The evening went brilliantly, and you are now officially seeing each other!`;

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
    return { ok: false, text: 'You must be at least 18 to make a partnership official.' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.romanceStage !== 'dating' && rel.relation !== 'dating')) {
    return { ok: false, text: 'You are not currently casually dating this person.' };
  }

  if (rel.meter < 50) {
    rel.meter = clamp(rel.meter - 5);
    return {
      ok: false,
      text: `${rel.name} feels things are moving too fast and wants to keep things casual for now.`,
    };
  }

  rel.relation = 'partner';
  rel.romanceStage = 'partner';
  rel.meter = clamp(rel.meter + 15);
  const happinessBoost = rng.rangeInt(8, 15);
  character.stats.happiness = clamp(character.stats.happiness + happinessBoost);

  const msg = `You had an honest conversation with ${rel.name} and decided to make your relationship official!`;
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
    return { ok: false, text: 'You must be at least 18 to get married.' };
  }

  const existingSpouse = character.relationships.find((r) => r.relation === 'spouse' && r.alive);
  if (existingSpouse) {
    return { ok: false, text: 'You are already married!' };
  }

  const rel = character.relationships.find((r) => r.id === relationshipId);
  if (!rel || (rel.romanceStage !== 'partner' && rel.relation !== 'partner')) {
    return { ok: false, text: 'You can only propose to an official partner.' };
  }

  const RING_COST = 50;
  if (character.money < RING_COST) {
    return { ok: false, text: `You need at least ৳${RING_COST} to buy a proper ring for the proposal.` };
  }

  character.money -= RING_COST;

  if (rel.meter < 65) {
    rel.meter = clamp(rel.meter - 20);
    character.stats.happiness = clamp(character.stats.happiness - 15);
    const rejectMsg = `${rel.name} was stunned by the proposal, but admitted they are not ready for marriage yet.`;
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

  const successMsg = `Under a canopy of fairy lights, you proposed to ${rel.name}. With joyful tears, they shouted YES! You are officially married!`;
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
    return { ok: false, text: 'You do not have an active serious partner to cheat on.', caught: false };
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

    const caughtMsg = `You engaged in a reckless affair, but suspicious texts were discovered by ${rel.name}! A volcanic confrontation erupted in tears, shouting, and utter devastation.`;
    character.history.push({ age: character.age, text: caughtMsg, tone: 'bad' });

    // If meter collapsed below 20, partner dumps / divorces immediately
    if (rel.meter < 20) {
      rel.relation = 'ex';
      rel.romanceStage = 'ex';
      character.flags = character.flags.filter((f) => f !== 'is_married');
      const breakupMsg = `${rel.name} packed their bags, threw the house keys on the counter, and walked out of your life for good.`;
      character.history.push({ age: character.age, text: breakupMsg, tone: 'bad' });
    }

    return { ok: true, text: caughtMsg, caught: true };
  }

  // Not caught, but internal guilt and emotional detachment linger
  rel.meter = clamp(rel.meter - 15);
  character.stats.happiness = clamp(character.stats.happiness - 10);
  const secretMsg = `You stepped out on ${rel.name} during an out-of-town weekend. You escaped undetected, but the gnawing guilt weighs heavily on your conscience.`;
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
    return { ok: false, text: 'No active romantic partner found.' };
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

    const divorceMsg = `You and ${rel.name} finalized your divorce. After legal proceedings and an equitable settlement of ৳${settlement}, you parted ways.`;
    character.history.push({ age: character.age, text: divorceMsg, tone: 'bad' });
    return { ok: true, text: divorceMsg };
  }

  const breakupMsg = `You and ${rel.name} decided to call it quits. You agreed it was for the best, though the silence at home feels strange.`;
  character.history.push({ age: character.age, text: breakupMsg, tone: 'neutral' });
  return { ok: true, text: breakupMsg };
}
