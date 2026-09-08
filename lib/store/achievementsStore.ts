/**
 * Persisted achievements store (DESIGN.md §5.9, init.md M5 #2).
 *
 * Ribbons unlocked across playthroughs live in localStorage under their own
 * key, logic-free and JSON-serializable, so Gate 5's "recorded and persisted"
 * requirement is testable with an injected storage (same pattern as
 * `settingsStore`). Evaluation logic stays in `lib/engine/achievements.ts`.
 */

import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { evaluateRibbons } from '@/lib/engine/achievements';
import type { Character } from '@/lib/engine/types';
import type { SaveStorage } from '@/lib/save/storage';
import { localStorageStorage } from '@/lib/save/storage';

export const ACHIEVEMENTS_STORAGE_KEY = 'jibon-niye-khela/achievements';

export interface AchievementRecord {
  acquiredAt: string;
}

export interface AchievementsState {
  /** ribbon id → when it was first earned. */
  unlocked: Record<string, AchievementRecord>;
  isHydrated: boolean;
}

export interface AchievementsActions {
  /** Restore once per page load. */
  hydrate(): void;
  /**
   * Evaluate a character against all ribbons, record any newly earned.
   * Returns the ids unlocked by this character.
   */
  recordLife(character: Character): string[];
  /** Manually record a single ribbon (tests / manual QA). */
  unlock(id: string): boolean;
  resetAll(): void;
}

type AchievementsStore = AchievementsState & AchievementsActions;

function sanitize(raw: Partial<AchievementsState> | null | undefined): AchievementsState {
  const unlocked: Record<string, AchievementRecord> = {};
  const fallback = new Date().toISOString();
  if (raw && typeof raw.unlocked === 'object' && raw.unlocked !== null) {
    for (const [id, record] of Object.entries(raw.unlocked)) {
      const at = typeof record?.acquiredAt === 'string' ? record.acquiredAt : fallback;
      unlocked[id] = { acquiredAt: at };
    }
  }
  return { unlocked, isHydrated: true };
}

interface CreateAchievementsStoreOptions {
  storage?: SaveStorage;
}

export function createAchievementsStore(
  options: CreateAchievementsStoreOptions = {},
): UseBoundStore<StoreApi<AchievementsStore>> {
  const storage = options.storage ?? localStorageStorage;

  return create<AchievementsStore>()((set, get) => {
    function persist(): void {
      storage.write(JSON.stringify({ unlocked: get().unlocked }));
    }

    return {
      unlocked: {},
      isHydrated: false,

      hydrate() {
        if (get().isHydrated) return;
        let raw: string | null = null;
        try {
          raw = storage.read();
        } catch {
          raw = null;
        }
        set(raw ? sanitize(JSON.parse(raw) as Partial<AchievementsState>) : sanitize(null));
      },

      recordLife(character) {
        const earned = evaluateRibbons(character);
        const unlocked = { ...get().unlocked };
        const newly: string[] = [];
        const acquiredAt = new Date().toISOString();
        for (const id of earned) {
          if (!unlocked[id]) {
            unlocked[id] = { acquiredAt };
            newly.push(id);
          }
        }
        if (newly.length > 0) {
          set({ unlocked });
          persist();
        }
        return newly;
      },

      unlock(id) {
        if (get().unlocked[id]) return false;
        const unlocked = { ...get().unlocked, [id]: { acquiredAt: new Date().toISOString() } };
        set({ unlocked });
        persist();
        return true;
      },

      resetAll() {
        storage.clear();
        set({ unlocked: {}, isHydrated: get().isHydrated });
      },
    };
  });
}

/** The app-wide singleton achievements store. */
export const achievementsStore = createAchievementsStore();