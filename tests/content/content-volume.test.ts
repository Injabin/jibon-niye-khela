import { describe, expect, it } from 'vitest';
import { EVENT_REGISTRY } from '@/content/events';
import { ALL_CONTENT_FLAGS } from '@/content/events/flags';
import { MILESTONE_KINDS, isMilestoneKind } from '@/lib/engine/moments';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import { getEligibleEventsFrom, pickWeighted } from '@/lib/engine/events/registry';
import type { LifeEventDef } from '@/lib/engine/types';

const STAT_EFFECT_KEYS = new Set([
  'health',
  'happiness',
  'smarts',
  'looks',
  'money',
  'fame',
  'karma',
  'addTrait',
  'removeTrait',
  'addFlag',
  'removeFlag',
]);

const CATEGORIES = new Set(['childhood', 'teen', 'young-adult', 'adult', 'senior', 'universal']);
const TONES = new Set(['good', 'bad', 'neutral', 'funny']);

function flagless(age: number): ReturnType<typeof createCharacter>['character'] {
  const { character } = createCharacter(42);
  character.age = age;
  character.flags = [];
  character.traits = [];
  return character;
}

function collectText(event: LifeEventDef): string {
  return [event.text, ...event.choices.map((c) => `${c.text} ${c.outcomeText}`)].join(' \n ');
}

describe('content volume (Gate 5 / DESIGN.md §10)', () => {
  it(`EVENT_REGISTRY totals 150–250 unique events (target: DESIGN.md §10)`, () => {
    expect(EVENT_REGISTRY.length).toBeGreaterThanOrEqual(150);
    expect(EVENT_REGISTRY.length).toBeLessThanOrEqual(250);
  });

  it('has a healthy share of content per life stage', () => {
    for (const category of CATEGORIES) {
      const count = EVENT_REGISTRY.filter((e) => e.category === category).length;
      expect(count, category).toBeGreaterThan(0);
      // No single stage may dominate the entire pool.
      expect(count, category).toBeLessThanOrEqual(EVENT_REGISTRY.length * 0.4);
    }
  });

  it('every life stage has at least one dedicated event (no zero-eligible pools)', () => {
    // Dedicated category coverage independent of universal padding.
    for (const stage of ['childhood', 'teen', 'young-adult', 'adult', 'senior']) {
      expect(
        EVENT_REGISTRY.some((e) => e.category === stage),
        stage
      ).toBe(true);
    }
  });

  it('every age 0–120 has at least one eligible event for a flag-less character', () => {
    for (let age = 0; age <= 120; age++) {
      const eligible = getEligibleEventsFrom(EVENT_REGISTRY, flagless(age));
      expect(eligible.length, `age ${age}`).toBeGreaterThan(0);
    }
  });

  it('component stage pools (not just universal) cover their age bands for a flag-less character', () => {
    const bands: Array<[number, number]> = [
      [0, 12],
      [13, 17],
      [18, 25],
      [26, 65],
      [66, 120],
    ];
    for (const [lo, hi] of bands) {
      const fromStage = EVENT_REGISTRY.filter((e) => e.category !== 'universal');
      let best = 0;
      for (let age = lo; age <= hi; age++) {
        const n = getEligibleEventsFrom(fromStage, flagless(age)).length;
        best = Math.max(best, n);
      }
      expect(best, `${lo}-${hi}`).toBeGreaterThan(0);
    }
  });

  it('pickWeighted succeeds for a flag-less character at every age', () => {
    for (let age = 0; age <= 120; age++) {
      const eligible = getEligibleEventsFrom(EVENT_REGISTRY, flagless(age));
      expect(() => pickWeighted(eligible, new RNG(age)), `age ${age}`).not.toThrow();
    }
  });
});

describe('content schema validation (Gate 5 / TESTING.md Gate 5)', () => {
  it('every event has a unique snake_case id and non-empty text', () => {
    const ids = EVENT_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const event of EVENT_REGISTRY) {
      expect(event.id, event.id).toMatch(/^[a-z][a-z0-9_]{2,60}$/);
      expect(event.text.trim().length, event.id).toBeGreaterThan(10);
    }
  });

  it('age ranges, weight, tone, and category are all valid', () => {
    for (const event of EVENT_REGISTRY) {
      expect(Number.isInteger(event.minAge), event.id).toBe(true);
      expect(Number.isInteger(event.maxAge), event.id).toBe(true);
      expect(event.minAge, event.id).toBeGreaterThanOrEqual(0);
      expect(event.maxAge, event.id).toBeGreaterThanOrEqual(event.minAge);
      expect(event.maxAge, event.id).toBeLessThanOrEqual(120);
      expect(event.weight, event.id).toBeGreaterThan(0);
      expect(TONES.has(event.tone), `${event.id} tone`).toBe(true);
      expect(CATEGORIES.has(event.category), `${event.id} category`).toBe(true);
      expect(event.choices.length, event.id).toBeGreaterThan(0);
      if (event.tags !== undefined) {
        expect(Array.isArray(event.tags), `${event.id} tags`).toBe(true);
      }
      if (event.moment !== undefined) {
        expect(isMilestoneKind(event.moment), `${event.id} moment`).toBe(true);
      }
    }
  });

  it('category age bands are sensible (no infant seniors, no toddler teens)', () => {
    for (const event of EVENT_REGISTRY) {
      switch (event.category) {
        case 'childhood':
          expect(event.maxAge, event.id).toBeLessThanOrEqual(12);
          break;
        case 'teen':
          expect(event.minAge, event.id).toBeGreaterThanOrEqual(10);
          expect(event.maxAge, event.id).toBeLessThanOrEqual(18);
          break;
        case 'young-adult':
          expect(event.minAge, event.id).toBeGreaterThanOrEqual(16);
          expect(event.maxAge, event.id).toBeLessThanOrEqual(40);
          break;
        case 'adult':
          expect(event.minAge, event.id).toBeGreaterThanOrEqual(20);
          break;
        case 'senior':
          expect(event.minAge, event.id).toBeGreaterThanOrEqual(50);
          break;
        case 'universal':
        default:
          break;
      }
    }
  });

  it('choices are valid and unique within each event', () => {
    for (const event of EVENT_REGISTRY) {
      const choiceIds = event.choices.map((c) => c.id);
      expect(new Set(choiceIds).size, event.id).toBe(choiceIds.length);
      for (const choice of event.choices) {
        expect(choice.id, event.id).toMatch(/^[a-z][a-z0-9_]{1,60}$/);
        expect(choice.text.length, `${event.id}/${choice.id}`).toBeGreaterThan(3);
        expect(TONES.has(choice.tone), `${event.id}/${choice.id} tone`).toBe(true);
        for (const key of Object.keys(choice.effects)) {
          expect(STAT_EFFECT_KEYS.has(key), `${event.id}/${choice.id} key ${key}`).toBe(true);
        }
        const numeric = Object.entries(choice.effects).filter(
          ([k, v]) => !k.startsWith('add') && !k.startsWith('remove') && typeof v === 'number'
        );
        for (const [, value] of numeric) {
          expect(Math.abs(value as number), `${event.id}/${choice.id}`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('every required/anti/add/remove flag is in the documented vocabulary', () => {
    const vocab = new Set(ALL_CONTENT_FLAGS);
    for (const event of EVENT_REGISTRY) {
      for (const flag of [...(event.requiredFlags ?? []), ...(event.antiFlags ?? [])]) {
        expect(vocab.has(flag), `${event.id} gate flag "${flag}"`).toBe(true);
      }
      for (const choice of event.choices) {
        if (choice.effects.addFlag) expect(vocab.has(choice.effects.addFlag), `${event.id} addFlag`).toBe(true);
        if (choice.effects.removeFlag) expect(vocab.has(choice.effects.removeFlag), `${event.id} removeFlag`).toBe(true);
      }
    }
  });

  it('flag-gated events are actually reachable from the pool', () => {
    // Every required flag must be awarded (or satisfiable via a trait) by at
    // least one other event's choice in the pool — otherwise the gate never opens.
    const awarded = new Set<string>();
    for (const event of EVENT_REGISTRY) {
      for (const choice of event.choices) {
        if (choice.effects.addFlag) awarded.add(choice.effects.addFlag);
        if (choice.effects.addTrait) awarded.add(choice.effects.addTrait);
      }
    }
    const satsifiableByDefaultName = new Set(['education_elementary', 'education_middle', 'education_high']);
    for (const event of EVENT_REGISTRY) {
      for (const flag of event.requiredFlags ?? []) {
        expect(
          awarded.has(flag) || satsifiableByDefaultName.has(flag),
          `${event.id} requires unreachable flag "${flag}"`
        ).toBe(true);
      }
    }
  });
});

describe('sensitive-content policy spot-check (Gate 5 / DESIGN.md §11)', () => {
  const BANNED = /(suici|take your own life|kill yourself|end your life|self.harm)/i;

  it('no event text or choice offers self-harm as a path', () => {
    for (const event of EVENT_REGISTRY) {
      expect(collectText(event), event.id).not.toMatch(BANNED);
    }
  });

  it('no teen/childhood event is tagged for adult themes', () => {
    for (const event of EVENT_REGISTRY) {
      if (event.category === 'childhood' || event.category === 'teen') {
        const tags = event.tags ?? [];
        for (const tag of ['sexual', 'explicit', 'graphic', 'violent']) {
          expect(tags.includes(tag), `${event.id} tag ${tag}`).toBe(false);
        }
      }
    }
  });

  it('milestone moments used in content all resolve via the runtime mapper', () => {
    const momentIds = new Set(MILESTONE_KINDS.map((m) => m.id));
    for (const event of EVENT_REGISTRY) {
      if (event.moment && !momentIds.has(event.moment)) {
        expect(event.moment, event.id).toBeUndefined();
      }
    }
  });
});