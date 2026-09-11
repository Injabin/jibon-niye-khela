import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { BOND_MAX, BOND_PER_VISIT, generateFamilyTree, layoutFamilyTree, relationLabel } from '@/lib/engine/family';
import type { FamilyMember } from '@/lib/engine/family';

function build(seed: number) {
  const { character } = createCharacter(seed);
  return { character, tree: generateFamilyTree(character, seed) };
}

describe('family tree generation (M4 #3)', () => {
  it('is deterministic for the same seed', () => {
    const { character, tree } = build(11);
    expect(generateFamilyTree(character, 11)).toEqual(tree);
  });

  it('keeps the character as the rooted self node', () => {
    const { character, tree } = build(11);
    const self = tree.members.find((m) => m.role === 'self');
    expect(self).toBeDefined();
    expect(self!.id).toBe(tree.selfId);
    expect(self!.name).toBe(`${character.name} ${character.surname}`);
    expect(self!.age).toBe(character.age);
    expect(self!.alive).toBe(character.alive);
    expect(self!.bond).toBe(BOND_MAX);
  });

  it('builds a three-generation household: self, two parents, two grandparents', () => {
    const { tree } = build(12);
    expect(tree.members).toHaveLength(5);
    expect(tree.members.filter((m) => m.role === 'mother').length).toBe(1);
    expect(tree.members.filter((m) => m.role === 'father').length).toBe(1);
    expect(tree.members.filter((m) => m.role === 'grandparent').length).toBe(2);
    expect(tree.edges).toHaveLength(4);
  });

  it('respects age order and plausible generation gaps', () => {
    const { character, tree } = build(13);
    const byId = new Map(tree.members.map((m) => [m.id, m]));
    for (const edge of tree.edges) {
      const elder = byId.get(edge.from)!;
      const younger = byId.get(edge.to)!;
      expect(elder.age).toBeGreaterThan(younger.age);
    }
    const self = tree.members.find((m) => m.role === 'self')!;
    for (const parent of tree.members.filter((m) => m.role === 'mother' || m.role === 'father')) {
      expect(parent.age - character.age).toBeGreaterThanOrEqual(24);
      expect(parent.age - character.age).toBeLessThanOrEqual(40);
    }
    for (const gp of tree.members.filter((m) => m.role === 'grandparent')) {
      expect(gp.age).toBeGreaterThan(self.age);
    }
    void self;
  });

  it('keeps all bonds within [0, 100] and all names unique', () => {
    const { tree } = build(14);
    const names = new Set<string>();
    for (const member of tree.members) {
      expect(member.bond).toBeGreaterThanOrEqual(0);
      expect(member.bond).toBeLessThanOrEqual(BOND_MAX);
      expect(names.has(member.name)).toBe(false);
      names.add(member.name);
    }
  });

  it('every edge references an existing member and every non-self member is reachable', () => {
    const { tree } = build(15);
    const ids = new Set(tree.members.map((m) => m.id));
    for (const edge of tree.edges) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
    const reachable = new Set<string>();
    const edges = [...tree.edges];
    const seen = [tree.selfId];
    while (seen.length > 0) {
      const id = seen.pop()!;
      for (const edge of edges) {
        if (edge.to === id || edge.from === id) {
          const other = edge.from === id ? edge.to : edge.from;
          if (!reachable.has(other)) {
            reachable.add(other);
            seen.push(other);
          }
        }
      }
    }
    for (const member of tree.members) {
      if (member.role !== 'self') expect(reachable.has(member.id)).toBe(true);
    }
  });

  it('IDs are unique across the household', () => {
    const { tree } = build(16);
    expect(new Set(tree.members.map((m) => m.id)).size).toBe(tree.members.length);
  });
});

describe('family tree layout', () => {
  it('places every member inside the 800×560 canvas with a fixed self anchor', () => {
    const { tree } = build(17);
    const positions = layoutFamilyTree(tree);
    expect(positions.size).toBe(tree.members.length);
    for (const member of tree.members) {
      const pos = positions.get(member.id);
      expect(pos).toBeDefined();
      expect(pos!.x).toBeGreaterThanOrEqual(0);
      expect(pos!.x).toBeLessThanOrEqual(800);
      expect(pos!.y).toBeGreaterThanOrEqual(0);
      expect(pos!.y).toBeLessThanOrEqual(560);
    }
    expect(positions.get(tree.selfId)).toEqual({ x: 400, y: 440 });
  });
});

describe('bond constants and labels', () => {
  it('exposes a spend-time gain and a hard cap', () => {
    expect(BOND_PER_VISIT).toBe(8);
    expect(BOND_MAX).toBe(100);
  });

  it('labels roles for the relationship panel', () => {
    const member = (role: FamilyMember['role']) => ({ id: 'x', name: 'X', gender: 'female', role, age: 40, alive: true, bond: 50, metAge: 0, lastSpentAge: 0 } as FamilyMember);
    expect(relationLabel(member('self'))).toBe('তুমি');
    expect(relationLabel(member('mother'))).toBe('আম্মা');
    expect(relationLabel(member('father'))).toBe('আব্বা');
    expect(relationLabel(member('grandparent'))).toBe('দাদী / নানী');
    expect(relationLabel(member('spouse'))).toBe('বউ (স্ত্রী)');
    expect(relationLabel({ ...member('grandparent'), gender: 'male' })).toBe('দাদা / নানা');
    expect(relationLabel(member('child'))).toBe('মেয়ে');
    expect(relationLabel(member('sibling'))).toBe('বোন');
  });
});