import type { Character, LifeEventDef } from '@/lib/engine/types';

export const CURRENT_SCHEMA_VERSION = 1;

export interface SaveStateV1 {
  schemaVersion: 1;
  savedAt: string;
  seed: number;
  rngState: number;
  character: Character;
  /** Full event definitions awaiting a player choice — kept JSON-serializable (Gate 2). */
  pendingEvents: LifeEventDef[];
  /** Index into pendingEvents of the event currently on screen. */
  currentEventIndex: number;
}

export type SaveState = SaveStateV1;

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

  return state;
}

export function migrateSave(data: unknown): SaveStateV1 {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Save file is empty or corrupted');
  }

  const record = data as Record<string, unknown>;

  if (record.schemaVersion === 1) {
    return record as unknown as SaveStateV1;
  }

  throw new Error(`No migration path for schema version ${String(record.schemaVersion)}`);
}

export function defaultSaveState(
  seed: number,
  rngState: number,
  character: Character,
  pendingEvents: LifeEventDef[] = [],
  currentEventIndex = 0
): SaveState {
  return {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    seed,
    rngState,
    character,
    pendingEvents,
    currentEventIndex,
  };
}