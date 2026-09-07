/**
 * Milestone moments & facial expressions (DESIGN.md §7) — pure, non-random.
 *
 * Two small pure mappings the UI layer consumes:
 *  - `expressionForTone`: which avatar expression overlay to show for an
 *    event outcome tone (`good | bad | neutral | funny`).
 *  - `MILESTONE_KINDS` + `milestoneKindForEvent`: the shared catalogue of
 *    milestone sting beats an event can carry via its `moment` field.
 *
 * This module stays free of asset paths, colours, and SFX names so the
 * engine barrel never couples to the UI/audio layers (AGENT.md §5).
 */

import type { LifeEventDef, MilestoneKind, Tone } from './types';

/** Avatar expression overlays, keyed by event outcome tone. */
export type ExpressionId = 'sparkle' | 'tear' | 'think' | 'giggle';

export const EXPRESSION_BY_TONE: Record<Tone, ExpressionId> = {
  good: 'sparkle',
  bad: 'tear',
  neutral: 'think',
  funny: 'giggle',
};

export function expressionForTone(tone: Tone): ExpressionId {
  return EXPRESSION_BY_TONE[tone];
}

export interface MilestoneKindDef {
  id: MilestoneKind;
  label: string;
}

/** 10 reusable milestone beats; content tags events with `moment`. */
export const MILESTONE_KINDS: readonly MilestoneKindDef[] = [
  { id: 'confetti', label: 'Big win' },
  { id: 'money', label: 'Money matters' },
  { id: 'diploma', label: 'Graduation' },
  { id: 'wedding', label: 'A wedding' },
  { id: 'handcuffs', label: 'Trouble' },
  { id: 'tombstone', label: 'The end' },
  { id: 'birth', label: 'A birth' },
  { id: 'sparkles', label: 'A small win' },
  { id: 'heart', label: 'A bond' },
  { id: 'house', label: 'A home' },
];

export function isMilestoneKind(value: unknown): value is MilestoneKind {
  return MILESTONE_KINDS.some((kind) => kind.id === value);
}

/** Which sting (if any) an event carries. Null means no moment beat. */
export function milestoneKindForEvent(
  event: LifeEventDef | Pick<LifeEventDef, 'moment'>,
): MilestoneKind | null {
  return event.moment ?? null;
}