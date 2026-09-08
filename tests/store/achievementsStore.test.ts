import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { createInMemoryStorage } from '@/lib/save/storage';
import { createAchievementsStore } from '@/lib/store/achievementsStore';
import type { Character } from '@/lib/engine/types';

function ribbonEarner(seed: number): Character {
  const { character } = createCharacter(seed);
  character.age = 92;
  character.money = 500_000;
  character.education.graduated = true;
  character.criminalRecord.push({ offense: 'fraud', age: 40, sentenceYears: 3, served: true });
  return character;
}

describe('achievements store persistence (TESTING.md Gate 5)', () => {
  it('records newly earned ribbons, persists them, and dedupes across lives', () => {
    const storage = createInMemoryStorage();
    const store = createAchievementsStore({ storage });
    store.getState().hydrate();

    const first = store.getState().recordLife(ribbonEarner(1));
    expect(first).toContain('long_life');
    expect(first).toContain('scholar');
    expect(first).toContain('tycoon');
    expect(first).toContain('excon');

    const state = store.getState();
    expect(state.unlocked.long_life?.acquiredAt).toBeTruthy();
    expect(typeof state.unlocked.long_life?.acquiredAt).toBe('string');
    expect(storage.read()).toContain('long_life');
    expect(storage.read()).toContain('excon');

    // A second life with the same earnings unlocks nothing new.
    expect(store.getState().recordLife(ribbonEarner(2))).toEqual([]);

    // A fresh store hydrating from the same storage sees the unlocks.
    const secondStore = createAchievementsStore({ storage });
    secondStore.getState().hydrate();
    expect(secondStore.getState().unlocked.long_life?.acquiredAt).toBeTruthy();
    expect(Object.keys(secondStore.getState().unlocked)).toContain('scholar');
    expect(secondStore.getState().unlocked).toEqual(state.unlocked);
  });

  it('a fresh storage starts empty and unlock/reset behave', () => {
    const storage = createInMemoryStorage();
    const store = createAchievementsStore({ storage });
    store.getState().hydrate();
    expect(store.getState().unlocked).toEqual({});

    expect(store.getState().unlock('celebrity')).toBe(true);
    expect(store.getState().unlock('celebrity')).toBe(false);
    expect(storage.read()).toContain('celebrity');

    store.getState().resetAll();
    expect(store.getState().unlocked).toEqual({});
    expect(storage.read()).toBeNull();
  });

  it('a dead character and a living character alike are evaluated', () => {
    const storage = createInMemoryStorage();
    const store = createAchievementsStore({ storage });
    store.getState().hydrate();
    const { character } = createCharacter(4);
    character.age = 95;
    character.alive = false;
    character.causeOfDeath = 'old age';
    expect(store.getState().recordLife(character)).toContain('long_life');
  });
});