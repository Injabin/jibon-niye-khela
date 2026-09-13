export type Gender = 'male' | 'female';

export type AvatarHair = 'cocoa' | 'midnight' | 'chestnut' | 'silver';
export type AvatarOutfit = 'sunshine' | 'mint' | 'lavender' | 'coral';

export interface AvatarAppearance {
  hair: AvatarHair;
  outfit: AvatarOutfit;
}

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

/**
 * Player relationship-state derived from living relations and flags.
 * `dating`/`partnered`/`married`/`single` are mutually exclusive snapshots of
 * the most committed active romantic tie; the rest are orthogonal booleans.
 */
export type RelationshipState =
  | 'single'
  | 'dating'
  | 'partnered'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'has_child'
  | 'has_pet';

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
  /** Character age the last time this NPC (parent/relative) was asked for money. */
  lastAskMoneyAge?: number;
  /** Character age the last time a reconciliation was attempted with this estranged NPC. */
  lastMakePeaceAge?: number;
  /** Count of secret extramarital/infra-partnership affairs this NPC has had (F). */
  affairCount?: number;
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

export interface EducationUniversity {
  id: string;
  name: string;
  area: string;
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
  /** The university/college currently attended (E — Part E picker, defaulted on enroll). */
  university?: EducationUniversity;
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
  | 'ask_out_peer'
  | 'make_peace';

/** Ceremony choice offered when a partner accepts the wedding proposal. */
export type WeddingStyle = 'kazi_office' | 'community_center';

export interface Character {
  id: string;
  name: string;
  surname: string;
  gender: Gender;
  /** Optional presentation-only customization; absent in legacy saves. */
  appearance?: AvatarAppearance;
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
  /** Multi-romance tracking (F): age the player first juggled 2+ active romances. */
  illicit?: { sinceAge?: number };
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
  appearance?: Partial<AvatarAppearance>;
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
  /** Relationship meter adjustment applied to living NPCs with the given role. */
  bond?: { role: Relation; amount: number };
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
  /** Gender targeting; 'any' (default) targets every gender. */
  gender?: Gender | 'any';
  /** Religion targeting; 'any' (default) targets every religion. */
  religion?: Religion | 'any';
  /** Required relationship-state conditions derived from living relations/flags. */
  relationshipState?: RelationshipState[];
  /** Relationship states that make this event ineligible. */
  antiRelationshipState?: RelationshipState[];
  /** Fires at most once per life, regardless of the 15-age anti-repetition cooldown. */
  oncePerLife?: boolean;
  /** Optional live condition evaluated against the character at draw time (e.g. child school age). */
  predicate?: (character: Character) => boolean;
  /**
   * Custom-resolved events (F/H/I): routed to resolveRomanceDramaChoice
   * instead of stat-only resolution. Covers caught-infidelity drama (F),
   * NPC-initiated romantic interest (H), and proposal/baby initiative
   * events whose outcomes need real relationship surgery (I). `relationshipIds`
   * is filled for store-injected events; static registry events leave it empty
   * and the resolver picks the best living partner/dating NPC dynamically.
   */
  drama?: {
    action:
      | 'npc_affair'
      | 'multi_caught'
      | 'classmate_interest'
      | 'coworker_interest'
      | 'marriage_proposal'
      | 'exclusive_proposal'
      | 'partner_baby_proposal'
      | 'single_askout';
    relationshipIds: string[];
  };
}

export interface AgeUpResult {
  character: Character;
  firedEvents: LifeEventDef[];
}

export interface CreateCharacterResult {
  character: Character;
  rng: RNG;
}