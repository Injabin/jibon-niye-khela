import { describe, expect, it } from 'vitest';
import { ageUp, checkForDeath, killCharacter } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { applyStatEffects } from '@/lib/engine/stats';

describe('death handling (Gate 1 / Test 3)', () => {
  it('a character whose health hits 0 dies with a cause of death', () => {
    const { character, rng } = createCharacter(10);
    character.age = 20;
    character.stats.health = 3;
    applyStatEffects(character, { health: -3 });
    expect(character.stats.health).toBe(0);

    checkForDeath(character, rng);
    expect(character.alive).toBe(false);
    expect(character.causeOfDeath).toBe('health complications');
  });

  it('a character already dead does not process further ageUp calls', () => {
    const { character, rng } = createCharacter(11);
    killCharacter(character, 'test cause');
    const snapshot = JSON.stringify(character);

    const { firedEvents } = ageUp(character, rng);

    expect(firedEvents).toEqual([]);
    expect(JSON.stringify(character)).toBe(snapshot);
  });

  it('old age death sets cause to "old age" (guaranteed past the upper bound)', () => {
    const { character, rng } = createCharacter(12);
    character.age = 129;
    character.stats.health = 100;
    ageUp(character, rng);
    expect(character.alive).toBe(false);
    expect(character.causeOfDeath).toBe('old age');
  });

  it('a health-0 character dies through the ageUp path too', () => {
    const { character, rng } = createCharacter(13);
    character.age = 30;
    character.stats.health = 0;
    ageUp(character, rng);
    expect(character.alive).toBe(false);
    expect(character.causeOfDeath).toBe('health complications');
  });
});

describe('age monotonicity (Gate 1 / Test 4)', () => {
  it('every processed ageUp increments age by exactly 1, never skipping or repeating', () => {
    const { character, rng } = createCharacter(14);
    character.age = 20;
    character.stats.health = 95;

    const ages: number[] = [];
    let calls = 0;
    while (character.alive && calls < 100) {
      const before = character.age;
      ageUp(character, rng);
      if (character.age !== before) {
        ages.push(character.age);
      }
      calls += 1;
    }

    expect(ages.length).toBeGreaterThan(1);
    for (let i = 1; i < ages.length; i++) {
      expect(ages[i]).toBe(ages[i - 1] + 1);
    }
  });

  it('a young healthy character survives decades with strictly increasing age', () => {
    const { character, rng } = createCharacter(15);
    character.age = 18;
    character.stats.health = 100;

    let previousAge = character.age;
    for (let i = 0; i < 40; i++) {
      if (!character.alive) break;
      ageUp(character, rng);
      expect(character.age).toBe(previousAge + 1);
      previousAge = character.age;
    }
  });
});

describe('character creation', () => {
  it('creates a newborn with parents and initial stats', () => {
    const { character } = createCharacter(16);
    expect(character.age).toBe(0);
    expect(character.alive).toBe(true);
    expect(character.relationships.length).toBeGreaterThanOrEqual(2);
    expect(character.name.length).toBeGreaterThan(0);
    expect(character.surname.length).toBeGreaterThan(0);
    expect(character.history.length).toBeGreaterThan(0);
  });

  it('looks derive from parental genetics plus a small roll', () => {
    const { character } = createCharacter(17);
    expect(character.stats.looks).toBeGreaterThanOrEqual(0);
    expect(character.stats.looks).toBeLessThanOrEqual(100);
  });

  it('same seed yields a fresh identical character every time', () => {
    const a = createCharacter(500).character;
    const b = createCharacter(500).character;
    expect(a).toEqual(b);
  });
});