import { create } from 'zustand';
import { ageUp, checkForDeath } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import { RNG } from '@/lib/engine/rng';
import type { Character, LifeEventDef } from '@/lib/engine/types';
import { defaultSaveState } from '@/lib/save/schema';
import type { SaveState } from '@/lib/save/schema';
import {
  exportSave,
  importSave,
  loadSave,
  localStorageStorage,
  storeSave,
} from '@/lib/save/storage';

function makeRng(seed: number, state: number): RNG {
  const rng = new RNG(seed);
  rng.setState(state);
  return rng;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export interface GameStoreState {
  character: Character | null;
  seed: number;
  rngState: number;
  pendingEvents: LifeEventDef[];
  currentEventIndex: number;
  savedAt: string | null;
  message: string | null;
  error: string | null;
  isHydrated: boolean;
}

export interface GameStoreActions {
  /** Restore a save from storage once per page load. */
  hydrate(): void;
  /** Start a new life; an explicit seed is honoured (tests). Returns the seed used. */
  newGame(seed?: number): number;
  /** Advance one year. No-op while a choice is pending or after death. */
  ageUp(): boolean;
  /** Resolve the current pending event with the player's choice. */
  resolveCurrentChoice(choiceId: string): boolean;
  /** Export the current game as a formatted JSON string; null when no character exists. */
  exportToJson(): string | null;
  /** Import a raw save file. Returned boolean is success; sets `error`/`message` accordingly. */
  importFromRaw(raw: string): boolean;
  /** Wipe storage and all in-memory state. */
  resetGame(): void;
}

type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  character: null,
  seed: 0,
  rngState: 0,
  pendingEvents: [],
  currentEventIndex: 0,
  savedAt: null,
  message: null,
  error: null,
  isHydrated: false,
};

function toSaveState(s: GameStoreState, character: Character): SaveState {
  return defaultSaveState(s.seed, s.rngState, character, s.pendingEvents, s.currentEventIndex);
}

export const useGameStore = create<GameStore>()((set, get) => {
  function persist(): void {
    const s = get();
    if (!s.character) return;
    const savedAt = new Date().toISOString();
    const state = defaultSaveState(s.seed, s.rngState, s.character, s.pendingEvents, s.currentEventIndex);
    state.savedAt = savedAt;
    storeSave(localStorageStorage, state);
    set({ savedAt });
  }

  return {
    ...initialState,

    hydrate() {
      if (get().isHydrated) return;
      const save = loadSave(localStorageStorage);
      if (save) {
        set({
          character: save.character,
          seed: save.seed,
          rngState: save.rngState,
          pendingEvents: save.pendingEvents ?? [],
          currentEventIndex: save.currentEventIndex ?? 0,
          savedAt: save.savedAt,
          message: null,
          error: null,
        });
      }
      set({ isHydrated: true });
    },

    newGame(seedOverride) {
      const seed = seedOverride ?? randomSeed();
      const { character, rng } = createCharacter(seed);
      set({
        character,
        seed,
        rngState: rng.getState(),
        pendingEvents: [],
        currentEventIndex: 0,
        message: 'A new life begins…',
        error: null,
      });
      persist();
      return seed;
    },

    ageUp() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = ageUp(character, rng);

      set({
        character: result.character,
        rngState: rng.getState(),
        pendingEvents: [...result.firedEvents],
        currentEventIndex: 0,
        message: null,
        error: null,
      });
      persist();
      return true;
    },

    resolveCurrentChoice(choiceId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length === 0) return false;

      const event = s.pendingEvents[s.currentEventIndex];
      if (!event) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      resolveEventChoice(character, event, choiceId);
      checkForDeath(character, rng);

      const nextIndex = s.currentEventIndex + 1;
      const done = nextIndex >= s.pendingEvents.length;

      set({
        character,
        rngState: rng.getState(),
        pendingEvents: done ? [] : s.pendingEvents,
        currentEventIndex: done ? 0 : nextIndex,
        error: null,
      });
      persist();
      return true;
    },

    exportToJson() {
      const s = get();
      if (!s.character) return null;
      return exportSave(toSaveState(s, s.character));
    },

    importFromRaw(raw) {
      try {
        const save = importSave(raw);
        set({
          character: save.character,
          seed: save.seed,
          rngState: save.rngState,
          pendingEvents: save.pendingEvents ?? [],
          currentEventIndex: save.currentEventIndex ?? 0,
          savedAt: save.savedAt,
          message: 'Save imported.',
          error: null,
        });
        persist();
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'The save file could not be read.';
        set({ error: message });
        return false;
      }
    },

    resetGame() {
      localStorageStorage.clear();
      set({ ...initialState, isHydrated: get().isHydrated });
    },
  };
});

if (typeof window !== 'undefined') {
  (window as unknown as { __JNK_GAME_STORE__?: unknown }).__JNK_GAME_STORE__ = useGameStore;
}