import { create } from 'zustand';
import { ageUp, checkForDeath } from '@/lib/engine/aging';
import {
  ACTIVITY_BUDGET_EXCEEDED_MESSAGE,
  applyLeisureTradeoff,
  canSpendAction,
  spendAction,
} from '@/lib/engine/activity';
import { createCharacter } from '@/lib/engine/character';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import { BOND_MAX, BOND_PER_VISIT, ageFamilyMembers, birthChild, generateFamilyTree, relationLabel } from '@/lib/engine/family';
import type { FamilyTree, FamilyRole } from '@/lib/engine/family';
import { buildHeirFamilyTree, createHeirCharacter, eligibleHeirs, nextLifeSeed } from '@/lib/engine/legacy';
import { buyAsset, sellAsset } from '@/lib/engine/events/categories/assets';
import { applyForJob, quitJob, workOvertime, suckUpToBoss, askForRaise } from '@/lib/engine/events/categories/career';
import { commitCrime } from '@/lib/engine/events/categories/crime';
import {
  prisonBail,
  prisonEscape,
  prisonFight,
  prisonGoodBehavior,
  prisonGym,
  prisonLibrary,
} from '@/lib/engine/prison';
import { enterHigherEducation, studyHarder, hireTutor, dropOutOfSchool, skipClass, joinDebateClub } from '@/lib/engine/events/categories/education';
import { visitDoctor } from '@/lib/engine/events/categories/health';
import { RNG } from '@/lib/engine/rng';
import type { AssetKind, Character, CustomCharacterOptions, LifeEventDef, MilestoneKind, Relation, RelationshipAction, Tone, WeddingStyle } from '@/lib/engine/types';
import {
  generateDatingPool,
  askOutCandidate,
  makeOfficialPartner,
  proposeMarriage,
  cheatBranch,
  breakupOrDivorce,
  dateCandidateOrPartner,
  giveGiftToPartner,
  tryForBaby,
  callOrTextEx,
  hookupWithEx,
  begGetBackTogether,
  insultEx,
  type DatingCandidate,
} from '@/lib/engine/romance';
import {
  spendTimeWithPerson,
  chatWithPerson,
  complimentPerson,
  insultPerson,
  askMoneyFromPerson,
  giveGiftToPerson,
  praiseChild,
  buyChildTreat,
  disciplineChild,
  giveChildAllowance,
  befriendPeer,
  askOutPeer,
  type RelationshipActionResult,
} from '@/lib/engine/relationships';
import { achievementsStore } from '@/lib/store/achievementsStore';
import { soundManager } from '@/lib/audio/SoundManager';
import { fetchEventForYear } from '@/lib/ai/contentOrchestrator';
import { getFallbackEvent } from '@/lib/ai/fallbackBank';
import { defaultSaveState } from '@/lib/save/schema';
import type { SaveState } from '@/lib/save/schema';
import {
  exportSave,
  importSave,
  loadSave,
  localStorageStorage,
  storeSave,
} from '@/lib/save/storage';

function makeRng(seed: number, state: number): RNG {
  const rng = new RNG(seed);
  rng.setState(state);
  return rng;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Maps household roles onto the character's relationship kinds for consistency. */
const ROLE_TO_RELATION: Partial<Record<FamilyRole, Relation>> = {
  mother: 'mother',
  father: 'father',
  grandparent: 'grandparent',
  sibling: 'sibling',
  spouse: 'spouse',
  child: 'child',
};

/** Mirrors family-tree deaths onto the character's relationship array. */
function syncRelationshipDeaths(character: Character, tree: FamilyTree | null): void {
  if (!tree) return;
  const familyTreeRoleFor: Partial<Record<Relation, FamilyRole>> = {
    mother: 'mother',
    father: 'father',
    sibling: 'sibling',
    child: 'child',
    spouse: 'spouse',
    grandparent: 'grandparent',
  };
  for (const rel of character.relationships) {
    const role = familyTreeRoleFor[rel.relation];
    if (!role) continue;
    const member = tree.members.find((m) => m.role === role && m.name === rel.name);
    if (member && !member.alive && rel.alive) {
      rel.alive = false;
      character.history.push({
        age: character.age,
        text: `${rel.name} মারা গেছে। দোয়া করিলাম অর আত্মার মাগফিরাতের জন্য!`,
        tone: 'bad',
      });
    }
  }
}

export interface GameStoreState {
  character: Character | null;
  seed: number;
  rngState: number;
  pendingEvents: LifeEventDef[];
  currentEventIndex: number;
  savedAt: string | null;
  message: string | null;
  error: string | null;
  isHydrated: boolean;
  /** Tone of the player's most recent choice — drives the avatar expression overlay. */
  lastOutcomeTone: Tone | null;
  /**
   * Transient moment-sting trigger (M4): set by the actions that resolve a
   * choice or roll a year, consumed as the `kind` prop of <MomentSting>.
   * Deliberately NOT persisted — it is presentation state, not game state.
   */
  pendingSting: MilestoneKind | null;
  /** Monotonic trigger id bumped on every sting so repeated kinds replay. */
  stingToken: number;
  /** Persisted household tree (schema v2); null only before a life begins. */
  familyTree: FamilyTree | null;
  /** Paused game state (Phase 10). */
  isPaused: boolean;
  /** Whether the hybrid engine is currently requesting a Gemini event. */
  isGeneratingEvent: boolean;
}

export type FamilyInteractionType = 'spend_time' | 'chitchat' | 'compliment' | 'ask_money' | 'gift';

export interface FamilyInteractionResult {
  ok: boolean;
  message: string;
}

export interface GameStoreActions {
  /** Restore a save from storage once per page load. */
  hydrate(): void;
  /** Start a new life; an explicit seed is honoured (tests). Returns the seed used. */
  newGame(seed?: number): number;
  /** Advance one year synchronously via fallback/engine. */
  ageUp(): boolean;
  /** Advance one year asynchronously via the hybrid Gemini/fallback engine. */
  ageUpAsync(): Promise<boolean>;
  /** Resolve the current pending event with the player's choice. */
  resolveCurrentChoice(choiceId: string): boolean;
  /**
   * Active-menu education action (DESIGN.md §5.1): begin either post-secondary
   * path after school ends. Returns false when unavailable (dead, pending
   * event, already studying/graduated, under 18, or an undergraduate with too
   * low smarts). Sets `message` to the outcome either way.
   */
  enrollHigherEducation(path: 'undergraduate' | 'vocational'): boolean;
  /** Active-menu career action (DESIGN.md §5.2): apply to an eligible job. */
  applyForJob(jobId: string): boolean;
  /** Quit the current job, returning to the unemployed state. */
  quitJob(): boolean;
  /** Active-menu crime action (DESIGN.md §5.6): attempt a crime. */
  commitCrime(crimeId: string): boolean;
  /** Prison action (D — Phase 3.5): pay bail / plea-deal fine to walk out early. */
  bailOut(): boolean;
  /** Prison action (D — Phase 3.5): workout on the jail grounds. */
  prisonGym(): boolean;
  /** Prison action (D — Phase 3.5): read the jail library. */
  prisonLibrary(): boolean;
  /** Prison action (D — Phase 3.5): brawl inside the barracks. */
  prisonFight(): boolean;
  /** Prison action (D — Phase 3.5): good conduct; shaves a year, zero = parole. */
  prisonGoodBehavior(): boolean;
  /** Prison action (D — Phase 3.5): attempt a risky escape. */
  prisonEscape(): boolean;
  /** Active-menu asset action (DESIGN.md §5.5): buy an asset kind. */
  buyAsset(kind: AssetKind, options?: { name?: string; price?: number }): boolean;
  /** Sell one owned asset by id. */
  sellAsset(assetId: string): boolean;
  /** Active-menu health action (DESIGN.md §5.4/§5.7): a doctor's visit. */
  visitDoctor(): boolean;
  /**
   * Raise a family member's bond by spending time (once per game year, capped
   * at 100). Returns false when the tree is missing, the member is the
   * character, the year's visit is used, or their bond is maxed.
   */
  spendTimeWith(memberId: string): boolean;
  /** Detailed interactive family interactions (chitchat, compliment, ask for money, gift, spend time). */
  interactWithFamily(memberId: string, action: FamilyInteractionType): FamilyInteractionResult;
  /** Export the current game as a formatted JSON string; null when no character exists. */
  exportToJson(): string | null;
  /** Import a raw save file. Returned boolean is success; sets `error`/`message` accordingly. */
  importFromRaw(raw: string): boolean;
  /** Wipe storage and all in-memory state. */
  resetGame(): void;
  /** Start a new custom life with explicit configuration. */
  newCustomGame(options: CustomCharacterOptions, seed?: number): number;
  /** Generate a candidate pool for dating based on character age. */
  getDatingCandidates(): DatingCandidate[];
  /** Ask out a dating candidate. */
  askOut(candidate: DatingCandidate): boolean;
  /** Make an exclusive official partnership. */
  makeOfficial(relationshipId: string): boolean;
  /** Propose marriage to an official partner with a chosen ceremony style. */
  propose(relationshipId: string, style?: WeddingStyle): boolean;
  /** Engage in a consequence-driven cheating affair. */
  cheat(relationshipId: string): boolean;
  /** Break up or divorce an active romantic partner or spouse. */
  breakupOrDivorce(relationshipId: string): boolean;
  /** Take partner or crush on an authentic Dhakaiya date. */
  datePartner(relationshipId: string): boolean;
  /** Give a gift to a romantic partner, crush, or spouse. */
  giveGift(relationshipId: string): boolean;
  /** Try for a baby with a committed partner or spouse. */
  haveBaby(relationshipId: string): boolean;
  /** Active-menu education action: study harder to boost GPA and smarts. */
  studyHarder(): boolean;
  /** Active-menu education action: hire a private tutor. */
  hireTutor(): boolean;
  /** Active-menu education action: drop out of school. */
  dropOutOfSchool(): boolean;
  /** Active-menu education action: bang class to hang out (skip class). */
  skipClass(): boolean;
  /** Active-menu education action: join the school/college debate club. */
  joinDebateClub(): boolean;
  /** Active-menu career action: work overtime to boost performance. */
  workOvertime(): boolean;
  /** Active-menu career action: suck up to boss. */
  suckUpToBoss(): boolean;
  /** Active-menu career action: ask for a raise. */
  askForRaise(): boolean;
  /** Interact with any living person in character.relationships using BitLife sub-actions. */
  interactWithPerson(relationshipId: string, action: RelationshipAction): boolean;
  /** Reach out to an ex-partner via call or text. */
  callEx(relationshipId: string): boolean;
  /** Secret rendezvous with an ex-partner. */
  hookupEx(relationshipId: string): boolean;
  /** Beg to get back together with an ex-partner. */
  reuniteEx(relationshipId: string): boolean;
  /** Insult an ex-partner. */
  insultEx(relationshipId: string): boolean;
  /** Visit Kabiraj (traditional herbalist/spiritual healer). */
  visitKabiraj(): boolean;
  /** Workout at the gym / akhora for health and looks. */
  doGymWorkout(): boolean;
  /** Watch a movie at Madhumita/Cineplex for happiness. */
  watchMovie(): boolean;
  /** Pray or worship at mosque or temple according to religion for karma and peace. */
  prayOrWorship(): boolean;
  /** Do quick side hustle for emergency cash (tuition, delivery, street vendor). */
  doSideHustle(kind: 'tuition' | 'delivery' | 'street_vendor'): boolean;
  /** Legacy mode (init.md M5 #4): continue as a child who has come of age after */
  continueAsHeir(heirId: string): boolean;
  /** Set pause state (Phase 10). Ducks ambient music when paused. */
  setPaused(isPaused: boolean): void;
  /** Toggle pause state (Phase 10). */
  togglePause(): void;
}

type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  character: null,
  seed: 0,
  rngState: 0,
  pendingEvents: [],
  currentEventIndex: 0,
  savedAt: null,
  message: null,
  error: null,
  isHydrated: false,
  lastOutcomeTone: null,
  pendingSting: null,
  stingToken: 0,
  familyTree: null,
  isPaused: false,
  isGeneratingEvent: false,
};

function toSaveState(s: GameStoreState, character: Character): SaveState {
  return defaultSaveState(s.seed, s.rngState, character, s.pendingEvents, s.currentEventIndex, s.familyTree);
}

/**
 * Context-first pipeline helper (B). When the engine draws no events for a
 * year, derive a single context-aware fallback event (flags are evaluated
 * against the character's traits + flags), appending it to recentEventHistory.
 */
export function selectYearFallbacks(character: Character, seed: number): LifeEventDef[] {
  const fallback = getFallbackEvent({
    age: character.age,
    recentEventIds: (character.recentEventHistory ?? []).map((r) => r.id),
    seed,
    character,
  });
  if (!character.recentEventHistory) character.recentEventHistory = [];
  if (!character.recentEventHistory.some((r) => r.id === fallback.id)) {
    character.recentEventHistory.push({ id: fallback.id, age: character.age });
  }
  return [fallback];
}

export const useGameStore = create<GameStore>()((set, get) => {
  function persist(): void {
    const s = get();
    if (!s.character) return;
    const savedAt = new Date().toISOString();
    const state = defaultSaveState(
      s.seed,
      s.rngState,
      s.character,
      s.pendingEvents,
      s.currentEventIndex,
      s.familyTree,
    );
    state.savedAt = savedAt;
    storeSave(localStorageStorage, state);
    set({ savedAt });
  }

  /**
   * Shared harness for the active-menu actions (DESIGN.md §2): guarded to an
   * alive character with no pending choice (a menu action must not interleave
   * with a live event card), the engine runs on a structured clone with a
   * re-seeded RNG so every outcome is deterministic from (seed, rngState).
   * The outcome text becomes the banner message; rejected actions still
   * persist so consumed randomness never re-rolls the same failed attempt.
   */
  function runIdleAction(
    op: (character: Character, rng: RNG) => { ok: boolean; text: string; tone?: Tone },
    opts?: { leisure?: boolean },
  ): boolean {
    const s = get();
    if (!s.character || !s.character.alive || s.isPaused) return false;
    if (s.pendingEvents.length > 0) return false;
    if (!canSpendAction(s.character)) {
      set({ message: ACTIVITY_BUDGET_EXCEEDED_MESSAGE, error: null });
      return false;
    }

    const rng = makeRng(s.seed, s.rngState);
    const character = structuredClone(s.character);
    const result = op(character, rng);

    if (result.ok) {
      spendAction(character);
      if (opts?.leisure) applyLeisureTradeoff(character);
    }

    // Guaranteed timeline logging for EVERY idle action
    const lastHistory = character.history[character.history.length - 1];
    if (!lastHistory || lastHistory.text !== result.text) {
      character.history.push({
        age: character.age,
        text: result.text,
        tone: result.tone ?? (result.ok ? 'good' : 'neutral'),
      });
    }

    set({ character, rngState: rng.getState(), message: result.text, error: null });
    persist();
    return result.ok;
  }

  /**
   * Budget gate for the bespoke menu actions that bypass runIdleAction
   * (romance + school + career extras). Mirrors runIdleAction's guards and
   * refuses once the year's 3 actions are spent.
   */
  function assertBudgetAvailable(): boolean {
    const s = get();
    if (!s.character || !s.character.alive) return false;
    if (s.pendingEvents.length > 0) return false;
    if (!canSpendAction(s.character)) {
      set({ message: ACTIVITY_BUDGET_EXCEEDED_MESSAGE, error: null });
      return false;
    }
    return true;
  }

  /** Record one spent action slot after a bespoke action succeeded. */
  function consumeBudget(character: Character): void {
    character.activityBudgetUsed = (character.activityBudgetUsed ?? 0) + 1;
  }

  return {
    ...initialState,

    hydrate() {
      if (get().isHydrated) return;
      const save = loadSave(localStorageStorage);
      if (save) {
        set({
          character: save.character,
          seed: save.seed,
          rngState: save.rngState,
          pendingEvents: save.pendingEvents ?? [],
          currentEventIndex: save.currentEventIndex ?? 0,
          savedAt: save.savedAt,
          message: null,
          error: null,
          pendingSting: null,
          stingToken: 0,
          familyTree: save.familyTree ?? null,
        });
      }
      set({ isHydrated: true });
    },

    newGame(seedOverride) {
      soundManager.duckMusic(false);
      const seed = seedOverride ?? randomSeed();
      const { character, rng } = createCharacter(seed);
      const familyTree = generateFamilyTree(character, seed);
      set({
        character,
        seed,
        rngState: rng.getState(),
        pendingEvents: [],
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: null,
        stingToken: 0,
        familyTree,
        isPaused: false,
        message: 'A new life begins…',
        error: null,
      });
      persist();
      return seed;
    },

    newCustomGame(options, seedOverride) {
      soundManager.duckMusic(false);
      const seed = seedOverride ?? randomSeed();
      const { character, rng } = createCharacter(seed, options);
      const familyTree = generateFamilyTree(character, seed);
      set({
        character,
        seed,
        rngState: rng.getState(),
        pendingEvents: [],
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: null,
        stingToken: 0,
        familyTree,
        isPaused: false,
        message: 'A custom life begins…',
        error: null,
      });
      persist();
      return seed;
    },

    ageUp() {
      const s = get();
      if (!s.character || !s.character.alive || s.isPaused) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = ageUp(character, rng);

      if (!result.character.alive) {
        achievementsStore.getState().recordLife(result.character);
      }

      const familyTree =
        s.familyTree && result.character.alive
          ? ageFamilyMembers(s.familyTree, result.character.age, rng)
          : s.familyTree;
      if (result.character.alive) syncRelationshipDeaths(result.character, familyTree);

      // Context-first pipeline (B): engine-drawn events outrank the fallback on
      // the sync path too. Engine events were already recorded in
      // recentEventHistory by drawYearlyEvents, so only the fallback branch
      // needs extra bookkeeping (handled by selectYearFallbacks).
      let events: LifeEventDef[] = [];
      if (result.character.alive) {
        events =
          result.firedEvents.length > 0
            ? result.firedEvents
            : selectYearFallbacks(result.character, s.seed + result.character.age);
      }

      set({
        character: result.character,
        rngState: rng.getState(),
        pendingEvents: events,
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: result.character.alive ? null : 'tombstone',
        stingToken: result.character.alive ? s.stingToken : s.stingToken + 1,
        message: null,
        error: null,
        familyTree,
        isGeneratingEvent: false,
      });
      persist();
      return true;
    },

    async ageUpAsync() {
      const s = get();
      if (!s.character || !s.character.alive || s.isPaused || s.isGeneratingEvent) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = ageUp(character, rng);

      if (!result.character.alive) {
        achievementsStore.getState().recordLife(result.character);
      }

      const familyTree =
        s.familyTree && result.character.alive
          ? ageFamilyMembers(s.familyTree, result.character.age, rng)
          : s.familyTree;
      if (result.character.alive) syncRelationshipDeaths(result.character, familyTree);

      if (!result.character.alive) {
        set({
          character: result.character,
          rngState: rng.getState(),
          pendingEvents: [...result.firedEvents],
          currentEventIndex: 0,
          lastOutcomeTone: null,
          pendingSting: 'tombstone',
          stingToken: s.stingToken + 1,
          message: null,
          error: null,
          familyTree,
          isGeneratingEvent: false,
        });
        persist();
        return true;
      }

      // 1. Context events first (B): engine-drawn events outrank Gemini for this
      //    year. No AI call, no spinner, and the events were already appended to
      //    recentEventHistory by drawYearlyEvents.
      if (result.firedEvents.length > 0) {
        set({
          character: result.character,
          rngState: rng.getState(),
          familyTree,
          pendingEvents: result.firedEvents,
          currentEventIndex: 0,
          lastOutcomeTone: null,
          pendingSting: null,
          message: null,
          error: null,
          isGeneratingEvent: false,
        });
        persist();
        return true;
      }

      // 2. Advance age and stats synchronously so persistence is never stale
      set({
        character: result.character,
        rngState: rng.getState(),
        familyTree,
        isGeneratingEvent: true,
        error: null,
      });
      persist();

      // 3. Fetch annual content event (Gemini if eligible, else fallback)
      let eventToFire: LifeEventDef | null = null;
      try {
        const fetched = await fetchEventForYear(result.character, result.character.age);
        eventToFire = fetched.event;
        if (fetched.source === 'gemini') {
          result.character.aiCallsUsed = (result.character.aiCallsUsed ?? 0) + 1;
        }
      } catch {
        eventToFire = getFallbackEvent({
          age: result.character.age,
          recentEventIds: (result.character.recentEventHistory ?? []).map((r) => r.id),
          seed: s.seed + result.character.age,
          character: result.character,
        });
      }

      if (result.character.alive && eventToFire) {
        if (!result.character.recentEventHistory) result.character.recentEventHistory = [];
        if (!result.character.recentEventHistory.some((r) => r.id === eventToFire!.id)) {
          result.character.recentEventHistory.push({ id: eventToFire.id, age: result.character.age });
        }
      }

      set({
        character: result.character,
        pendingEvents: eventToFire ? [eventToFire] : [...result.firedEvents],
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: null,
        message: null,
        error: null,
        isGeneratingEvent: false,
      });
      persist();
      return true;
    },

    resolveCurrentChoice(choiceId) {
      const s = get();
      if (!s.character || !s.character.alive || s.isPaused) return false;
      if (s.pendingEvents.length === 0) return false;

      const event = s.pendingEvents[s.currentEventIndex];
      if (!event) return false;

      const choice = event.choices.find((c) => c.id === choiceId) ?? null;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      resolveEventChoice(character, event, choiceId);
      checkForDeath(character, rng);

      // A content event granted "has_child" (M5 #4): the new child joins the
      // household tree right here, so a birth is recorded even though events
      // only carry a flag. Runs on the same RNG stream as the resolve.
      let familyTree = s.familyTree;
      if (character.alive && familyTree) {
        const hadChildBefore = s.character.flags.includes('has_child');
        if (!hadChildBefore && character.flags.includes('has_child')) {
          familyTree = birthChild(familyTree, character, rng);
        }
      }

      const nextIndex = s.currentEventIndex + 1;
      const done = nextIndex >= s.pendingEvents.length;
      // A choice can be fatal (checkForDeath above). If it is, the rest of the
      // year's events are moot and must not linger: pendingEvents blocks the
      // block that resolves choices for dark characters, so any remaining
      // events would freeze the game off the life-summary rendering (dead = 
      // !alive && pendingEvents.length === 0 in GameHub) with no way out.
      const died = !character.alive;
      if (died) {
        achievementsStore.getState().recordLife(character);
      }
      const sting = character.alive ? (event.moment ?? null) : 'tombstone';

      set({
        character,
        rngState: rng.getState(),
        pendingEvents: done || died ? [] : s.pendingEvents,
        currentEventIndex: done || died ? 0 : nextIndex,
        lastOutcomeTone: choice?.tone ?? null,
        pendingSting: sting,
        stingToken: sting ? s.stingToken + 1 : s.stingToken,
        error: null,
        familyTree,
      });
      persist();
      return true;
    },

    spendTimeWith(memberId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      const tree = s.familyTree;
      if (!tree) return false;
      const member = tree.members.find((m) => m.id === memberId);
      if (!member) return false;
      if (member.role === 'self') return false;
      if (!member.alive) return false;
      const characterAge = s.character.age;
      if (member.lastSpentAge === characterAge) return false;
      if (member.bond >= BOND_MAX) return false;

      const nextBond = Math.min(BOND_MAX, member.bond + BOND_PER_VISIT);
      const members = tree.members.map((m) =>
        m.id === memberId ? { ...m, bond: nextBond, lastSpentAge: characterAge } : m,
      );
      set({ familyTree: { ...tree, members } });

      // Keep the character's relationships array in sync with the same bond.
      const relation = ROLE_TO_RELATION[member.role];
      if (relation) {
        const character = structuredClone(s.character);
        const rel = character.relationships.find((r) => r.relation === relation && r.name === member.name);
        if (rel) rel.meter = nextBond;
        set({ character });
      }

      persist();
      return true;
    },

    interactWithFamily(memberId, action) {
      const s = get();
      if (!s.character || !s.character.alive) return { ok: false, message: 'জীবন শেষ হইয়া গেছে!' };
      const tree = s.familyTree;
      if (!tree) return { ok: false, message: 'পরিবারের কোনো হদিস নাই!' };
      const member = tree.members.find((m) => m.id === memberId);
      if (!member) return { ok: false, message: 'এই মানুষকে তো চিনি না!' };
      if (member.role === 'self') return { ok: false, message: 'নিজের লগে নিজে তামাশা করবা?' };
      if (!member.alive) return { ok: false, message: `${member.name} আর দুনিয়ায় নাই!` };

      const character = structuredClone(s.character);
      const rng = makeRng(s.seed, s.rngState);
      let bondDelta = 0;
      let happyDelta = 0;
      let moneyDelta = 0;
      let text = '';
      let ok = true;

      const roleBangla = relationLabel(member);

      switch (action) {
        case 'spend_time': {
          if (member.lastSpentAge === character.age) {
            return { ok: false, message: 'এই বছর উনার লগে কাচ্চি খাওয়া শেষ! সামনে বছর আবার খাইয়ো।' };
          }
          bondDelta = BOND_PER_VISIT;
          happyDelta = 6;
          member.lastSpentAge = character.age;
          text = `${roleBangla} ${member.name}-রে নিয়া নাজিরাবাজারের নান্নার বিরিয়ানিতে গেলা। গরম কাচ্চি আর বোরহানি খাইয়া দিলটা ঠাণ্ডা হইয়া গেল! (+৮ খাতির, +৬ সুখ)`;
          break;
        }
        case 'chitchat': {
          bondDelta = 3;
          happyDelta = 4;
          const topics = [
            `টং দোকানে বইসা লাল চা আর টোস্ট বিস্কুট খাইতে খাইতে পাড়ার নানা কিচ্ছা-কাহিনী নিয়া জমজমাট আড্ডা মারলা।`,
            `পুরান ঢাকার সাকরাইন আর শবে বরাতের হালুয়া রুটির স্মৃতি নিয়া মেলা কথা হইল। দিলটা হালকা লাগল!`,
            `মহল্লার কার ঘরে কী হইল, কার পোলা কার লগে ঘুরল — এই নিয়া জম্পেশ গসিপ চলল।`,
          ];
          text = `${roleBangla} ${member.name}-এর লগে আড্ডা: ${rng.pick(topics)} (+৩ খাতির, +৪ সুখ)`;
          break;
        }
        case 'compliment': {
          bondDelta = 4;
          happyDelta = 3;
          const praises = [
            `'আপনের মতো দিলদরিয়া মানুষ পুরা পুরান ঢাকায় আর একটাও পাইবা না!'`,
            `'আপনের চেহারা আর স্বভাব দেইখা সবাই কয় আপনে সাক্ষাৎ নবাবের বংশধর!'`,
            `'আপনের হাতের রান্নার কাছে তো স্টার হোটেলের বাবুর্চিও ফেইল!'`,
          ];
          text = `${roleBangla} ${member.name}-রে মাখন মারলা: ${rng.pick(praises)} উনি খুশিতে বাকবাকুম হইয়া গেলেন! (+৪ খাতির)`;
          break;
        }
        case 'ask_money': {
          if (member.bond >= 40) {
            const amount = rng.pick([100, 200, 300, 500]);
            moneyDelta = amount;
            happyDelta = 4;
            bondDelta = -2;
            text = `${roleBangla} ${member.name}-এর কাছে হাত পাতলা। উনি পকেট থেইকা ৳${amount} বাইর কইরা দিলেন: 'এই নে, রাখ। ফালতু চুদুর বুদুর করবি না কইলাম!' (+৳${amount})`;
          } else {
            ok = false;
            happyDelta = -5;
            bondDelta = -3;
            text = `${roleBangla} ${member.name} চোখ গরম কইরা ধমক দিলেন: 'কামকাজের মুরোদ নাই, খালি ট্যাকা ধার চাইতে আইছত! বের হ চোখের সামনে থেইকা!' (-৫ সুখ)`;
          }
          break;
        }
        case 'gift': {
          const cost = 200;
          if (character.money < cost) {
            return { ok: false, message: `পকেটে ফুটো পয়সাও নাই (৳${cost} দরকার)! উপহার দিবা কেমনে?` };
          }
          moneyDelta = -cost;
          bondDelta = 10;
          happyDelta = 5;
          const giftItems = [
            'চকবাজারের খাঁটি জাফরানি মিষ্টি আর বাকরখানি',
            'নবাববাড়ির সুগন্ধি আতর আর সুরমা',
            'পাতলা রেশমি শাল আর সুরমাদানি',
          ];
          text = `${roleBangla} ${member.name}-রে ${rng.pick(giftItems)} উপহার দিলা। উনি বেজায় খুশি হইয়া মাথায় হাত বুলাইয়া দোয়া দিলেন! (+১০ খাতির, −৳${cost})`;
          break;
        }
      }

      const nextBond = Math.max(0, Math.min(BOND_MAX, member.bond + bondDelta));
      const members = tree.members.map((m) =>
        m.id === memberId ? { ...m, bond: nextBond, lastSpentAge: member.lastSpentAge } : m,
      );

      character.stats.happiness = Math.max(0, Math.min(100, character.stats.happiness + happyDelta));
      character.money = Math.max(0, character.money + moneyDelta);

      const relation = ROLE_TO_RELATION[member.role];
      if (relation) {
        const rel = character.relationships.find((r) => r.relation === relation && r.name === member.name);
        if (rel) rel.meter = nextBond;
      }

      character.history.push({
        age: character.age,
        text,
        tone: ok ? 'good' : 'neutral',
      });

      set({
        character,
        familyTree: { ...tree, members },
        rngState: rng.getState(),
        message: text,
      });

      persist();
      return { ok, message: text };
    },

    enrollHigherEducation(path) {
      return runIdleAction((character, rng) => {
        const out = enterHigherEducation(character, rng, path);
        return { ok: out.accepted, text: out.text };
      });
    },

    applyForJob(jobId) {
      return runIdleAction((character, rng) => {
        const out = applyForJob(character, rng, jobId);
        return { ok: out.hired, text: out.text };
      });
    },

    quitJob() {
      return runIdleAction((character) => {
        const out = quitJob(character);
        return { ok: out.quit, text: out.text };
      });
    },

    commitCrime(crimeId) {
      return runIdleAction((character, rng) => {
        const out = commitCrime(character, rng, crimeId);
        return { ok: true, text: out.text };
      });
    },

    bailOut() {
      return runIdleAction((character) => {
        const out = prisonBail(character);
        return { ok: out.ok, text: out.text };
      });
    },

    prisonGym() {
      return runIdleAction((character) => {
        const out = prisonGym(character);
        return { ok: out.ok, text: out.text };
      });
    },

    prisonLibrary() {
      return runIdleAction((character) => {
        const out = prisonLibrary(character);
        return { ok: out.ok, text: out.text };
      });
    },

    prisonFight() {
      return runIdleAction((character, rng) => {
        const out = prisonFight(character, rng);
        return { ok: out.ok, text: out.text };
      });
    },

    prisonGoodBehavior() {
      return runIdleAction((character, rng) => {
        const out = prisonGoodBehavior(character, rng);
        return { ok: out.ok, text: out.text };
      });
    },

    prisonEscape() {
      return runIdleAction((character, rng) => {
        const out = prisonEscape(character, rng);
        return { ok: out.ok, text: out.text };
      });
    },

    buyAsset(kind, options) {
      return runIdleAction((character, rng) => {
        const out = buyAsset(character, rng, kind, options);
        return { ok: out.bought, text: out.text };
      });
    },

    sellAsset(assetId) {
      return runIdleAction((character, rng) => {
        const out = sellAsset(character, rng, assetId);
        return { ok: out.sold, text: out.text };
      });
    },

    visitDoctor() {
      return runIdleAction((character) => {
        const out = visitDoctor(character);
        return { ok: true, text: out.text };
      });
    },

    getDatingCandidates() {
      const s = get();
      if (!s.character || !s.character.alive) return [];
      const rng = makeRng(s.seed, s.rngState);
      return generateDatingPool(s.character, rng);
    },

    askOut(candidate) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = askOutCandidate(character, candidate, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    makeOfficial(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = makeOfficialPartner(character, relationshipId, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    propose(relationshipId, style = 'kazi_office') {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const familyTree = s.familyTree ? structuredClone(s.familyTree) : null;
      const result = proposeMarriage(character, familyTree, relationshipId, rng, style);
      if (result.ok) consumeBudget(character);

      set({
        character,
        familyTree,
        rngState: rng.getState(),
        message: result.text,
        pendingSting: result.ok ? 'wedding' : null,
        stingToken: result.ok ? s.stingToken + 1 : s.stingToken,
        error: null,
      });
      persist();
      return result.ok;
    },

    cheat(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = cheatBranch(character, relationshipId, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    breakupOrDivorce(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const familyTree = s.familyTree ? structuredClone(s.familyTree) : null;
      const result = breakupOrDivorce(character, familyTree, relationshipId, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        familyTree,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    datePartner(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = dateCandidateOrPartner(character, relationshipId, rng);
      if (result.ok) consumeBudget(character);
      if (result.ok) {
        const rel = character.relationships.find((r) => r.id === relationshipId);
        if (rel) rel.lastMetAge = character.age;
      }

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    giveGift(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = giveGiftToPartner(character, relationshipId, rng);
      if (result.ok) consumeBudget(character);
      if (result.ok) {
        const rel = character.relationships.find((r) => r.id === relationshipId);
        if (rel) rel.lastMetAge = character.age;
      }

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    haveBaby(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const familyTree = s.familyTree ? structuredClone(s.familyTree) : null;
      const result = tryForBaby(character, familyTree, relationshipId, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        familyTree,
        rngState: rng.getState(),
        message: result.text,
        pendingSting: result.ok ? 'birth' : null,
        stingToken: result.ok ? s.stingToken + 1 : s.stingToken,
        error: null,
      });
      persist();
      return result.ok;
    },

    studyHarder() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const character = structuredClone(s.character);
      const result = studyHarder(character);
      if (result.ok) consumeBudget(character);

      set({
        character,
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    hireTutor() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const character = structuredClone(s.character);
      const result = hireTutor(character);
      if (result.ok) consumeBudget(character);

      set({
        character,
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    dropOutOfSchool() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const character = structuredClone(s.character);
      const result = dropOutOfSchool(character);
      if (result.ok) consumeBudget(character);

      set({
        character,
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    skipClass() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = skipClass(character, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    joinDebateClub() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = joinDebateClub(character, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    workOvertime() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const character = structuredClone(s.character);
      const result = workOvertime(character);
      if (result.ok) consumeBudget(character);

      set({
        character,
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    suckUpToBoss() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = suckUpToBoss(character, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    askForRaise() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;
      if (!assertBudgetAvailable()) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = askForRaise(character, rng);
      if (result.ok) consumeBudget(character);

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    interactWithPerson(relationshipId, action) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      let result: RelationshipActionResult;

      switch (action) {
        case 'spend_time':
          result = spendTimeWithPerson(character, relationshipId, rng);
          break;
        case 'chat':
          result = chatWithPerson(character, relationshipId, rng);
          break;
        case 'compliment':
          result = complimentPerson(character, relationshipId, rng);
          break;
        case 'insult':
          result = insultPerson(character, relationshipId, rng);
          break;
        case 'ask_money':
          result = askMoneyFromPerson(character, relationshipId, rng);
          break;
        case 'gift':
          result = giveGiftToPerson(character, relationshipId, rng);
          break;
        case 'call_ex': {
          const out = callOrTextEx(character, relationshipId, rng);
          result = { ok: out.ok, text: out.text, tone: 'neutral' };
          break;
        }
        case 'hookup_ex': {
          const out = hookupWithEx(character, relationshipId, rng);
          result = { ok: out.ok, text: out.text, tone: 'neutral' };
          break;
        }
        case 'reunite_ex': {
          const out = begGetBackTogether(character, relationshipId, rng);
          result = { ok: out.ok, text: out.text, tone: out.ok ? 'good' : 'bad' };
          break;
        }
        case 'praise_child':
          result = praiseChild(character, relationshipId, rng);
          break;
        case 'child_treat':
          result = buyChildTreat(character, relationshipId, rng);
          break;
        case 'discipline_child':
          result = disciplineChild(character, relationshipId, rng);
          break;
        case 'child_allowance':
          result = giveChildAllowance(character, relationshipId, rng);
          break;
        case 'befriend':
          result = befriendPeer(character, relationshipId, rng);
          break;
        case 'ask_out_peer':
          result = askOutPeer(character, relationshipId, rng);
          break;
        default:
          return false;
      }

      if (result.ok) {
        const rel = character.relationships.find((r) => r.id === relationshipId);
        if (rel) rel.lastMetAge = character.age;
      }

      set({
        character,
        rngState: rng.getState(),
        message: result.text,
        error: null,
      });
      persist();
      return result.ok;
    },

    callEx(relationshipId) {
      return get().interactWithPerson(relationshipId, 'call_ex');
    },

    hookupEx(relationshipId) {
      return get().interactWithPerson(relationshipId, 'hookup_ex');
    },

    reuniteEx(relationshipId) {
      return get().interactWithPerson(relationshipId, 'reunite_ex');
    },

    insultEx(relationshipId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const out = insultEx(character, relationshipId, rng);
      set({
        character,
        rngState: rng.getState(),
        message: out.text,
        error: null,
      });
      persist();
      return out.ok;
    },

    visitKabiraj() {
      return runIdleAction((character, rng) => {
        const cost = 100;
        if (character.money < cost) {
          return { ok: false, text: `কবিরাজি দাওয়াই নেওয়ার মতো ৳${cost} পকেটে নাই!` };
        }
        character.money -= cost;
        const heal = rng.rangeInt(10, 22);
        character.stats.health = Math.min(100, character.stats.health + heal);
        character.stats.happiness = Math.min(100, character.stats.happiness + 6);
        const text = `চকবাজারের নামকরা কবিরাজ সাবের কাছে গেলা। ঝাঁড়ফুক দিয়া খাঁটি তুলসী পাতা আর মধু মাখা গাছের শিকড় খাওয়াইয়া দিলো। শরীর চাঙ্গা হইলো! (+${heal} স্বাস্থ্য, −৳${cost})`;
        return { ok: true, text, tone: 'good' };
      }, { leisure: true });
    },

    doGymWorkout() {
      return runIdleAction((character, rng) => {
        const cost = 150;
        if (character.money < cost) {
          return { ok: false, text: `জিম বা আখড়ায় ভর্তি হওয়ার মতো ৳${cost} পকেটে নাই!` };
        }
        character.money -= cost;
        const healthGain = rng.rangeInt(6, 12);
        const looksGain = rng.rangeInt(4, 8);
        character.stats.health = Math.min(100, character.stats.health + healthGain);
        character.stats.looks = Math.min(100, character.stats.looks + looksGain);
        character.stats.happiness = Math.min(100, character.stats.happiness + 5);
        const text = `আর্মানিটোলার সনাতন আখড়ায় ও জিমে গিয়া ডাম্বেল আর বুক ডন মারলা! মাসল ফুললো, চর্বি ঝইড়া চেহারা খোলতাই হইলো! (+${healthGain} স্বাস্থ্য, +${looksGain} চেহারা, −৳${cost})`;
        return { ok: true, text, tone: 'good' };
      }, { leisure: true });
    },

    watchMovie() {
      return runIdleAction((character) => {
        const cost = 250;
        if (character.money < cost) {
          return { ok: false, text: `সিনেমার টিকিট কাটার মতো ৳${cost} পকেটে নাই!` };
        }
        character.money -= cost;
        character.stats.happiness = Math.min(100, character.stats.happiness + 16);
        const text = `মধুমিতা সিনেমা হলে গিয়া টিকিটের লগে গরম পপকর্ন নিয়া ফুল অ্যাকশন সিনেমা দেখলা! হলের দর্শকদের শিষ আর তালির লগে মনটা পুরাই ফুরফুরে হইয়া গেল! (+১৬ সুখ, −৳${cost})`;
        return { ok: true, text, tone: 'good' };
      }, { leisure: true });
    },

    prayOrWorship() {
      return runIdleAction((character, rng) => {
        const isMuslim = character.religion === 'islam';
        const karmaGain = rng.rangeInt(10, 18);
        const happyGain = rng.rangeInt(8, 14);
        character.reputation.karma = Math.min(100, character.reputation.karma + karmaGain);
        character.stats.happiness = Math.min(100, character.stats.happiness + happyGain);

        const text = isMuslim
          ? `তারা মসজিদে গিয়া খুশুখুজুর লগে নামাজ আদায় করলা এবং দেশ ও পরিবারের জন্য খাস দোয়া করলা। অন্তরে স্বর্গীয় প্রশান্তি নেমে আসলো! (+${karmaGain} কর্ম, +${happyGain} সুখ)`
          : `ঢাকেশ্বরী জাতীয় মন্দিরে গিয়া দেবীর চরণে মাথা ঠেকাইয়া প্রণাম করলা ও পুষ্পাঞ্জলি দিলা। অন্তরে গভীর আত্মিক শান্তি পাইলা! (+${karmaGain} কর্ম, +${happyGain} সুখ)`;
        return { ok: true, text, tone: 'good' };
      });
    },

    doSideHustle(kind) {
      return runIdleAction((character, rng) => {
        let earned = 0;
        let text = '';
        if (kind === 'tuition') {
          if (character.stats.smarts < 40) {
            return { ok: false, text: 'নিজেরই পড়াশোনার ঠিক নাই, অন্যেরে টিউশনি পড়াইবা কেমনে?' };
          }
          earned = rng.rangeInt(400, 1200);
          character.money += earned;
          character.stats.smarts = Math.min(100, character.stats.smarts + 2);
          text = `পাড়ার এক বড়লোকের পোলারে অংক আর ইংরেজি টিউশনি পড়াইয়া নগদ ৳${earned} পকেটে ভরলা! (+৳${earned}, +বুদ্ধি)`;
        } else if (kind === 'delivery') {
          earned = rng.rangeInt(300, 800);
          character.money += earned;
          character.stats.health = Math.max(1, character.stats.health - 3);
          text = `পুরান ঢাকার অলিগলিতে সাইকেল নিয়া ফুড ও পার্সেল ডেলিভারি দিলা। রোদ-বৃষ্টিতে খাটাখাটুনি কইরা ৳${earned} কামাই করলা! (+৳${earned})`;
        } else {
          earned = rng.rangeInt(350, 950);
          character.money += earned;
          text = `চকবাজারের মোড়ে ভ্যানে কইরা বাকরখানি আর ঝালমুড়ি বেইচা ভালোই লাভ হইলো! নগদ ৳${earned} লাভ করলা! (+৳${earned})`;
        }
        return { ok: true, text, tone: 'good' };
      }, { leisure: true });
    },

    exportToJson() {
      const s = get();
      if (!s.character) return null;
      return exportSave(toSaveState(s, s.character));
    },

    importFromRaw(raw) {
      try {
        const save = importSave(raw);
        set({
          character: save.character,
          seed: save.seed,
          rngState: save.rngState,
          pendingEvents: save.pendingEvents ?? [],
          currentEventIndex: save.currentEventIndex ?? 0,
          savedAt: save.savedAt,
          lastOutcomeTone: null,
          pendingSting: null,
          stingToken: 0,
          familyTree: save.familyTree ?? null,
          message: 'Save imported.',
          error: null,
        });
        persist();
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'The save file could not be read.';
        set({ error: message });
        return false;
      }
    },

    continueAsHeir(heirId) {
      const s = get();
      if (!s.character || s.character.alive) return false;
      const tree = s.familyTree;
      if (!tree) return false;
      const heirs = eligibleHeirs(s.character, tree);
      const heir = heirs.find((h) => h.id === heirId);
      if (!heir) return false;

      const rng = makeRng(s.seed, s.rngState);
      const parent = s.character;
      const heirCharacter = createHeirCharacter(parent, heir, heirs.length, rng);
      const familyTree = buildHeirFamilyTree(tree, heirCharacter);
      const heirSeed = nextLifeSeed(rng);

      set({
        character: heirCharacter,
        seed: heirSeed,
        rngState: heirSeed >>> 0,
        pendingEvents: [],
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: null,
        stingToken: s.stingToken + 1,
        familyTree,
        message: `You carry on as ${heirCharacter.name} ${heirCharacter.surname}, ${heir.age} years young.`,
        error: null,
      });
      persist();
      return true;
    },

    setPaused(isPaused) {
      set({ isPaused });
      soundManager.duckMusic(isPaused);
    },

    togglePause() {
      const isPaused = !get().isPaused;
      set({ isPaused });
      soundManager.duckMusic(isPaused);
    },

    resetGame() {
      localStorageStorage.clear();
      soundManager.duckMusic(false);
      set({ ...initialState, isHydrated: get().isHydrated });
    },
  };
});

if (typeof window !== 'undefined') {
  (window as unknown as { __JNK_GAME_STORE__?: unknown }).__JNK_GAME_STORE__ = useGameStore;
}