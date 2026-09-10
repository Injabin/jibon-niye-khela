import { describe, expect, it, beforeEach } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import { ageFamilyMembers, birthChild, type FamilyTree } from '@/lib/engine/family';
import { RNG } from '@/lib/engine/rng';
import type { LifeEventDef } from '@/lib/engine/types';

beforeEach(() => {
  useGameStore.getState().resetGame();
  localStorage.clear();
  useGameStore.setState({ isHydrated: true });
});

function deadAdultWithHeir(seed: number, childAge: number): { heirId: string; tree: FamilyTree } {
  useGameStore.getState().newGame(seed);
  const s = useGameStore.getState();
  const tree = s.familyTree!;
  const withBaby = birthChild(tree, s.character!, new RNG(seed + 1));
  const grown = {
    ...withBaby,
    members: withBaby.members.map((m) => (m.role === 'child' ? { ...m, age: childAge } : m)),
  };
  const character = structuredClone(s.character!);
  character.age = 60;
  character.money = 60_000;
  character.birthYear = 1990;
  character.reputation.karma = 70;
  character.traits = ['charming'];
  character.alive = false;
  character.causeOfDeath = 'old age';

  const heir = grown.members.find((m) => m.role === 'child')!;
  useGameStore.setState({ character, familyTree: grown });
  return { heirId: heir.id, tree: grown };
}

describe('continueAsHeir (M5 #4)', () => {
  it('hands the story to an eligible child and starts a fresh serializable life', () => {
    const { heirId } = deadAdultWithHeir(101, 20);
    const before = useGameStore.getState();
    const ok = useGameStore.getState().continueAsHeir(heirId);
    expect(ok).toBe(true);

    const s = useGameStore.getState();
    expect(s.character!.alive).toBe(true);
    expect(s.character!.age).toBe(20);
    expect(s.character!.name).not.toBe('');
    expect(s.character!.surname).toBe(before.character!.surname);
    expect(s.character!.money).toBe(60_000);
    expect(s.character!.flags).toContain('religion_muslim');
    expect(s.pendingEvents).toEqual([]);
    expect(s.seed).not.toBe(before.seed);
    expect(s.rngState).toBe(s.seed >>> 0);

    const self = s.familyTree!.members.find((m) => m.role === 'self')!;
    expect(self.id).toBe(s.character!.id);
    const lateParent = s.familyTree!.members.find((m) => m.name === `${before.character!.name} ${before.character!.surname}`);
    expect(lateParent).toBeDefined();
    expect(lateParent!.alive).toBe(false);
    expect(lateParent!.role).toBe(before.character!.gender === 'female' ? 'mother' : 'father');
    expect(s.familyTree!.members.some((m) => m.role === 'child')).toBe(false);

    // The full resulting state round-trips JSON (legacy save must persist).
    const payload = JSON.parse(JSON.stringify({ ...s, character: s.character, familyTree: s.familyTree }));
    expect(payload.character.age).toBe(20);
    expect(payload.familyTree.selfId).toBe(payload.character.id);
  });

  it('refuses an underage child, an alive life, or an unknown heir', () => {
    const first = deadAdultWithHeir(102, 16);
    expect(useGameStore.getState().continueAsHeir(first.heirId)).toBe(false);

    const alive = useGameStore.getState();
    alive.newGame(103);
    const a = useGameStore.getState();
    const tree = a.familyTree!;
    const grown = ageFamilyMembers(tree, 60);
    useGameStore.setState({ familyTree: grown });
    // The character is alive — legacy must not fire.
    expect(useGameStore.getState().continueAsHeir('any-id')).toBe(false);
  });

  it('cannot fire twice once the heir is alive', () => {
    const { heirId } = deadAdultWithHeir(104, 20);
    useGameStore.getState().continueAsHeir(heirId);
    expect(useGameStore.getState().continueAsHeir(heirId)).toBe(false);
  });
});

describe('birth hook on has_child choices', () => {
  const BIRTH_EVENT: LifeEventDef = {
    id: 'test_baby_announcement',
    text: 'A life is announced in the house.',
    minAge: 25,
    maxAge: 45,
    weight: 1,
    tone: 'good',
    category: 'adult',
    choices: [{ id: 'rejoice', text: 'Rejoice', tone: 'good', effects: { addFlag: 'has_child' }, outcomeText: 'A tiny new life moves in.' }],
  };

  it('adds a real child member to the family tree when the flag appears', () => {
    useGameStore.getState().newGame(201);

    useGameStore.setState({ pendingEvents: [BIRTH_EVENT], currentEventIndex: 0 });
    useGameStore.getState().resolveCurrentChoice('rejoice');

    const after = useGameStore.getState();
    expect(after.character!.flags).toContain('has_child');
    const child = after.familyTree!.members.find((m) => m.role === 'child');
    expect(child).toBeDefined();
    expect(child!.age).toBe(0);
    expect(after.familyTree!.edges.some((e) => e.to === child!.id && e.label === 'parent')).toBe(true);
  });

  it('does not add another child for a repeat has_child choice', () => {
    useGameStore.getState().newGame(202);
    useGameStore.setState({ pendingEvents: [BIRTH_EVENT], currentEventIndex: 0 });
    useGameStore.getState().resolveCurrentChoice('rejoice');
    const first = useGameStore.getState().familyTree!.members.filter((m) => m.role === 'child').length;

    useGameStore.setState({ pendingEvents: [BIRTH_EVENT], currentEventIndex: 0 });
    useGameStore.getState().resolveCurrentChoice('rejoice');
    const second = useGameStore.getState().familyTree!.members.filter((m) => m.role === 'child').length;
    expect(second).toBe(first);
  });
});