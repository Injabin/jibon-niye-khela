import { create } from 'zustand';
import { ageUp, checkForDeath } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import { BOND_MAX, BOND_PER_VISIT, ageFamilyMembers, birthChild, generateFamilyTree } from '@/lib/engine/family';
import type { FamilyTree, FamilyRole } from '@/lib/engine/family';
import { buildHeirFamilyTree, createHeirCharacter, eligibleHeirs, nextLifeSeed } from '@/lib/engine/legacy';
import { buyAsset, sellAsset } from '@/lib/engine/events/categories/assets';
import { applyForJob, quitJob } from '@/lib/engine/events/categories/career';
import { commitCrime } from '@/lib/engine/events/categories/crime';
import { enterHigherEducation } from '@/lib/engine/events/categories/education';
import { visitDoctor } from '@/lib/engine/events/categories/health';
import { RNG } from '@/lib/engine/rng';
import type { AssetKind, Character, LifeEventDef, MilestoneKind, Relation, Tone } from '@/lib/engine/types';
import { achievementsStore } from '@/lib/store/achievementsStore';
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
}

export interface GameStoreActions {
  /** Restore a save from storage once per page load. */
  hydrate(): void;
  /** Start a new life; an explicit seed is honoured (tests). Returns the seed used. */
  newGame(seed?: number): number;
  /** Advance one year. No-op while a choice is pending or after death. */
  ageUp(): boolean;
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
  /** Export the current game as a formatted JSON string; null when no character exists. */
  exportToJson(): string | null;
  /** Import a raw save file. Returned boolean is success; sets `error`/`message` accordingly. */
  importFromRaw(raw: string): boolean;
  /** Wipe storage and all in-memory state. */
  resetGame(): void;
  /**
   * Legacy mode (init.md M5 #4): continue as a child who has come of age after
   * this life ended. Returns false when the life is not over, the family tree
   * is missing, or the heir is not an eligible child. On success the character
   * and family tree are replaced and the archive flows through persist().
   */
  continueAsHeir(heirId: string): boolean;
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
};

function toSaveState(s: GameStoreState, character: Character): SaveState {
  return defaultSaveState(s.seed, s.rngState, character, s.pendingEvents, s.currentEventIndex, s.familyTree);
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
    op: (character: Character, rng: RNG) => { ok: boolean; text: string },
  ): boolean {
    const s = get();
    if (!s.character || !s.character.alive) return false;
    if (s.pendingEvents.length > 0) return false;

    const rng = makeRng(s.seed, s.rngState);
    const character = structuredClone(s.character);
    const result = op(character, rng);

    set({ character, rngState: rng.getState(), message: result.text, error: null });
    persist();
    return result.ok;
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
        message: 'A new life begins…',
        error: null,
      });
      persist();
      return seed;
    },

    ageUp() {
      const s = get();
      if (!s.character || !s.character.alive) return false;
      if (s.pendingEvents.length > 0) return false;

      const rng = makeRng(s.seed, s.rngState);
      const character = structuredClone(s.character);
      const result = ageUp(character, rng);

      if (!result.character.alive) {
        achievementsStore.getState().recordLife(result.character);
      }

      const familyTree =
        s.familyTree && result.character.alive
          ? ageFamilyMembers(s.familyTree, result.character.age)
          : s.familyTree;

      set({
        character: result.character,
        rngState: rng.getState(),
        pendingEvents: [...result.firedEvents],
        currentEventIndex: 0,
        lastOutcomeTone: null,
        pendingSting: result.character.alive ? null : 'tombstone',
        stingToken: result.character.alive ? s.stingToken : s.stingToken + 1,
        message: null,
        error: null,
        familyTree,
      });
      persist();
      return true;
    },

    resolveCurrentChoice(choiceId) {
      const s = get();
      if (!s.character || !s.character.alive) return false;
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

    resetGame() {
      localStorageStorage.clear();
      set({ ...initialState, isHydrated: get().isHydrated });
    },
  };
});

if (typeof window !== 'undefined') {
  (window as unknown as { __JNK_GAME_STORE__?: unknown }).__JNK_GAME_STORE__ = useGameStore;
}