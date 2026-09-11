/**
 * Dhakaiya school catalog (H — BitLife-style player-chosen schools).
 * Three school-age windows mirror the engine stages: elementary (6–11),
 * middle (12–14), high (15–17). Public schools are free (govt), the flagship
 * private institutes carry a tuition fee and an admission smarts gate. A
 * default school per stage keeps the auto-advance arc playable when the
 * player never opens the picker.
 */

export type SchoolStage = 'elementary' | 'middle' | 'high';
export type SchoolPrestige = 1 | 2 | 3;

export interface SchoolDef {
  id: string;
  stage: SchoolStage;
  name: string;
  area: string;
  prestige: SchoolPrestige;
  /** Admission fee (৳0 for govt schools). */
  tuition: number;
  /** Minimum smarts for selective schools; undefined = open admission. */
  minSmarts?: number;
}

export const SCHOOLS: readonly SchoolDef[] = [
  // Elementary (age 6–11)
  { id: 'e_armanitola', stage: 'elementary', name: 'আরমানিটোলা সরকারি প্রাথমিক বিদ্যালয়', area: 'লক্ষ্মীবাজার', prestige: 1, tuition: 0 },
  { id: 'e_wari', stage: 'elementary', name: 'ওয়ারী সরকারি প্রাথমিক বিদ্যালয়', area: 'ওয়ারী', prestige: 1, tuition: 0 },
  { id: 'e_lalbagh', stage: 'elementary', name: 'লালবাগ আদর্শ প্রাথমিক বিদ্যালয়', area: 'লালবাগ', prestige: 2, tuition: 0 },
  { id: 'e_gregorian', stage: 'elementary', name: 'সেন্ট গ্রেগরি প্রাইমারি স্কুল', area: 'সদরঘাট', prestige: 3, tuition: 600, minSmarts: 35 },

  // Middle (age 12–14)
  { id: 'm_pogose', stage: 'middle', name: 'পোগোজ স্কুল', area: 'লক্ষ্মীবাজার', prestige: 1, tuition: 0 },
  { id: 'm_smriti', stage: 'middle', name: 'শহীদ স্মৃতি মডেল স্কুল', area: 'গেন্ডারিয়া', prestige: 1, tuition: 0 },
  { id: 'm_victoria', stage: 'middle', name: 'বাংলাবাজার ভিক্টোরিয়া স্কুল', area: 'বাংলাবাজার', prestige: 2, tuition: 0, minSmarts: 40 },
  { id: 'm_motijheel', stage: 'middle', name: 'মতিঝিল আইডিয়াল হাই স্কুল', area: 'মতিঝিল', prestige: 3, tuition: 750, minSmarts: 45 },

  // High / SSC-HSC (age 15–17)
  { id: 'h_collegiate', stage: 'high', name: 'ঢাকা কলেজিয়েট স্কুল', area: 'রমন', prestige: 1, tuition: 0 },
  { id: 'h_muslim', stage: 'high', name: 'সরকারি মুসলিম হাই স্কুল', area: 'বাহাদুর শাহ পার্ক', prestige: 2, tuition: 0 },
  { id: 'h_siddheswari', stage: 'high', name: 'সিদ্ধেশ্বরী কলেজ', area: 'মগবাজার', prestige: 2, tuition: 0 },
  { id: 'h_notredame', stage: 'high', name: 'নটর ডেম কলেজ', area: 'ধানমন্ডি', prestige: 3, tuition: 900, minSmarts: 55 },
];

export const DEFAULT_SCHOOLS: Record<SchoolStage, SchoolDef> = {
  elementary: { id: 'e_armanitola', stage: 'elementary', name: 'আরমানিটোলা সরকারি প্রাথমিক বিদ্যালয়', area: 'লক্ষ্মীবাজার', prestige: 1, tuition: 0 },
  middle: { id: 'm_pogose', stage: 'middle', name: 'পোগোজ স্কুল', area: 'লক্ষ্মীবাজার', prestige: 1, tuition: 0 },
  high: { id: 'h_collegiate', stage: 'high', name: 'ঢাকা কলেজিয়েট স্কুল', area: 'রমন', prestige: 1, tuition: 0 },
};

export function findSchoolById(id: string): SchoolDef | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

export function schoolsForStage(stage: SchoolStage): SchoolDef[] {
  return SCHOOLS.filter((s) => s.stage === stage);
}

export function defaultSchoolForStage(stage: SchoolStage): SchoolDef {
  return DEFAULT_SCHOOLS[stage];
}

/** School stage for an age, mirroring the engine's schooling windows. */
export function stageForAge(age: number): SchoolStage | null {
  if (age >= 6 && age <= 11) return 'elementary';
  if (age >= 12 && age <= 14) return 'middle';
  if (age >= 15 && age <= 17) return 'high';
  return null;
}

export const PRESTIGE_LABELS: Record<SchoolPrestige, string> = {
  1: 'সরকারি / মহল্লার স্কুল',
  2: 'মধ্যম ধাঁচের',
  3: 'নামকরা ব্যাচেলর',
};