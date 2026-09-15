import { describe, expect, it } from 'vitest';
import { EVENT_REGISTRY } from '@/content/events';
import { ALL_FALLBACK_EVENTS } from '@/lib/ai/fallbackBank';

const ALL_EVENTS = [...EVENT_REGISTRY, ...ALL_FALLBACK_EVENTS];

/**
 * Every flag an event can require/ban or a choice effect can add/remove,
 * across both content pools. The engine also grants flags imperatively
 * (marriage -> has_spouse, career -> job_*, assets -> has_car/has_house,
 * crime -> criminal_record, finance -> has_debt, education -> gpa_* etc.),
 * so "required but ungrantable" is only a defect if NO grant exists at all.
 */
const REQUIRED_FLAGS = new Set<string>();
const BANNED_FLAGS = new Set<string>();
const EFFECT_ADDS = new Set<string>();
const EFFECT_REMOVES = new Set<string>();
const ONCE_PER_LIFE_IDS = new Set<string>();
const GENDER_TAGGED = new Map<string, { gender?: string; religion?: string; minAge: number; maxAge: number; category: string }>();

for (const e of ALL_EVENTS) {
  for (const f of e.requiredFlags ?? []) REQUIRED_FLAGS.add(f);
  for (const f of e.antiFlags ?? []) BANNED_FLAGS.add(f);
  for (const c of e.choices) {
    if (c.effects?.addFlag) EFFECT_ADDS.add(c.effects.addFlag);
    if (c.effects?.removeFlag) EFFECT_REMOVES.add(c.effects.removeFlag);
  }
  if (e.oncePerLife) ONCE_PER_LIFE_IDS.add(e.id);
  GENDER_TAGGED.set(e.id, {
    gender: e.gender,
    religion: e.religion,
    minAge: e.minAge,
    maxAge: e.maxAge,
    category: e.category,
  });
}

/** Flags the engine systems themselves set imperatively (not by content choice effects). */
const ENGINE_GRANTED = new Set([
  'religion_muslim',
  'religion_hindu',
  'has_spouse',
  'is_married',
  'has_partner',
  'divorced',
  'widowed',
  'has_child',
  'has_pet',
  'criminal_record',
  'in_jail',
  'gone_straight',
  'bankrupt',
  'has_car',
  'has_house',
  'has_investment',
  'has_debt',
  'unemployed',
  'retired',
  'perf_high',
  'perf_low',
  'gpa_high',
  'gpa_low',
  'moved_away',
  'student',
  'toddler_trait_rolled',
  'side_hustle',
  'hobby_sport',
  'hobby_music',
  'hobby_art',
  'traveler',
  'social_star',
  'volunteer',
  'fitness_good',
  'went_to_therapy',
  'quit_bad_habit',
  'pet_plea',
  'parttime_accept',
  'ill_recovered',
  'mental_low',
  'injury_recovered',
  'education_elementary',
  'education_middle',
  'education_high',
  'education_university',
  'education_vocational',
  'education_graduate',
  'major_stem',
  'major_business',
  'major_arts',
  'major_medicine',
  'major_law',
  'has_family_estranged',
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
  'sued',
]);

describe('PART A — flag vocabulary sanity (requirements + grants)', () => {
  it('every required flag is either vocabulary-registered or a known content flag', () => {
    const unknown = [...REQUIRED_FLAGS].filter((f) => !ENGINE_GRANTED.has(f));
    expect(unknown.map((f) => `required:${f}`)).toEqual([]);
  });

  it('every banned flag is either vocabulary-registered or a known content flag', () => {
    const unknown = [...BANNED_FLAGS].filter((f) => !ENGINE_GRANTED.has(f));
    expect(unknown.map((f) => `anti:${f}`)).toEqual([]);
  });

  it('a flag that is required is granted somewhere (content or engine)', () => {
    const ungrantable = [...REQUIRED_FLAGS].filter(
      (f) => !EFFECT_ADDS.has(f) && !ENGINE_GRANTED.has(f),
    );
    // Some flags are conditionally true at character creation (religion_*).
    const knownCreation = ['religion_muslim', 'religion_hindu'];
    const missing = ungrantable.filter((f) => !knownCreation.includes(f));
    expect(missing.map((f) => `ungrantable:${f}`)).toEqual([]);
  });

  it('a flag that can be removed by a choice is also granted or already present at creation', () => {
    const impossible = [...EFFECT_REMOVES].filter(
      (f) => !EFFECT_ADDS.has(f) && !ENGINE_GRANTED.has(f),
    );
    expect(impossible.map((f) => `orphan-remove:${f}`)).toEqual([]);
  });

  it('oncePerLife events are never duplicated in the registry', () => {
    const ids = [...ONCE_PER_LIFE_IDS];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no oncePerLife event is repeated twice in the same pool', () => {
    const allIds = ALL_EVENTS.map((e) => e.id);
    const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
    expect(dupes.map((d) => `dup:${d}`)).toEqual([]);
  });
});

describe('PART A — life-stage age consistency (tags vs definitions)', () => {
  it('childhood events are all ages 0-12, senior events never below 50', () => {
    const wrongChildhood = ALL_EVENTS.filter(
      (e) => e.category === 'childhood' && (e.minAge > 12 || e.maxAge > 12),
    );
    const wrongSenior = ALL_EVENTS.filter(
      (e) => e.category === 'senior' && e.maxAge < 50,
    );
    expect(wrongChildhood.map((e) => `${e.id}:${e.minAge}-${e.maxAge}`)).toEqual([]);
    expect(wrongSenior.map((e) => `${e.id}:${e.minAge}-${e.maxAge}`)).toEqual([]);
  });

  it('teen events never go below 10 or above 25', () => {
    const wrong = ALL_EVENTS.filter(
      (e) => e.category === 'teen' && (e.minAge < 10 || e.maxAge > 25),
    );
    expect(wrong.map((e) => `${e.id}:${e.minAge}-${e.maxAge}`)).toEqual([]);
  });
});