import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { generateFamilyTree } from '@/lib/engine/family';
import {
  CURRENT_SCHEMA_VERSION,
  defaultSaveState,
  deserializeState,
  migrateSave,
  serializeState,
} from '@/lib/save/schema';

describe('family tree persistence (schema v2, DESIGN.md §9)', () => {
  it('migrates a v1 save to v2 by regenerating the tree from the seed', () => {
    const { character } = createCharacter(21);
    const v1 = {
      schemaVersion: 1,
      savedAt: '2026-01-01T00:00:00.000Z',
      seed: 21,
      rngState: 99,
      character,
      pendingEvents: [],
      currentEventIndex: 0,
    };

    const migrated = migrateSave(v1);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.character).toEqual(character);
    expect(migrated.familyTree).toEqual(generateFamilyTree(character, 21));
  });

  it('migrating a legacy save is repeatable and idempotent', () => {
    const { character } = createCharacter(22);
    const v1 = { schemaVersion: 1, seed: 22, rngState: 0, character };
    const first = migrateSave(v1);
    const second = migrateSave(first);
    expect(second.character).toEqual(character);
    expect(second.familyTree).toEqual(first.familyTree);
  });

  it('a migrated save passes full deserialization', () => {
    const { character } = createCharacter(23);
    const raw = serializeState(migrateSave({ schemaVersion: 1, seed: 23, rngState: 0, character }));
    const restored = deserializeState(raw);
    expect(restored.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(restored.familyTree.members).toHaveLength(5);
    expect(restored.character).toEqual(character);
  });

  it('defaultSaveState persists the tree and the store round-trips it', () => {
    const { character } = createCharacter(24);
    const save = defaultSaveState(24, 7, character);
    expect(save.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(save.familyTree).toBeDefined();
    expect(save.familyTree.members.length).toBe(5);

    const restored = deserializeState(serializeState(save));
    expect(restored).toEqual(save);
    expect(restored.familyTree.selfId).toBe(save.familyTree.selfId);
  });

  it('rejects a save whose family tree payload is malformed', () => {
    const { character } = createCharacter(25);
    const good = defaultSaveState(25, 0, character);
    const broken = {
      ...good,
      familyTree: { selfId: 'a', members: 'nope', edges: [] },
    } as unknown as ReturnType<typeof defaultSaveState>;
    const raw = serializeState(broken);
    expect(() => deserializeState(raw)).toThrow();
  });
});