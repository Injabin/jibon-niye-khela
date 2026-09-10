/**
 * Local Curated Fallback Bank for the Dhakaiya Bangla Edition
 *
 * Provides a resilient, hand-authored library of authentic Dhakaiya life events
 * ensuring the game is 100% playable standalone without internet or during Gemini API outages.
 */

import type { LifeEventDef, Tone } from '@/lib/engine/types';
import { INFANT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/infant';
import { CHILD_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/child';
import { TEEN_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/teen';
import { YOUNG_ADULT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/youngAdult';
import { ADULT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/adult';
import { SENIOR_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/senior';

export const ALL_FALLBACK_EVENTS: readonly LifeEventDef[] = [
  ...INFANT_FALLBACK_EVENTS,
  ...CHILD_FALLBACK_EVENTS,
  ...TEEN_FALLBACK_EVENTS,
  ...YOUNG_ADULT_FALLBACK_EVENTS,
  ...ADULT_FALLBACK_EVENTS,
  ...SENIOR_FALLBACK_EVENTS,
];

export interface FallbackFilter {
  age: number;
  recentEventIds?: string[];
  preferredTone?: Tone;
  seed?: number;
}

/**
 * Deterministically selects an appropriate fallback event for the given age,
 * excluding recently seen event IDs to prevent immediate repeats.
 */
export function getFallbackEvent(filter: FallbackFilter): LifeEventDef {
  const { age, recentEventIds = [], preferredTone, seed = 42 } = filter;
  const recentSet = new Set(recentEventIds);

  // 1. Direct age match excluding recent
  let candidates = ALL_FALLBACK_EVENTS.filter(
    (e) => e.minAge <= age && e.maxAge >= age && !recentSet.has(e.id),
  );

  // 2. If all direct candidates were recently seen, relax anti-repeat
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => e.minAge <= age && e.maxAge >= age);
  }

  // 3. If still empty, find nearest life stage
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => Math.abs(e.minAge - age) <= 5);
  }

  // 4. Absolute fallback
  if (candidates.length === 0) {
    candidates = [...ALL_FALLBACK_EVENTS];
  }

  // 5. Prefer target tone if available
  if (preferredTone) {
    const toneMatches = candidates.filter((e) => e.tone === preferredTone);
    if (toneMatches.length > 0) candidates = toneMatches;
  }

  // Deterministic index selection using seed + age
  const idx = Math.abs((seed * 31 + age * 17) % candidates.length);
  const selected = candidates[idx] ?? candidates[0];

  return {
    ...selected,
    source: 'fallback',
  };
}
