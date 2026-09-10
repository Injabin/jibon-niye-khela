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
  gender?: 'male' | 'female';
  religion?: 'islam' | 'hinduism';
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
  playerStyle?: string;
  relationshipStatus?: string;
  careerStatus?: string;
  criminalStatus?: string;
  recentDecisions?: string[];
}

export function buildDhakaiyaPrompt(input: PromptInput): string {
  const isMinor = input.age < 18;

  const allSamples = DHAKAIYA_VOICE_GUIDE.sampleSentences;
  // Shuffle and pick 6 diverse samples so Gemini gets varied voice anchors each time
  const shuffled = [...allSamples].sort(() => Math.random() - 0.5);
  const sampleAnchors = shuffled
    .slice(0, 6)
    .map((s) => `- ${s.category}: "${s.text}"`)
    .join('\n');

  const recentList =
    input.recentEventIds.length > 0
      ? input.recentEventIds.slice(-5).join(', ')
      : 'None (fresh life)';

  const decisionsList =
    input.recentDecisions && input.recentDecisions.length > 0
      ? input.recentDecisions.slice(-3).join(' | ')
      : 'None';

  return `
You are the narrative engine for "Jibon Niye Khela" (জীবন নিয়ে খেলা), an authentic Dhakaiya life simulation game.
Generate ONE life event situation with 2 to 4 interactive player choices for the current character.

### CHARACTER CONTEXT & PLAYER STYLE:
- Age: ${input.age} years old (Life Stage: ${input.stage})
- Gender: ${input.gender ?? 'male'}
- Religion: ${input.religion === 'hinduism' ? 'Hinduism' : 'Islam'}
- Stats: Health=${input.stats.health}/100, Happiness=${input.stats.happiness}/100, Smarts=${input.stats.smarts}/100, Looks=${input.stats.looks}/100
- Money: ৳${input.money ?? 0}
- Player Lifestyle & Persona: ${input.playerStyle ?? 'সাধারণ ঢাকাইয়া জীবন'}
- Career / School Situation: ${input.careerStatus ?? 'কোনো নির্দিষ্ট পেশা নাই'}
- Relationship & Family Status: ${input.relationshipStatus ?? 'সিঙ্গেল'}
- Criminal / Law Status: ${input.criminalStatus ?? 'পুলিশের খাতায় নাম নাই'}
- Active Traits: ${input.traits.length > 0 ? input.traits.join(', ') : 'None'}
- Target Tone for this year: ${input.targetTone}
- Recent Player Choices & Decisions: [${decisionsList}]
- RECENT EVENTS (DO NOT REPEAT THESE THEMES OR IDS): [${recentList}]

### STRICT RELIGIOUS & MARITAL LOGIC (MANDATORY):
1. RELIGION: The character is ${input.religion === 'hinduism' ? 'HINDU (সনাতন ধর্মাবলম্বী)' : 'MUSLIM (ইসলাম ধর্মাবলম্বী)'}.
${input.religion === 'hinduism'
  ? '   - Strictly generate ONLY Hindu cultural/religious events (Shankharibazar Durga Puja, Janmashtami procession, Saraswati Puja pushpanjali, Dol Purnima/Holi colors, temple prasad). NEVER mention Qurbani, Eid, Ramadan, Shab-e-Barat, or Islamic prayers.'
  : '   - Strictly generate ONLY Islamic cultural/religious events (Eid-ul-Fitr, Qurbani Eid cow market, Ramadan iftar, Shab-e-Barat halwa, mosque prayers). NEVER mention Hindu puja or rituals.'
}
2. GENDER & MARITAL LOGIC: The character is ${input.gender ?? 'male'}. In Bangladesh/Dhakaiya society, marriage and romance are heterosexual (a man dates/marries a woman/wife, a woman dates/marries a man/husband).

### STORY PERSONALIZATION DIRECTIVE:
You MUST tailor this year's situation directly to the character's active Lifestyle (${input.playerStyle ?? 'সাধারণ জীবন'}), Career (${input.careerStatus ?? 'কোনো কাজ নাই'}), and Relationship (${input.relationshipStatus ?? 'সিঙ্গেল'}). If they have a spouse, children, a toxic boss, or are running street hustles, weave that directly into the dilemma! Make choices comedic, culturally rooted, and impactful.

### STRICT SAFETY RULES (MANDATORY):
1. NO real-world public figures, living celebrities, or politicians.
2. NO sexual content, explicit intimacy, or sexual jokes involving characters under 18.
${isMinor ? '3. THE CHARACTER IS A MINOR (Age ' + input.age + '). The situation must strictly be age-appropriate (school, family, friends, childhood antics, innocent crushes, hobbies). NEVER adult themes or illegal vice.' : '3. Adult situations may include funny romance/marriage/career dilemmas, but NO graphic sexual descriptions or pornographic content.'}
4. NO glorification of self-harm or suicide.
5. NO graphic gore or gratuitous violence.

### AUTHENTIC DHAKAIYA KUTTI DIALECT (MANDATORY VOCABULARY):
Use authentic Old Dhaka Kutti vocabulary directly from everyday speech:
- ছেলে -> পোলা, মেয়ে -> মাইয়া, ছেলেপেলে -> পোলাপাইন
- সত্যি -> হাচা / হাচ্চা, কেন -> ক্যান / ক্যালা, কেমন -> কেমতে
- শোন -> হুন / শুন, চা খেয়ে -> চা খায়া, আমার সঙ্গে যাবেন নাকি? -> আমার লগে যাইবেন নিকি?
- থেকে -> থেইকা / থন, কিন্তু -> মাগার / মগর, আমিও -> আমি বি, সব -> ছব
- দেখি -> দেহি, গিয়ে -> যায়া, আমি যাচ্ছি -> আমি যাইতাছি, আমি করবো -> আমি করুম
- Additional streetwise flavor: মামুর বেটা, চান্দি গরম, মাইঙ্কা চিপা, ফুটানি, তল্পিতল্পা, ট্যাকা, গ্যাঞ্জাম, লাল দালান!

### EXPANDED SLANG VOCABULARY (USE NATURALLY IN SITUATIONS & CHOICES):
- ফাপর (Fapor) = Bluffing / showing off (e.g., "ফাপর লস হালায়?")
- চাপাবাজ (Chapabaj) = Someone who lies or exaggerates a lot
- গ্যাঞ্জাম (Ganjam) = Trouble / fight (e.g., "খামোখা গ্যাঞ্জাম লাগাইস না!")
- প্যারা (Pyara) = Headache / hassle (e.g., "মামা, আর প্যারা দিস না।")
- চিপা (Chipa) = Narrow alley / tight spot (e.g., "কোন চিপায় লুকাইলি?")
- খাইসতা (Khaista) = Annoying / dirty behavior
- টাউট (Taut) = A cheater or fraud
- আবাইল্লা (Abailla) = Useless (e.g., "এক্কেরে আবাইল্লা কাম করলি!")
- মাখন (Makhon) = Awesome / perfect (e.g., "পুরা মাখন অবস্থা!")
- ক্যাচাল (Kachal) = Useless argument / nagging
- ঠোলা (Thola) = Police (local slang)
- গড়ের মাঠ (Gorer Math) = Empty pocket (e.g., "পকেট পুরাই গড়ের মাঠ!")

### FAMOUS DIALOGUES (Use as punchlines, reactions, or NPC dialogue):
- "মোগ্যাম্বো খুশ হুয়া!" (When someone gets an unexpected treat)
- "মারব এহানে, লাশ পড়ব শ্মশানে!" (Before a friendly fight or confrontation)
- "পিকচার আভি বাকি হ্যায় মেরে দোস্ত!" (When things look bad but hope remains)
- "চান্দের দেশে পাঠায়া দিমু এক্কেরে!" (Pure Dhakaiya threat)
- "খাইছে আমারে!" (Extreme shock/surprise)
- "আবে হালায়, কি কস এইগুলা?" (Disbelief at someone's words)

### EVERYDAY SENTENCE PATTERNS (Use these natural phrasings):
- তুমি কেমন আছ? -> "কিরে মামা, কেমতে দিনকাল কাডাইতাছস?"
- আমি ভালো আছি -> "আলহামদুলিল্লাহ, পুরাই মাখন আছি!"
- কোথায় যাচ্ছ? -> "কই যাস হালায়?"
- বস ডাকছেন -> "বস আমারে তলব দিছে, মনে লয় আইজকা খবর আছে!"
- কাজ শেষ হয়নি -> "কাম তো এহনো লটকা রইছে মিয়া ভাই!"
- খাবার ভালো -> "খানাডা পুরাই অস্থির অইছে মামা, খায়া কলিজা জুড়ায়া গেল!"
- টাকা নেই -> "মামা, পকেট পুরাই গড়ের মাঠ, দুইডা ট্যাহা ধার দে!"
- মন খারাপ -> "মুখডা বাংলার পাঁচের মত কইরা রাখছস ক্যালা? প্যারা খাইছস নি?"
- ভুল স্বীকার -> "ভুল অইলে মাইনা নিবি, খামোখা ত্যাদড়ামি করবি না।"
- ধৈর্য ধরো -> "একটু চিল কর মামা, এত হাইপার অইস না!"
- NEVER use stiff textbook/standard Bangla (শুদ্ধ বাংলা) or Romanized Banglish. Write exclusively in authentic Bangla Unicode script (বাংলা ইউনিকোড).

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
