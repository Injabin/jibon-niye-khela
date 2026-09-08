import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import {
  BOND_MAX,
  ageFamilyMembers,
  birthChild,
  generateFamilyTree,
  layoutFamilyTree,
  type FamilyTree,
} from '@/lib/engine/family';
import {
  buildHeirFamilyTree,
  COMING_OF_AGE,
  createHeirCharacter,
  eligibleHeirs,
  MAX_INHERITANCE,
  nextLifeSeed,
} from '@/lib/engine/legacy';
import { RNG } from '@/lib/engine/rng';
import type { Character } from '@/lib/engine/types';

function parentAndTree(seed: number): { character: Character; tree: FamilyTree } {
  const { character } = createCharacter(seed);
  character.age = 60;
  character.money = 90_000;
  character.reputation.karma = 80;
  character.traits = ['charming', 'funny'];
  character.gender = 'female';
  character.birthYear = 1960;
  character.alive = false;
  character.causeOfDeath = 'old age';
  return { character, tree: generateFamilyTree(character, seed) };
}

function withChild(tree: FamilyTree, age: number, alive = true, name = 'Declan Blackwood'): FamilyTree {
  return {
    ...tree,
    members: [
      ...tree.members,
      {
        id: `child-${age}-${name}`,
        name,
        gender: 'male',
        role: 'child',
        age,
        alive,
        bond: 60,
        metAge: 42,
        lastSpentAge: -1,
      },
    ],
  };
}

describe('eligibleHeirs', () => {
  it('lists alive children who have come of age, oldest first', () => {
    const { character, tree } = parentAndTree(3);
    // Generate the tree for a 60-year-old, then add children at various ages.
    const grown = withChild(withChild(withChild(tree, 25), 18), 12);
    const named = withChild(grown, 44, false, 'Mable Blackwood');
    const heirs = eligibleHeirs(character, named);
    expect(heirs.map((h) => h.age)).toEqual([25, 18]);
  });

  it('returns nothing while the character is alive', () => {
    const { character, tree } = parentAndTree(5);
    character.alive = true;
    expect(eligibleHeirs(character, withChild(tree, 30))).toEqual([]);
  });

  it('returns nothing without a family tree or character', () => {
    expect(eligibleHeirs(null, null)).toEqual([]);
    const { character } = parentAndTree(7);
    expect(eligibleHeirs(character, null)).toEqual([]);
  });
});

describe('createHeirCharacter', () => {
  it('builds a fresh adult heir with an even inheritance split', () => {
    const { character, tree } = parentAndTree(11);
    const [heir] = eligibleHeirs(character, withChild(tree, 20));
    const rng = new RNG(12);
    const heirCharacter = createHeirCharacter(character, heir!, 2, rng);

    expect(heirCharacter.name).toBe('Declan');
    expect(heirCharacter.surname).toBe(character.surname);
    expect(heirCharacter.gender).toBe('male');
    expect(heirCharacter.age).toBe(20);
    expect(heirCharacter.alive).toBe(true);
    expect(heirCharacter.money).toBe(45_000); // 90_000 split two ways
    expect(heirCharacter.flags).toEqual([]);
    expect(heirCharacter.education.stage).toBe('high');
    expect(heirCharacter.education.graduated).toBe(false);
    expect(heirCharacter.reputation).toEqual({ fame: 0, karma: 40 });
    expect(heirCharacter.career.jobId).toBeNull();
    expect(heirCharacter.assets).toEqual([]);
    expect(heirCharacter.criminalRecord).toEqual([]);
    expect(heirCharacter.relationships).toEqual([]);
    expect(heirCharacter.traits.length).toBeLessThanOrEqual(2);
    expect(heirCharacter.history).toHaveLength(2);
    expect(heirCharacter.statHistory).toHaveLength(2);
    expect(heirCharacter.birthYear).toBe(1960 + (60 - 20));
  });

  it('never inherits debt and clamps absurd estates to the money max', () => {
    const { character, tree } = parentAndTree(13);
    character.money = -5_000;
    const [heir] = eligibleHeirs(character, withChild(tree, 25));
    const heirCharacter = createHeirCharacter(character, heir!, 1, new RNG(20));
    expect(heirCharacter.money).toBe(0);

    character.money = MAX_INHERITANCE * 4;
    const [heir2] = eligibleHeirs(character, withChild(tree, 25));
    const heir2Character = createHeirCharacter(character, heir2!, 1, new RNG(21));
    expect(heir2Character.money).toBe(MAX_INHERITANCE);
  });

  it('uses an older stage for heirs past typical college age', () => {
    const { character, tree } = parentAndTree(17);
    const [heir] = eligibleHeirs(character, withChild(tree, 26));
    const heirCharacter = createHeirCharacter(character, heir!, 1, new RNG(30));
    expect(heirCharacter.education.stage).toBe('undergraduate');
  });

  it('always advances to a deterministic seed in range', () => {
    const rng = new RNG(99);
    const first = nextLifeSeed(rng);
    expect(first).toBeGreaterThanOrEqual(1);
    expect(first).toBeLessThanOrEqual(2_147_483_646);
    const second = nextLifeSeed(rng);
    // consumes randomness, so a second draw differs
    expect(second).not.toBe(first);
  });
});

describe('buildHeirFamilyTree', () => {
  it('re-roles the late self into a parent and the chosen child into self', () => {
    const { character, tree } = parentAndTree(23);
    const surname = character.surname;
    const otherChild = withChild(tree, 30, true, `Zara ${surname}`);
    const withHeir = withChild(otherChild, 22, true, `Declan ${surname}`);
    const chosen = eligibleHeirs(character, withHeir).find((h) => h.age === 22)!;
    const heirCharacter = createHeirCharacter(character, chosen, 2, new RNG(31));
    const heirTree = buildHeirFamilyTree(withHeir, heirCharacter);

    expect(heirTree.selfId).toBe(heirCharacter.id);
    const self = heirTree.members.find((m) => m.role === 'self');
    expect(self).toBeDefined();
    expect(self!.name).toBe(`Declan ${surname}`);

    const lateParent = heirTree.members.find((m) => m.name === `${character.name} ${character.surname}`);
    expect(lateParent?.role).toBe('mother');
    expect(lateParent?.alive).toBe(false);

    // Zara remains, now as a sibling; the chosen heir is gone from the list.
    const zara = heirTree.members.find((m) => m.name === `Zara ${surname}`);
    expect(zara?.role).toBe('sibling');
    expect(heirTree.members.filter((m) => m.name === `Declan ${surname}`)).toHaveLength(1);

    // The tree links the late parent down to the new self.
    expect(heirTree.edges).toContainEqual({ from: lateParent!.id, to: heirCharacter.id, label: 'parent' });
    expect(heirTree.selfId).toBe(heirTree.members.find((m) => m.role === 'self')!.id);

    // Layout still maps every member (siblings land on the bottom row).
    const positions = layoutFamilyTree(heirTree);
    for (const member of heirTree.members) {
      expect(positions.has(member.id)).toBe(true);
    }
  });
});

describe('birthChild and ageFamilyMembers', () => {
  it('birthChild adds a 0-year-old member connected to the character', () => {
    const { character, tree } = parentAndTree(29);
    character.age = 30;
    const next = birthChild(tree, character, new RNG(40));
    const child = next.members.find((m) => m.role === 'child');
    expect(child).toBeDefined();
    expect(child!.age).toBe(0);
    expect(child!.alive).toBe(true);
    expect(child!.bond).toBe(60);
    expect(next.edges).toContainEqual({ from: tree.selfId, to: child!.id, label: 'parent' });
    expect(layoutFamilyTree(next).has(child!.id)).toBe(true);
  });

  it('ageFamilyMembers bumps living members and mirrors the character age', () => {
    const { character, tree } = parentAndTree(37);
    const withBaby = birthChild(tree, character, new RNG(41));
    const withDead = withChild(withBaby, 44, false, 'Old Aunt Blackwood');
    const grown = ageFamilyMembers(withDead, 40);

    expect(grown.members.find((m) => m.role === 'self')!.age).toBe(40);
    const baby = grown.members.find((m) => m.role === 'child' && m.age !== 44);
    expect(baby!.age).toBe(1);
    expect(grown.members.find((m) => m.name === 'Old Aunt Blackwood')!.age).toBe(44);
  });
});

describe('legacy store flow', () => {
  it('produces a serializable heir state via the engine path', () => {
    const { character, tree } = parentAndTree(43);
    const prepared = ageFamilyMembers(withChild(tree, 20, true, `Declan ${character.surname}`), 60);
    const [heir] = eligibleHeirs(character, prepared);
    const heirCharacter = createHeirCharacter(character, heir!, 1, new RNG(50));
    const heirTree = buildHeirFamilyTree(prepared, heirCharacter);
    const payload = JSON.parse(JSON.stringify({ character: heirCharacter, familyTree: heirTree }));
    expect(payload.character.age).toBe(21);
    expect(payload.character.money).toBe(90_000);
    expect(payload.familyTree.selfId).toBe(payload.character.id);
  });
});

describe('COMING_OF_AGE', () => {
  it('matches the documented threshold', () => {
    expect(COMING_OF_AGE).toBe(18);
  });

  it('heirs only ever appear once in the new tree', () => {
    const { character, tree } = parentAndTree(51);
    const prepared = withChild(tree, 19, true, `Declan ${character.surname}`);
    const [heir] = eligibleHeirs(character, prepared);
    const heirCharacter = createHeirCharacter(character, heir!, 1, new RNG(52));
    const heirTree = buildHeirFamilyTree(prepared, heirCharacter);
    expect(heirTree.members.filter((m) => m.name === heirCharacter.name + ' ' + heirCharacter.surname)).toHaveLength(
      1,
    );
    expect(BOND_MAX).toBeGreaterThan(0);
  });
});