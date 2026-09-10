/**
 * Client-Side Content Orchestrator for the Hybrid Content Engine
 *
 * Enforces:
 *  1. Client-side cooldown management (RPM short backoff vs. RPD daily exhaustion).
 *  2. Per-life 8-call rationing with strict priority for milestone ages [0, 6, 13, 18, 30, 60].
 *  3. Seeded deterministic 15% wildcard roll (using lib/engine/rng.ts).
 *  4. Seamless automatic fallback to local fallbackBank.ts on any error or cooldown.
 */

import type { Character, LifeEventDef, Tone } from '@/lib/engine/types';
import { RNG } from '@/lib/engine/rng';
import { getFallbackEvent } from '@/lib/ai/fallbackBank';

export const MILESTONE_AGES: readonly number[] = [0, 6, 13, 18, 30, 60];
export const MAX_AI_CALLS_PER_LIFE = 8;
export const WILDCARD_CHANCE = 0.15; // 15% probability for non-milestone years

export interface OrchestratorResult {
  event: LifeEventDef;
  source: 'gemini' | 'fallback';
}

// Client-side in-memory & sessionStorage cooldown tracking
interface CooldownState {
  rpmUntil: number; // epoch ms
  rpdUntil: number; // epoch ms
}

const STORAGE_KEY = 'jnk_ai_cooldowns_v2';

function loadCooldowns(): CooldownState {
  if (typeof window === 'undefined') return { rpmUntil: 0, rpdUntil: 0 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { rpmUntil: 0, rpdUntil: 0 };
    return JSON.parse(raw) as CooldownState;
  } catch {
    return { rpmUntil: 0, rpdUntil: 0 };
  }
}

function saveCooldowns(state: CooldownState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore sessionStorage quota / privacy errors
  }
}

const activeCooldowns = loadCooldowns();

export function setRpmCooldown(durationMs = 60_000): void {
  activeCooldowns.rpmUntil = Date.now() + durationMs;
  saveCooldowns(activeCooldowns);
}

export function setRpdCooldown(retryAtEpochSec: number): void {
  activeCooldowns.rpdUntil = retryAtEpochSec * 1000;
  saveCooldowns(activeCooldowns);
}

export function isUnderCooldown(): { blocked: boolean; reason?: 'RPM' | 'RPD' } {
  const now = Date.now();
  if (now < activeCooldowns.rpdUntil) {
    return { blocked: true, reason: 'RPD' };
  }
  if (now < activeCooldowns.rpmUntil) {
    return { blocked: true, reason: 'RPM' };
  }
  return { blocked: false };
}

function computeLifeEventSeed(character: Character, targetAge: number): number {
  let charHash = 0;
  const idOrName = character.id || character.name || 'char';
  for (let i = 0; i < idOrName.length; i++) {
    charHash = (Math.imul(31, charHash) + idOrName.charCodeAt(i)) | 0;
  }
  return Math.abs(charHash ^ (character.birthYear * 37) ^ (targetAge * 13));
}

/**
 * Determines whether the character is currently eligible to request a live Gemini event,
 * strictly reserving capacity for upcoming milestone ages before allowing wildcard rolls.
 */
export function isEligibleForGemini(character: Character, targetAge: number): boolean {
  // 1. Check client cooldowns
  if (isUnderCooldown().blocked) return false;

  // 2. Check per-life hard cap
  const used = character.aiCallsUsed ?? 0;
  if (used >= MAX_AI_CALLS_PER_LIFE) return false;

  // 3. Count remaining milestone ages strictly ahead of current age
  const remainingMilestones = MILESTONE_AGES.filter((m) => m > targetAge).length;

  // 4. Milestone precedence check:
  const isCurrentMilestone = MILESTONE_AGES.includes(targetAge);

  if (isCurrentMilestone) {
    // Milestones always get priority as long as under the cap
    return true;
  }

  // Non-milestone wildcard: ONLY allowed if remaining milestone quota is preserved
  if (used + remainingMilestones >= MAX_AI_CALLS_PER_LIFE) {
    return false; // Reserved for upcoming milestones
  }

  // 5. Seeded deterministic 15% roll using engine RNG
  const lifeSeed = computeLifeEventSeed(character, targetAge);
  const rng = new RNG(lifeSeed);
  const roll = rng.next();

  return roll < WILDCARD_CHANCE;
}

export async function fetchEventForYear(
  character: Character,
  targetAge: number,
  targetTone: Tone = 'neutral',
): Promise<OrchestratorResult> {
  const recentIds = (character.recentEventHistory ?? []).map((r) => r.id);
  const lifeEventSeed = computeLifeEventSeed(character, targetAge);

  // 1. Check rationing eligibility
  const eligible = isEligibleForGemini(character, targetAge);

  if (!eligible) {
    const fallback = getFallbackEvent({
      age: targetAge,
      recentEventIds: recentIds,
      preferredTone: targetTone,
      seed: lifeEventSeed,
    });
    return { event: fallback, source: 'fallback' };
  }

  // 2. Attempt live Gemini generation through the server-only proxy route
  try {
    let stage: 'infant' | 'child' | 'teen' | 'young-adult' | 'adult' | 'senior' = 'adult';
    if (targetAge <= 5) stage = 'infant';
    else if (targetAge <= 12) stage = 'child';
    else if (targetAge <= 17) stage = 'teen';
    else if (targetAge <= 29) stage = 'young-adult';
    else if (targetAge <= 64) stage = 'adult';
    else stage = 'senior';

    const payload = {
      age: targetAge,
      stage,
      stats: {
        health: character.stats.health,
        happiness: character.stats.happiness,
        smarts: character.stats.smarts,
        looks: character.stats.looks,
      },
      money: character.money,
      traits: character.traits,
      recentEventIds: recentIds,
      targetTone,
    };

    const res = await fetch('/api/generate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 429) {
        if (errData.errorType === 'RPD_EXHAUSTED' && typeof errData.retryAt === 'number') {
          setRpdCooldown(errData.retryAt);
        } else {
          setRpmCooldown(60_000);
        }
      } else {
        // Validation failure, timeout, or server error -> short backoff
        setRpmCooldown(30_000);
      }

      // Seamless fallback on failure
      const fallback = getFallbackEvent({
        age: targetAge,
        recentEventIds: recentIds,
        preferredTone: targetTone,
        seed: lifeEventSeed,
      });
      return { event: fallback, source: 'fallback' };
    }

    const data = await res.json();
    if (data.success && data.event) {
      return { event: data.event, source: 'gemini' };
    }

    // Response malformed -> fallback
    const fallback = getFallbackEvent({
      age: targetAge,
      recentEventIds: recentIds,
      preferredTone: targetTone,
      seed: lifeEventSeed,
    });
    return { event: fallback, source: 'fallback' };
  } catch {
    // Network failure / fetch abort -> short cooldown + fallback
    setRpmCooldown(30_000);
    const fallback = getFallbackEvent({
      age: targetAge,
      recentEventIds: recentIds,
      preferredTone: targetTone,
      seed: lifeEventSeed,
    });
    return { event: fallback, source: 'fallback' };
  }
}
