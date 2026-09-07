import type { SaveState } from './schema';
import { deserializeState, serializeState } from './schema';

/**
 * Stable persistence interface (init.md M2). localStorage backs it today;
 * idb-keyval can replace the implementation later without touching callers.
 */
export interface SaveStorage {
  read(): string | null;
  write(raw: string): void;
  clear(): void;
}

const STORAGE_KEY = 'jibon-niye-khela/save';

export const localStorageStorage: SaveStorage = {
  read() {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  },
  write(raw) {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, raw);
      }
    } catch {
      // Storage full or blocked (private mode): the session stays playable in memory.
    }
  },
  clear() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  },
};

export function createInMemoryStorage(initial = ''): SaveStorage {
  let value = initial;
  return {
    read: () => value || null,
    write: (raw: string) => {
      value = raw;
    },
    clear: () => {
      value = '';
    },
  };
}

export function loadSave(storage: SaveStorage): SaveState | null {
  const raw = storage.read();
  if (!raw) return null;
  try {
    return deserializeState(raw);
  } catch {
    return null;
  }
}

export function storeSave(storage: SaveStorage, state: SaveState): void {
  storage.write(serializeState(state));
}

/** Export a save as a formatted, human-readable JSON string for the file picker. */
export function exportSave(state: SaveState): string {
  return JSON.stringify(state, null, 2);
}

/** Parse an imported save file; throws a descriptive Error on malformed input. */
export function importSave(raw: string): SaveState {
  return deserializeState(raw);
}