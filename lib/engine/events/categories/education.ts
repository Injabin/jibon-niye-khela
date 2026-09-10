/**
 * Education system engine (DESIGN.md §5.1, init.md M5 #2).
 *
 * Pure, RNG-seeded progress through the schooling arc: auto-advancing
 * elementary → middle → high school with a smarts-driven GPA, then a
 * player-chosen post-secondary path (undergraduate / vocational) with
 * smarts-gated majors, tuition, and a graduation countdown. All state lives
 * on `character.education`; flags come from the shared vocabulary in
 * `content/events/flags.ts`. Never imports React or touches the DOM.
 */

import type { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import type { Character, EducationStage, Tone } from '@/lib/engine/types';

export interface EducationOutcome {
  text: string;
  tone: Tone;
}

export type MajorField = 'stem' | 'business' | 'arts' | 'medicine' | 'law';

export const MAJOR_FLAG: Record<MajorField, string> = {
  stem: 'major_stem',
  business: 'major_business',
  arts: 'major_arts',
  medicine: 'major_medicine',
  law: 'major_law',
};

export const SCHOOL_START_AGE = 6;
export const SCHOOL_END_AGE = 17;
export const UNDERGRAD_YEARS = 4;
export const VOCATIONAL_YEARS = 2;
export const UNDERGRAD_TUITION = 1_200;
export const VOCATIONAL_TUITION = 250;
export const GPA_HIGH = 3.5;
export const GPA_LOW = 1.7;

const SCHOOL_STAGES: { age: number; stage: EducationStage }[] = [
  { age: 6, stage: 'elementary' },
  { age: 12, stage: 'middle' },
  { age: 15, stage: 'high' },
];

const SCHOOL_STAGE_FLAG: Record<EducationStage, string> = {
  none: '',
  preschool: '',
  elementary: 'education_elementary',
  middle: 'education_middle',
  high: 'education_high',
  undergraduate: 'education_university',
  graduate: 'education_graduate',
  vocational: 'education_vocational',
  dropped: '',
};

function removeFlag(character: Character, flag: string): void {
  character.flags = character.flags.filter((f) => f !== flag);
}

function hasFlag(character: Character, flag: string): boolean {
  return character.flags.includes(flag);
}

/** Smarts-driven GPA in [1.0, 4.0] rounded to one decimal, with a small roll. */
export function gpaFor(character: Character, rng: RNG): number {
  const base = 0.5 + (character.stats.smarts / 100) * 3.4;
  const jitter = rng.rangeInt(-15, 15) / 100;
  const gpa = Math.min(4, Math.max(1, base + jitter));
  return Math.round(gpa * 10) / 10;
}

/** Post-secondary major suggestion driven by smarts (DESIGN.md §5.1). */
function chooseMajor(character: Character, rng: RNG): MajorField {
  const smarts = character.stats.smarts;
  if (smarts >= 75) return rng.pick(['stem', 'medicine'] as const);
  if (smarts >= 55) return rng.pick(['stem', 'business', 'law'] as const);
  return rng.pick(['business', 'arts'] as const);
}

function setMajor(character: Character, major: string): void {
  character.education.major = major;
  const flag = MAJOR_FLAG[major as MajorField];
  if (flag && !hasFlag(character, flag)) {
    character.flags.push(flag);
  }
}

/** Silence the "no salary appended" pattern — flag toggles are side effects. */
function toggleStudentFlag(character: Character, enrolled: boolean): void {
  if (enrolled) {
    if (!hasFlag(character, 'student')) character.flags.push('student');
  } else {
    removeFlag(character, 'student');
  }
}

export const MAJOR_NAMES_BANGLA: Record<MajorField, string> = {
  stem: 'বুয়েটে ইঞ্জিনিয়ারিং',
  medicine: 'মিটফোর্ড মেডিকেল কলেজে ডাক্তারি',
  law: 'ঢাকা বিশ্ববিদ্যালয়ের আইন বিভাগ',
  business: 'ঢাকা বিশ্ববিদ্যালয়ে বাণিজ্য ও ব্যবসা শিক্ষা',
  arts: 'জগন্নাথ বিশ্ববিদ্যালয়ে সাহিত্য ও মানবিক',
};

/** Post-secondary enrollment of the player's choosing (DESIGN.md §5.1). */
export function enterHigherEducation(
  character: Character,
  rng: RNG,
  path: 'undergraduate' | 'vocational',
): EducationOutcome & { accepted: boolean } {
  const e = character.education;

  if (!character.alive) {
    return { accepted: false, text: 'এহন তো পড়াশোনায় ভর্তি হওয়ার উপায় নাই।', tone: 'bad' };
  }
  if (e.enrolled) {
    return { accepted: false, text: 'তুমি তো অলরেডি পড়াশোনা করতাছো, ক্লাসে মন দেও!', tone: 'neutral' };
  }
  if (e.graduated) {
    return { accepted: false, text: 'পড়াশোনার পাট তো চুকাইয়া ফালাইছো, এহন কামাই-রুজির ধান্দা করো!', tone: 'neutral' };
  }
  if (character.age < SCHOOL_END_AGE) {
    return { accepted: false, text: 'স্কুল তো এখনও শ্যাষ হয় নাই, আগেই এতো বড় খোয়াব দেইখো না!', tone: 'neutral' };
  }
  if (path === 'vocational') {
    e.stage = 'vocational';
    e.enrolled = true;
    e.enrolledAge = character.age;
    e.major = '';
    toggleStudentFlag(character, true);
    if (!hasFlag(character, 'education_vocational')) character.flags.push('education_vocational');
    applyStatEffects(character, { money: -VOCATIONAL_TUITION });
    if (character.money < 0 && !hasFlag(character, 'has_debt')) character.flags.push('has_debt');
    return {
      accepted: true,
      text: 'ঢাকা পলিটেকনিক ইনস্টিটিউটে কারিগরি কোর্সে ভর্তি হইলা। হাতে টেস্টার আর স্লাইরেঞ্জ নিয়া কাজের পাকা তালিম শুরু!',
      tone: 'good',
    };
  }

  if (character.stats.smarts < 40 && !hasFlag(character, 'gpa_high')) {
    return {
      accepted: false,
      text: 'ভর্তি অফিসের বড় কর্তা এক কাপ লাল চা খাইতে খাইতে কইলো—"মামা, এই নম্বরে তো এখানে চান্স হইবো না, অন্য কোথাও চেষ্টা মারো!"',
      tone: 'neutral',
    };
  }

  const major = chooseMajor(character, rng);
  e.stage = 'undergraduate';
  e.enrolled = true;
  e.enrolledAge = character.age;
  setMajor(character, major);
  toggleStudentFlag(character, true);
  if (!hasFlag(character, 'education_university')) character.flags.push('education_university');
  applyStatEffects(character, { money: -UNDERGRAD_TUITION });
  if (character.money < 0 && !hasFlag(character, 'has_debt')) character.flags.push('has_debt');
  return {
    accepted: true,
    text: `${MAJOR_NAMES_BANGLA[major]} শাখায় ভর্তি পাইলা! টিউশন ফির ধাক্কা আছে, তয় ক্যাম্পাসে তোমার কদর এহন তুঙ্গে!`,
    tone: 'good',
  };
}

/** Yearly maintenance: school progression, GPA drift, higher-ed countdown. */
export function tickEducation(character: Character, rng: RNG): EducationOutcome | null {
  const e = character.education;
  const age = character.age;

  if (e.graduated || e.stage === 'dropped') return null;

  // Post-secondary countdown → graduation.
  if (e.enrolled && (e.stage === 'undergraduate' || e.stage === 'vocational' || e.stage === 'graduate')) {
    const years = e.stage === 'vocational' ? VOCATIONAL_YEARS : UNDERGRAD_YEARS;
    if (e.enrolledAge != null && age >= e.enrolledAge + years) {
      e.graduated = true;
      e.enrolled = false;
      toggleStudentFlag(character, false);
      return {
        text: e.stage === 'vocational'
          ? 'ঢাকা পলিটেকনিকের কারিগরি ডিপ্লোমা শেষ কইরা সার্টিফিকেট হাতে পাইলা! এহন তুমি পুরাই ওস্তাদ কারিগর!'
          : `মাথায় সমাবর্তনের কালো ক্যাপ পইরা গ্র্যাজুয়েট (graduate) হইলা! মহল্লার পোলাপাইন কয়—"মামা তো এহন আস্ত শিক্ষিত জজ-ব্যারিস্টার!"`,
        tone: 'good',
      };
    }
    return null;
  }

  // Compulsory schooling, ages 6–17.
  if (age >= SCHOOL_START_AGE && age <= SCHOOL_END_AGE) {
    let target: EducationStage = 'elementary';
    for (const s of SCHOOL_STAGES) {
      if (age >= s.age) target = s.stage;
    }
    const changed = e.stage !== target;
    e.stage = target;
    const flag = SCHOOL_STAGE_FLAG[e.stage];
    if (flag && !hasFlag(character, flag)) character.flags.push(flag);
    toggleStudentFlag(character, true);
    e.enrolled = true;
    // GPA drift (silent): reflected in the gpa_high / gpa_low flags for content.
    e.gpa = gpaFor(character, rng);
    if (e.gpa >= GPA_HIGH) {
      if (!hasFlag(character, 'gpa_high')) character.flags.push('gpa_high');
      removeFlag(character, 'gpa_low');
    } else if (e.gpa <= GPA_LOW) {
      if (!hasFlag(character, 'gpa_low')) character.flags.push('gpa_low');
      removeFlag(character, 'gpa_high');
    } else {
      removeFlag(character, 'gpa_high');
      removeFlag(character, 'gpa_low');
    }
    if (changed) {
      if (e.stage === 'elementary') {
        return {
          text: 'তুমি আরমানিটোলা সরকারি প্রাথমিক বিদ্যালয়ে ভর্তি হইলা। নতুন খাতা-কলম আর পেন্সিল বক্সের গন্ধে মনটা খুশিতে ঝলমল করতাছে!',
          tone: 'neutral',
        };
      }
      if (e.stage === 'middle') {
        return {
          text: 'পগোজ স্কুলে নতুন ক্লাসে উঠলা! পুরান ঢাকার অলিগলিপথে বন্ধুদের লগে আড্ডা আর পড়ালেখার নতুন চাপ!',
          tone: 'neutral',
        };
      }
      return {
        text: 'ঢাকা কলেজিয়েট স্কুলে এসএসসির পড়াশোনা শুরু হইলো! মুরব্বিরা কইলো—"এহন যদি মন দিয়া না পড়স, বাপে কিন্তু দোকানে বসায় দিবো!"',
        tone: 'neutral',
      };
    }
  }

  // School ends: the player chooses a post-secondary path (or work).
  const inSchoolStages: EducationStage[] = ['elementary', 'middle', 'high'];
  if (e.enrolled && inSchoolStages.includes(e.stage) && age > SCHOOL_END_AGE) {
    e.enrolled = false;
    toggleStudentFlag(character, false);
    return { text: 'স্কুলের পাট চুকাইলা (School is out)! এহন তো তুমি সাবালক, সামনে ভার্সিটিতে যাইবা নাকি রুজি-রোজগারে নামবা?', tone: 'neutral' };
  }

  return null;
}