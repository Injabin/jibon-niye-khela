import { describe, expect, it } from 'vitest';
import {
  EXPRESSION_BY_TONE,
  MILESTONE_KINDS,
  expressionForTone,
  isMilestoneKind,
  milestoneKindForEvent,
  type ExpressionId,
} from '@/lib/engine/moments';
import type { LifeEventDef, MilestoneKind, Tone } from '@/lib/engine/types';

describe('expressionForTone (DESIGN.md §7)', () => {
  it('maps every outcome tone to a distinct expression overlay id', () => {
    const toneOf: Record<Tone, ExpressionId> = {
      good: 'sparkle',
      bad: 'tear',
      neutral: 'think',
      funny: 'giggle',
    };
    const seen = new Set<ExpressionId>();
    for (const tone of Object.keys(toneOf) as Tone[]) {
      const id = expressionForTone(tone);
      expect(seen.has(id)).toBe(false);
      seen.add(id);
      expect(id).toBe(toneOf[tone]);
    }
    expect(Object.keys(EXPRESSION_BY_TONE)).toHaveLength(4);
  });
});

describe('MILESTONE_KINDS (DESIGN.md §7)', () => {
  it('defines 10 reusable milestone beats with unique ids', () => {
    const ids = MILESTONE_KINDS.map((kind) => kind.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(10);
    for (const kind of MILESTONE_KINDS) {
      expect(kind.label.length).toBeGreaterThan(0);
      expect(isMilestoneKind(kind.id)).toBe(true);
    }
  });

  it('covers the core beats required by DESIGN.md §7', () => {
    const ids = new Set(MILESTONE_KINDS.map((kind) => kind.id));
    for (const required of ['confetti', 'money', 'handcuffs', 'tombstone', 'diploma', 'wedding'] as const) {
      expect(ids.has(required), `missing beat ${required}`).toBe(true);
    }
  });

  it('rejects unknown ids and accepts known ones', () => {
    expect(isMilestoneKind('confetti')).toBe(true);
    expect(isMilestoneKind('explosion')).toBe(false);
    expect(isMilestoneKind(undefined)).toBe(false);
    expect(isMilestoneKind(null)).toBe(false);
  });
});

describe('milestoneKindForEvent', () => {
  function event(moment?: MilestoneKind): LifeEventDef {
    return {
      id: 'test_event',
      text: 'A test',
      minAge: 0,
      maxAge: 99,
      weight: 10,
      tone: 'neutral',
      category: 'universal',
      moment,
      choices: [],
    };
  }

  it('returns the moment beat for a tagged event', () => {
    expect(milestoneKindForEvent(event('confetti'))).toBe('confetti');
    expect(milestoneKindForEvent(event('tombstone'))).toBe('tombstone');
  });

  it('returns null when an event has no moment', () => {
    expect(milestoneKindForEvent(event(undefined))).toBeNull();
    expect(milestoneKindForEvent({ moment: undefined })).toBeNull();
  });
});