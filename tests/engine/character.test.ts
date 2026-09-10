import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import {
  MUSLIM_MALE_NAMES,
  MUSLIM_FEMALE_NAMES,
  MUSLIM_SURNAMES,
  HINDU_MALE_NAMES,
  HINDU_FEMALE_NAMES,
  HINDU_SURNAMES,
} from '@/content/names';

describe('Religion-aware Character Generation', () => {
  it('generates a Muslim male with correct religion, flags, name pool, and birth text', () => {
    const { character } = createCharacter(1111, { religion: 'islam', gender: 'male' });
    expect(character.religion).toBe('islam');
    expect(character.flags).toContain('religion_muslim');
    expect(character.flags).not.toContain('religion_hindu');
    expect(MUSLIM_MALE_NAMES).toContain(character.name);
    expect(MUSLIM_SURNAMES).toContain(character.surname);

    const mother = character.relationships.find((r) => r.relation === 'mother')!;
    const father = character.relationships.find((r) => r.relation === 'father')!;
    expect(MUSLIM_FEMALE_NAMES.some((n) => mother.name.includes(n))).toBe(true);
    expect(MUSLIM_MALE_NAMES.some((n) => father.name.includes(n))).toBe(true);
    expect(mother.name.endsWith(character.surname)).toBe(true);
    expect(father.name.endsWith(character.surname)).toBe(true);

    const birthEntry = character.history.find((h) => h.age === 0)!;
    expect(birthEntry.text).toContain('মাশাল্লাহ');
    expect(birthEntry.text).not.toContain('ভগবান');
  });

  it('generates a Hindu female with correct religion, flags, name pool, and birth text', () => {
    const { character } = createCharacter(2222, { religion: 'hinduism', gender: 'female' });
    expect(character.religion).toBe('hinduism');
    expect(character.flags).toContain('religion_hindu');
    expect(character.flags).not.toContain('religion_muslim');
    expect(HINDU_FEMALE_NAMES).toContain(character.name);
    expect(HINDU_SURNAMES).toContain(character.surname);

    const mother = character.relationships.find((r) => r.relation === 'mother')!;
    const father = character.relationships.find((r) => r.relation === 'father')!;
    expect(HINDU_FEMALE_NAMES.some((n) => mother.name.includes(n))).toBe(true);
    expect(HINDU_MALE_NAMES.some((n) => father.name.includes(n))).toBe(true);

    const birthEntry = character.history.find((h) => h.age === 0)!;
    expect(birthEntry.text).toContain('ভগবান');
    expect(birthEntry.text).not.toContain('মাশাল্লাহ');
  });

  it('generates cross-religion name sets that are mutually exclusive', () => {
    const { character: muslim } = createCharacter(3333, { religion: 'islam', gender: 'male' });
    expect(HINDU_MALE_NAMES).not.toContain(muslim.name);
    expect(HINDU_SURNAMES).not.toContain(muslim.surname);

    const { character: hindu } = createCharacter(4444, { religion: 'hinduism', gender: 'male' });
    expect(MUSLIM_MALE_NAMES).not.toContain(hindu.name);
    expect(MUSLIM_SURNAMES).not.toContain(hindu.surname);
  });

  it('honours explicit name/surname overrides even when they span religions', () => {
    const { character } = createCharacter(5555, {
      religion: 'islam',
      gender: 'male',
      name: 'Arjun',
      surname: 'Banerjee',
    });
    expect(character.name).toBe('Arjun');
    expect(character.surname).toBe('Banerjee');
    expect(character.religion).toBe('islam');
    expect(character.flags).toContain('religion_muslim');
  });

  it('defaults to ~85% Muslim across a large deterministic roll', () => {
    let muslimCount = 0;
    const total = 200;
    for (let seed = 100; seed < 100 + total; seed++) {
      const { character } = createCharacter(seed);
      if (character.religion === 'islam') muslimCount++;
    }
    expect(muslimCount).toBeGreaterThan(130);
  });
});
