import { create } from 'zustand';
import { Character, LifeEventDef } from '../engine/types';
import { createCharacter } from '../engine/character';
import { ageUp, resolveEventChoice } from '../engine/aging';
import { RNG } from '../engine/rng';
import { eventRegistry } from '../engine/events/registry';
import { migrateSave, SaveStateV2, CURRENT_SCHEMA_VERSION } from '../save/schema';
import { ActivityDef } from '../engine/activities';
import { Job } from '../engine/types';

interface GameState {
  character: Character | null;
  rngState: number;
  pendingEvents: LifeEventDef[];
  
  startGame: () => void;
  ageUp: () => void;
  resolveEvent: (eventId: string, choiceId: string) => void;
  performActivity: (activity: ActivityDef) => void;
  takeJob: (job: Job | null) => void;
  loadFromSave: (save: SaveStateV2) => void;
  getSnapshot: () => SaveStateV2 | null;
}

const SAVE_KEY = 'jibon_niye_khela_save';

export const useGameStore = create<GameState>((set, get) => ({
  character: null,
  rngState: 0,
  pendingEvents: [],

  startGame: () => {
    const seed = Date.now();
    const { character, rng } = createCharacter(seed);
    set({ character, rngState: rng.getState(), pendingEvents: [] });
    localStorage.removeItem(SAVE_KEY);
  },

  ageUp: () => {
    const { character, rngState, pendingEvents } = get();
    if (!character || pendingEvents.length > 0 || !character.alive) return;
    
    // Clone character to keep it pure
    const charDraft = JSON.parse(JSON.stringify(character));
    const rng = new RNG(rngState);
    
    const { character: updatedChar, firedEvents } = ageUp(charDraft, rng);
    
    set({ 
      character: updatedChar, 
      rngState: rng.getState(), 
      pendingEvents: firedEvents 
    });
    
    autoSave(get().getSnapshot());
  },

  resolveEvent: (eventId, choiceId) => {
    const { character, pendingEvents } = get();
    if (!character) return;

    const charDraft = JSON.parse(JSON.stringify(character));
    resolveEventChoice(charDraft, eventId, choiceId, eventRegistry);
    
    const remainingEvents = pendingEvents.filter(e => e.id !== eventId);
    
    set({ 
      character: charDraft,
      pendingEvents: remainingEvents
    });

    autoSave(get().getSnapshot());
  },

  performActivity: (activity) => {
    const { character, rngState } = get();
    if (!character) return;
    const charDraft = JSON.parse(JSON.stringify(character));
    const rng = new RNG(rngState);
    
    const outcome = activity.perform(charDraft, rng);
    
    charDraft.history.push({
      age: charDraft.age,
      text: outcome,
      tone: 'neutral'
    });
    
    set({ character: charDraft, rngState: rng.getState() });
    autoSave(get().getSnapshot());
  },

  takeJob: (job) => {
    const { character } = get();
    if (!character) return;
    const charDraft = JSON.parse(JSON.stringify(character));
    
    if (job) {
      charDraft.job = job;
      charDraft.history.push({
        age: charDraft.age,
        text: `You started a new job as a ${job.title}.`,
        tone: 'good'
      });
    } else if (charDraft.job) {
      charDraft.history.push({
        age: charDraft.age,
        text: `You quit your job as a ${charDraft.job.title}.`,
        tone: 'neutral'
      });
      charDraft.job = null;
    }
    
    set({ character: charDraft });
    autoSave(get().getSnapshot());
  },

  loadFromSave: (save) => {
    set({ 
      character: save.character, 
      rngState: save.rngState, 
      pendingEvents: save.currentEvents
        .map(id => eventRegistry.find(e => e.id === id)!)
        .filter(Boolean)
    });
  },

  getSnapshot: () => {
    const { character, rngState, pendingEvents } = get();
    if (!character) return null;
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      rngState,
      character,
      currentEvents: pendingEvents.map(e => e.id)
    };
  }
}));

function autoSave(snapshot: SaveStateV2 | null) {
  if (snapshot) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  }
}

export function initializeSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const migrated = migrateSave(data);
    if (migrated) {
      useGameStore.getState().loadFromSave(migrated);
      return true;
    }
  } catch (e) {
    console.error("Failed to load save", e);
  }
  return false;
}

export function exportSaveString(): string | null {
  const snapshot = useGameStore.getState().getSnapshot();
  return snapshot ? JSON.stringify(snapshot) : null;
}

export function importSaveString(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    const migrated = migrateSave(data);
    if (migrated) {
      useGameStore.getState().loadFromSave(migrated);
      autoSave(migrated);
      return true;
    }
  } catch (e) {
    console.error("Import failed", e);
  }
  return false;
}
