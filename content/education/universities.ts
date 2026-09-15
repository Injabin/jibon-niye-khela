/**
 * Dhakaiya university catalog (Part E — real Dhaka higher-ed institutes).
 * Mirrors the school catalog: govt institutes are free with a smarts gate,
 * private universities charge tuition and also gate admission by smarts. A
 * "major" restriction keeps the institute honest (বুয়েট → ইঞ্জিনিয়ারিং) while
 * the player still gatekeeps the subject through the engine's smarts checks.
 */

export type UniversityPrestige = 1 | 2 | 3;
export type UniversityMajor = 'stem' | 'business' | 'arts' | 'medicine' | 'law';

export interface UniversityDef {
  id: string;
  name: string;
  area: string;
  prestige: UniversityPrestige;
  /** Admission fee (৳0 for govt institutes). */
  tuition: number;
  /** Minimum smarts for selective institutes; undefined = open admission. */
  minSmarts?: number;
  /** Subjects offered; undefined = every subject is on the table. */
  majors?: readonly UniversityMajor[];
}

export const UNIVERSITIES: readonly UniversityDef[] = [
  { id: 'u_dhaka', name: 'ঢাকা বিশ্ববিদ্যালয়', area: 'রমনা', prestige: 2, tuition: 0, minSmarts: 55 },
  { id: 'u_buet', name: 'বুয়েট', area: 'পলাশী', prestige: 3, tuition: 0, minSmarts: 70, majors: ['stem'] },
  { id: 'u_mitford', name: 'মিটফোর্ড মেডিকেল কলেজ', area: 'সদরঘাট', prestige: 3, tuition: 0, minSmarts: 80, majors: ['medicine'] },
  { id: 'u_jagannath', name: 'জগন্নাথ বিশ্ববিদ্যালয়', area: 'সদরঘাট', prestige: 1, tuition: 0, minSmarts: 40, majors: ['business', 'arts', 'law'] },
  { id: 'u_northsouth', name: 'নর্থ সাউথ বিশ্ববিদ্যালয়', area: 'বসুন্ধরা', prestige: 3, tuition: 1200, minSmarts: 60, majors: ['business', 'stem'] },
  { id: 'u_brac', name: 'ব্র্যাক বিশ্ববিদ্যালয়', area: 'মোহাখালী', prestige: 2, tuition: 850, minSmarts: 55, majors: ['business', 'arts'] },
  { id: 'u_ewu', name: 'ইষ্ট ওয়েস্ট বিশ্ববিদ্যালয়', area: 'আফতাবনগর', prestige: 2, tuition: 900, minSmarts: 55, majors: ['business', 'arts'] },
  { id: 'u_aiub', name: 'আমেরিকান ইন্টারন্যাশনাল ইউনিভার্সিটি', area: 'কুড়িল', prestige: 2, tuition: 950, minSmarts: 50, majors: ['stem', 'business'] },
  { id: 'u_ulab', name: 'ইউনিভার্সিটি অব লিবারেল আর্টস', area: 'ধানমন্ডি', prestige: 2, tuition: 1000, minSmarts: 50, majors: ['arts', 'law'] },
  { id: 'u_green', name: 'গ্রিন ইউনিভার্সিটি', area: 'বসুন্ধরা', prestige: 1, tuition: 600, minSmarts: 45, majors: ['business', 'arts'] },
  { id: 'u_daffodil', name: 'ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি', area: 'ধানমন্ডি', prestige: 1, tuition: 500, minSmarts: 40, majors: ['stem', 'business', 'arts'] },
];

export function findUniversityById(id: string): UniversityDef | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}

export const UNIVERSITY_PRESTIGE_LABELS: Record<UniversityPrestige, string> = {
  1: 'সাধারণ ধাঁচের',
  2: 'মধ্যম ধাঁচের',
  3: 'নামকরা ব্যাচেলর',
};