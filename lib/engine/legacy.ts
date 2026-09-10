/**
 * Legacy / heir mode (init.md M5 #4, DESIGN.md §5.3/§5.8).
 *
 * When a life ends, a surviving child who has reached the coming-of-age age
 * can be played next. The heir is a real character: a fresh `Character` with
 * a disciplined inheritance (the estate split evenly among eligible heirs,
 * debt never inherited), a prologue in their history, and a family tree that
 * carries the late parent (and siblings) forward from the old one. All pure
 * and deterministic from (seed, rngState).
 */

import { generateId } from './character';
import { BOND_MAX, type FamilyMember, type FamilyTree, type FamilyRole } from './family';
import { MONEY_MAX } from './stats';
import type { RNG } from './rng';
import type { Character, Stats, StatsHistoryPoint } from './types';

export const COMING_OF_AGE = 18;

/** Estate shares are capped so an absurd bank balance can't overflow the save. */
export const MAX_INHERITANCE = MONEY_MAX;

/** Surviving children old enough to inherit, oldest first. */
export function eligibleHeirs(character: Character | null, tree: FamilyTree | null): FamilyMember[] {
  if (!character || character.alive) return [];
  if (!tree) return [];
  return tree.members
    .filter((m) => m.role === 'child' && m.alive && m.age >= COMING_OF_AGE)
    .sort((a, b) => b.age - a.age);
}

function backstoryStats(age: number, rng: RNG): StatsHistoryPoint {
  const childhood = {
    health: rng.rangeInt(78, 92),
    happiness: rng.rangeInt(72, 90),
    smarts: rng.rangeInt(40, 62),
    looks: rng.rangeInt(62, 80),
  };
  return {
    age: age,
    health: childhood.health,
    happiness: childhood.happiness,
    smarts: childhood.smarts,
    looks: childhood.looks,
  };
}

/**
 * Build the heir's playable character. Names and identity come from the chosen
 * family member; stats/traits/backstory fill in deterministically from RNG.
 * `heirsCount` splits the estate evenly — the heir never inherits debt.
 */
export function createHeirCharacter(
  parent: Character,
  heir: FamilyMember,
  heirsCount: number,
  rng: RNG,
): Character {
  const age = heir.age;
  let firstName = heir.name;
  if (parent.surname && firstName.endsWith(` ${parent.surname}`)) {
    firstName = firstName.slice(0, -parent.surname.length - 1);
  } else if (firstName.includes(' ')) {
    const lastSpace = firstName.lastIndexOf(' ');
    firstName = firstName.slice(0, lastSpace);
  }
  const share = Math.max(0, Math.floor(parent.money / Math.max(1, heirsCount)));
  const inheritance = Math.min(MAX_INHERITANCE, share);

  const stats: Stats = {
    health: rng.rangeInt(58, 74),
    happiness: rng.rangeInt(58, 72),
    smarts: rng.rangeInt(58, 74),
    looks: rng.rangeInt(56, 72),
  };

  const traits = parent.traits.length > 0 ? [rng.pick(parent.traits)] : [];
  const stage = age >= 22 ? 'undergraduate' : 'high';
  const inheritedKarma = Math.max(0, Math.floor(parent.reputation.karma / 2));

  const childhood = backstoryStats(age, rng);

  return {
    id: generateId(rng),
    name: firstName,
    surname: parent.surname,
    gender: heir.gender,
    birthYear: parent.birthYear + (parent.age - age),
    stats,
    money: inheritance,
    age,
    alive: true,
    traits,
    flags: [],
    reputation: { fame: 0, karma: inheritedKarma },
    education: { stage, enrolled: false, gpa: 3.0, major: '', graduated: false },
    career: { jobId: null, performance: 50, yearsAtJob: 0 },
    assets: [],
    relationships: [],
    criminalRecord: [],
    history: [
      {
        age: Math.max(8, age - 12),
        text: `${firstName} grew up in the shadow of a house that always smelled of ambitions.`,
        tone: 'neutral',
      },
      {
        age,
        text: `${parent.name} ${parent.surname} passes on. The estate is split between the heirs — you take your share and a name to carry.`,
        tone: 'bad',
      },
    ],
    statHistory: [
      {
        age: childhood.age,
        health: childhood.health,
        happiness: childhood.happiness,
        smarts: childhood.smarts,
        looks: childhood.looks,
      },
      { age, health: stats.health, happiness: stats.happiness, smarts: stats.smarts, looks: stats.looks },
    ],
  };
}

/**
 * The heir's family tree viewed from their own perspective: the late parent's
 * `self` node becomes `mother`/`father` (deceased), every other old child
 * becomes a sibling, the surviving generations keep their roles, and the heir
 * becomes the new `self`, linked to the late parent.
 */
export function buildHeirFamilyTree(tree: FamilyTree, heir: Character): FamilyTree {
  const oldSelf = tree.members.find((m) => m.role === 'self');
  const heirMember = tree.members.find(
    (m) => m.role === 'child' && (m.name === `${heir.name} ${heir.surname}` || m.name === heir.name),
  );
  if (!oldSelf || !heirMember) {
    throw new Error('Cannot build a heir family tree without the late self and the chosen child');
  }

  const parentRole: FamilyRole = oldSelf.gender === 'female' ? 'mother' : 'father';

  const members = tree.members
    .filter((m) => m.id !== heirMember.id)
    .map((member): FamilyMember => {
      if (member.id === oldSelf.id) return { ...member, role: parentRole, alive: false };
      if (member.role === 'child') return { ...member, role: 'sibling' };
      return member;
    });

  const self: FamilyMember = {
    id: heir.id,
    name: `${heir.name} ${heir.surname}`,
    gender: heir.gender,
    role: 'self',
    age: heir.age,
    alive: true,
    bond: BOND_MAX,
    metAge: 0,
    lastSpentAge: 0,
  };
  members.push(self);

  const edges = tree.edges
    .filter((edge) => edge.from !== heirMember.id && edge.to !== heirMember.id)
    .concat({ from: oldSelf.id, to: self.id, label: 'parent' });

  return { selfId: self.id, members, edges };
}

/** Derive a fresh seed for the heir's life from the current RNG stream. */
export function nextLifeSeed(rng: RNG): number {
  return rng.rangeInt(1, 2_147_483_646);
}