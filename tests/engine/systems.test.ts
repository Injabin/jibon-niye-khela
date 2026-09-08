import { describe, expect, it } from 'vitest';
import { ageUp } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { buyAsset, sellAsset, tickAssets } from '@/lib/engine/events/categories/assets';
import { applyForJob, getJobBoard, quitJob, tickCareer } from '@/lib/engine/events/categories/career';
import { commitCrime, tickCrime } from '@/lib/engine/events/categories/crime';
import {
  enterHigherEducation,
  tickEducation,
} from '@/lib/engine/events/categories/education';
import {
  applyMentalSupport,
  incidentChance,
  mentalSupportIfNeeded,
  tickHealth,
  visitDoctor,
} from '@/lib/engine/events/categories/health';
import type { Character } from '@/lib/engine/types';

/** Returns the first seed in [0, max) where `predicate` holds — deterministic. */
function findSeed(predicate: (char: Character, rng: RNG) => boolean, max = 200): number | undefined {
  for (let seed = 0; seed < max; seed++) {
    const { character, rng } = createCharacter(seed);
    if (predicate(character, rng)) return seed;
  }
  return undefined;
}

describe('education engine (DESIGN.md §5.1)', () => {
  it('auto-advances compulsory schooling at ages 6 → 12 → 15 → out', () => {
    const { character, rng } = createCharacter(1);
    character.age = 5;
    character.education.stage = 'none';
    expect(tickEducation(character, rng)).toBeNull();

    character.age = 6;
    const start = tickEducation(character, rng);
    expect(character.education.stage).toBe('elementary');
    expect(character.flags).toContain('education_elementary');
    expect(character.flags).toContain('student');
    expect(start?.tone).toBe('neutral');

    character.age = 12;
    tickEducation(character, rng);
    expect(character.education.stage).toBe('middle');

    character.age = 15;
    tickEducation(character, rng);
    expect(character.education.stage).toBe('high');

    character.age = 18;
    const out = tickEducation(character, rng);
    expect(out?.text).toContain('School');
    expect(character.education.enrolled).toBe(false);
    expect(character.flags).not.toContain('student');
  });

  it('rolls a smarts-driven GPA within [1.0, 4.0] and sets gpa flags', () => {
    const { character, rng } = createCharacter(2);
    character.age = 6;
    character.stats.smarts = 95;
    character.education.stage = 'none';
    tickEducation(character, rng);
    expect(character.education.gpa).toBeGreaterThanOrEqual(1);
    expect(character.education.gpa).toBeLessThanOrEqual(4);
    expect(character.flags).toContain('gpa_high');
  });

  it('accepts a bright applicant into university with a major + tuition', () => {
    const { character, rng } = createCharacter(3);
    character.age = 20;
    character.stats.smarts = 85;
    character.education.stage = 'high';
    const moneyBefore = character.money;
    const result = enterHigherEducation(character, rng, 'undergraduate');
    expect(result.accepted).toBe(true);
    expect(character.education.stage).toBe('undergraduate');
    expect(character.education.enrolled).toBe(true);
    expect(character.education.enrolledAge).toBe(20);
    expect(character.flags).toContain('education_university');
    expect(character.flags.some((f) => f.startsWith('major_'))).toBe(true);
    expect(character.money).toBeLessThan(moneyBefore);
    expect(character.education.graduated).toBe(false);
  });

  it('rejects a low-smarts applicant without a strong GPA', () => {
    const { character, rng } = createCharacter(4);
    character.age = 20;
    character.stats.smarts = 20;
    const result = enterHigherEducation(character, rng, 'undergraduate');
    expect(result.accepted).toBe(false);
    expect(character.education.enrolled).toBe(false);
  });

  it('accepts vocational study without a smarts gate', () => {
    const { character, rng } = createCharacter(5);
    character.age = 20;
    character.stats.smarts = 10;
    const result = enterHigherEducation(character, rng, 'vocational');
    expect(result.accepted).toBe(true);
    expect(character.education.stage).toBe('vocational');
    expect(character.flags).toContain('education_vocational');
  });

  it('graduates post-secondary after the enrolment-age countdown', () => {
    const { character, rng } = createCharacter(6);
    character.age = 20;
    character.education.stage = 'undergraduate';
    character.education.enrolled = true;
    character.education.enrolledAge = 16;
    character.flags.push('student');
    const result = tickEducation(character, rng);
    expect(result?.text).toContain('graduate');
    expect(character.education.graduated).toBe(true);
    expect(character.education.enrolled).toBe(false);
    expect(character.flags).not.toContain('student');
  });

  it('a dropped-out character leaves education alone', () => {
    const { character, rng } = createCharacter(7);
    character.age = 10;
    character.education.stage = 'dropped';
    expect(tickEducation(character, rng)).toBeNull();
    expect(character.education.stage).toBe('dropped');
  });
});

describe('career engine (DESIGN.md §5.2)', () => {
  it('the board gates jobs by age and education', () => {
    const { character } = createCharacter(8);
    character.age = 6;
    expect(getJobBoard(character).length).toBe(0);

    character.age = 24;
    character.education.stage = 'undergraduate';
    character.education.graduated = true;
    character.stats.smarts = 80;
    character.flags.push('major_law');
    const board = getJobBoard(character);
    expect(board.some((j) => j.id === 'lawyer')).toBe(true);
    expect(board.some((j) => j.id === 'doctor')).toBe(false); // doctor needs major_medicine
  });

  it('a nurse hire requires the vocational flag', () => {
    const { character } = createCharacter(9);
    character.age = 20;
    character.stats.smarts = 70;
    expect(getJobBoard(character).some((j) => j.id === 'nurse')).toBe(false);
    character.flags.push('education_vocational', 'education_high');
    character.education.stage = 'vocational';
    expect(getJobBoard(character).some((j) => j.id === 'nurse')).toBe(true);
  });

  it('applyForJob hires some seeds, rejects others, and sets career state when hired', () => {
    const hiredSeed = findSeed((character, rng) => {
      character.age = 18;
      return applyForJob(character, rng, 'fastfood').hired;
    });
    expect(hiredSeed).toBeDefined();
    const { character: hired, rng: hiredRng } = createCharacter(hiredSeed as number);
    hired.age = 18;
    const ok = applyForJob(hired, hiredRng, 'fastfood');
    expect(ok.hired).toBe(true);
    expect(hired.career.jobId).toBe('fastfood');
    expect(hired.career.yearsAtJob).toBe(0);
    expect(hired.flags).toContain('job_service');
    expect(hired.flags).not.toContain('unemployed');

    const rejectedSeed = findSeed((character, rng) => {
      character.age = 18;
      character.stats.smarts = 30;
      character.stats.looks = 30;
      return !applyForJob(character, rng, 'fastfood').hired;
    });
    expect(rejectedSeed).toBeDefined();
    const { character: rejected, rng: rejectedRng } = createCharacter(rejectedSeed as number);
    rejected.age = 18;
    rejected.stats.smarts = 30;
    const no = applyForJob(rejected, rejectedRng, 'fastfood');
    expect(no.hired).toBe(false);
    expect(rejected.career.jobId).toBeNull();
  });

  it('the yearly career tick pays salary and accrues time at the job', () => {
    const { character, rng } = createCharacter(10);
    character.age = 30;
    character.career.jobId = 'fastfood';
    character.career.performance = 55;
    character.career.yearsAtJob = 0;
    const moneyBefore = character.money;
    tickCareer(character, rng);
    expect(character.money).toBeGreaterThan(moneyBefore);
    expect(character.career.yearsAtJob).toBe(1);
    expect(character.career.performance).toBeGreaterThanOrEqual(0);
    expect(character.career.performance).toBeLessThanOrEqual(100);
  });

  it('quitJob clears the job and flags unemployment', () => {
    const { character, rng } = createCharacter(11);
    character.age = 18;
    character.career.jobId = 'fastfood';
    character.career.performance = 55;
    character.career.yearsAtJob = 2;
    character.flags.push('job_service');
    const result = quitJob(character);
    expect(result.quit).toBe(true);
    expect(character.career.jobId).toBeNull();
    expect(character.flags).not.toContain('job_service');
    expect(character.flags).toContain('unemployed');
    // tickCareer is a no-op without a job
    expect(tickCareer(character, rng)).toBeNull();
  });
});

describe('assets engine (DESIGN.md §5.5)', () => {
  it('buys a car, flagging ownership (leveraged into debt when cash is short)', () => {
    const { character, rng } = createCharacter(12);
    character.age = 30;
    character.money = 30;
    const result = buyAsset(character, rng, 'car');
    expect(result.bought).toBe(true);
    expect(character.money).toBeLessThan(0);
    expect(character.flags).toContain('has_car');
    expect(character.flags).toContain('has_debt');
    expect(character.assets.some((a) => a.kind === 'car')).toBe(true);
  });

  it('refuses speculative buys without cash', () => {
    const { character, rng } = createCharacter(13);
    character.age = 30;
    character.money = 30;
    const result = buyAsset(character, rng, 'stock');
    expect(result.bought).toBe(false);
    expect(character.assets.length).toBe(0);
  });

  it('buys a home outright when flush — no debt flag', () => {
    const { character, rng } = createCharacter(14);
    character.age = 30;
    character.money = 100_000;
    const result = buyAsset(character, rng, 'home');
    expect(result.bought).toBe(true);
    expect(character.money).toBeGreaterThanOrEqual(0);
    expect(character.flags).toContain('has_house');
    expect(character.flags).not.toContain('has_debt');
  });

  it('selling the last asset of a kind retires its ownership flag', () => {
    const { character, rng } = createCharacter(15);
    character.age = 30;
    character.money = 100_000;
    buyAsset(character, rng, 'jewelry');
    const asset = character.assets[0];
    expect(character.flags).toContain('has_investment');
    const sale = sellAsset(character, rng, asset.id);
    expect(sale.sold).toBe(true);
    expect(sale.proceeds).toBeGreaterThan(0);
    expect(character.assets.length).toBe(0);
    expect(character.flags).not.toContain('has_investment');
  });

  it('the yearly tick drifts values without corrupting the portfolio', () => {
    const { character, rng } = createCharacter(16);
    character.age = 40;
    character.money = 1_000_000;
    buyAsset(character, rng, 'crypto');
    buyAsset(character, rng, 'car');
    const before = character.assets.map((a) => ({ id: a.id, value: a.value }));
    tickAssets(character, rng);
    expect(character.assets.length).toBe(before.length);
    for (const asset of character.assets) {
      expect(asset.value).toBeGreaterThanOrEqual(1);
      expect(typeof asset.value).toBe('number');
    }
  });
});

describe('crime engine (DESIGN.md §5.6)', () => {
  it('running many crimes yields both the paid-fast and arrested branches', () => {
    let arrested = 0;
    let paid = 0;
    for (let seed = 0; seed < 120; seed++) {
      const { character, rng } = createCharacter(seed);
      character.age = 21;
      const outcome = commitCrime(character, rng, 'shoplift');
      if (outcome.arrested) {
        arrested += 1;
        expect(character.criminalRecord.length).toBeGreaterThan(0);
        expect(character.flags).toContain('criminal_record');
        expect(character.flags).toContain('in_jail');
      } else {
        paid += 1;
        expect(outcome.reward).toBeGreaterThan(0);
        expect(character.money).toBeGreaterThan(createCharacter(seed).character.money);
        expect(character.criminalRecord.length).toBe(0);
      }
    }
    expect(arrested).toBeGreaterThan(0);
    expect(paid).toBeGreaterThan(0);
  });

  it('a jailed character cannot commit more crime', () => {
    const { character, rng } = createCharacter(17);
    character.age = 21;
    character.flags.push('in_jail');
    const result = commitCrime(character, rng, 'shoplift');
    expect(result.text).toContain('already inside');
    expect(character.criminalRecord.length).toBe(0);
  });

  it('jail time counts down and releases the character with a fresh-start flag', () => {
    const { character } = createCharacter(18);
    character.age = 24;
    character.criminalRecord.push({ offense: 'burglary', age: 24, sentenceYears: 1, served: false });
    character.flags.push('criminal_record', 'in_jail');
    const year = tickCrime(character);
    expect(year?.tone).toBe('good');
    expect(character.criminalRecord[0].served).toBe(true);
    expect(character.flags).not.toContain('in_jail');
    expect(character.flags).toContain('gone_straight');
  });
});

describe('health engine (DESIGN.md §5.7, §11)', () => {
  it('scales incident odds with age and lowers them with lifestyle flags', () => {
    const { character } = createCharacter(19);
    character.age = 10;
    const young = incidentChance(character);
    character.age = 70;
    const old = incidentChance(character);
    expect(old).toBeGreaterThan(young);
    character.flags.push('fitness_good', 'quit_bad_habit');
    const improved = incidentChance(character);
    expect(improved).toBeLessThan(old);
  });

  it('tickHealth can roll a damaging incident', () => {
    const seed = findSeed((character, rng) => {
      character.age = 30;
      character.stats.happiness = 80;
      return tickHealth(character, rng) !== null;
    });
    expect(seed).toBeDefined();
    const { character, rng } = createCharacter(seed as number);
    character.age = 30;
    character.stats.happiness = 80;
    const healthBefore = character.stats.health;
    const outcome = tickHealth(character, rng);
    expect(outcome).not.toBeNull();
    expect(character.stats.health).toBeLessThanOrEqual(healthBefore);
  });

  it('routes low happiness to supportive therapy, once per life', () => {
    const { character } = createCharacter(20);
    character.age = 25;
    character.stats.happiness = 20;
    const suggestion = mentalSupportIfNeeded(character);
    expect(suggestion).not.toBeNull();
    applyMentalSupport(character);
    expect(character.flags).toContain('went_to_therapy');
    expect(character.flags).not.toContain('mental_low');
    expect(character.stats.happiness).toBeGreaterThan(20);
    expect(mentalSupportIfNeeded(character)).toBeNull();
  });

  it('a doctor visit restores health at a price', () => {
    const { character } = createCharacter(21);
    character.stats.health = 50;
    const moneyBefore = character.money;
    visitDoctor(character);
    expect(character.stats.health).toBeGreaterThan(50);
    expect(character.money).toBeLessThan(moneyBefore);
  });
});

describe('systems tick through ageUp (init.md M5 #2)', () => {
  it('a child reaches high school and leaves the student flag by 18', () => {
    const { character, rng } = createCharacter(22);
    character.age = 5;
    character.stats.health = 100;
    character.stats.happiness = 90;
    let guard = 0;
    while (character.age < 18 && character.alive && guard < 20) {
      ageUp(character, rng);
      guard += 1;
    }
    expect(character.education.stage).toBe('high');
    expect(character.flags).not.toContain('student');
  });

  it('an employed character earns money on the next age-up payday', () => {
    const { character, rng } = createCharacter(23);
    character.age = 30;
    character.career.jobId = 'fastfood';
    character.career.performance = 80;
    character.money = 0;
    const before = character.money;
    ageUp(character, rng);
    expect(character.career.yearsAtJob).toBeGreaterThanOrEqual(1);
    expect(character.money).toBeGreaterThan(before);
  });
});
