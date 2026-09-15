/**
 * Career engine tests — E (Phase 3.5).
 *
 * Covers exactly the two E promises:
 *  1. A `requires.trait` seat is filled by the trait ~or~ the equivalent flag
 *     (~the flag the HSC-runner earns and the trait the hobby holds both
 *     sit the pro_athlete board — no more one-column gatekeeping).
 *  2. The ladder is honest: promotions bump `tier`, which lifts both the
 *     tier title and `annualSalary` — the payday raise is real, and fame
 *     feeds (politician / soldier / pro_athlete / entertainer) push real
 *     fame while office & side-hustle gigs never do.
 */

import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  annualSalary,
  careerLadder,
  careerTitle,
  isJobEligible,
  JOB_BOARD,
  tickCareer,
} from '@/lib/engine/events/categories/career';
import type { Character } from '@/lib/engine/types';

function fresh(seed = 3, options?: Parameters<typeof createCharacter>[1]) {
  const { character, rng } = createCharacter(seed, options);
  return { character, rng };
}

function withCareer(character: Character, jobId: string, tier = 0, performance = 55) {
  character.career = { jobId, tier, performance, yearsAtJob: 0 };
  return character;
}

/** A character old enough (18+) and pretty enough (looks >= 60) for pro_athlete. */
function athleteAtOffice():
  | { character: Character; rng: RNG; job: (typeof JOB_BOARD)[number] }
  | never {
  const { character, rng } = fresh(11);
  character.age = 20;
  character.stats.looks = Math.max(character.stats.looks, 70);
  const job = JOB_BOARD.find((j) => j.id === 'pro_athlete')!;
  if (!job) throw new Error('pro_athlete missing from JOB_BOARD');
  return { character, rng, job };
}

describe('job eligibility — requires.trait ~or~ the equivalent flag', () => {
  it('seats a trait when the trait is held', () => {
    const { character, job } = athleteAtOffice();
    if (!character.traits.includes('hobby_sport')) character.traits.push('hobby_sport');
    expect(isJobEligible(job, character)).toBe(true);
  });

  it('seats the same job from the equivalent flag alone (a flag earns the seat)', () => {
    const { character, job } = athleteAtOffice();
    character.traits = character.traits.filter((t) => t !== 'hobby_sport');
    character.flags.push('hobby_sport'); // hobby_sport flag = same seat
    expect(isJobEligible(job, character)).toBe(true);
  });

  it('still blocks when neither the trait nor the flag is held', () => {
    const { character, job } = athleteAtOffice();
    character.traits = character.traits.filter((t) => t !== 'hobby_sport');
    character.flags = character.flags.filter((f) => f !== 'hobby_sport');
    expect(isJobEligible(job, character)).toBe(false);
  });
});

describe('career ladders (E)', () => {
  it('defines fame-feeding ladders and keeps plain gigs ladder-less', () => {
    expect(careerLadder('politician')?.fameFeed).toBe(true);
    expect(careerLadder('pro_athlete')?.fameFeed).toBe(true);
    expect(careerLadder('entertainer')?.fameFeed).toBe(true);
    expect(careerLadder('side_business')?.fameFeed).toBe(false);
    expect(careerLadder('fastfood')).toBeUndefined();
  });

  it('titles the tier, not a flat job title, once the ladder exists', () => {
    const { character } = fresh(7);
    withCareer(character, 'programmer', 2, 78);
    const title = careerTitle(character);
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('programmer');
    expect(title).not.toBe(JOB_BOARD.find((j) => j.id === 'programmer')!.title);
  });

  it('scales annual salary with the tier (payday raises are real)', () => {
    const job = JOB_BOARD.find((j) => j.id === 'pro_athlete')!;
    const t0 = annualSalary(job, 60, 0);
    const t2 = annualSalary(job, 60, 2);
    expect(t2).toBeGreaterThan(t0);
  });

  it('a promotion bumps the tier and feeds real fame for famous gigs', () => {
    const { character, rng } = fresh(4);
    withCareer(character, 'politician', 0, 99);
    const beforeFame = character.reputation.fame;
    let outcome: { text: string; tone: string } | null = null;
    for (let i = 0; i < 40; i++) {
      outcome = tickCareer(character, rng);
      if ((character.career.tier ?? 0) > 0) break;
    }
    expect(character.career.tier ?? 0).toBeGreaterThan(0);
    expect(character.reputation.fame).toBeGreaterThan(beforeFame);
    expect(outcome?.tone).toBe('good');
  });

  it('side hustles never fame-feed, even with the overnight hustle', () => {
    const { character, rng } = fresh(6);
    withCareer(character, 'side_business', 0, 93);
    const beforeFame = character.reputation.fame;
    for (let i = 0; i < 8; i++) tickCareer(character, rng);
    expect(character.reputation.fame).toBe(beforeFame);
  });
});

describe('professional jobs require the matching major (M6)', () => {
  /** Undergraduate plus an optional major flag — then probe a job. */
  function undergrad(seed: number, major?: string, smarts = 90) {
    const { character } = fresh(seed);
    character.age = 30;
    character.education.stage = 'undergraduate';
    character.education.graduated = true;
    character.stats.smarts = smarts;
    if (major) character.flags.push(major);
    return character;
  }

  it('programmer now needs the science/engineering major', () => {
    const job = JOB_BOARD.find((j) => j.id === 'programmer')!;
    expect(isJobEligible(job, undergrad(601))).toBe(false);
    expect(isJobEligible(job, undergrad(602, 'major_arts'))).toBe(false);
    expect(isJobEligible(job, undergrad(603, 'major_stem'))).toBe(true);
  });

  it('the new board lists data_scientist, civil_engineer, banker, pharmacist, university_teacher', () => {
    for (const id of ['data_scientist', 'civil_engineer', 'banker', 'pharmacist', 'university_teacher']) {
      expect(JOB_BOARD.some((j) => j.id === id), id).toBe(true);
    }
  });

  it('data_scientist and civil_engineer demand major_stem', () => {
    for (const id of ['data_scientist', 'civil_engineer']) {
      const job = JOB_BOARD.find((j) => j.id === id)!;
      expect(isJobEligible(job, undergrad(604)), id).toBe(false);
      expect(isJobEligible(job, undergrad(605, 'major_stem')), id).toBe(true);
    }
  });

  it('banker demands major_business and pharmacist demands major_medicine', () => {
    const banker = JOB_BOARD.find((j) => j.id === 'banker')!;
    expect(isJobEligible(banker, undergrad(606, 'major_stem'))).toBe(false);
    expect(isJobEligible(banker, undergrad(607, 'major_business'))).toBe(true);

    const pharmacist = JOB_BOARD.find((j) => j.id === 'pharmacist')!;
    expect(isJobEligible(pharmacist, undergrad(608, 'major_business'))).toBe(false);
    expect(isJobEligible(pharmacist, undergrad(609, 'major_medicine'))).toBe(true);
  });

  it('university_teacher admits ANY post-secondary major', () => {
    const job = JOB_BOARD.find((j) => j.id === 'university_teacher')!;
    for (const major of ['major_stem', 'major_business', 'major_arts', 'major_medicine', 'major_law']) {
      expect(isJobEligible(job, undergrad(610, major)), major).toBe(true);
    }
    expect(isJobEligible(job, undergrad(611))).toBe(false);
  });

  it('annualSalary scales up the ladder for the new roles', () => {
    for (const id of ['data_scientist', 'civil_engineer', 'banker', 'pharmacist', 'university_teacher']) {
      const job = JOB_BOARD.find((j) => j.id === id)!;
      const t2 = annualSalary(job, 60, 2);
      const t0 = annualSalary(job, 60, 0);
      expect(t2, id).toBeGreaterThan(t0);
    }
  });
});
