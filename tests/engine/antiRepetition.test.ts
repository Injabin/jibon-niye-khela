import { describe, expect, it } from 'vitest';
import { EVENT_REGISTRY } from '@/content/events';
import { createCharacter } from '@/lib/engine/character';
import { drawYearlyEventsFrom, EVENT_COOLDOWN_YEARS, getEligibleEventsFrom } from '@/lib/engine/events/registry';
import { renderTemplate, hasTemplate } from '@/lib/engine/events/template';
import { RNG } from '@/lib/engine/rng';
import { getFallbackEvent } from '@/lib/ai/fallbackBank';

describe('Anti-Repetition Engine (Gate 9 / Additional_plus_improved_plan.md)', () => {
  it('EVENT_COOLDOWN_YEARS is configured to 15 years', () => {
    expect(EVENT_COOLDOWN_YEARS).toBe(15);
  });

  it('no non-universal event fires twice within a 15-year window across 10 simulated lives', () => {
    for (let lifeSeed = 1001; lifeSeed <= 1010; lifeSeed++) {
      const { character } = createCharacter(lifeSeed);
      const rng = new RNG(lifeSeed);
      const historyByEventId = new Map<string, number[]>();

      for (let age = 0; age <= 85; age++) {
        character.age = age;
        const drawn = drawYearlyEventsFrom(EVENT_REGISTRY, character, rng);

        for (const ev of drawn) {
          // Check if this event was seen in the last 15 years
          if (ev.category !== 'universal') {
            const pastAges = historyByEventId.get(ev.id) ?? [];
            for (const pastAge of pastAges) {
              const diff = age - pastAge;
              expect(
                diff,
                `Event ${ev.id} repeated at age ${age} after being seen at age ${pastAge} (diff ${diff} < 15)`
              ).toBeGreaterThanOrEqual(15);
            }
          }

          if (!historyByEventId.has(ev.id)) {
            historyByEventId.set(ev.id, []);
          }
          historyByEventId.get(ev.id)!.push(age);
        }
      }
    }
  });

  it('event eligibility respects recentEventHistory records', () => {
    const { character } = createCharacter(42);
    character.age = 25;
    character.recentEventHistory = [{ id: 'ya_freelance_gig', age: 20 }];

    const eligible = getEligibleEventsFrom(EVENT_REGISTRY, character);
    expect(eligible.some((e) => e.id === 'ya_freelance_gig')).toBe(false);

    // After aging past 15 years (age 20 + 15 = 35)
    character.age = 36;
    const eligibleLater = getEligibleEventsFrom(EVENT_REGISTRY, character);
    const eventDef = EVENT_REGISTRY.find((e) => e.id === 'ya_freelance_gig');
    if (eventDef && eventDef.maxAge >= 36) {
      expect(eligibleLater.some((e) => e.id === 'ya_freelance_gig')).toBe(true);
    }
  });
});

describe('Dynamic Text Templating (Gate 9 / Additional_plus_improved_plan.md)', () => {
  it('detects templates accurately via hasTemplate', () => {
    expect(hasTemplate('Hello {world|friend|traveler}')).toBe(true);
    expect(hasTemplate('Normal text without template tokens')).toBe(false);
  });

  it('renderTemplate chooses deterministically with RNG seed', () => {
    const template = 'You ordered a hot cup of {ginger chai|cardamom tea|spiced coffee}.';
    const rng1 = new RNG(777);
    const rng2 = new RNG(777);

    const res1 = renderTemplate(template, rng1);
    const res2 = renderTemplate(template, rng2);

    expect(res1).toBe(res2);
    expect(['You ordered a hot cup of ginger chai.', 'You ordered a hot cup of cardamom tea.', 'You ordered a hot cup of spiced coffee.']).toContain(res1);
  });

  it('renderTemplate provides textual variety across different seeds', () => {
    const template = 'You meet {a mysterious stranger|an old friend|a curious street performer}.';
    const results = new Set<string>();

    for (let seed = 1; seed <= 20; seed++) {
      results.add(renderTemplate(template, new RNG(seed)));
    }

    // Should pick more than 1 option across 20 distinct seeds
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('Fallback Bank Anti-Repetition (Dhakaiya Bangla)', () => {
  it('does not repeat events across consecutive years during childhood (ages 6-12)', () => {
    for (let baseSeed = 100; baseSeed <= 120; baseSeed++) {
      const recentEventIds: string[] = [];
      const seenIds = new Set<string>();

      for (let age = 6; age <= 12; age++) {
        const event = getFallbackEvent({
          age,
          recentEventIds,
          seed: baseSeed + age,
        });

        expect(
          recentEventIds.includes(event.id),
          `Fallback event ${event.id} repeated at age ${age} for seed ${baseSeed}`
        ).toBe(false);

        recentEventIds.push(event.id);
        seenIds.add(event.id);
      }

      expect(seenIds.size).toBe(7);
    }
  });
});
