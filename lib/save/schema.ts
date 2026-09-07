import type { Character, LifeEventDef } from '@/lib/engine/types';
import { generateFamilyTree, type FamilyTree } from '@/lib/engine/family';

export const CURRENT_SCHEMA_VERSION = 2;

export interface SaveStateV2 {
  schemaVersion: 2;
  savedAt: string;
  seed: number;
  rngState: number;
  character: Character;
  /** Full event definitions awaiting a player choice — kept JSON-serializable (Gate 2). */
  pendingEvents: LifeEventDef[];
  /** Index into pendingEvents of the event currently on screen. */
  currentEventIndex: number;
  /**
   * Household family tree (init.md M4 #3, DESIGN.md §9). Added in schema v2;
   * a v1 save migrates by regenerating it deterministically from the seed.
   */
  familyTree: FamilyTree;
}

export type SaveState = SaveStateV2;

function isCharacterLike(value: unknown): value is Character {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.stats === 'object' &&
    v.stats !== null &&
    typeof v.age === 'number' &&
    typeof v.alive === 'boolean' &&
    Array.isArray(v.traits)
  );
}

function isLifeEventLike(value: unknown): value is LifeEventDef {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    typeof v.minAge === 'number' &&
    typeof v.maxAge === 'number' &&
    typeof v.weight === 'number' &&
    Array.isArray(v.choices)
  );
}

function isFamilyTreeLike(value: unknown): value is FamilyTree {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.selfId === 'string' &&
    Array.isArray(v.members) &&
    Array.isArray(v.edges) &&
    v.members.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as Record<string, unknown>).id === 'string' &&
        typeof (m as Record<string, unknown>).name === 'string' &&
        typeof (m as Record<string, unknown>).bond === 'number',
    )
  );
}

export function serializeState(state: SaveState): string {
  return JSON.stringify(state);
}

export function deserializeState(raw: string): SaveState {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Save file is not a valid object');
  }

  const migrated = migrateSave(parsed);
  const state = migrated as SaveState;

  if (state.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${state.schemaVersion}`);
  }
  if (!isCharacterLike(state.character)) {
    throw new Error('Save file has an invalid character payload');
  }
  if (state.pendingEvents !== undefined && !Array.isArray(state.pendingEvents)) {
    throw new Error('Save file has an invalid pending-events payload');
  }
  if (state.pendingEvents && state.pendingEvents.some((e) => !isLifeEventLike(e))) {
    throw new Error('Save file contains a malformed pending event');
  }
  if (!isFamilyTreeLike(state.familyTree)) {
    throw new Error('Save file has an invalid family-tree payload');
  }

  return state;
}

export function migrateSave(data: unknown): SaveStateV2 {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Save file is empty or corrupted');
  }

  const record = data as Record<string, unknown>;

  if (record.schemaVersion === 2) {
    return record as unknown as SaveStateV2;
  }

  // v1 → v2: rebuild the household tree deterministically from the seed so a
  // legacy save keeps its exact character but gains a consistent family (DESIGN §9).
  if (record.schemaVersion === 1) {
    const v1 = record as unknown as { character: Character; seed: number };
    if (!isCharacterLike(v1.character) || typeof v1.seed !== 'number') {
      throw new Error('Save file is empty or corrupted');
    }
    return {
      ...(record as object),
      familyTree: generateFamilyTree(v1.character, v1.seed),
      schemaVersion: 2,
    } as unknown as SaveStateV2;
  }

  throw new Error(`No migration path for schema version ${String(record.schemaVersion)}`);
}

export function defaultSaveState(
  seed: number,
  rngState: number,
  character: Character,
  pendingEvents: LifeEventDef[] = [],
  currentEventIndex = 0,
  familyTree: FamilyTree | null = null,
): SaveState {
  return {
    schemaVersion: 2,
    savedAt: new Date().toISOString(),
    seed,
    rngState,
    character,
    pendingEvents,
    currentEventIndex,
    familyTree: familyTree ?? generateFamilyTree(character, seed),
  };
}