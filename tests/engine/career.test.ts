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