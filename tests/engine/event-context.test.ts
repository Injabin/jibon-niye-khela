import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { getEligibleEventsFrom } from '@/lib/engine/events/registry';
import {
  ALL_FALLBACK_EVENTS,
  getFallbackEvent,
  isFallbackEventContextEligible,
} from '@/lib/ai/fallbackBank';
import { selectYearFallbacks } from '@/lib/store/gameStore';
import type { Character, Religion } from '@/lib/engine/types';

const SPOUSE_SENIOR_EVENT = ALL_FALLBACK_EVENTS.find((e) => e.id === 'senior_golden_anniversary');
const SPOUSE_ADULT_EVENT = ALL_FALLBACK_EVENTS.find((e) => e.id === 'adult_gold_necklace_anniversary');

function atAge(
  seed: number,
  age: number,
  religion: Religion = 'islam',
  flags: string[] = [],
): Character {
  const { character } = createCharacter(seed, { religion });
  character.age = age;
  character.flags.push(...flags);
  return character;
}

describe('B: fallback bank context-awareness', () => {
  it('tags the two spouse-tied fallback events with has_spouse', () => {
    expect(SPOUSE_SENIOR_EVENT?.requiredFlags).toContain('has_spouse');
    expect(SPOUSE_ADULT_EVENT?.requiredFlags).toContain('has_spouse');
  });

  it('spouse-only events are ineligible for unmarried characters', () => {
    const singleSenior = atAge(101, 70);
    const singleAdult = atAge(102, 40);
    if (SPOUSE_SENIOR_EVENT) {
      expect(isFallbackEventContextEligible(SPOUSE_SENIOR_EVENT, { character: singleSenior })).toBe(false);
    }
    if (SPOUSE_ADULT_EVENT) {
      expect(isFallbackEventContextEligible(SPOUSE_ADULT_EVENT, { character: singleAdult })).toBe(false);
    }
  });

  it('spouse-only events are eligible for married characters', () => {
    const marriedSenior = atAge(103, 70, 'islam', ['has_spouse']);
    const marriedAdult = atAge(104, 40, 'islam', ['has_spouse']);
    if (SPOUSE_SENIOR_EVENT) {
      expect(isFallbackEventContextEligible(SPOUSE_SENIOR_EVENT, { character: marriedSenior })).toBe(true);
    }
    if (SPOUSE_ADULT_EVENT) {
      expect(isFallbackEventContextEligible(SPOUSE_ADULT_EVENT, { character: marriedAdult })).toBe(true);
    }
  });

  it('getEligibleEventsFrom gates the fallback bank by context flags', () => {
    const marriedSenior = atAge(105, 70, 'islam', ['has_spouse']);
    const singleSenior = atAge(106, 70);
    const marriedIds = getEligibleEventsFrom(ALL_FALLBACK_EVENTS, marriedSenior).map((e) => e.id);
    const singleIds = getEligibleEventsFrom(ALL_FALLBACK_EVENTS, singleSenior).map((e) => e.id);
    expect(marriedIds).toContain('senior_golden_anniversary');
    expect(singleIds).not.toContain('senior_golden_anniversary');
  });

  it('religion isolation holds when context arrives as a character', () => {
    const hinduFlagged = ALL_FALLBACK_EVENTS.filter((e) => e.requiredFlags?.includes('religion_hindu'));
    const muslimFlagged = ALL_FALLBACK_EVENTS.filter((e) => e.requiredFlags?.includes('religion_muslim'));
    expect(hinduFlagged.length).toBeGreaterThanOrEqual(2);
    expect(muslimFlagged.length).toBeGreaterThanOrEqual(2);

    const muslim = atAge(107, 20, 'islam');
    const hindu = atAge(108, 20, 'hinduism');
    for (const event of hinduFlagged) {
      expect(getFallbackEvent({ age: 20, seed: 12345, character: muslim }).id).not.toBe(event.id);
    }
    for (const event of muslimFlagged) {
      expect(getFallbackEvent({ age: 20, seed: 12345, character: hindu }).id).not.toBe(event.id);
    }
  });

  it('religion + spouse context compose in a single fallback draw', () => {
    const hinduSpouseSenior = atAge(109, 70, 'hinduism', ['has_spouse']);
    const draw = getFallbackEvent({ age: 70, seed: 4242, character: hinduSpouseSenior });
    expect(draw.requiredFlags?.includes('religion_muslim')).not.toBe(true);
  });
});

describe('B: store context-first pipeline helper', () => {
  it('returns one fallback event and records it in recentEventHistory', () => {
    const char = atAge(110, 25, 'hinduism');
    const before = char.recentEventHistory?.length ?? 0;
    const events = selectYearFallbacks(char, 777);
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('fallback');
    expect(char.recentEventHistory?.length).toBe(before + 1);
    expect(char.recentEventHistory?.[char.recentEventHistory!.length - 1].age).toBe(25);
  });

  it('fallback drawn through the pipeline respects character religion', () => {
    const hinduFlagged = ALL_FALLBACK_EVENTS.filter((e) => e.requiredFlags?.includes('religion_hindu'));
    for (const event of hinduFlagged) {
      const char = atAge(111, 30, 'islam');
      const events = selectYearFallbacks(char, 888 + event.minAge);
      expect(events[0].id).not.toBe(event.id);
    }
  });

  it('never draws a spouse-tagged fallback for a single character through the pipeline', () => {
    for (const age of [40, 70, 80]) {
      const singles = getEligibleEventsFrom(
        ALL_FALLBACK_EVENTS,
        atAge(112 + age, age),
      ).filter((e) => e.requiredFlags?.includes('has_spouse'));
      expect(singles).toHaveLength(0);
    }
  });
});