import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import { localStorageStorage } from '@/lib/save/storage';
import { BOND_MAX, BOND_PER_VISIT } from '@/lib/engine/family';

beforeEach(() => {
  useGameStore.getState().resetGame();
  localStorage.clear();
});

describe('spendTimeWith (M4 #3 bond interaction)', () => {
  it('raises a family member bond once per year, capped at 100', () => {
    useGameStore.getState().newGame(8);
    const tree = useGameStore.getState().familyTree!;
    const mother = tree.members.find((m) => m.role === 'mother')!;
    expect(mother.bond).toBeLessThan(BOND_MAX);

    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(true);
    const updated = useGameStore.getState().familyTree!.members.find((m) => m.id === mother.id)!;
    expect(updated.bond).toBe(Math.min(BOND_MAX, mother.bond + BOND_PER_VISIT));
    expect(updated.lastSpentAge).toBe(useGameStore.getState().character!.age);

    // A second visit in the same game year is refused.
    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(false);

    // Aging up re-opens the door for next year.
    useGameStore.getState().ageUp();
    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(true);
  });

  it('refuses the character node and a maxed member', () => {
    useGameStore.getState().newGame(8);
    const self = useGameStore.getState().familyTree!.members.find((m) => m.role === 'self')!;
    expect(useGameStore.getState().spendTimeWith(self.id)).toBe(false);

    useGameStore.setState((s) => ({
      familyTree:
        s.familyTree && {
          ...s.familyTree,
          members: s.familyTree.members.map((m) => (m.role === 'mother' ? { ...m, bond: BOND_MAX } : m)),
        },
    }));
    const mother = useGameStore.getState().familyTree!.members.find((m) => m.role === 'mother')!;
    expect(mother.bond).toBe(BOND_MAX);
    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(false);
  });

  it('syncs the character relationships meter with the same bond', () => {
    useGameStore.getState().newGame(8);
    const mother = useGameStore.getState().familyTree!.members.find((m) => m.role === 'mother')!;
    useGameStore.setState((s) => ({
      character: s.character && {
        ...s.character,
        relationships: [
          { id: 'r1', relation: 'mother', name: mother.name, age: 40, alive: true, meter: 60, metAge: 0 },
        ],
      },
    }));

    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(true);
    const synced = useGameStore.getState().character!.relationships.find((r) => r.relation === 'mother')!;
    const updated = useGameStore.getState().familyTree!.members.find((m) => m.id === mother.id)!;
    expect(synced.meter).toBe(updated.bond);
  });

  it('is refused after death', () => {
    useGameStore.getState().newGame(8);
    const mother = useGameStore.getState().familyTree!.members.find((m) => m.role === 'mother')!;
    useGameStore.setState((s) => ({ character: s.character && { ...s.character, alive: false } }));
    expect(useGameStore.getState().spendTimeWith(mother.id)).toBe(false);
  });

  it('refuses bond gain for a deceased member while the character is alive', () => {
    useGameStore.getState().newGame(8);
    const tree = useGameStore.getState().familyTree!;
    const grandparent = tree.members.find((m) => m.role === 'grandparent')!;
    // Mark the grandparent dead but keep the character alive.
    useGameStore.setState((s) => ({
      familyTree: s.familyTree && {
        ...s.familyTree,
        members: s.familyTree.members.map((m) =>
          m.id === grandparent.id ? { ...m, alive: false } : m,
        ),
      },
    }));
    expect(useGameStore.getState().spendTimeWith(grandparent.id)).toBe(false);
    // Bond must be untouched.
    const after = useGameStore.getState().familyTree!.members.find((m) => m.id === grandparent.id)!;
    expect(after.bond).toBe(grandparent.bond);
  });

  it('persists the raised bond into the exported save', () => {
    useGameStore.getState().newGame(8);
    const mother = useGameStore.getState().familyTree!.members.find((m) => m.role === 'mother')!;
    useGameStore.getState().spendTimeWith(mother.id);

    const json = useGameStore.getState().exportToJson()!;
    const parsed = JSON.parse(json) as { familyTree: { members: Array<{ id: string; bond: number }> } };
    const persisted = parsed.familyTree.members.find((m) => m.id === mother.id)!;
    expect(persisted.bond).toBe(mother.bond + BOND_PER_VISIT);
  });

  it('a fresh game always carries a persisted five-member tree', () => {
    useGameStore.getState().newGame(8);
    expect(useGameStore.getState().familyTree).not.toBeNull();
    const raw = localStorageStorage.read();
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { schemaVersion: number };
    expect(parsed.schemaVersion).toBe(2);
  });
});