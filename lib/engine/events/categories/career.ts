/**
 * Career system engine (DESIGN.md §5.2, init.md M5 #2).
 *
 * A fictional job board filtered by age, education attainment, smarts, looks,
 * and traits. Jobs are data, not hardcoded component logic. The yearly
 * maintenance tick pays the salary, drifts a simple "performance" sub-stat,
 * and rolls promotion / firing branches so careers actually diverge. Sales,
 * business ownership, and special trees read as content + flags; the engine
 * owns the structured `character.career` state and the money flows.
 */

import type { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import type { Character, EducationStage, Tone } from '@/lib/engine/types';

export interface JobDef {
  id: string;
  title: string;
  minAge: number;
  /** Job-family flag from the shared vocabulary (job_retail, job_tech, …). */
  flag: string;
  requires?: {
    /** Highest school level that must have been *reached* (dropped blocks). */
    education?: 'middle' | 'high' | 'undergraduate' | 'vocational';
    minSmarts?: number;
    minLooks?: number;
    /** A trait id (hobby_sport, etc.). */
    trait?: string;
    /** A major flag required (major_law, major_medicine, …). */
    major?: string;
  };
  /** [min, max] yearly salary. */
  salary: [number, number];
}

export interface JobApplicationResult {
  hired: boolean;
  jobId?: string;
  title?: string;
  text: string;
  tone: Tone;
}

export interface CareerOutcome {
  text: string;
  tone: Tone;
}

/**
 * Fictional job board (original titles, no real companies or people).
 * Education = the highest stage that must have been reached on the arc.
 */
export const JOB_BOARD: readonly JobDef[] = [
  { id: 'fastfood', title: 'Fast-food server', minAge: 16, flag: 'job_service', salary: [120, 260] },
  { id: 'retail_clerk', title: 'Department-store clerk', minAge: 16, flag: 'job_retail', salary: [140, 320] },
  { id: 'hustle_delivery', title: 'Delivery courier', minAge: 16, flag: 'job_service', requires: { minSmarts: 30 }, salary: [180, 460] },
  {
    id: 'entertainer',
    title: 'Street performer',
    minAge: 16,
    flag: 'job_entertainer',
    requires: { minLooks: 55 },
    salary: [200, 900],
  },
  {
    id: 'warehouse',
    title: 'Warehouse worker',
    minAge: 18,
    flag: 'job_trade',
    requires: { education: 'middle' },
    salary: [380, 700],
  },
  {
    id: 'construction_app',
    title: 'Construction worker',
    minAge: 18,
    flag: 'job_trade',
    requires: { education: 'middle' },
    salary: [440, 820],
  },
  {
    id: 'office_admin',
    title: 'Office assistant',
    minAge: 18,
    flag: 'job_office',
    requires: { education: 'high' },
    salary: [420, 760],
  },
  {
    id: 'tech_support',
    title: 'Tech support rep',
    minAge: 18,
    flag: 'job_tech',
    requires: { education: 'high', minSmarts: 55 },
    salary: [520, 920],
  },
  {
    id: 'nurse',
    title: 'Nurse',
    minAge: 19,
    flag: 'job_medical',
    requires: { education: 'vocational', minSmarts: 55 },
    salary: [900, 1_400],
  },
  {
    id: 'soldier',
    title: 'Military recruit',
    minAge: 18,
    flag: 'job_military',
    salary: [330, 850],
  },
  {
    id: 'illustrator',
    title: 'Freelance illustrator',
    minAge: 18,
    flag: 'job_art',
    requires: { minSmarts: 50 },
    salary: [360, 1_200],
  },
  {
    id: 'side_business',
    title: 'Side-business owner',
    minAge: 18,
    flag: 'job_business',
    requires: { minSmarts: 45 },
    salary: [300, 1_800],
  },
  {
    id: 'pro_athlete',
    title: 'Pro athlete',
    minAge: 18,
    flag: 'job_sports',
    requires: { trait: 'hobby_sport', minLooks: 60 },
    salary: [800, 5_000],
  },
  {
    id: 'programmer',
    title: 'Software developer',
    minAge: 22,
    flag: 'job_tech',
    requires: { education: 'undergraduate', minSmarts: 60 },
    salary: [1_600, 3_000],
  },
  {
    id: 'accountant',
    title: 'Accountant',
    minAge: 22,
    flag: 'job_finance',
    requires: { education: 'undergraduate', major: 'major_business', minSmarts: 60 },
    salary: [1_500, 2_600],
  },
  {
    id: 'lawyer',
    title: 'Associate lawyer',
    minAge: 24,
    flag: 'job_legal',
    requires: { education: 'undergraduate', major: 'major_law', minSmarts: 70 },
    salary: [2_200, 4_200],
  },
  {
    id: 'doctor',
    title: 'Doctor',
    minAge: 26,
    flag: 'job_medical',
    requires: { education: 'undergraduate', major: 'major_medicine', minSmarts: 75 },
    salary: [2_600, 5_200],
  },
  {
    id: 'politician',
    title: 'Local councillor',
    minAge: 30,
    flag: 'job_politics',
    requires: { education: 'undergraduate', minSmarts: 70 },
    salary: [1_200, 2_600],
  },
];

export const ALL_JOB_FLAGS: readonly string[] = JOB_BOARD.map((j) => j.flag);

/** Highest stage reached on the education arc; 'dropped' blocks high-or-better jobs. */
function educationReached(character: Character): EducationStage {
  return character.education.stage;
}

const REACHED_ORDER: Record<EducationStage, number> = {
  none: 0,
  preschool: 0,
  dropped: 0,
  elementary: 1,
  middle: 2,
  high: 3,
  vocational: 4,
  undergraduate: 5,
  graduate: 6,
};

export function isJobEligible(job: JobDef, character: Character): boolean {
  if (character.age < job.minAge) return false;
  const req = job.requires;
  if (req) {
    if (req.education) {
      const reached = REACHED_ORDER[educationReached(character)];
      // 'dropped' blocks jobs that expect any schooling past elementary.
      if (character.education.stage === 'dropped' && req.education !== 'middle') return false;
      if (reached < REACHED_ORDER[req.education]) return false;
    }
    if (req.minSmarts != null && character.stats.smarts < req.minSmarts) return false;
    if (req.minLooks != null && character.stats.looks < req.minLooks) return false;
    if (req.trait && !character.traits.includes(req.trait)) return false;
    if (req.major && !character.flags.includes(req.major)) return false;
  }
  return true;
}

/** The board a player sees at this age/state — drives the future Careers menu. */
export function getJobBoard(character: Character): readonly JobDef[] {
  return JOB_BOARD.filter((job) => isJobEligible(job, character));
}

/** Annual salary implied by the current job + performance (mid ± perf factor). */
export function annualSalary(job: JobDef, performance: number): number {
  const mid = (job.salary[0] + job.salary[1]) / 2;
  return Math.round(mid * (0.5 + performance / 100));
}

export function applyForJob(
  character: Character,
  rng: RNG,
  jobId: string,
  reasonOverride?: string,
): JobApplicationResult {
  if (!character.alive) {
    return { hired: false, text: 'You cannot job-hunt now.', tone: 'bad' };
  }
  const job = JOB_BOARD.find((j) => j.id === jobId);
  if (!job) {
    return { hired: false, text: 'No such job exists in this world.', tone: 'neutral' };
  }
  if (!isJobEligible(job, character)) {
    return { hired: false, text: `You do not meet the requirements for ${job.title}.`, tone: 'neutral' };
  }

  let chance = 0.45 + (character.stats.smarts - 50) * 0.004 + (character.stats.looks - 50) * 0.002;
  if (job.requires?.trait && character.traits.includes(job.requires.trait)) chance += 0.1;
  if (job.requires?.major && character.flags.includes(job.requires.major)) chance += 0.1;
  const hireChance = Math.min(0.98, Math.max(0.15, chance));

  const hired = rng.chance(hireChance);
  if (hired) {
    character.career.jobId = job.id;
    character.career.performance = 55;
    character.career.yearsAtJob = 0;
    if (!character.flags.includes(job.flag)) character.flags.push(job.flag);
    character.flags = character.flags.filter((f) => f !== 'unemployed');
    const pay = annualSalary(job, 55);
    return {
      hired: true,
      jobId: job.id,
      title: job.title,
      text: reasonOverride ?? `${job.title} hires you. The first payday looms with quiet promise. (≈${pay} coins / year)`,
      tone: 'good',
    };
  }
  return { hired: false, text: `${job.title} turns you down — politely, heroically.`, tone: 'neutral' };
}

export function quitJob(character: Character): CareerOutcome & { quit: boolean } {
  if (!character.career.jobId) {
    return { quit: false, text: 'You have no job to leave.', tone: 'neutral' };
  }
  const job = JOB_BOARD.find((j) => j.id === character.career.jobId);
  character.career = { jobId: null, performance: 50, yearsAtJob: 0 };
  if (job) character.flags = character.flags.filter((f) => f !== job.flag);
  if (!character.flags.includes('unemployed')) character.flags.push('unemployed');
  return { quit: true, text: 'You hand in your notice. Employment, briefly, becomes a rumour.', tone: 'neutral' };
}

/**
 * Yearly maintenance: salary payday, years-at-job count, performance drift,
 * and the promotion / firing branches. Quiet years return null so the engine
 * never spams history.
 */
export function tickCareer(character: Character, rng: RNG): CareerOutcome | null {
  if (!character.career.jobId) return null;
  const job = JOB_BOARD.find((j) => j.id === character.career.jobId);
  if (!job) return null;

  character.career.yearsAtJob += 1;
  const pay = annualSalary(job, character.career.performance);
  applyStatEffects(character, { money: pay });

  const nextPerf = Math.max(0, Math.min(100, character.career.performance + rng.rangeInt(-5, 5)));
  character.career.performance = nextPerf;
  character.flags = character.flags.filter((f) => f !== 'perf_high' && f !== 'perf_low');
  if (nextPerf >= 80) character.flags.push('perf_high');
  else if (nextPerf <= 25) character.flags.push('perf_low');

  if (nextPerf >= 75 && rng.chance(0.3)) {
    character.career.performance = 62;
    return { text: `Your work at ${job.title} pays off — promotion. The new title fits like a nice coat.`, tone: 'good' };
  }

  if (nextPerf <= 28 && character.career.yearsAtJob >= 1 && rng.chance(0.28)) {
    character.career = { jobId: null, performance: 50, yearsAtJob: 0 };
    character.flags = character.flags.filter((f) => f !== job.flag);
    if (!character.flags.includes('unemployed')) character.flags.push('unemployed');
    return { text: `The ${job.title} job ends — the firm calls it "restructuring". You call it a lunch invite.`, tone: 'bad' };
  }

  return null;
}