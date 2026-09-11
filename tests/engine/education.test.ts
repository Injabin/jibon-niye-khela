import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { skipClass, joinDebateClub, tickEducation } from '@/lib/engine/events/categories/education';
import { applyToSchool, enterHigherEducation, eligibleSubjects, SUBJECTS } from '@/lib/engine/events/categories/education';
import { SCHOOLS, findSchoolById, stageForAge } from '@/content/education/schools';

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

describe('School Catalog (H — BitLife-style picking)', () => {
  it('catalog has four options per compulsory stage', () => {
    for (const stage of ['elementary', 'middle', 'high'] as const) {
      const byStage = SCHOOLS.filter((s) => s.stage === stage);
      expect(byStage.length).toBe(4);
      expect(new Set(byStage.map((s) => s.id)).size).toBe(4);
    }
  });

  it('prestigious schools carry more tuition and a smarts gate', () => {
    for (const s of SCHOOLS) {
      if (s.prestige === 1) expect(s.tuition).toBe(0);
      if (s.prestige === 3) {
        expect(s.tuition).toBeGreaterThan(0);
        expect(s.minSmarts).toBeDefined();
      }
    }
  });

  it('stageForAge maps the schooling windows', () => {
    expect(stageForAge(6)).toBe('elementary');
    expect(stageForAge(11)).toBe('elementary');
    expect(stageForAge(12)).toBe('middle');
    expect(stageForAge(14)).toBe('middle');
    expect(stageForAge(15)).toBe('high');
    expect(stageForAge(17)).toBe('high');
    expect(stageForAge(5)).toBeNull();
    expect(stageForAge(18)).toBeNull();
  });

  it('applyToSchool rejects when the age does not match the stage', () => {
    const { character } = createCharacter(12001);
    character.age = 20;
    character.education.enrolled = false;
    character.education.graduated = false;
    const highSchool = findSchoolById('h_collegiate')!;
    const out = applyToSchool(character, highSchool.id, new RNG(12001));
    expect(out.accepted).toBe(false);
  });

  it('applyToSchool rejects on the smarts gate at a selective school', () => {
    const { character } = createCharacter(12002);
    character.age = 16;
    character.education.enrolled = true;
    character.education.stage = 'high';
    character.stats.smarts = 30; // below h_notredame's 55
    const out = applyToSchool(character, 'h_notredame', new RNG(12002));
    expect(out.accepted).toBe(false);
    expect(out.text).toContain('নম্বরের ঘাটতি');
  });

  it('applyToSchool rejects when the tuition is unaffordable', () => {
    const { character } = createCharacter(12003);
    character.age = 16;
    character.education.enrolled = true;
    character.education.stage = 'high';
    character.stats.smarts = 60;
    character.money = 100;
    const out = applyToSchool(character, 'h_notredame', new RNG(12003));
    expect(out.accepted).toBe(false);
    expect(out.text).toContain('পয়সা');
  });

  it('applyToSchool charges tuition, sets the school, and boosts smarts', () => {
    const { character } = createCharacter(12004);
    character.age = 16;
    character.education.enrolled = true;
    character.education.stage = 'high';
    character.stats.smarts = 60;
    character.money = 5000;
    const smartsBefore = character.stats.smarts;
    const out = applyToSchool(character, 'h_notredame', new RNG(12004));
    expect(out.accepted).toBe(true);
    expect(character.money).toBe(5000 - 900);
    expect(character.education.school?.id).toBe('h_notredame');
    expect(character.education.school?.prestige).toBe(3);
    expect(character.stats.smarts).toBeGreaterThanOrEqual(smartsBefore);
    expect(character.history.length).toBeGreaterThan(0);
  });

  it('tickEducation auto-assigns a default school when a stage starts', () => {
    const { character } = createCharacter(12005);
    character.age = 6;
    character.education.stage = 'none';
    character.education.enrolled = false;
    const out = tickEducation(character, new RNG(12005));
    expect(out).not.toBeNull();
    expect(character.education.school?.stage).toBe('elementary');
    expect(character.education.school?.id).toBe('e_armanitola');
  });

  it('applyToSchool refuses the school the child already attends', () => {
    const { character } = createCharacter(12006);
    character.age = 10;
    character.education.enrolled = true;
    character.education.stage = 'elementary';
    character.education.school = { id: 'e_armanitola', name: 'আরমানিটোলা সরকারি প্রাথমিক বিদ্যালয়', stage: 'elementary', prestige: 1 };
    const out = applyToSchool(character, 'e_armanitola', new RNG(12006));
    expect(out.accepted).toBe(false);
  });
});

describe('Higher-Education Subjects (H — BitLife-style picking)', () => {
  it('eligibleSubjects gates on smarts', () => {
    const { character } = createCharacter(13001);
    character.stats.smarts = 60;
    const pool = eligibleSubjects(character);
    expect(pool).toContain('business');
    expect(pool).toContain('arts');
    expect(pool).not.toContain('medicine'); // needs 80
    expect(pool).not.toContain('stem'); // needs 70
  });

  it('enterHigherEducation accepts the chosen major and records it', () => {
    const { character } = createCharacter(13002);
    character.age = 19;
    character.education.enrolled = false;
    character.education.stage = 'none';
    character.education.graduated = false;
    character.stats.smarts = 72;
    character.money = 5000;
    const out = enterHigherEducation(character, new RNG(13002), 'undergraduate', 'stem');
    expect(out.accepted).toBe(true);
    expect(character.education.major).toBe('stem');
    expect(character.education.enrolled).toBe(true);
    expect(character.education.stage).toBe('undergraduate');
  });

  it('enterHigherEducation rejects a chosen subject below its gate', () => {
    const { character } = createCharacter(13003);
    character.age = 19;
    character.education.enrolled = false;
    character.education.stage = 'none';
    character.education.graduated = false;
    character.stats.smarts = 50;
    character.money = 5000;
    const out = enterHigherEducation(character, new RNG(13003), 'undergraduate', 'medicine');
    expect(out.accepted).toBe(false);
    expect(character.education.enrolled).toBe(false);
    expect(out.text).toContain('বুদ্ধি');
  });

  it('every major field has a Bangla label and institute', () => {
    for (const m of Object.keys(SUBJECTS) as (keyof typeof SUBJECTS)[]) {
      expect(SUBJECTS[m].label.length).toBeGreaterThan(0);
      expect(SUBJECTS[m].institute.length).toBeGreaterThan(0);
      expect(SUBJECTS[m].minSmarts).toBeGreaterThan(0);
    }
  });
});
