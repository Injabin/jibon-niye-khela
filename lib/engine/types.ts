export type Gender = 'male' | 'female';

export type Tone = 'good' | 'bad' | 'neutral' | 'funny';

/**
 * Milestone "moment" beats (DESIGN.md §7): a short, reusable Lottie sting
 * triggered by event kind — not authored per unique event. The visual/audio
 * treatment for each kind lives in the UI layer; this enum is the shared
 * contract so content can tag events without knowing rendering details.
 */
export type MilestoneKind =
  | 'confetti'
  | 'money'
  | 'diploma'
  | 'wedding'
  | 'handcuffs'
  | 'tombstone'
  | 'birth'
  | 'sparkles'
  | 'heart'
  | 'house';

import type { RNG } from './rng';

export interface Stats {
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
}

export interface Reputation {
  fame: number;
  karma: number;
}

export type Relation =
  | 'mother'
  | 'father'
  | 'grandparent'
  | 'sibling'
  | 'spouse'
  | 'child'
  | 'partner'
  | 'friend'
  | 'pet';

export interface Relationship {
  id: string;
  relation: Relation;
  name: string;
  age: number;
  alive: boolean;
  meter: number;
  metAge: number;
}

export type EducationStage =
  | 'none'
  | 'preschool'
  | 'elementary'
  | 'middle'
  | 'high'
  | 'undergraduate'
  | 'graduate'
  | 'vocational'
  | 'dropped';

export interface EducationState {
  stage: EducationStage;
  enrolled: boolean;
  gpa: number;
  major: string;
  graduated: boolean;
  /** Age at which post-secondary study began; drives the graduation countdown. */
  enrolledAge?: number;
}

export interface CareerState {
  jobId: string | null;
  performance: number;
  yearsAtJob: number;
}

export type AssetKind = 'car' | 'home' | 'jewelry' | 'collectible' | 'stock' | 'crypto';

export interface Asset {
  id: string;
  kind: AssetKind;
  name: string;
  purchasePrice: number;
  value: number;
  acquiredAge: number;
}

export interface CrimeEntry {
  offense: string;
  age: number;
  sentenceYears: number;
  served: boolean;
}

export interface StatsHistoryPoint {
  age: number;
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
}

export interface LifeEventLogEntry {
  age: number;
  text: string;
  tone: Tone;
}

export interface Character {
  id: string;
  name: string;
  surname: string;
  gender: Gender;
  birthYear: number;
  stats: Stats;
  money: number;
  age: number;
  alive: boolean;
  causeOfDeath?: string;
  traits: string[];
  flags: string[];
  reputation: Reputation;
  education: EducationState;
  career: CareerState;
  assets: Asset[];
  relationships: Relationship[];
  criminalRecord: CrimeEntry[];
  history: LifeEventLogEntry[];
  statHistory: StatsHistoryPoint[];
}

export interface StatEffects {
  health?: number;
  happiness?: number;
  smarts?: number;
  looks?: number;
  money?: number;
  fame?: number;
  karma?: number;
  addTrait?: string;
  removeTrait?: string;
  addFlag?: string;
  removeFlag?: string;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: StatEffects;
  outcomeText: string;
  tone: Tone;
}

export interface LifeEventDef {
  id: string;
  text: string;
  minAge: number;
  maxAge: number;
  weight: number;
  tone: Tone;
  category: 'childhood' | 'teen' | 'young-adult' | 'adult' | 'senior' | 'universal';
  /** Optional milestone sting fired when this event resolves (DESIGN.md §7). */
  moment?: MilestoneKind;
  choices: EventChoice[];
  requiredFlags?: string[];
  antiFlags?: string[];
  tags?: string[];
}

export interface AgeUpResult {
  character: Character;
  firedEvents: LifeEventDef[];
}

export interface CreateCharacterResult {
  character: Character;
  rng: RNG;
}