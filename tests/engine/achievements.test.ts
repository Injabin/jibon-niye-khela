import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { evaluateRibbons, RIBBONS, ribbonById } from '@/lib/engine/achievements';
import type { Character } from '@/lib/engine/types';

/** A storied late-life character that should trip nearly every ribbon. */
function storiedLife(seed: number): Character {
  const { character } = createCharacter(seed);
  character.age = 92;
  character.money = 500_000;
  character.education.graduated = true;
  character.flags.push('gpa_high', 'has_house', 'has_child', 'job_military');
  character.reputation.fame = 90;
  character.criminalRecord.push({ offense: 'fraud', age: 40, sentenceYears: 3, served: true });
  return character;
}

describe('achievements / ribbons (DESIGN.md §5.9)', () => {
  it('every ribbon has a unique id, a name, and a description', () => {
    const ids = new Set(RIBBONS.map((r) => r.id));
    expect(ids.size).toBe(RIBBONS.length);
    for (const ribbon of RIBBONS) {
      expect(ribbon.name.length).toBeGreaterThan(0);
      expect(ribbon.description.length).toBeGreaterThan(0);
    }
  });

  it('a young ordinary character has earned nothing', () => {
    const { character } = createCharacter(9);
    expect(evaluateRibbons(character)).toEqual([]);
  });

  it('a storied life trips many distinguishable ribbons at once', () => {
    const earned = evaluateRibbons(storiedLife(1));
    expect(earned).toContain('long_life');
    expect(earned).toContain('scholar');
    expect(earned).toContain('straight_a');
    expect(earned).toContain('tycoon');
    expect(earned).toContain('homeowner');
    expect(earned).toContain('family_life');
    expect(earned).toContain('veteran');
    expect(earned).toContain('excon');
    expect(earned).toContain('celebrity');
    expect(earned.length).toBeGreaterThanOrEqual(3);
  });

  it('an ex-con requires the sentence to have been served', () => {
    const { character } = createCharacter(3);
    character.criminalRecord.push({ offense: 'burglary', age: 30, sentenceYears: 2, served: false });
    expect(evaluateRibbons(character)).not.toContain('excon');
    character.criminalRecord[0].served = true;
    expect(evaluateRibbons(character)).toContain('excon');
  });

  it('ribbonById resolves known ids and misses unknown ones', () => {
    expect(ribbonById('scholar')?.name).toBe('Cap and Gown');
    expect(ribbonById('not-a-ribbon')).toBeUndefined();
  });
});