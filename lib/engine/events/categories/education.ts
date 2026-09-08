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

/** Post-secondary enrollment of the player's choosing (DESIGN.md §5.1). */
export function enterHigherEducation(
  character: Character,
  rng: RNG,
  path: 'undergraduate' | 'vocational',
): EducationOutcome & { accepted: boolean } {
  const e = character.education;

  if (!character.alive) {
    return { accepted: false, text: 'You cannot enroll now.', tone: 'bad' };
  }
  if (e.enrolled) {
    return { accepted: false, text: 'You are already studying.', tone: 'neutral' };
  }
  if (e.graduated) {
    return { accepted: false, text: 'Your studying days are already done.', tone: 'neutral' };
  }
  if (character.age < SCHOOL_END_AGE) {
    return { accepted: false, text: 'School is not behind you yet.', tone: 'neutral' };
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
      text: `You enroll in a vocational program. The tools smell like possibility (and slightly of solvent).`,
      tone: 'good',
    };
  }

  if (character.stats.smarts < 40 && !hasFlag(character, 'gpa_high')) {
    return {
      accepted: false,
      text: 'The admission office politely suggests a different path.',
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
    text: `You win a spot at university, ${major} major. Tuition bites, but the library is a cathedral.`,
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
          ? `You finish your vocational training, certificate in hand and toolbox packed.`
          : `You graduate with a ${e.major || 'chosen'} degree. The cap fits.`,
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
      const label = e.stage === 'elementary' ? 'primary school' : e.stage === 'middle' ? 'middle school' : 'high school';
      return {
        text: e.stage === 'elementary'
          ? `You start primary school. The pencil case is the proudest thing you own.`
          : `${label === 'middle school' ? 'Middle school' : 'High school'} begins. New faces, new noise, new rules.`,
        tone: 'neutral',
      };
    }
  }

  // School ends: the player chooses a post-secondary path (or work).
  const inSchoolStages: EducationStage[] = ['elementary', 'middle', 'high'];
  if (e.enrolled && inSchoolStages.includes(e.stage) && age > SCHOOL_END_AGE) {
    e.enrolled = false;
    toggleStudentFlag(character, false);
    return { text: `School's out. Your next chapter is yours to choose.`, tone: 'neutral' };
  }

  return null;
}