import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';

describe('Custom Life Creator Engine (Gate 9 / Additional_plus_improved_plan.md)', () => {
  it('creates custom character with custom name, surname, gender, and birth year', () => {
    const { character } = createCharacter(42, {
      name: 'Tariq',
      surname: 'Ahmed',
      gender: 'male',
      birthYear: 1995,
      wealthTier: 'middle',
      startingTraits: ['athletic', 'charismatic'],
    });

    expect(character.name).toBe('Tariq');
    expect(character.surname).toBe('Ahmed');
    expect(character.gender).toBe('male');
    expect(character.birthYear).toBe(1995);
    expect(character.traits).toContain('athletic');
    expect(character.traits).toContain('charismatic');
  });

  it('custom wealthTier alters starting funds and baseline privileges appropriately', () => {
    const poor = createCharacter(100, { wealthTier: 'poor' }).character;
    const middle = createCharacter(100, { wealthTier: 'middle' }).character;
    const wealthy = createCharacter(100, { wealthTier: 'wealthy' }).character;

    // Poor starts with low money, high resilience/karma
    expect(poor.money).toBeLessThanOrEqual(50);
    expect(poor.reputation.karma).toBeGreaterThanOrEqual(60);

    // Middle starts with moderate money
    expect(middle.money).toBeGreaterThanOrEqual(150);
    expect(middle.money).toBeLessThan(1000);

    // Wealthy starts with substantial seed money and looks/privilege
    expect(wealthy.money).toBeGreaterThanOrEqual(2000);
    expect(wealthy.stats.looks).toBeGreaterThanOrEqual(middle.stats.looks);
  });

  it('unparameterized createCharacter maintains exact 0-regression determinism across 200 seeds (Gate 1 baseline)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const runA = createCharacter(seed);
      const runB = createCharacter(seed);

      expect(runA.character.name).toBe(runB.character.name);
      expect(runA.character.surname).toBe(runB.character.surname);
      expect(runA.character.gender).toBe(runB.character.gender);
      expect(runA.character.stats).toEqual(runB.character.stats);
      expect(runA.character.money).toBe(runB.character.money);
      expect(runA.character.traits).toEqual(runB.character.traits);
      expect(runA.character.alive).toBe(true);
      expect(runA.character.age).toBe(0);
    }
  });
});
