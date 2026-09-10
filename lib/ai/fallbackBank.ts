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

  // 1. Direct age match strictly excluding all recent events
  let candidates = ALL_FALLBACK_EVENTS.filter(
    (e) => e.minAge <= age && e.maxAge >= age && !recentSet.has(e.id),
  );

  // 2. If stage candidate pool was exhausted, exclude the last 15 seen events
  if (candidates.length === 0) {
    const last15 = new Set(recentEventIds.slice(-15));
    candidates = ALL_FALLBACK_EVENTS.filter(
      (e) => e.minAge <= age && e.maxAge >= age && !last15.has(e.id),
    );
  }

  // 3. Fallback: exclude at least the last 3 seen events (never repeat immediately)
  if (candidates.length === 0) {
    const last3 = new Set(recentEventIds.slice(-3));
    candidates = ALL_FALLBACK_EVENTS.filter(
      (e) => e.minAge <= age && e.maxAge >= age && !last3.has(e.id),
    );
  }

  // 4. Fallback: any candidate for current age
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => e.minAge <= age && e.maxAge >= age);
  }

  // 5. If still empty, find nearest life stage
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => Math.abs(e.minAge - age) <= 5);
  }

  // 6. Absolute fallback
  if (candidates.length === 0) {
    candidates = [...ALL_FALLBACK_EVENTS];
  }

  // 7. Prefer target tone if available
  if (preferredTone) {
    const toneMatches = candidates.filter((e) => e.tone === preferredTone);
    if (toneMatches.length > 0) candidates = toneMatches;
  }

  // High-avalanche 32-bit hash mixer: guarantees uniform pseudo-random index
  // without periodic modulo collisions or harmonic resonance across consecutive years
  let h = ((seed ^ 0xdeadbeef) + (age * 0x45d9f3b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  const idx = h % candidates.length;
  const selected = candidates[idx] ?? candidates[0];

  return {
    ...selected,
    source: 'fallback',
  };
}
