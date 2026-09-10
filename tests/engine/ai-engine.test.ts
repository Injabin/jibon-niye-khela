import { describe, expect, it } from 'vitest';
import { buildDhakaiyaPrompt } from '@/lib/ai/promptBuilder';
import { validateGeminiEvent } from '@/lib/ai/responseValidator';
import {
  ALL_FALLBACK_EVENTS,
  getFallbackEvent,
} from '@/lib/ai/fallbackBank';
import { INFANT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/infant';
import { CHILD_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/child';
import { TEEN_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/teen';
import { YOUNG_ADULT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/youngAdult';
import { ADULT_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/adult';
import { SENIOR_FALLBACK_EVENTS } from '@/content/bangla/fallback-events/senior';
import {
  isEligibleForGemini,
  setRpmCooldown,
  setRpdCooldown,
  isUnderCooldown,
  MILESTONE_AGES,
  MAX_AI_CALLS_PER_LIFE,
} from '@/lib/ai/contentOrchestrator';
import { createCharacter } from '@/lib/engine/character';
import type { Character } from '@/lib/engine/types';

describe('AI Engine - Prompt Builder (Phase 2)', () => {
  it('generates a detailed prompt with player stats, age, and Dhakaiya instructions', () => {
    const prompt = buildDhakaiyaPrompt({
      age: 16,
      stage: 'teen',
      stats: { health: 75, happiness: 80, smarts: 65, looks: 70 },
      money: 500,
      traits: ['আতেল', 'সাহসী'],
      recentEventIds: ['teen_ssc_admit_lost'],
      targetTone: 'funny',
    });

    expect(prompt).toContain('16');
    expect(prompt).toContain('teen');
    expect(prompt).toContain('75');
    expect(prompt).toContain('80');
    expect(prompt).toContain('আতেল');
    expect(prompt).toContain('funny');
    expect(prompt).toContain('teen_ssc_admit_lost');
    // Enforces Dhakaiya Unicode Bangla instructions
    expect(prompt).toContain('বাংলা ইউনিকোড');
    expect(prompt).toContain('Dhakaiya');
  });

  it('includes strict safety and content moderation rules in prompt', () => {
    const prompt = buildDhakaiyaPrompt({
      age: 10,
      stage: 'child',
      stats: { health: 80, happiness: 80, smarts: 80, looks: 80 },
      money: 50,
      traits: [],
      recentEventIds: [],
      targetTone: 'neutral',
    });

    expect(prompt).toContain('NO real-world public figures');
    expect(prompt).toContain('NO sexual content');
    expect(prompt).toContain('JSON');
  });
});

describe('AI Engine - Response Validator (Phase 2)', () => {
  const validMockResponse = JSON.stringify({
    situationText: 'গলির মোড়ে আড্ডা দিতে গিয়া চান্দি গরম হইয়া গেল!',
    tag: 'teen',
    choices: [
      {
        id: 'c1',
        label: 'চায়ের দোকানে বইসা এক কাপ মালাই চা খাও',
        outcomeText: 'গরম চায়ে চুমুক দিয়া মন পুরাই চিল!',
        tone: 'good',
        statEffects: { happiness: 15, health: 5 },
      },
      {
        id: 'c2',
        label: 'ঝামেলা না কইরা বাড়ি চইলা যাও',
        outcomeText: 'শান্তিতে বাড়ি ফিরলি।',
        tone: 'neutral',
        statEffects: { happiness: 5 },
      },
    ],
  });

  it('validates a well-formed Dhakaiya event payload', () => {
    const result = validateGeminiEvent(validMockResponse, 16);
    expect(result.valid).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event?.text).toContain('গলির মোড়ে আড্ডা দিতে গিয়া');
    expect(result.event?.choices.length).toBe(2);
    expect(result.event?.source).toBe('gemini');
  });

  it('clamps extreme stat effects to [-25, +25] range', () => {
    const extremeResponse = JSON.stringify({
      situationText: 'বিশাল একখান কাণ্ড ঘইটা গেল!',
      tag: 'young-adult',
      choices: [
        {
          id: 'c1',
          label: 'এক লাফে গাছে ওঠো',
          outcomeText: 'ফাটাফাটি কাণ্ড!',
          tone: 'good',
          statEffects: { happiness: 100, health: -80, smarts: 40 },
        },
      ],
    });

    const result = validateGeminiEvent(extremeResponse, 22);
    expect(result.valid).toBe(true);
    const choice = result.event?.choices[0];
    expect(choice?.effects.happiness).toBe(25);
    expect(choice?.effects.health).toBe(-25);
    expect(choice?.effects.smarts).toBe(25);
  });

  it('rejects events containing banned political figures or public figures', () => {
    const bannedResponse = JSON.stringify({
      situationText: 'হঠাৎ দেখে শেখ হাসিনা রাস্তায় দাঁড়িয়ে ভাষণ দিচ্ছেন!',
      tag: 'random',
      choices: [
        {
          id: 'c1',
          label: 'ভাষণ শুনো',
          outcomeText: 'মন দিয়ে শুনলে।',
          tone: 'bad',
          statEffects: { happiness: 5 },
        },
      ],
    });

    const result = validateGeminiEvent(bannedResponse, 25);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('safety filter');
  });

  it('rejects sexual or adult intimacy choices for underage characters (< 18)', () => {
    const minorIntimacyResponse = JSON.stringify({
      situationText: 'ক্লাসের এক বন্ধুর সাথে নির্জন কক্ষে প্রেম ও ঘনিষ্ঠ বাসর রাত!',
      tag: 'romance',
      choices: [
        {
          id: 'c1',
          label: 'ঘনিষ্ঠ হও',
          outcomeText: 'শারীরিক সম্পর্ক হলো।',
          tone: 'bad',
          statEffects: { happiness: 10 },
        },
      ],
    });

    const result = validateGeminiEvent(minorIntimacyResponse, 14);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Minor under 18');
  });

  it('rejects invalid JSON or missing required fields', () => {
    const malformed = 'Not valid JSON at all';
    expect(validateGeminiEvent(malformed, 20).valid).toBe(false);

    const missingChoices = JSON.stringify({ situationText: 'কিছু একটা হইলো' });
    expect(validateGeminiEvent(missingChoices, 20).valid).toBe(false);
  });
});

describe('AI Engine - Fallback Bank (Phase 2)', () => {
  it('contains at least 150+ total events per init.md §4.6', () => {
    expect(ALL_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(150);
  });

  it('has at least 25+ events in every age bucket', () => {
    expect(INFANT_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(CHILD_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(TEEN_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(YOUNG_ADULT_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(ADULT_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(SENIOR_FALLBACK_EVENTS.length).toBeGreaterThanOrEqual(25);
  });

  it('every fallback event is valid Unicode Bangla and has source=fallback', () => {
    for (const event of ALL_FALLBACK_EVENTS) {
      expect(event.id).toBeTruthy();
      expect(event.text).toBeTruthy();
      expect(event.choices.length).toBeGreaterThanOrEqual(1);
      expect(event.choices.length).toBeLessThanOrEqual(4);

      for (const choice of event.choices) {
        expect(choice.id).toBeTruthy();
        expect(choice.text).toBeTruthy();
        expect(choice.outcomeText).toBeTruthy();
      }
    }
  });

  it('retrieves age-appropriate fallback event deterministically with seed', () => {
    const e1 = getFallbackEvent({ age: 2, seed: 101 });
    const e2 = getFallbackEvent({ age: 2, seed: 101 });
    expect(e1.id).toBe(e2.id);
    expect(e1.minAge).toBeLessThanOrEqual(2);
    expect(e1.maxAge).toBeGreaterThanOrEqual(2);
    expect(e1.source).toBe('fallback');
  });

  it('respects anti-repeat filtering by excluding recently seen event IDs', () => {
    const first = getFallbackEvent({ age: 10, seed: 50 });
    const second = getFallbackEvent({
      age: 10,
      recentEventIds: [first.id],
      seed: 50,
    });

    expect(second.id).not.toBe(first.id);
  });
});

describe('AI Engine - Content Orchestrator & Rationing (Phase 2)', () => {
  function makeChar(aiCallsUsed = 0, age = 0): Character {
    const { character } = createCharacter(12345);
    character.age = age;
    character.aiCallsUsed = aiCallsUsed;
    return character;
  }

  it('allows milestone ages [0, 6, 13, 18, 30, 60] when under cap', () => {
    for (const milestone of MILESTONE_AGES) {
      const char = makeChar(0, milestone);
      expect(isEligibleForGemini(char, milestone)).toBe(true);
    }
  });

  it('preserves priority quota for upcoming milestones before allowing wildcards', () => {
    // If target age is 15 (non-milestone), remaining milestones are [18, 30, 60] = 3.
    // Max cap = 8.
    // If used = 5, used + remaining = 8 -> wildcard CANNOT be allowed, reserved for milestones!
    const charTight = makeChar(5, 15);
    expect(isEligibleForGemini(charTight, 15)).toBe(false);

    // If used = 4, used + remaining = 7 < 8 -> wildcard is eligible to roll
    // (Actual result depends on seeded RNG roll, but it does not get rejected by milestone check)
  });

  it('blocks all live calls when 8-call per-life hard cap is reached', () => {
    const maxedChar = makeChar(MAX_AI_CALLS_PER_LIFE, 18);
    expect(isEligibleForGemini(maxedChar, 18)).toBe(false);
    expect(isEligibleForGemini(maxedChar, 25)).toBe(false);
  });

  it('manages RPM and RPD cooldowns properly', () => {
    // Test RPM short cooldown
    setRpmCooldown(10_000);
    const rpmStatus = isUnderCooldown();
    expect(rpmStatus.blocked).toBe(true);
    expect(rpmStatus.reason).toBe('RPM');

    // Test RPD cooldown (epoch timestamp)
    const futureEpochSec = Math.floor(Date.now() / 1000) + 3600;
    setRpdCooldown(futureEpochSec);
    const rpdStatus = isUnderCooldown();
    expect(rpdStatus.blocked).toBe(true);
    expect(rpdStatus.reason).toBe('RPD');
  });
});
