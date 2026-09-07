import { expect, test, describe } from 'vitest';
import { RNG } from '../lib/engine/rng';
import { createCharacter } from '../lib/engine/character';
import { ageUp, resolveEventChoice } from '../lib/engine/aging';
import { clamp, applyStatEffects } from '../lib/engine/stats';
import { getEligibleEvents, eventRegistry } from '../lib/engine/events/registry';

describe('RNG Determinism', () => {
  test('same seed produces same sequence', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(12345);
    
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.rangeInt(1, 10)).toBe(rng2.rangeInt(1, 10));
    expect(rng1.pick(['a', 'b', 'c'])).toBe(rng2.pick(['a', 'b', 'c']));
  });

  test('different seed produces different sequence (most of the time)', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(99999);
    // There is a tiny mathematical chance they match, but in practice they won't.
    expect(rng1.next()).not.toBe(rng2.next());
  });
});

describe('Stats', () => {
  test('clamp bounds properly', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-50)).toBe(0);
    expect(clamp(50)).toBe(50);
  });

  test('applyStatEffects clamps values', () => {
    const { character } = createCharacter(1);
    character.stats.health = 90;
    
    applyStatEffects(character, { health: 20 });
    expect(character.stats.health).toBe(100);

    applyStatEffects(character, { health: -200 });
    expect(character.stats.health).toBe(0);
    
    character.money = 10;
    applyStatEffects(character, { money: -20 });
    expect(character.money).toBe(0); // Money doesn't go below 0 (for now)
  });
});

describe('Events and Aging', () => {
  test('getEligibleEvents filters by age correctly', () => {
    const { character } = createCharacter(1);
    character.age = 4; // toddler
    
    const eligible = getEligibleEvents(character);
    const hasToddler = eligible.some(e => e.id === 'toddler_tantrum');
    const hasTeen = eligible.some(e => e.id === 'teen_party');
    
    expect(hasToddler).toBe(true);
    expect(hasTeen).toBe(false);
  });

  test('event choices apply correctly and log history', () => {
    const { character } = createCharacter(1);
    character.stats.happiness = 50;
    const initialHistoryLength = character.history.length;
    
    resolveEventChoice(character, 'toddler_first_steps', 'walk', eventRegistry);
    
    expect(character.stats.happiness).toBe(60); // +10
    expect(character.history.length).toBe(initialHistoryLength + 1);
    expect(character.history[character.history.length - 1].text).toContain('mother');
  });

  test('death by health triggers correctly', () => {
    const { character } = createCharacter(1);
    character.stats.health = 5;
    
    // An event that does -10 health
    resolveEventChoice(character, 'child_eat_bug', 'eat', eventRegistry);
    
    expect(character.stats.health).toBe(0);
    expect(character.alive).toBe(false);
    expect(character.causeOfDeath).toBe('fatal event complication');
  });
});

describe('Headless Full Life Simulation', () => {
  test('simulate 100 lives without crashing', () => {
    for (let i = 0; i < 100; i++) {
      const { character, rng } = createCharacter(i);
      
      // Safety breakout to prevent infinite loop
      let maxYears = 150;
      while (character.alive && maxYears > 0) {
        const { firedEvents } = ageUp(character, rng);
        
        // Randomly pick choices for any fired events
        for (const event of firedEvents) {
          const choice = rng.pick(event.choices);
          resolveEventChoice(character, event.id, choice.id, eventRegistry);
        }
        
        maxYears--;
      }
      
      expect(character.alive).toBe(false);
      expect(character.causeOfDeath).toBeTruthy();
    }
  });
});
