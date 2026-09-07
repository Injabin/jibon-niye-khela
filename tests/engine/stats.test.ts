import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import {
  applyStatEffects,
  applyYearlyDecay,
  clamp,
  happinessDrift,
  healthDecay,
  looksDecay,
  oldAgeDeathChance,
} from '@/lib/engine/stats';

describe('stat clamping (Gate 1 / Test 2)', () => {
  it('clamp caps overflows to 100', () => {
    expect(clamp(101)).toBe(100);
    expect(clamp(999)).toBe(100);
  });

  it('clamp floors underflows to 0', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(-999)).toBe(0);
  });

  it('clamp handles custom bounds', () => {
    expect(clamp(5, -10, 10)).toBe(5);
    expect(clamp(50, -10, 10)).toBe(10);
    expect(clamp(-50, -10, 10)).toBe(-10);
  });

  it('clamps NaN to the minimum', () => {
    expect(clamp(Number.NaN)).toBe(0);
  });

  it('applyStatEffects clamps all four stats from opposite extremes', () => {
    const { character } = createCharacter(1);
    character.stats.health = 10;
    character.stats.happiness = 50;
    character.stats.smarts = 90;
    character.stats.looks = 5;

    applyStatEffects(character, {
      health: -999,
      happiness: +999,
      smarts: +999,
      looks: -999,
    });

    expect(character.stats.health).toBe(0);
    expect(character.stats.happiness).toBe(100);
    expect(character.stats.smarts).toBe(100);
    expect(character.stats.looks).toBe(0);
  });

  it('clamps reputation fame and karma', () => {
    const { character } = createCharacter(2);
    applyStatEffects(character, { fame: -999, karma: +999 });
    expect(character.reputation.fame).toBe(0);
    expect(character.reputation.karma).toBe(100);
  });

  it('keeps money inside the negative-to-positive bounds', () => {
    const { character } = createCharacter(3);
    applyStatEffects(character, { money: -999_999_999 });
    expect(character.money).toBeGreaterThanOrEqual(-10_000_000);
    applyStatEffects(character, { money: 999_999_999_999 });
    expect(character.money).toBeLessThanOrEqual(10_000_000_000);
  });

  it('rounds results to integers', () => {
    const { character } = createCharacter(4);
    applyStatEffects(character, { health: 0.7 });
    expect(Number.isInteger(character.stats.health)).toBe(true);
  });
});

describe('yearly decay curves (DESIGN.md §4)', () => {
  it('health does not decay before age 50', () => {
    expect(healthDecay(30)).toBe(0);
    expect(healthDecay(50)).toBe(0);
  });

  it('health decays in old age and grows with age', () => {
    expect(healthDecay(60)).toBeGreaterThan(0);
    expect(healthDecay(85)).toBeGreaterThan(healthDecay(60));
  });

  it('happiness drifts toward the neutral 50', () => {
    expect(happinessDrift(10)).toBeGreaterThan(0);
    expect(happinessDrift(90)).toBeLessThan(0);
    expect(happinessDrift(50)).toBe(0);
  });

  it('looks decay only past 60', () => {
    expect(looksDecay(55)).toBe(0);
    expect(looksDecay(70)).toBeGreaterThan(0);
  });

  it('applyYearlyDecay keeps all stats clamped', () => {
    const { character } = createCharacter(5);
    character.age = 90;
    character.stats.health = 1;
    for (let i = 0; i < 5; i++) {
      applyYearlyDecay(character);
    }
    for (const stat of ['health', 'happiness', 'smarts', 'looks'] as const) {
      expect(character.stats[stat]).toBeGreaterThanOrEqual(0);
      expect(character.stats[stat]).toBeLessThanOrEqual(100);
    }
  });
});

describe('old-age death curve (DESIGN.md §5.8)', () => {
  it('has zero risk below 68', () => {
    expect(oldAgeDeathChance(0)).toBe(0);
    expect(oldAgeDeathChance(50)).toBe(0);
    expect(oldAgeDeathChance(67)).toBe(0);
  });

  it('rises after ~70 and caps at 1.0', () => {
    expect(oldAgeDeathChance(75)).toBeGreaterThan(0);
    expect(oldAgeDeathChance(100)).toBe(1);
    expect(oldAgeDeathChance(140)).toBe(1);
  });

  it('monotonically increases with age', () => {
    for (let age = 68; age < 100; age++) {
      expect(oldAgeDeathChance(age + 1)).toBeGreaterThanOrEqual(oldAgeDeathChance(age));
    }
  });
});