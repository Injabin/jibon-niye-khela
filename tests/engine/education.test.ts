import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { skipClass, joinDebateClub, tickEducation } from '@/lib/engine/events/categories/education';

describe('Education Extras (skipClass & joinDebateClub)', () => {
  it('skipClass raises happiness and logs even when not caught', () => {
    const rng = new RNG(5001);
    const { character } = createCharacter(5001);
    character.age = 10;
    character.education.enrolled = true;
    character.education.stage = 'elementary';

    const historyBefore = character.history.length;
    const result = skipClass(character, rng);
    expect(result.ok).toBe(true);
    expect(character.stats.happiness).toBeGreaterThan(0);
    expect(character.history.length).toBeGreaterThanOrEqual(historyBefore);
  });

  it('skipClass reduces smarts slightly on success', () => {
    const { character } = createCharacter(5002);
    character.age = 12;
    character.education.enrolled = true;
    character.education.stage = 'middle';
    const smartsBefore = character.stats.smarts;

    // Run many attempts to gather an average; happiness gained every time
    let totalSmarts = 0;
    for (let i = 0; i < 10; i++) {
      const c = structuredClone(character);
      const r = new RNG(5002 + i);
      skipClass(c, r);
      totalSmarts += c.stats.smarts;
    }
    expect(totalSmarts / 10).toBeLessThanOrEqual(smartsBefore);
  });

  it('skipClass logs a bad tone and hits GPA when caught (via probabilistic spread)', () => {
    let caughtObserved = false;
    for (let seed = 6000; seed < 6100; seed++) {
      const { character } = createCharacter(seed);
      character.age = 14;
      character.education.enrolled = true;
      character.education.stage = 'high';
      character.education.gpa = 3.5;
      const gpaBefore = character.education.gpa;
      const result = skipClass(character, new RNG(seed));
      if (result.tone === 'bad') {
        caughtObserved = true;
        expect(character.education.gpa).toBeLessThan(gpaBefore);
        break;
      }
    }
    expect(caughtObserved).toBe(true);
  });

  it('skipClass rejects when not enrolled', () => {
    const { character } = createCharacter(7001);
    const result = skipClass(character, new RNG(7001));
    expect(result.ok).toBe(false);
  });

  it('joinDebateClub costs money, raises smarts and sets the flag', () => {
    const { character } = createCharacter(8001);
    character.age = 12;
    character.education.enrolled = true;
    character.education.stage = 'middle';
    character.money = 2000;

    const moneyBefore = character.money;
    const result = joinDebateClub(character, new RNG(8001));
    expect(result.ok).toBe(true);
    expect(character.money).toBe(moneyBefore - 100);
    expect(character.flags).toContain('extracurricular_debate');
    expect(character.stats.smarts).toBeGreaterThan(0);
  });

  it('joinDebateClub rejects when not enrolled and when under age 10', () => {
    const { character: unenrolled } = createCharacter(9001);
    unenrolled.education.enrolled = false;
    expect(joinDebateClub(unenrolled, new RNG(9001)).ok).toBe(false);

    const { character: young } = createCharacter(9002);
    young.age = 8;
    young.education.enrolled = true;
    expect(joinDebateClub(young, new RNG(9002)).ok).toBe(false);
  });

  it('joinDebateClub can win a prize (probabilistic)', () => {
    let prizeObserved = false;
    for (let seed = 10000; seed < 10200; seed++) {
      const { character } = createCharacter(seed);
      character.age = 14;
      character.education.enrolled = true;
      character.money = 5000;
      const result = joinDebateClub(character, new RNG(seed));
      if (result.text.includes('পুরস্কার')) {
        prizeObserved = true;
        expect(result.text).toContain('৳');
        break;
      }
    }
    expect(prizeObserved).toBe(true);
  });

  it('tickEducation seeds classmates when enrolled', () => {
    const { character } = createCharacter(11001);
    character.age = 9;
    character.education.enrolled = true;
    character.education.stage = 'elementary';
    tickEducation(character, new RNG(11001));

    const classmates = character.relationships.filter((r) => r.relation === 'classmate');
    expect(classmates.length).toBeGreaterThanOrEqual(1);
    for (const c of classmates) {
      expect(c.age).toBeGreaterThanOrEqual(5);
      expect(c.alive).toBe(true);
    }
  });
});
