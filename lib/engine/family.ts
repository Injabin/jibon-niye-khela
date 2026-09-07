/**
 * Family tree model (init.md M4 #3, DESIGN.md §7/§8).
 *
 * Pure engine data — no assets, colours or SFX (AGENT.md §5). The tree is
 * derived deterministically from the game seed so an imported legacy save can
 * rebuild it, and it is persisted as versioned JSON in the save (schema v2,
 * DESIGN.md §9), generation included.
 */

import { FEMALE_NAMES, MALE_NAMES } from '@/content/names';
import type { Character, Gender } from './types';
import { generateId } from './character';
import { RNG } from './rng';

/** Relationship kind to the active character, used for the panel + labels. */
export type FamilyRole = 'self' | 'mother' | 'father' | 'grandparent' | 'sibling' | 'spouse' | 'child';

export interface FamilyMember {
  id: string;
  name: string;
  gender: Gender;
  role: FamilyRole;
  age: number;
  alive: boolean;
  /** 0–100 closeness meter shown in the relationship panel (DESIGN.md §8). */
  bond: number;
  /** Character age when this member entered the household. */
  metAge: number;
  /** Character age the last time "spend time" raised the bond (once per year). */
  lastSpentAge: number;
}

export interface FamilyEdge {
  /** Parent/elder endpoint id. */
  from: string;
  /** Child endpoint id. */
  to: string;
  /** Edge kind shown as a small label on the graph ('parent'). */
  label: 'parent';
}

export interface FamilyTree {
  selfId: string;
  members: FamilyMember[];
  edges: FamilyEdge[];
}

/** Bond gained per "Spend time" interaction; hard ceiling. */
export const BOND_PER_VISIT = 8;
export const BOND_MAX = 100;

function fullName(gender: Gender, surname: string, rng: RNG, used: Set<string>): string {
  let name = '';
  do {
    name = `${gender === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES)} ${surname}`;
  } while (used.has(name));
  used.add(name);
  return name;
}

function rollAge(range: [number, number], rng: RNG): number {
  return rng.rangeInt(range[0], range[1]);
}

/** Older family members are more likely to have already passed on. */
function rollAlive(age: number, rng: RNG): boolean {
  const chance = Math.max(0.15, 1 - age / 120);
  return rng.chance(chance);
}

/**
 * Deterministic starting household: the character, both parents and one
 * grandparent from each side — five nodes across three generations.
 */
export function generateFamilyTree(character: Character, seed: number): FamilyTree {
  const rng = new RNG(seed);
  const used = new Set<string>();
  const surname = character.surname;

  const self: FamilyMember = {
    id: generateId(rng),
    name: `${character.name} ${surname}`,
    gender: character.gender,
    role: 'self',
    age: character.age,
    alive: character.alive,
    bond: BOND_MAX,
    metAge: 0,
    lastSpentAge: 0,
  };

  const motherAge = character.age + rollAge([24, 34], rng);
  const fatherAge = character.age + rollAge([26, 36], rng);

  const mother: FamilyMember = {
    id: generateId(rng),
    name: fullName('female', surname, rng, used),
    gender: 'female',
    role: 'mother',
    age: motherAge,
    alive: rollAlive(motherAge, rng),
    bond: rng.rangeInt(72, 88),
    metAge: 0,
    lastSpentAge: -1,
  };

  const father: FamilyMember = {
    id: generateId(rng),
    name: fullName('male', surname, rng, used),
    gender: 'male',
    role: 'father',
    age: fatherAge,
    alive: rollAlive(fatherAge, rng),
    bond: rng.rangeInt(68, 86),
    metAge: 0,
    lastSpentAge: -1,
  };

  const grandmotherAge = character.age + rollAge([48, 62], rng);
  const grandfatherAge = character.age + rollAge([50, 66], rng);

  const grandmother: FamilyMember = {
    id: generateId(rng),
    name: fullName('female', surname, rng, used),
    gender: 'female',
    role: 'grandparent',
    age: grandmotherAge,
    alive: rollAlive(grandmotherAge, rng),
    bond: rng.rangeInt(52, 74),
    metAge: 0,
    lastSpentAge: -1,
  };

  const grandfather: FamilyMember = {
    id: generateId(rng),
    name: fullName('male', surname, rng, used),
    gender: 'male',
    role: 'grandparent',
    age: grandfatherAge,
    alive: rollAlive(grandfatherAge, rng),
    bond: rng.rangeInt(48, 72),
    metAge: 0,
    lastSpentAge: -1,
  };

  const members = [self, mother, father, grandmother, grandfather];
  const edges: FamilyEdge[] = [
    { from: mother.id, to: self.id, label: 'parent' },
    { from: father.id, to: self.id, label: 'parent' },
    { from: grandmother.id, to: mother.id, label: 'parent' },
    { from: grandfather.id, to: father.id, label: 'parent' },
  ];

  return { selfId: self.id, members, edges };
}

/**
 * Static 3-generation layout over an 800×560 canvas. Grandparents sit on the
 * top row, parents in the middle, and the character at the bottom centre.
 */
export function layoutFamilyTree(tree: FamilyTree): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const self = tree.members.find((m) => m.id === tree.selfId);
  if (!self) return positions;

  const mother = tree.members.find((m) => m.role === 'mother' && m.id !== self.id);
  const father = tree.members.find((m) => m.role === 'father' && m.id !== self.id);

  positions.set(self.id, { x: 400, y: 440 });
  if (mother) positions.set(mother.id, { x: 240, y: 310 });
  if (father) positions.set(father.id, { x: 560, y: 310 });

  const poles = tree.members.filter((m) => m.role === 'grandparent');
  const maternal = poles.find((p) => p.gender === 'female');
  const paternal = poles.find((p) => p.gender === 'male');
  if (maternal) positions.set(maternal.id, { x: 180, y: 150 });
  if (paternal) positions.set(paternal.id, { x: 620, y: 150 });

  return positions;
}

/** Human label for a member in the panel (e.g. "Mother", "Grandmother"). */
export function relationLabel(member: FamilyMember): string {
  switch (member.role) {
    case 'self':
      return 'You';
    case 'mother':
      return 'Mother';
    case 'father':
      return 'Father';
    case 'grandparent':
      return member.gender === 'female' ? 'Grandmother' : 'Grandfather';
    case 'sibling':
      return member.gender === 'female' ? 'Sister' : 'Brother';
    case 'spouse':
      return 'Spouse';
    case 'child':
      return 'Child';
  }
}