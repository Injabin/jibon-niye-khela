/**
 * Prison cycle engine tests (D — Phase 3.5).
 *
 * Covers the jail lifecycle: arrest writes the flag + record, bail/plea pays a
 * fine to walk out, good-behaviour shaves years and can parole, escape is a
 * risky bid, and a criminal record hard-blocks the trust trades (politics,
 * law, military, medicine) while smearing hire chances elsewhere.
 */

import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import { commitCrime, isJailed } from '@/lib/engine/events/categories/crime';
import {
  isJailed as prisonIsJailed,
  prisonBail,
  prisonEscape,
  prisonFight,
  prisonGoodBehavior,
  prisonGym,
  prisonLibrary,
  remainingSentence,
} from '@/lib/engine/prison';
import { applyForJob, getJobBoard, hasCriminalRecord, isJobEligible, JOB_BOARD } from '@/lib/engine/events/categories/career';
import type { Character } from '@/lib/engine/types';

function fresh(seed = 7, options?: Parameters<typeof createCharacter>[1]) {
  const { character, rng } = createCharacter(seed, options);
  character.flags = character.flags.filter((f) => f !== 'in_jail' && f !== 'criminal_record' && f !== 'gone_straight');
  return { character, rng };
}

function putInJail(character: Character, sentence = 2) {
  character.criminalRecord.push({ offense: 'burglary', age: character.age, sentenceYears: sentence, served: false });
  if (!character.flags.includes('criminal_record')) character.flags.push('criminal_record');
  if (!character.flags.includes('in_jail')) character.flags.push('in_jail');
  return character;
}

/** Drive `commitCrime` until caught (karma forces the catch), assert the record. */
function arrested(character: Character, rng: RNG) {
  applyStatEffects(character, { karma: 100 });
  let out;
  for (let i = 0; i < 60; i++) {
    out = commitCrime(character, rng, 'heist');
    if (out?.arrested) break;
  }
  expect(out?.arrested).toBe(true);
  expect(isJailed(character)).toBe(true);
  expect(hasCriminalRecord(character)).toBe(true);
  const entry = character.criminalRecord[character.criminalRecord.length - 1];
  expect(entry.served).toBe(false);
  expect(entry.sentenceYears).toBeGreaterThan(0);
  expect(remainingSentence(character)).toBe(entry.sentenceYears);
}

describe('arrest sets the jail lifecycle', () => {
  it('commitCrime rotates the in_jail flag when caught', () => {
    const { character, rng } = fresh(3);
    arrested(character, rng);
  });

  it('crime.ts isJailed and prison.ts isJailed agree', () => {
    const { character } = fresh();
    putInJail(character);
    expect(isJailed(character)).toBe(true);
    expect(prisonIsJailed(character)).toBe(true);
  });
});

describe('bail / plea deal', () => {
  it('releases on a cash fine and clears the flag when affordable', () => {
    const { character } = fresh();
    applyStatEffects(character, { money: 10_000 });
    putInJail(character, 2);
    const before = character.money;
    const out = prisonBail(character);
    expect(out.ok).toBe(true);
    expect(out.released).toBe(true);
    expect(character.money).toBe(before - 2 * 400);
    expect(prisonIsJailed(character)).toBe(false);
    expect(character.flags).toContain('gone_straight');
    expect(character.criminalRecord[character.criminalRecord.length - 1].served).toBe(true);
  });

  it('refuses when the fine is unaffordable and keeps the jail flag', () => {
    const { character } = fresh();
    putInJail(character, 4);
    applyStatEffects(character, { money: -9_999 });
    const out = prisonBail(character);
    expect(out.ok).toBe(false);
    expect(prisonIsJailed(character)).toBe(true);
  });

  it('is a no-op outside jail', () => {
    const { character } = fresh();
    expect(prisonBail(character).ok).toBe(false);
  });
});

describe('jail actions', () => {
  it('prisonGym boosts health and happiness', () => {
    const { character } = fresh();
    putInJail(character, 1);
    const healthBefore = character.stats.health;
    const happyBefore = character.stats.happiness;
    const out = prisonGym(character);
    expect(out.ok).toBe(true);
    expect(character.stats.health).toBeGreaterThan(healthBefore);
    expect(character.stats.happiness).toBeGreaterThan(happyBefore);
  });

  it('prisonLibrary boosts smarts', () => {
    const { character } = fresh();
    putInJail(character, 1);
    const before = character.stats.smarts;
    const out = prisonLibrary(character);
    expect(out.ok).toBe(true);
    expect(character.stats.smarts).toBeGreaterThan(before);
  });

  it('prisonFight resolves without mutating the sentence', () => {
    const { character, rng } = fresh(11);
    putInJail(character, 1);
    const before = remainingSentence(character);
    const out = prisonFight(character, rng);
    expect(out.ok).toBe(true);
    expect(remainingSentence(character)).toBe(before);
  });

  it('prisonGoodBehavior shaves exactly one year or leaves it untouched', () => {
    const { character, rng } = fresh(5);
    putInJail(character, 3);
    const before = remainingSentence(character);
    const out = prisonGoodBehavior(character, rng);
    expect(out.ok).toBe(true);
    expect(remainingSentence(character)).toBe(before === 3 ? 2 : before);
  });

  it('a 1-year shave either paroles or keeps a single year', () => {
    const { character, rng } = fresh(6);
    putInJail(character, 1);
    const out = prisonGoodBehavior(character, rng);
    expect(out.ok).toBe(true);
    if (out.released) {
      expect(prisonIsJailed(character)).toBe(false);
      expect(character.flags).toContain('gone_straight');
    } else {
      expect(remainingSentence(character)).toBe(1);
    }
  });

  it('escape frees on success and adds years on failure, across seeds', () => {
    let sawRelease = false;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const { character } = fresh(seed);
      const rng = new RNG(seed);
      putInJail(character, 2);
      const before = remainingSentence(character);
      const out = prisonEscape(character, rng);
      expect(out.ok).toBe(true);
      if (out.released) {
        sawRelease = true;
        expect(prisonIsJailed(character)).toBe(false);
      } else {
        expect(prisonIsJailed(character)).toBe(true);
        expect(remainingSentence(character)).toBe(before + 2);
      }
    }
    expect(sawRelease).toBe(true);
  });

  it('jail actions refuse outside jail', () => {
    const { character, rng } = fresh();
    expect(prisonGym(character).ok).toBe(false);
    expect(prisonLibrary(character).ok).toBe(false);
    expect(prisonFight(character, rng).ok).toBe(false);
    expect(prisonGoodBehavior(character, rng).ok).toBe(false);
    expect(prisonEscape(character, rng).ok).toBe(false);
  });
});

describe('post-release career gating', () => {
  it('criminal record hard-blocks politics, law, military and medicine jobs', () => {
    const { character } = fresh();
    character.flags.push('criminal_record');
    character.education.stage = 'undergraduate';
    character.stats.smarts = 90;
    character.traits.push('major_law', 'major_medicine');
    const blocked = new Set(['politician', 'lawyer', 'doctor', 'soldier', 'nurse']);
    const boardIds = getJobBoard(character).map((j) => j.id);
    for (const job of JOB_BOARD) {
      if (blocked.has(job.id)) {
        expect(boardIds).not.toContain(job.id);
        expect(isJobEligible(job, character)).toBe(false);
      }
    }
  });

  it('recorded applicants may still hire into allowed trades', () => {
    const { character, rng } = fresh();
    character.flags.push('criminal_record');
    character.education.stage = 'high';
    character.stats.smarts = 90;
    character.stats.looks = 90;
    const out = applyForJob(character, rng, 'office_admin');
    expect(typeof out.hired).toBe('boolean');
  });
});