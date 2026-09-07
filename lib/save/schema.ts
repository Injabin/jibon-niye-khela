import { Character } from '../engine/types';

export const CURRENT_SCHEMA_VERSION = 2;

export interface SaveStateV1 {
  schemaVersion: 1;
  rngState: number;
  character: Record<string, unknown>; // Legacy
  currentEvents: string[];
}

export interface SaveStateV2 {
  schemaVersion: 2;
  rngState: number;
  character: Character;
  currentEvents: string[];
}

export type SaveState = SaveStateV1 | SaveStateV2; // Union of schema versions

export function migrateSave(data: unknown): SaveStateV2 | null {
  if (!data || typeof data !== 'object') return null;
  const typedData = data as Record<string, unknown>;
  if (!typedData.schemaVersion) return null;

  let current = typedData;

  // Migrate V1 to V2
  if (current.schemaVersion === 1) {
    const v1 = current as Record<string, unknown>;
    const char = v1.character as Record<string, unknown>;
    char.job = null;
    char.assets = [];
    v1.schemaVersion = 2;
    current = v1;
  }

  if (current.schemaVersion === 2) {
    return current as unknown as SaveStateV2;
  }

  return null;
}
