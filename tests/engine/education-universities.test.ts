import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { enrollAtUniversity, SUBJECTS, eligibleSubjects } from '@/lib/engine/events/categories/education';
import { UNIVERSITIES, UNIVERSITY_PRESTIGE_LABELS } from '@/content/education/universities';

describe('Part E — real Dhaka university catalog', () => {
  it('contains a healthy set of distinct, real institutes with sane numbers', () => {
    expect(UNIVERSITIES.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(UNIVERSITIES.map((u) => u.id));
    expect(ids.size).toBe(UNIVERSITIES.length);

    for (const u of UNIVERSITIES) {
      expect(u.tuition).toBeGreaterThanOrEqual(0);
      expect([1, 2, 3]).toContain(u.prestige);
      expect(u.name.length).toBeGreaterThan(3);
      if (u.minSmarts !== undefined) {
        expect(u.minSmarts).toBeGreaterThanOrEqual(40);
        expect(u.minSmarts).toBeLessThanOrEqual(80);
      }
      if (u.majors) {
        for (const m of u.majors) expect(Object.keys(SUBJECTS)).toContain(m);
      }
      expect(UNIVERSITY_PRESTIGE_LABELS[u.prestige].length).toBeGreaterThan(0);
    }
  });

  it('offers the flagship real names a Dhakaiya would recognize', () => {
    const names = UNIVERSITIES.map((u) => u.name).join(' ');
    for (const famous of ['বুয়েট', 'ঢাকা বিশ্ববিদ্যালয়', 'জগন্নাথ বিশ্ববিদ্যালয়', 'নর্থ সাউথ', 'ড্যাফোডিল']) {
      expect(names).toContain(famous);
    }
  });

  it('enrolls an eligible player at a govt university free of charge', () => {
    const { character } = createCharacter(21);
    character.age = 21;
    character.stats.smarts = 60;
    const money = character.money;
    const out = enrollAtUniversity(character, new RNG(41001), 'u_dhaka', 'business');

    expect(out.accepted).toBe(true);
    expect(character.education.university?.name).toBe('ঢাকা বিশ্ববিদ্যালয়');
    expect(character.education.stage).toBe('undergraduate');
    expect(character.education.enrolled).toBe(true);
    expect(character.education.major).toBe('business');
    expect(character.money).toBe(money); // govt = no tuition
    expect(character.flags).toContain('education_university');
    expect(character.history[character.history.length - 1].text).toContain('ঢাকা বিশ্ববিদ্যালয়');
  });

  it('charges tuition at a private university', () => {
    const { character } = createCharacter(21);
    character.age = 21;
    character.stats.smarts = 70;
    character.money = 5000;
    const out = enrollAtUniversity(character, new RNG(41002), 'u_northsouth', 'stem');

    expect(out.accepted).toBe(true);
    const uni = UNIVERSITIES.find((u) => u.id === 'u_northsouth')!;
    expect(character.money).toBe(5000 - uni.tuition);
  });

  it('rejects a minor, a weak student, and a pauper', () => {
    const { character: minor } = createCharacter(16);
    minor.age = 16;
    expect(enrollAtUniversity(minor, new RNG(41003), 'u_dhaka').accepted).toBe(false);

    const { character: weak } = createCharacter(21);
    weak.age = 21;
    weak.stats.smarts = 40;
    expect(enrollAtUniversity(weak, new RNG(41004), 'u_buet').accepted).toBe(false);

    const { character: poor } = createCharacter(21);
    poor.age = 21;
    poor.stats.smarts = 70;
    poor.money = 0;
    expect(enrollAtUniversity(poor, new RNG(41005), 'u_northsouth').accepted).toBe(false);
  });

  it('falls back to a university-approved subject when the chosen one is not offered', () => {
    const { character } = createCharacter(21);
    character.age = 21;
    character.stats.smarts = 75;
    const out = enrollAtUniversity(character, new RNG(41006), 'u_buet', 'arts');

    expect(out.accepted).toBe(true);
    expect(character.education.major).toBe('stem'); // বুয়েট only teaches engineering
    expect(eligibleSubjects(character)).toContain('stem');
  });
});