import { describe, expect, it } from 'vitest';
import { ageUp, checkForDeath, simulateLife } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import {
  CURRENT_SCHEMA_VERSION,
  defaultSaveState,
  deserializeState,
  migrateSave,
  serializeState,
} from '@/lib/save/schema';
import type { Character } from '@/lib/engine/types';

function roundTrip(character: Character, seed: number, rngState = 0): Character {
  const save = defaultSaveState(seed, rngState, character);
  const raw = serializeState(save);
  const restored = deserializeState(raw);
  expect(restored).toEqual(save);
  return restored.character;
}

describe('save schema round-trip (Gate 1 / Test 8)', () => {
  it('a fresh character round-trips losslessly', () => {
    const { character } = createCharacter(31);
    const restored = roundTrip(character, 31);
    expect(restored).toEqual(character);
  });

  it('a mid-life character with events, traits and history round-trips', async () => {
    const { character, rng } = createCharacter(32);
    let rngState = 0;
    let guard = 0;
    while (character.alive && character.age < 45 && guard < 100) {
      const { firedEvents } = ageUp(character, rng);
      for (const event of firedEvents) {
        const choice = rng.pick(event.choices);
        resolveEventChoice(character, event, choice.id);
        checkForDeath(character, rng);
      }
      rngState = rng.getState();
      guard += 1;
    }
    await Promise.resolve();
    const restored = roundTrip(character, 32, rngState);
    expect(restored).toEqual(character);
  });

  it('a dead character round-trips with its cause of death', () => {
    const character = simulateLife(33);
    expect(character.alive).toBe(false);
    const restored = roundTrip(character, 33);
    expect(restored.causeOfDeath).toBe(character.causeOfDeath);
    expect(restored).toEqual(character);
  });

  it('serialized output is plain JSON with no functions', () => {
    const { character } = createCharacter(34);
    const raw = serializeState(defaultSaveState(34, 0, character));
    const parsed = JSON.parse(raw);
    expect(typeof parsed).toBe('object');
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('deserializeState rejects malformed payloads', () => {
    expect(() => deserializeState('not json')).toThrow();
    expect(() => deserializeState(JSON.stringify('hello'))).toThrow();
    expect(() => deserializeState(JSON.stringify({ schemaVersion: 1, character: {} }))).toThrow();
  });

  it('migrateSave accepts the current version and rejects unknowns', () => {
    expect(() => migrateSave({ schemaVersion: CURRENT_SCHEMA_VERSION })).not.toThrow();
    expect(() => migrateSave({ schemaVersion: 999 })).toThrow();
  });
});

describe('engine determinism is save-compatible', () => {
  it('replaying from a checkpoint recreates the same later state', () => {
    const seed = 55;
    const { character, rng } = createCharacter(seed);

    let guard = 0;
    while (character.age < 20 && character.alive && guard < 50) {
      const { firedEvents } = ageUp(character, rng);
      for (const event of firedEvents) {
        const choice = rng.pick(event.choices);
        resolveEventChoice(character, event, choice.id);
        checkForDeath(character, rng);
      }
      guard += 1;
    }
    const checkpointRng = rng.getState();

    // Box the state via the serialized save, then keep two copies playing.
    const boxed = deserializeState(serializeState(defaultSaveState(seed, checkpointRng, character)));
    const replayRng = new RNG(seed);
    replayRng.setState(boxed.rngState);

    const boxedCharacter = boxed.character;
    let guard2 = 0;
    while (character.alive && boxedCharacter.alive && guard2 < 30) {
      const stepA = ageUp(character, rng);
      for (const e of stepA.firedEvents) {
        resolveEventChoice(character, e, rng.pick(e.choices).id);
        checkForDeath(character, rng);
      }
      const stepB = ageUp(boxedCharacter, replayRng);
      for (const e of stepB.firedEvents) {
        resolveEventChoice(boxedCharacter, e, replayRng.pick(e.choices).id);
        checkForDeath(boxedCharacter, replayRng);
      }
      expect(boxedCharacter).toEqual(character);
      guard2 += 1;
    }
  });
});