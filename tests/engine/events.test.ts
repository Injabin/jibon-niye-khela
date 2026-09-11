import { describe, expect, it } from 'vitest';
import { ageUp } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  drawYearlyEvents,
  getEligibleEventsFrom,
  pickWeighted,
  resolveEventChoice,
} from '@/lib/engine/events/registry';
import { CHILDHOOD_EVENTS } from '@/content/events/childhood';
import { TEEN_EVENTS } from '@/content/events/teen';
import { ALL_FALLBACK_EVENTS, getFallbackEvent } from '@/lib/ai/fallbackBank';
import type { Character, LifeEventDef } from '@/lib/engine/types';

function atAge(seed: number, age: number): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  return character;
}

describe('age filtering boundaries (Gate 1 / Test 5)', () => {
  // Real content event: teen_acne spans exactly 13-17.
  const acneEvent = TEEN_EVENTS.find((e) => e.id === 'teen_acne');
  const boundaryEvent = CHILDHOOD_EVENTS.find((e) => e.id === 'child_lost_tooth');
  it('real content has a 13-17 event for boundary assertions', () => {
    expect(acneEvent).toBeDefined();
    if (acneEvent) {
      expect(acneEvent.minAge).toBe(13);
      expect(acneEvent.maxAge).toBe(17);
    }
  });

  it('is eligible at minAge, in-range at maxAge, and ineligible just outside', () => {
    if (!acneEvent || !boundaryEvent) return;

    expect(getEligibleEventsFrom([acneEvent], atAge(1, 12)).map((e) => e.id)).not.toContain('teen_acne');
    expect(getEligibleEventsFrom([acneEvent], atAge(1, 13)).map((e) => e.id)).toContain('teen_acne');
    expect(getEligibleEventsFrom([acneEvent], atAge(1, 17)).map((e) => e.id)).toContain('teen_acne');
    expect(getEligibleEventsFrom([acneEvent], atAge(1, 18)).map((e) => e.id)).not.toContain('teen_acne');

    // child_lost_tooth spans 5-8.
    expect(boundaryEvent.minAge).toBe(5);
    expect(boundaryEvent.maxAge).toBe(8);
    expect(getEligibleEventsFrom([boundaryEvent], atAge(1, 4)).map((e) => e.id)).not.toContain('child_lost_tooth');
    expect(getEligibleEventsFrom([boundaryEvent], atAge(1, 5)).map((e) => e.id)).toContain('child_lost_tooth');
    expect(getEligibleEventsFrom([boundaryEvent], atAge(1, 8)).map((e) => e.id)).toContain('child_lost_tooth');
    expect(getEligibleEventsFrom([boundaryEvent], atAge(1, 9)).map((e) => e.id)).not.toContain('child_lost_tooth');
  });

  it('drawYearlyEvents never fires an out-of-range event and caps at 3 per year', () => {
    for (let age = 0; age <= 40; age++) {
      const character = atAge(1, age);
      const events = drawYearlyEvents(character, new RNG(age));
      expect(events.length).toBeLessThanOrEqual(3);
      for (const event of events) {
        expect(event.minAge, event.id).toBeLessThanOrEqual(age);
        expect(event.maxAge, event.id).toBeGreaterThanOrEqual(age);
      }
    }
  });
});

describe('requiredFlags gating (Gate 1 / Test 5)', () => {
  // Real content event: child_got_pet requires the 'pet_plea' flag.
  const petEvent = CHILDHOOD_EVENTS.find((e) => e.id === 'child_got_pet');
  it('real content has a flag-gated event', () => {
    expect(petEvent).toBeDefined();
    if (petEvent) {
      expect(Array.isArray(petEvent.requiredFlags)).toBe(true);
      expect(petEvent.requiredFlags).toContain('pet_plea');
    }
  });

  it('is hidden without the flag and appears once the flag exists', () => {
    if (!petEvent) return;

    const unflagged = atAge(8, 8);
    unflagged.flags = [];
    expect(getEligibleEventsFrom([petEvent], unflagged).map((e) => e.id)).not.toContain('child_got_pet');

    const flagged = atAge(8, 8);
    flagged.flags = ['pet_plea'];
    const eligible = getEligibleEventsFrom([petEvent], flagged);
    expect(eligible.some((e) => e.id === 'child_got_pet')).toBe(true);
  });

  it('assigned traits also satisfy flag checks', () => {
    if (!petEvent) return;
    const character = atAge(8, 8);
    character.flags = [];
    character.traits = ['pet_plea'];
    const eligible = getEligibleEventsFrom([petEvent], character);
    expect(eligible.some((e) => e.id === 'child_got_pet')).toBe(true);
  });

  it('the pet chain works end to end: beg/promise grants the flag, the reward event becomes drawable', () => {
    const wish = CHILDHOOD_EVENTS.find((e) => e.id === 'child_pet_wish');
    expect(wish).toBeDefined();
    if (!wish || !petEvent) return;

    const character = atAge(1, 5);
    const choice = wish.choices.find((c) => c.id === 'pet_promise')!;
    expect(choice.effects.addFlag).toBe('pet_plea');

    resolveEventChoice(character, wish, 'pet_promise');
    expect(character.flags).toContain('pet_plea');

    // At age 7, the reward event must now be eligible.
    const older = atAge(3, 7);
    older.flags = [...character.flags];
    const eligible = getEligibleEventsFrom([petEvent], older).map((e) => e.id);
    expect(eligible).toContain('child_got_pet');
  });
});

describe('weighted selection (Gate 1 / Test 6)', () => {
  function makeEvent(id: string, weight: number): LifeEventDef {
    return {
      id,
      text: id,
      minAge: 0,
      maxAge: 99,
      weight,
      tone: 'neutral',
      category: 'universal',
      choices: [{ id: 'c', text: 'a', effects: {}, outcomeText: 'o', tone: 'neutral' }],
    };
  }

  it('higher-weighted events are picked more often across many draws', () => {
    const heavy = makeEvent('heavy', 1000);
    const light = makeEvent('light', 10);

    let heavyCount = 0;
    let lightCount = 0;
    for (let seed = 0; seed < 500; seed++) {
      const picked = pickWeighted([heavy, light], new RNG(seed));
      if (picked.id === 'heavy') heavyCount += 1;
      else lightCount += 1;
    }

    expect(heavyCount).toBeGreaterThan(lightCount);
  });

  it('rejects an empty pool and a zero-weight pool', () => {
    expect(() => pickWeighted([], new RNG(1))).toThrow();
    expect(() => pickWeighted([makeEvent('zero', 0)], new RNG(1))).toThrow();
  });

  it('drawYearlyEvents never draws the same event twice in one year', () => {
    for (let age = 0; age <= 17; age++) {
      const character = atAge(2, age);
      const events = drawYearlyEvents(character, new RNG(age));
      const ids = events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('0-3 events per year over a long deterministic run', () => {
    const { character, rng } = createCharacter(6);
    let yearsWithEvents = 0;
    for (let i = 0; i < 60 && character.alive; i++) {
      const { firedEvents } = ageUp(character, rng);
      expect(firedEvents.length).toBeLessThanOrEqual(3);
      if (firedEvents.length > 0) yearsWithEvents += 1;
    }
    expect(yearsWithEvents).toBeGreaterThan(0);
  });
});

describe('resolveEventChoice applies effects and logs history', () => {
  const EV: LifeEventDef = {
    id: 'effect_test',
    text: 'A strange machine hums at you.',
    minAge: 0,
    maxAge: 99,
    weight: 50,
    tone: 'neutral',
    category: 'universal',
    choices: [
      { id: 'good', text: 'Press it', effects: { happiness: 5, money: 20 }, outcomeText: 'Worth a try.', tone: 'good' },
    ],
  };

  it('applies choice effects and appends a history entry', () => {
    const { character } = createCharacter(7);
    const happinessBefore = character.stats.happiness;
    const moneyBefore = character.money;
    const historyBefore = character.history.length;

    resolveEventChoice(character, EV, 'good');

    expect(character.stats.happiness).toBe(happinessBefore + 5);
    expect(character.money).toBe(moneyBefore + 20);
    expect(character.history.length).toBe(historyBefore + 1);
  });

  it('throws on an unknown choice id', () => {
    const { character } = createCharacter(8);
    expect(() => resolveEventChoice(character, EV, 'nope')).toThrow();
  });
});

describe('Religion Isolation (Fallback Bank & contentOrchestrator)', () => {
  const hinduFlaggedEvents = ALL_FALLBACK_EVENTS.filter(
    (e) => e.requiredFlags?.includes('religion_hindu'),
  );
  const muslimFlaggedEvents = ALL_FALLBACK_EVENTS.filter(
    (e) => e.requiredFlags?.includes('religion_muslim'),
  );

  it('has religion-flagged content in the fallback bank', () => {
    expect(hinduFlaggedEvents.length).toBeGreaterThanOrEqual(2);
    expect(muslimFlaggedEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('a Muslim character never receives a Hindu-only fallback event', () => {
    for (const event of hinduFlaggedEvents) {
      const eligible = getFallbackEvent({
        age: event.minAge,
        religion: 'islam',
        seed: 12345,
      });
      expect(eligible.id).not.toBe(event.id);
    }
  });

  it('a Hindu character never receives a Muslim-only fallback event', () => {
    for (const event of muslimFlaggedEvents) {
      const eligible = getFallbackEvent({
        age: event.minAge,
        religion: 'hinduism',
        seed: 12345,
      });
      expect(eligible.id).not.toBe(event.id);
    }
  });

  it('ageUp across a full Muslim life never fires a Hindu-flagged event', () => {
    const { character, rng } = createCharacter(9999, { religion: 'islam' });
    const hinduIds = new Set(hinduFlaggedEvents.map((e) => e.id));
    for (let i = 0; i < 60 && character.alive; i++) {
      const { firedEvents } = ageUp(character, rng);
      for (const evt of firedEvents) {
        expect(hinduIds.has(evt.id), `Muslim char received Hindu event: ${evt.id}`).toBe(false);
      }
    }
  });

  it('ageUp across a full Hindu life never fires a Muslim-flagged event', () => {
    const { character, rng } = createCharacter(8888, { religion: 'hinduism' });
    const muslimIds = new Set(muslimFlaggedEvents.map((e) => e.id));
    for (let i = 0; i < 60 && character.alive; i++) {
      const { firedEvents } = ageUp(character, rng);
      for (const evt of firedEvents) {
        expect(muslimIds.has(evt.id), `Hindu char received Muslim event: ${evt.id}`).toBe(false);
      }
    }
  });
});