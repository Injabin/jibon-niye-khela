/**
 * Prompt Builder for the Dhakaiya Bangla Hybrid Content Engine
 *
 * Embeds safety rules, authentic Dhakaiya voice guidelines, canonical few-shot anchors,
 * anti-repetition context, and JSON schema constraints directly in the Gemini prompt.
 */

import { DHAKAIYA_VOICE_GUIDE } from '@/content/bangla/voice-guide';
import type { Tone } from '@/lib/engine/types';

export interface PromptInput {
  age: number;
  stage: 'infant' | 'child' | 'teen' | 'young-adult' | 'adult' | 'senior';
  stats: {
    health: number;
    happiness: number;
    smarts: number;
    looks: number;
  };
  money?: number;
  traits: string[];
  recentEventIds: string[];
  targetTone: Tone;
}

export function buildDhakaiyaPrompt(input: PromptInput): string {
  const isMinor = input.age < 18;

  const sampleAnchors = DHAKAIYA_VOICE_GUIDE.sampleSentences
    .slice(0, 4)
    .map((s) => `- ${s.category}: "${s.text}"`)
    .join('\n');

  const recentList =
    input.recentEventIds.length > 0
      ? input.recentEventIds.slice(-5).join(', ')
      : 'None (fresh life)';

  return `
You are the narrative engine for "Jibon Niye Khela" (জীবন নিয়ে খেলা), an authentic Dhakaiya life simulation game.
Generate ONE life event situation with 2 to 4 interactive player choices for the current character.

### CHARACTER CONTEXT:
- Age: ${input.age} years old (Life Stage: ${input.stage})
- Stats: Health=${input.stats.health}/100, Happiness=${input.stats.happiness}/100, Smarts=${input.stats.smarts}/100, Looks=${input.stats.looks}/100
- Money: $${input.money ?? 0}
- Active Traits: ${input.traits.length > 0 ? input.traits.join(', ') : 'None'}
- Target Tone for this year: ${input.targetTone}
- RECENT EVENTS (DO NOT REPEAT THESE THEMES OR IDS): [${recentList}]

### STRICT SAFETY RULES (MANDATORY):
1. NO real-world public figures, living celebrities, or politicians.
2. NO sexual content, explicit intimacy, or sexual jokes involving characters under 18.
${isMinor ? '3. THE CHARACTER IS A MINOR (Age ' + input.age + '). The situation must strictly be age-appropriate (school, family, friends, childhood antics, innocent crushes, hobbies). NEVER adult themes or illegal vice.' : '3. Adult situations may include funny romance/marriage/career dilemmas, but NO graphic sexual descriptions or pornographic content.'}
4. NO glorification of self-harm or suicide.
5. NO graphic gore or gratuitous violence.

### LANGUAGE & TONE RULES:
- Everything MUST be written in authentic colloquial Dhakaiya Bangla script (বাংলা ইউনিকোড).
- Use witty, cheeky, streetwise Dhaka vocabulary (e.g., মামুর বেটা, চান্দি গরম, মাইঙ্কা চিপা, চুদুর বুদুর, ফাপড়, তেজপাতা, ট্যাকা, পুরাই আগুন).
- NEVER use stiff textbook/standard Bangla (শুদ্ধ বাংলা) or Romanized Banglish.

### CANONICAL VOICE EXAMPLES:
${sampleAnchors}

### OUTPUT JSON SCHEMA:
Return ONLY a valid, raw JSON object (no markdown code fences, no commentary) adhering to this exact schema:
{
  "situationText": "string in Dhakaiya Bangla describing what happened this year",
  "tag": "family" | "school" | "career" | "romance" | "health" | "crime" | "dilemma" | "random",
  "choices": [
    {
      "id": "short_unique_choice_id_in_english",
      "label": "short choice description in Dhakaiya Bangla",
      "outcomeText": "what happens after picking this choice in Dhakaiya Bangla",
      "tone": "good" | "bad" | "neutral" | "funny",
      "statEffects": {
        "health": number between -20 and 20,
        "happiness": number between -20 and 20,
        "smarts": number between -20 and 20,
        "looks": number between -20 and 20,
        "money": number between -50 and 50,
        "karma": number between -15 and 15
      }
    }
  ]
}
`.trim();
}
