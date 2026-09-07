import { Character } from '../engine/types';

export const CURRENT_SCHEMA_VERSION = 1;

export interface SaveStateV1 {
  schemaVersion: 1;
  rngState: number;
  character: Character;
  currentEvents: string[]; // IDs of events waiting for resolution
}

export type SaveState = SaveStateV1; // Union of future schema versions

export function migrateSave(data: unknown): SaveState | null {
  if (!data || typeof data !== 'object') return null;
  const typedData = data as Record<string, unknown>;
  if (!typedData.schemaVersion) return null;

  // Stub for future migrations
  if (typedData.schemaVersion === 1) {
    return typedData as unknown as SaveStateV1;
  }

  return null;
}
