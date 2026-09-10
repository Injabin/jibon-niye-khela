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
import { seedCoworkers } from '@/lib/engine/relationships';
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
  { id: 'fastfood', title: 'কাচ্চির সহকারী বাবুর্চি', minAge: 16, flag: 'job_service', salary: [120, 260] },
  { id: 'retail_clerk', title: 'চকবাজারের পাইকারি সেলসম্যান', minAge: 16, flag: 'job_retail', salary: [140, 320] },
  { id: 'hustle_delivery', title: 'পাঠাও / ফুড ডেলিভারি রাইডার', minAge: 16, flag: 'job_service', requires: { minSmarts: 30 }, salary: [180, 460] },
  {
    id: 'entertainer',
    title: 'রাস্তার ম্যাজিশিয়ান ও পারফর্মার',
    minAge: 16,
    flag: 'job_entertainer',
    requires: { minLooks: 55 },
    salary: [200, 900],
  },
  {
    id: 'warehouse',
    title: 'সদরঘাটের গুদাম শ্রমিক',
    minAge: 18,
    flag: 'job_trade',
    requires: { education: 'middle' },
    salary: [380, 700],
  },
  {
    id: 'construction_app',
    title: 'নির্মাণ শ্রমিক ও রাজমিস্ত্রি',
    minAge: 18,
    flag: 'job_trade',
    requires: { education: 'middle' },
    salary: [440, 820],
  },
  {
    id: 'office_admin',
    title: 'মতিঝিলের অফিস সহকারী',
    minAge: 18,
    flag: 'job_office',
    requires: { education: 'high' },
    salary: [420, 760],
  },
  {
    id: 'tech_support',
    title: 'নবাবপুরের ইলেকট্রনিক্স মিস্ত্রি',
    minAge: 18,
    flag: 'job_tech',
    requires: { education: 'high', minSmarts: 55 },
    salary: [520, 920],
  },
  {
    id: 'nurse',
    title: 'মিটফোর্ড হাসপাতালের নার্স',
    minAge: 19,
    flag: 'job_medical',
    requires: { education: 'vocational', minSmarts: 55 },
    salary: [900, 1_400],
  },
  {
    id: 'soldier',
    title: 'সেনাবাহিনীর রিক্রুট',
    minAge: 18,
    flag: 'job_military',
    salary: [330, 850],
  },
  {
    id: 'illustrator',
    title: 'নীলক্ষেতের গ্রাফিক্স ডিজাইনার',
    minAge: 18,
    flag: 'job_art',
    requires: { minSmarts: 50 },
    salary: [360, 1_200],
  },
  {
    id: 'side_business',
    title: 'বাকরখানি ও মিষ্টির ব্যবসা',
    minAge: 18,
    flag: 'job_business',
    requires: { minSmarts: 45 },
    salary: [300, 1_800],
  },
  {
    id: 'pro_athlete',
    title: 'পেশাদার ফুটবলার / ক্রিকেটার',
    minAge: 18,
    flag: 'job_sports',
    requires: { trait: 'hobby_sport', minLooks: 60 },
    salary: [800, 5_000],
  },
  {
    id: 'programmer',
    title: 'সফটওয়্যার ডেভেলপার',
    minAge: 22,
    flag: 'job_tech',
    requires: { education: 'undergraduate', minSmarts: 60 },
    salary: [1_600, 3_000],
  },
  {
    id: 'accountant',
    title: 'হিসাবরক্ষক (অ্যাকাউন্ট্যান্ট)',
    minAge: 22,
    flag: 'job_finance',
    requires: { education: 'undergraduate', major: 'major_business', minSmarts: 60 },
    salary: [1_500, 2_600],
  },
  {
    id: 'lawyer',
    title: 'জজ কোর্টের শিক্ষানবিস উকিল',
    minAge: 24,
    flag: 'job_legal',
    requires: { education: 'undergraduate', major: 'major_law', minSmarts: 70 },
    salary: [2_200, 4_200],
  },
  {
    id: 'doctor',
    title: 'বিশেষজ্ঞ এমবিবিএস ডাক্তার',
    minAge: 26,
    flag: 'job_medical',
    requires: { education: 'undergraduate', major: 'major_medicine', minSmarts: 75 },
    salary: [2_600, 5_200],
  },
  {
    id: 'politician',
    title: 'ওয়ার্ড কাউন্সিলর',
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
    return { hired: false, text: 'এহন তো চাকরি খোঁজার উপায় নাই।', tone: 'bad' };
  }
  const job = JOB_BOARD.find((j) => j.id === jobId);
  if (!job) {
    return { hired: false, text: 'এমন কোনো চাকরি দুনিয়ায় নাই!', tone: 'neutral' };
  }
  if (!isJobEligible(job, character)) {
    return { hired: false, text: `${job.title} পদের জন্য প্রয়োজনীয় যোগ্যতা তোমার এখনও হয় নাই।`, tone: 'neutral' };
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
      text: reasonOverride ?? `${job.title} পদে তোমার চাকরি হইয়া গেল! মালিক খুশি হইয়া কইলো—"মন দিয়া কাম করবা, ফাঁকিবাজি সহ্য করুম না!" (বছরে আয় ≈৳${pay.toLocaleString()})`,
      tone: 'good',
    };
  }

  const rejectLines = [
    `${job.title} পদের ইন্টারভিউতে তোমারে দেইখা মালিক মুখ ভেটকাইয়া কইলো—"তোমার সিভিতে তো কাজের চেয়ে চাপাবাজি বেশি, ভাগো এহন থিকা!"`,
    `${job.title} পদের ইন্টারভিউয়ার কইলো—"মামা, এহন কোনো লোক লাগবো না, অন্য কোথাও লাইন মারো!"`,
    `${job.title} পদের ভাইভায় কঠিন সব প্যাঁচানো প্রশ্ন কইরা তোমারে নাকচ কইরা দিল!`,
    `${job.title} পদের ম্যানেজমেন্ট জানাইলো যে বসের শালার ঘরের শালা অলরেডি এই চাকরি পাইয়া গেছে!`,
  ];
  return { hired: false, text: rng.pick(rejectLines), tone: 'neutral' };
}

/** Works overtime to boost job performance at the cost of health and happiness. */
export function workOvertime(character: Character): { ok: boolean; text: string } {
  if (!character.career.jobId) {
    return { ok: false, text: 'তোমার তো কোনো চাকরিই নাই, ওভারটাইম কার লাইগা খাটবা?' };
  }
  const job = JOB_BOARD.find((j) => j.id === character.career.jobId);
  const title = job?.title ?? 'কর্মস্থলে';

  character.career.performance = Math.min(100, character.career.performance + 15);
  character.stats.health = Math.max(0, character.stats.health - 5);
  character.stats.happiness = Math.max(0, character.stats.happiness - 5);

  const msg = `${title} কাজে রাত-দিন এক কইরা অতিরিক্ত ওভারটাইম খাটলা। বসের চোখে তোমার পারফরম্যান্স বাড়লো, তয় শরীলের অবস্থা কাহিল!`;
  character.history.push({ age: character.age, text: msg, tone: 'neutral' });
  return { ok: true, text: msg };
}

/** Sucks up to the boss for career favors and relationship boost. */
export function suckUpToBoss(character: Character, rng: RNG): { ok: boolean; text: string } {
  if (!character.career.jobId) {
    return { ok: false, text: 'কোনো বসের অস্তিত্বই নাই, তেল মারবা কারে?' };
  }

  const roll = rng.next();
  if (roll > 0.35) {
    character.career.performance = Math.min(100, character.career.performance + 10);
    character.stats.happiness = Math.min(100, character.stats.happiness + 5);
    const msg = `বসরে চা-সিঙ্গারা খাওয়াইয়া মুখে মধু ঢাইলা তেল মারলা। বস একগাল হাইসা কইলো—"তোর মতো কাজের পোলাই তো দরকার!"`;
    character.history.push({ age: character.age, text: msg, tone: 'good' });
    return { ok: true, text: msg };
  }

  character.career.performance = Math.max(0, character.career.performance - 5);
  character.stats.happiness = Math.max(0, character.stats.happiness - 8);
  const failMsg = `বস তোমার চাটুকারিতা ধইরা ফালাইয়া খ্যাঁক কইরা উঠলো—"চুদুর বুদুর বাদ দিয়া নিজের টেবিলে গিয়া কাম কর, তেল মারা বন্ধ কর!"`;
  character.history.push({ age: character.age, text: failMsg, tone: 'bad' });
  return { ok: false, text: failMsg };
}

/** Asks for a salary raise based on performance and tenure. */
export function askForRaise(character: Character, rng: RNG): { ok: boolean; text: string } {
  if (!character.career.jobId) {
    return { ok: false, text: 'চাকরি ছাড়া বেতন বাড়ানোর কথা ভাবাও পাপ!' };
  }

  const job = JOB_BOARD.find((j) => j.id === character.career.jobId);
  if (!job) return { ok: false, text: 'চাকরি খুঁজে পাওয়া যায় নাই।' };

  if (character.career.yearsAtJob < 1) {
    return { ok: false, text: 'চাকরিতে জয়েন কইরাই বেতন বাড়ানোর আবদার? মালিক তো খেদাইয়া দিবো!' };
  }

  if (character.career.performance < 55) {
    character.career.performance = Math.max(0, character.career.performance - 10);
    character.stats.happiness = Math.max(0, character.stats.happiness - 10);
    const scoldMsg = `মালিক তোমারে দেইখা চোখ রাঙাইয়া কইলো—"কাজে ফাঁকিবাজি মারোস, আবার বেতন বাড়াইতে আইছস? বেয়াদব!"`;
    character.history.push({ age: character.age, text: scoldMsg, tone: 'bad' });
    return { ok: false, text: scoldMsg };
  }

  const approved = character.career.performance >= 75 ? true : rng.chance(0.5);
  if (approved) {
    const boost = rng.rangeInt(15, 25);
    const bonusMoney = Math.round(((job.salary[0] + job.salary[1]) / 2) * (boost / 100));
    character.money += bonusMoney;
    character.stats.happiness = Math.min(100, character.stats.happiness + 15);
    const successMsg = `মালিক তোমার মেহনত দেইখা বেতন ${boost}% বাড়াইয়া দিল লগে ৳${bonusMoney.toLocaleString()} বোনাস দিলো! খুশিতে বুক ভইরা গেল!`;
    character.history.push({ age: character.age, text: successMsg, tone: 'good' });
    return { ok: true, text: successMsg };
  }

  character.stats.happiness = Math.max(0, character.stats.happiness - 5);
  const rejectMsg = `বস গম্ভীর হইয়া কইলো—"মার্কেটে মন্দা চলতাছে মামা, এহন এক পয়সাও বাড়ানো সম্ভব না, পরের বছর দেখুম।"`;
  character.history.push({ age: character.age, text: rejectMsg, tone: 'neutral' });
  return { ok: false, text: rejectMsg };
}

export function quitJob(character: Character): CareerOutcome & { quit: boolean } {
  if (!character.career.jobId) {
    return { quit: false, text: 'তোমার তো কোনো চাকরিই নাই, ছাড়বা কী?', tone: 'neutral' };
  }
  const job = JOB_BOARD.find((j) => j.id === character.career.jobId);
  character.career = { jobId: null, performance: 50, yearsAtJob: 0 };
  if (job) character.flags = character.flags.filter((f) => f !== job.flag);
  if (!character.flags.includes('unemployed')) character.flags.push('unemployed');
  return { quit: true, text: 'চাকরিতে ইস্তফা দিয়া দিলা! বসরে কইয়া আসলা—"আমারে দিয়া আর এই গোলামি হইবো না!" এহন তুমি স্বাধীন বেহুদা মানুষ!', tone: 'neutral' };
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
  if (character.career.yearsAtJob === 1) seedCoworkers(character, rng, 3);
  const pay = annualSalary(job, character.career.performance);
  applyStatEffects(character, { money: pay });

  const nextPerf = Math.max(0, Math.min(100, character.career.performance + rng.rangeInt(-5, 5)));
  character.career.performance = nextPerf;
  character.flags = character.flags.filter((f) => f !== 'perf_high' && f !== 'perf_low');
  if (nextPerf >= 80) character.flags.push('perf_high');
  else if (nextPerf <= 25) character.flags.push('perf_low');

  if (nextPerf >= 75 && rng.chance(0.3)) {
    character.career.performance = 62;
    return { text: `${job.title} কাজে তোমার দারুণ পারফরম্যান্সের কারণে পদোন্নতি (promotion) হইলো! মালিক মাইনে বাড়াইয়া দিল!`, tone: 'good' };
  }

  if (nextPerf <= 28 && character.career.yearsAtJob >= 1 && rng.chance(0.28)) {
    character.career = { jobId: null, performance: 50, yearsAtJob: 0 };
    character.flags = character.flags.filter((f) => f !== job.flag);
    if (!character.flags.includes('unemployed')) character.flags.push('unemployed');
    return { text: `${job.title} চাকরি থেইকা তোমারে খেদাইয়া দিল! মালিক কইলো—"অফিসে বইসা খালি ফাপড় মারলে কম্পানি চলবো না!"`, tone: 'bad' };
  }

  return null;
}