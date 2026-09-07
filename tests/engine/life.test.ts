import { describe, expect, it } from 'vitest';
import { ageUp, checkForDeath, simulateLife, UPPER_AGE_BOUND } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import { lifeStageForAge } from '@/lib/engine/life';

const LIVES_TO_SIMULATE = 200;

describe(`full-life stress (Gate 1 / Test 7): ${LIVES_TO_SIMULATE} lives`, () => {
  it('every simulated life terminates before the upper bound', () => {
    for (let seed = 0; seed < LIVES_TO_SIMULATE; seed++) {
      const character = simulateLife(seed);
      expect(character.alive, `seed ${seed} still alive`).toBe(false);
      expect(character.age, `seed ${seed} exceeded bound`).toBeLessThan(UPPER_AGE_BOUND);
    }
  });

  it('every life ends dead with a cause of death recorded', () => {
    for (let seed = 0; seed < LIVES_TO_SIMULATE; seed++) {
      const character = simulateLife(seed);
      expect(character.alive).toBe(false);
      expect(character.causeOfDeath, `seed ${seed}`).toBeTruthy();
      expect(typeof character.causeOfDeath).toBe('string');
    }
  });

  it('final stats always stay within [0, 100]', () => {
    for (let seed = 0; seed < LIVES_TO_SIMULATE; seed++) {
      const character = simulateLife(seed);
      for (const stat of ['health', 'happiness', 'smarts', 'looks'] as const) {
        expect(character.stats[stat], `seed ${seed} stat ${stat}`).toBeGreaterThanOrEqual(0);
        expect(character.stats[stat], `seed ${seed} stat ${stat}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('no life throws an exception', () => {
    expect(() => {
      for (let seed = 0; seed < LIVES_TO_SIMULATE; seed++) {
        simulateLife(seed);
      }
    }).not.toThrow();
  });
});

describe('human-shaped life distribution', () => {
  it('median lifespan lands within a plausible 40-95 range', () => {
    const ages = [];
    for (let seed = 0; seed < 300; seed++) {
      ages.push(simulateLife(seed).age);
    }
    ages.sort((a, b) => a - b);
    const median = ages[Math.floor(ages.length / 2)];
    expect(median).toBeGreaterThan(40);
    expect(median).toBeLessThan(95);
  });
});

describe('life-stage classification (Gate 3 music/tone cueing)', () => {
  it('maps the lifespan to the expected arcs at boundary ages', () => {
    expect(lifeStageForAge(0)).toBe('infant');
    expect(lifeStageForAge(3)).toBe('infant');
    expect(lifeStageForAge(4)).toBe('child');
    expect(lifeStageForAge(12)).toBe('child');
    expect(lifeStageForAge(13)).toBe('teen');
    expect(lifeStageForAge(17)).toBe('teen');
    expect(lifeStageForAge(18)).toBe('young-adult');
    expect(lifeStageForAge(25)).toBe('young-adult');
    expect(lifeStageForAge(26)).toBe('adult');
    expect(lifeStageForAge(40)).toBe('adult');
    expect(lifeStageForAge(41)).toBe('middle-aged');
    expect(lifeStageForAge(65)).toBe('middle-aged');
    expect(lifeStageForAge(66)).toBe('senior');
    expect(lifeStageForAge(99)).toBe('senior');
  });

  it('produces a monotonic arc across a full simulated life', () => {
    const order = ['infant', 'child', 'teen', 'young-adult', 'adult', 'middle-aged', 'senior'];
    const character = simulateLife(2024);
    const stages: string[] = [];
    for (let age = 0; age <= character.age; age++) {
      const stage = lifeStageForAge(age);
      if (stages.length === 0 || stages[stages.length - 1] !== stage) stages.push(stage);
    }
    const positions = stages.map((s) => order.indexOf(s));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i], `stage regression at index ${i}`).toBeGreaterThanOrEqual(positions[i - 1]);
    }
  });
});

describe('interactive play loop (UI path)', () => {
  it('simulates a life where the player picks choices and deaths are checked after each', () => {
    const { character, rng } = createCharacter(77);
    let eventsSeen = 0;

    while (character.alive && character.age < UPPER_AGE_BOUND) {
      const { firedEvents } = ageUp(character, rng);
      for (const event of firedEvents) {
        eventsSeen += 1;
        const choice = rng.pick(event.choices);
        resolveEventChoice(character, event, choice.id);
        checkForDeath(character, rng);
      }
    }

    expect(character.alive).toBe(false);
    expect(character.causeOfDeath).toBeTruthy();
    expect(eventsSeen).toBeGreaterThan(0);
  });
});

describe('headless life log', () => {
  it('prints a formatted life from birth to death (visible in test output)', () => {
    const character = simulateLife(1234);

    const lines: string[] = [
      `— Life #1234 —`,
      `${character.name} ${character.surname} (${character.gender}), born ${character.birthYear}`,
      `Traits: ${character.traits.length ? character.traits.join(', ') : 'none'}`,
      `Lived to age ${character.age}. Cause: ${character.causeOfDeath}`,
      `Final stats — health ${character.stats.health}, happiness ${character.stats.happiness}, smarts ${character.stats.smarts}, looks ${character.stats.looks}`,
      `Net worth: ${character.money} coins`,
      '',
      'Life log:',
    ];

    for (const entry of character.history) {
      lines.push(`  [age ${entry.age}] (${entry.tone}) ${entry.text}`);
    }

    console.log(lines.join('\n'));
    expect(character.alive).toBe(false);
  });
});