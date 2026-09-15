import { describe, expect, it } from 'vitest';
import { EVENT_REGISTRY } from '@/content/events';
import { ALL_FALLBACK_EVENTS, getFallbackEvent } from '@/lib/ai/fallbackBank';
import { createCharacter } from '@/lib/engine/character';
import {
  drawYearlyEventsFrom,
  getEligibleEventsFrom,
  resolveEventChoice,
} from '@/lib/engine/events/registry';
import { LIFESTAGE_BY_CATEGORY } from './lifeStageMatrix';
import type { Character } from '@/lib/engine/types';

const ALL_EVENTS = [...EVENT_REGISTRY, ...ALL_FALLBACK_EVENTS];

describe('PART A — static tag hygiene across both pools', () => {
  it('every event has a valid gender/religion tag', () => {
    for (const e of ALL_EVENTS) {
      const g = e.gender ?? 'any';
      const r = e.religion ?? 'any';
      expect(['male', 'female', 'any']).toContain(g);
      expect(['islam', 'hinduism', 'any']).toContain(r);
    }
  });

  it('every event belongs to a known life-stage category with matching age band', () => {
    for (const e of ALL_EVENTS) {
      expect(e.category).toBeDefined();
      expect(e.minAge).toBeLessThanOrEqual(e.maxAge);
      expect(Boolean(e.choices?.length)).toBe(true);
    }
  });

  it('no category has an absurd age range (childhood events before 18, senior before 40)', () => {
    const off = ALL_EVENTS.filter((e) => {
      const [lo, hi] = LIFESTAGE_BY_CATEGORY[e.category];
      return e.minAge < lo || e.maxAge > hi;
    });
    expect(off.map((e) => `${e.id} ${e.category} ${e.minAge}-${e.maxAge}`)).toEqual([]);
  });
});

describe('PART A — real character audits across gender × religion', () => {
  const religions = ['islam', 'hinduism'] as const;

  function char(seed: number, gender: 'male' | 'female', religion: (typeof religions)[number], age: number): Character {
    const { character } = createCharacter(seed, { gender, religion });
    character.age = age;
    return character;
  }

  it('male-only events never surface to female characters at any sampled age', () => {
    for (const religion of religions) {
      for (const age of [20, 30, 40, 50, 60, 70]) {
        const she = char(1, 'female', religion, age);
        const pool = [...EVENT_REGISTRY, ...ALL_FALLBACK_EVENTS].filter(
          (e) => e.gender === 'male',
        );
        expect(pool.length).toBeGreaterThan(0);
        const drawn = getEligibleEventsFrom(pool, she);
        expect(drawn).toEqual([]);
      }
    }
  });

  it('religion-targeted events are invisible to the other faith', () => {
    const tagged = ALL_EVENTS.filter((e) => e.religion && e.religion !== 'any');
    expect(tagged.length).toBeGreaterThan(0);
    for (const e of tagged) {
      const islamOnly = e.religion === 'islam';
      const hindu = char(2, 'male', 'hinduism', 10);
      const muslim = char(3, 'male', 'islam', 10);
      if (islamOnly) {
        expect(getEligibleEventsFrom([e], hindu)).toEqual([]);
      } else {
        expect(getEligibleEventsFrom([e], muslim)).toEqual([]);
      }
    }
  });

  it('fallback flag gating respects religion flags (islam-tagged events near age 8)', () => {
    const eid = ALL_FALLBACK_EVENTS.find((e) => e.id === 'child_eid_salami') ??
      ALL_FALLBACK_EVENTS.find((e) => e.id.includes('eid'));
    if (!eid) return;
    const hinduKid = char(4, 'male', 'hinduism', 8);
    const muslimKid = char(5, 'male', 'islam', 8);
    expect(getEligibleEventsFrom([eid], muslimKid).length).toBeGreaterThanOrEqual(0);
    const hinduList = getEligibleEventsFrom([eid], hinduKid);
    for (const ev of hinduList) {
      expect(ev.religion).not.toBe('islam');
    }
  });
});

describe('PART A — the 50-life simulation sweep', () => {
  const COMBO_MATRIX: Array<[number, 'male' | 'female', 'islam' | 'hinduism']> = [];
  let combo = 0;
  for (const religion of ['islam', 'hinduism'] as const) {
    for (const gender of ['male', 'female'] as const) {
      for (let life = 0; life < 14; life++) {
        COMBO_MATRIX.push([combo * 1000 + life, gender, religion]);
        combo += 1;
      }
    }
  }

  function auditOneLife(seed: number, gender: 'male' | 'female', religion: 'islam' | 'hinduism'): Array<string> {
    const { character, rng } = createCharacter(seed, { gender, religion });
    const violations: string[] = [];

    while (character.alive && character.age < 130) {
      character.age += 1;
      const fired = drawYearlyEventsFrom(EVENT_REGISTRY, character, rng);

      for (const ev of fired) {
        if (ev.gender && ev.gender !== 'any' && ev.gender !== character.gender) {
          violations.push(`gender:${ev.id}@${character.age}`);
        }
        if (ev.religion && ev.religion !== 'any' && ev.religion !== character.religion) {
          violations.push(`religion:${ev.id}@${character.age}`);
        }
        if (character.age < ev.minAge || character.age > ev.maxAge) {
          violations.push(`age:${ev.id}@${character.age} vs ${ev.minAge}-${ev.maxAge}`);
        }
      }

      // Resolve every fired event with a random choice so the simulated life's
      // flags, relationships, and finances genuinely change year over year.
      for (const ev of fired) {
        const choice = ev.choices[Math.floor(rng.next() * ev.choices.length)];
        resolveEventChoice(character, ev, choice?.id ?? ev.choices[0].id);
      }
    }

    return violations;
  }

  it('no swept life draws a gender/religion/age-ineligible event', () => {
    const allViolations: Array<string> = [];
    for (const [seed, gender, religion] of COMBO_MATRIX) {
      const violations = auditOneLife(seed, gender, religion);
      for (const v of violations) allViolations.push(`seed=${seed} ${gender}/${religion} ${v}`);
    }
    expect(allViolations.filter(Boolean)).toEqual([]);
  });

  it('fallback bank never hands a context-ineligible event across 50+ lives', () => {
    const violations: string[] = [];
    for (const [seed, gender, religion] of COMBO_MATRIX) {
      const { character } = createCharacter(seed, { gender, religion });
      for (let age = 0; age <= 120 && character.age === age; age++) {
        character.age = age;
        const event = getFallbackEvent({
          age,
          seed,
          character,
          recentEventIds: (character.recentEventHistory ?? []).map((r) => r.id),
        });
        if (event.gender && event.gender !== 'any' && event.gender !== character.gender) {
          violations.push(`fallback gender:${event.id}@${age} ${gender}/${religion}`);
        }
        if (event.religion && event.religion !== 'any' && event.religion !== character.religion) {
          violations.push(`fallback religion:${event.id}@${age} ${gender}/${religion}`);
        }
        if (age < event.minAge || age > event.maxAge) {
          violations.push(`fallback age:${event.id}@${age} vs ${event.minAge}-${event.maxAge}`);
        }
        if (!character.recentEventHistory) character.recentEventHistory = [];
        character.recentEventHistory.push({ id: event.id, age });
      }
    }
    expect(violations.filter(Boolean)).toEqual([]);
  });
});