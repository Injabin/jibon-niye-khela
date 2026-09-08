/**
 * Content flag vocabulary (Milestone 5, Gate 5).
 *
 * Events gate flips on these flags via `requiredFlags`/`antiFlags` and sets
 * them with `effects.addFlag`/`removeFlag`. The vocabulary keeps flags
 * consistent across the content pool so a flag an author "requires" is a flag
 * some event in the pool actually awards. `tests/content/content-volume.test.ts`
 * asserts every referenced flag exists here.
 */

export const EDUCATION_FLAGS = [
  'education_elementary',
  'education_middle',
  'education_high',
  'education_university',
  'education_graduate',
  'education_vocational',
  'major_stem',
  'major_business',
  'major_arts',
  'major_medicine',
  'major_law',
  'gpa_high',
  'gpa_low',
] as const;

export const CAREER_FLAGS = [
  'job_retail',
  'job_service',
  'job_office',
  'job_tech',
  'job_medical',
  'job_legal',
  'job_finance',
  'job_art',
  'job_trade',
  'job_military',
  'job_entertainer',
  'job_politics',
  'job_sports',
  'job_business',
  'perf_high',
  'perf_low',
  'retired',
] as const;

export const RELATIONSHIP_FLAGS = [
  'has_partner',
  'has_spouse',
  'has_child',
  'has_pet',
  'has_family_estranged',
  'divorced',
  'widowed',
  'moved_away',
] as const;

export const ASSET_FLAGS = [
  'has_car',
  'has_house',
  'has_investment',
  'has_debt',
  'bankrupt',
] as const;

export const CRIME_FLAGS = [
  'criminal_record',
  'in_jail',
  'gone_straight',
  'sued',
] as const;

export const HEALTH_FLAGS = [
  'fitness_good',
  'ill_recovered',
  'mental_low',
  'went_to_therapy',
  'injury_recovered',
  'quit_bad_habit',
] as const;

export const ACTIVITY_FLAGS = [
  'side_hustle',
  'hobby_sport',
  'hobby_music',
  'hobby_art',
  'traveler',
  'social_star',
  'volunteer',
] as const;

export const ALL_CONTENT_FLAGS: readonly string[] = [
  ...EDUCATION_FLAGS,
  ...CAREER_FLAGS,
  ...RELATIONSHIP_FLAGS,
  ...ASSET_FLAGS,
  ...CRIME_FLAGS,
  ...HEALTH_FLAGS,
  ...ACTIVITY_FLAGS,
  'student',
  'unemployed',
  'pet_plea',
  'parttime_accept',
];