/**
 * Response Validator & Content Safety Gate for the Gemini Content Engine
 *
 * Enforces four strict verification layers before any AI-generated response
 * is accepted into game state:
 *  1. Schema Structure & Choice Count
 *  2. Stat Delta Bounds Clamping (-25 .. +25)
 *  3. Banned Terms & Public Figures Regex Pass
 *  4. Age-Context Gating (Minors vs. Adults)
 */

import type { LifeEventDef, Tone, EventChoice, StatEffects } from '@/lib/engine/types';

export interface ValidationResult {
  valid: boolean;
  event?: LifeEventDef;
  reason?: string;
}

// In-memory diagnostic counter for observability
export const validationMetrics = {
  totalChecked: 0,
  passed: 0,
  schemaFailures: 0,
  contentFilterFailures: 0,
  ageFilterFailures: 0,
};

const BANNED_PATTERNS = [
  // Real world politicians & public figures
  /(শেখ হাসিনা|খালেদা জিয়া|তারেক রহমান|মুহাম্মদ ইউনূস|ইউনুস|মোদী|ট্রাম্প|বাইডেন|পুতিন)/i,
  /\b(sheikh hasina|khaleda zia|tarique rahman|muhammad yunus|modi|trump|biden|putin)\b/i,
  // Self-harm / suicide glorification
  /(আত্মহত্যা\s*করলে\s*ভালো|গলায়\s*দড়ি\s*দিয়া\s*মর|হাত\s*কাটা\s*ভালো)/i,
  // Extreme gore & sexual violence
  /(ধর্ষণ|গণধর্ষণ|যৌন নির্যাতন|রক্তাক্ত লাশ|টুকরা টুকরা কাটা)/i,
];

const MINOR_RESTRICTED_PATTERNS = [
  /(সেক্স|যৌন মিলন|বিছানায় যাওয়া|বাসর রাত|কনডম|পর্ন|মদ খাওয়া|গাঁজা খাওয়া|মাদক)/i,
];

const ALLOWED_TONES: ReadonlySet<Tone> = new Set(['good', 'bad', 'neutral', 'funny']);

export function validateGeminiEvent(
  raw: unknown,
  characterAge: number,
  targetCategory: LifeEventDef['category'] = 'universal',
): ValidationResult {
  validationMetrics.totalChecked++;

  let parsed: Record<string, unknown>;

  if (typeof raw === 'string') {
    try {
      // Strip potential markdown fencing if Gemini included any
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      validationMetrics.schemaFailures++;
      return { valid: false, reason: 'Failed to parse JSON output from Gemini' };
    }
  } else if (typeof raw === 'object' && raw !== null) {
    parsed = raw as Record<string, unknown>;
  } else {
    validationMetrics.schemaFailures++;
    return { valid: false, reason: 'Gemini output is neither string nor object' };
  }

  // --- LAYER 1: Schema Structure ---
  const situationText = typeof parsed.situationText === 'string' ? parsed.situationText.trim() : '';
  if (!situationText || situationText.length < 5) {
    validationMetrics.schemaFailures++;
    return { valid: false, reason: 'situationText is missing or too short' };
  }

  const rawChoices = Array.isArray(parsed.choices) ? parsed.choices : [];
  if (rawChoices.length < 1 || rawChoices.length > 4) {
    validationMetrics.schemaFailures++;
    return { valid: false, reason: `Invalid choice count (${rawChoices.length}); must be between 1 and 4` };
  }

  // Combine full event text for content safety inspection
  let fullTextToScan = situationText;

  // --- LAYER 2: Choices & Stat Delta Clamping ---
  const validatedChoices: EventChoice[] = [];

  for (let i = 0; i < rawChoices.length; i++) {
    const c = rawChoices[i];
    if (!c || typeof c !== 'object') {
      validationMetrics.schemaFailures++;
      return { valid: false, reason: `Choice at index ${i} is not an object` };
    }

    const label = typeof c.label === 'string' ? c.label.trim() : typeof c.text === 'string' ? c.text.trim() : '';
    if (!label) {
      validationMetrics.schemaFailures++;
      return { valid: false, reason: `Choice ${i} label is empty` };
    }

    const outcomeText = typeof c.outcomeText === 'string' ? c.outcomeText.trim() : label;
    const tone: Tone = ALLOWED_TONES.has(c.tone as Tone) ? (c.tone as Tone) : 'neutral';

    fullTextToScan += ' ' + label + ' ' + outcomeText;

    // Stat bounds checking (-25 .. +25 clamp)
    const rawEffects = (c.statEffects && typeof c.statEffects === 'object' ? c.statEffects : {}) as Record<string, unknown>;
    const effects: StatEffects = {};

    const clampDelta = (val: unknown, min: number, max: number): number | undefined => {
      if (typeof val !== 'number' || Number.isNaN(val)) return undefined;
      return Math.min(Math.max(Math.round(val), min), max);
    };

    if (rawEffects.health !== undefined) effects.health = clampDelta(rawEffects.health, -25, 25);
    if (rawEffects.happiness !== undefined) effects.happiness = clampDelta(rawEffects.happiness, -25, 25);
    if (rawEffects.smarts !== undefined) effects.smarts = clampDelta(rawEffects.smarts, -25, 25);
    if (rawEffects.looks !== undefined) effects.looks = clampDelta(rawEffects.looks, -25, 25);
    if (rawEffects.money !== undefined) effects.money = clampDelta(rawEffects.money, -100, 100);
    if (rawEffects.karma !== undefined) effects.karma = clampDelta(rawEffects.karma, -20, 20);

    validatedChoices.push({
      id: typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `ai_choice_${i + 1}`,
      text: label,
      outcomeText,
      tone,
      effects,
    });
  }

  // --- LAYER 3: Banned Terms & Public Figures ---
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(fullTextToScan)) {
      validationMetrics.contentFilterFailures++;
      return { valid: false, reason: `Violated banned terms / safety filter (pattern: ${pattern})` };
    }
  }

  // --- LAYER 4: Age-Context Filter for Minors ---
  if (characterAge < 18) {
    for (const pattern of MINOR_RESTRICTED_PATTERNS) {
      if (pattern.test(fullTextToScan)) {
        validationMetrics.ageFilterFailures++;
        return { valid: false, reason: 'Minor under 18 violated adult theme/intimacy restriction' };
      }
    }
  }

  validationMetrics.passed++;

  const event: LifeEventDef = {
    id: `ai_${characterAge}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    text: situationText,
    minAge: Math.max(0, characterAge - 1),
    maxAge: characterAge + 1,
    weight: 10,
    tone: validatedChoices[0]?.tone ?? 'neutral',
    category: targetCategory,
    choices: validatedChoices,
    source: 'gemini',
  };

  return { valid: true, event };
}
