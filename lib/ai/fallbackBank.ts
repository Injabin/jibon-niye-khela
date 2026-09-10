/**
 * Local Curated Fallback Bank for the Dhakaiya Bangla Edition
 *
 * Provides a resilient, hand-authored library of authentic Dhakaiya life events
 * ensuring the game is 100% playable standalone without internet or during Gemini API outages.
 */

import type { LifeEventDef, Religion, Tone } from '@/lib/engine/types';
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
  /** Hard religion isolation: when set, events tagged for the opposite faith are never selectable. */
  religion?: Religion;
}

/**
 * Religion isolation for the fallback bank: an event gated to one faith is only
 * drawable by a character of that faith. When no religion is supplied (generic
 * callers) every event stays eligible, preserving existing behaviour.
 */
function religionAllowed(event: LifeEventDef, religion?: Religion): boolean {
  if (!religion) return true;
  const requirements = event.requiredFlags ?? [];
  if (requirements.includes('religion_hindu') && religion !== 'hinduism') return false;
  if (requirements.includes('religion_muslim') && religion !== 'islam') return false;
  return true;
}

/**
 * Deterministically selects an appropriate fallback event for the given age,
 * excluding recently seen event IDs to prevent immediate repeats.
 */
export function getFallbackEvent(filter: FallbackFilter): LifeEventDef {
  const { age, recentEventIds = [], preferredTone, seed = 42, religion } = filter;
  const recentSet = new Set(recentEventIds);

  const ageEligible = (e: LifeEventDef) => e.minAge <= age && e.maxAge >= age && religionAllowed(e, religion);

  // 1. Direct age match strictly excluding all recent events
  let candidates = ALL_FALLBACK_EVENTS.filter(
    (e) => ageEligible(e) && !recentSet.has(e.id),
  );

  // 2. If stage candidate pool was exhausted, exclude the last 15 seen events
  if (candidates.length === 0) {
    const last15 = new Set(recentEventIds.slice(-15));
    candidates = ALL_FALLBACK_EVENTS.filter(
      (e) => ageEligible(e) && !last15.has(e.id),
    );
  }

  // 3. Fallback: exclude at least the last 3 seen events (never repeat immediately)
  if (candidates.length === 0) {
    const last3 = new Set(recentEventIds.slice(-3));
    candidates = ALL_FALLBACK_EVENTS.filter(
      (e) => ageEligible(e) && !last3.has(e.id),
    );
  }

  // 4. Fallback: any candidate for current age
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter(ageEligible);
  }

  // 5. If still empty, find nearest life stage
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => ageEligible(e) || Math.abs(e.minAge - age) <= 5);
  }

  // 6. Absolute fallback (religion isolation still holds so the wrong faith's
  //    holiday can never surface to the wrong character).
  if (candidates.length === 0) {
    candidates = ALL_FALLBACK_EVENTS.filter((e) => religionAllowed(e, religion));
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
