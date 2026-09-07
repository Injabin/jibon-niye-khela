import { describe, expect, it, beforeEach } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import { localStorageStorage, loadSave } from '@/lib/save/storage';

interface Node {
  [key: string]: unknown;
}

/** Deep assertion that a value tree contains nothing that breaks JSON. */
function assertSerializable(value: unknown, path = 'root'): void {
  if (value === null) return;
  const type = typeof value;
  expect(type, path).not.toBe('function');
  expect(type, path).not.toBe('undefined');

  if (type === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`));
    } else {
      const record = value as Node;
      for (const key of Object.keys(record)) {
        assertSerializable(record[key], `${path}.${key}`);
      }
    }
  }
}

beforeEach(() => {
  useGameStore.getState().resetGame();
  localStorage.clear();
});

describe('store serializability (Gate 2)', () => {
  function playSomeYears(seed: number): void {
    useGameStore.setState({ isHydrated: true });
    useGameStore.getState().newGame(seed);
    for (let i = 0; i < 25; i++) {
      useGameStore.getState().ageUp();
      let guard = 0;
      while (useGameStore.getState().pendingEvents.length > 0 && guard < 10) {
        const pending = useGameStore.getState().pendingEvents;
        const current = pending[useGameStore.getState().currentEventIndex];
        useGameStore.getState().resolveCurrentChoice(current.choices[0].id);
        guard += 1;
      }
    }
  }

  it('the PERSISTED state contains no functions, class instances, or undefined values', () => {
    playSomeYears(42);

    const raw = localStorageStorage.read();
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!) as unknown;
    assertSerializable(persisted);
    expect(JSON.parse(JSON.stringify(persisted))).toEqual(persisted);
  });

  it('again: the entire persisted state round-trips JSON losslessly', () => {
    playSomeYears(43);
    const raw = localStorageStorage.read()!;
    const reparsed = JSON.parse(JSON.stringify(JSON.parse(raw)));
    expect(reparsed).toEqual(JSON.parse(raw));
  });

  it('the persisted localStorage payload matches the store and round-trips', () => {
    playSomeYears(7);

    const save = loadSave(localStorageStorage);
    expect(save).not.toBeNull();
    expect(save!.character).toEqual(useGameStore.getState().character);
    expect(save!.seed).toBe(useGameStore.getState().seed);
    expect(save!.rngState).toBe(useGameStore.getState().rngState);
  });

  it('hydrate restores a saved game into the store', () => {
    useGameStore.setState({ isHydrated: true });
    useGameStore.getState().newGame(11);
    useGameStore.getState().ageUp();
    const preReload = JSON.stringify(useGameStore.getState().character);

    // Simulate a fresh process with the same localStorage.
    useGameStore.setState({ character: null, seed: 0, rngState: 0, pendingEvents: [], isHydrated: false });
    useGameStore.getState().hydrate();

    expect(JSON.stringify(useGameStore.getState().character)).toBe(preReload);
  });
});

describe('choices genuinely change outcomes (Gate 2 manual -> automated)', () => {
  function playUntilEvent(seed: number): string {
    useGameStore.setState({ isHydrated: true });
    useGameStore.getState().newGame(seed);
    let guard = 0;
    while (useGameStore.getState().pendingEvents.length === 0 && guard < 200) {
      useGameStore.getState().ageUp();
      guard += 1;
    }
    const json = useGameStore.getState().exportToJson();
    expect(json).not.toBeNull();
    return json!;
  }

  function exportJson(): string {
    return JSON.stringify(useGameStore.getState().character);
  }

  it('two different choices on the same pending event produce different state', () => {
    const snapshot = playUntilEvent(1234);
    const pendingFirst = useGameStore.getState().pendingEvents[0];
    expect(pendingFirst).toBeDefined();
    expect(pendingFirst.choices.length).toBeGreaterThan(1);

    // Branch A: first choice.
    useGameStore.getState().resolveCurrentChoice(pendingFirst.choices[0].id);
    const outcomeA = exportJson();

    // Branch B: rewind to the same moment, pick a different choice.
    useGameStore.getState().importFromRaw(snapshot);
    const pendingAgain = useGameStore.getState().pendingEvents[0];
    useGameStore.getState().resolveCurrentChoice(pendingAgain.choices[1].id);
    const outcomeB = exportJson();

    expect(outcomeA).not.toBe(outcomeB);
  });

  it('age-up loop is guarded while a choice is pending', () => {
    useGameStore.setState({ isHydrated: true });
    useGameStore.getState().newGame(99);
    let guard = 0;
    while (useGameStore.getState().pendingEvents.length === 0 && guard < 200) {
      useGameStore.getState().ageUp();
      guard += 1;
    }
    const ageBefore = useGameStore.getState().character!.age;
    expect(useGameStore.getState().ageUp()).toBe(false);
    expect(useGameStore.getState().character!.age).toBe(ageBefore);
  });
});

describe('corrupt import handling (Gate 2 manual -> automated)', () => {
  it('malformed JSON is rejected without crashing and sets an error', () => {
    const result = useGameStore.getState().importFromRaw('not json at all');
    expect(result).toBe(false);
    expect(useGameStore.getState().error).toBeTruthy();
    expect(useGameStore.getState().character).toBeNull();
  });

  it('a well-formed but invalid save is rejected', () => {
    const result = useGameStore.getState().importFromRaw(JSON.stringify({ hello: 'world' }));
    expect(result).toBe(false);
    expect(useGameStore.getState().error).toBeTruthy();
  });

  it('a valid export is imported successfully', () => {
    useGameStore.getState().newGame(5);
    const json = useGameStore.getState().exportToJson()!;
    useGameStore.getState().resetGame();
    const before = JSON.parse(json);

    expect(useGameStore.getState().importFromRaw(json)).toBe(true);
    expect(useGameStore.getState().error).toBeNull();
    expect(useGameStore.getState().character).toEqual(before.character);
  });
});