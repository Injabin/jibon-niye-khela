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
  | 'pet'
  | 'crush'
  | 'dating'
  | 'ex'
  | 'classmate'
  | 'coworker';

export interface Relationship {
  id: string;
  relation: Relation;
  name: string;
  age: number;
  alive: boolean;
  meter: number;
  metAge: number;
  romanceStage?: 'crush' | 'dating' | 'partner' | 'fiancé' | 'spouse' | 'ex';
  occupation?: string;
  /** NPC vitals (C): 0–100 meters that drift every year and can kill the NPC. */
  health?: number;
  happiness?: number;
  /** Engine career id when the NPC holds a job (drives job-family context checks). */
  jobId?: string;
  /** Character age the last time the player interacted with this NPC. */
  lastMetAge?: number;
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

export interface EducationSchool {
  id: string;
  name: string;
  stage: 'elementary' | 'middle' | 'high';
  prestige: 1 | 2 | 3;
}

export interface EducationState {
  stage: EducationStage;
  enrolled: boolean;
  gpa: number;
  major: string;
  graduated: boolean;
  /** Age at which post-secondary study began; drives the graduation countdown. */
  enrolledAge?: number;
  /** The school currently attended (H — player-chosen, defaulted at auto-advance). */
  school?: EducationSchool;
}

export interface CareerState {
  jobId: string | null;
  performance: number;
  yearsAtJob: number;
  /** Rung on the career ladder (E — Phase 3.5); 0 = entry, absent = entry. */
  tier?: number;
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

export type LoanKind = 'personal' | 'student' | 'home' | 'business';

export interface Loan {
  id: string;
  kind: LoanKind;
  principal: number;
  balance: number;
  rate: number;
  takenAge: number;
}

export interface FinanceState {
  /** Interest-bearing savings balance (DESIGN.md §5.5). */
  savings: number;
  /** Annual simple interest rate on the savings balance. */
  savingsRate: number;
  loans: Loan[];
  bankruptcies: number;
  /** Lending blackout until this age after a bankruptcy discharge. */
  bankruptcyBlockUntilAge?: number;
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

export type Religion = 'islam' | 'hinduism';

export type RelationshipAction =
  | 'spend_time'
  | 'chat'
  | 'compliment'
  | 'insult'
  | 'ask_money'
  | 'gift'
  | 'call_ex'
  | 'hookup_ex'
  | 'reunite_ex'
  | 'praise_child'
  | 'child_treat'
  | 'discipline_child'
  | 'child_allowance'
  | 'befriend'
  | 'ask_out_peer';

/** Ceremony choice offered when a partner accepts the wedding proposal. */
export type WeddingStyle = 'kazi_office' | 'community_center';

export interface Character {
  id: string;
  name: string;
  surname: string;
  gender: Gender;
  religion: Religion;
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
  /** Finance block (F — Phase 3.5); absent = an all-zero default for old saves. */
  finance?: FinanceState;
  relationships: Relationship[];
  criminalRecord: CrimeEntry[];
  history: LifeEventLogEntry[];
  statHistory: StatsHistoryPoint[];
  /** Recent event ids and the age they fired, used for the 15-age anti-repetition cooldown. */
  recentEventHistory?: Array<{ id: string; age: number }>;
  /** Count of live Gemini AI calls used during this life (capped at 8 per life). */
  aiCallsUsed?: number;
  /** ActiveMenu actions spent this calendar year (cap = ACTIVITY_BUDGET_PER_YEAR). */
  activityBudgetUsed?: number;
}

export type WealthTier = 'poor' | 'middle' | 'wealthy';

export interface CustomCharacterOptions {
  name?: string;
  surname?: string;
  gender?: Gender;
  religion?: Religion;
  birthYear?: number;
  wealthTier?: WealthTier;
  startingTraits?: string[];
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
  /** Origin of the event in the hybrid engine */
  source?: 'gemini' | 'fallback';
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