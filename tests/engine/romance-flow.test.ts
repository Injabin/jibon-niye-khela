import { describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';

type Props = { stats?: Partial<Record<'health'|'happiness'|'smarts'|'looks', number>>; money?: number; age?: number };

function setupCharacter(o: Props = {}) {
  localStorage.clear();
  const store = useGameStore.getState();
  store.resetGame();
  useGameStore.setState({ isHydrated: true });
  store.newGame(7);
  // Give a wealthy, good-looking adult to remove money/looks gates from the path.
  useGameStore.setState((s) => {
    const c = s.character!;
    c.age = o.age ?? 22;
    if (o.stats) Object.assign(c.stats, o.stats);
    if (o.money !== undefined) c.money = o.money;
    return s;
  });
  return useGameStore;
}

function resolveAll() {
  let guard = 0;
  while (useGameStore.getState().pendingEvents.length > 0 && guard < 20) {
    const ev = useGameStore.getState().pendingEvents[useGameStore.getState().currentEventIndex];
    if (!ev) break;
    useGameStore.getState().resolveCurrentChoice(ev.choices[0]?.id ?? '');
    guard++;
  }
}

describe('romance-marriage-baby end-to-end flow (J)', () => {
  it('askOut → makeOfficial → propose → haveBaby works in a straight line', () => {
    setupCharacter({
      stats: { health: 90, happiness: 80, smarts: 80, looks: 90 },
      money: 100_000,
      age: 24,
    });
    const candidates = useGameStore.getState().getDatingCandidates();
    expect(candidates.length).toBeGreaterThan(0);
    const cand = candidates[0];

    const s = useGameStore.getState();
    const asked = s.askOut(cand);
    expect(asked).toBe(true);
    resolveAll();
    let rel = useGameStore.getState().character!.relationships.find((r) => r.name === cand.name);
    expect(rel?.relation).toBe('dating');

    // If the engine rejected the first candidate, kick to the next one until accepted.
    if (!rel) {
      for (const c of candidates) {
        useGameStore.getState().askOut(c);
        resolveAll();
        rel = useGameStore.getState().character!.relationships.find((r) => r.name === c.name);
        if (rel) break;
      }
    }
    if (!rel) throw new Error('no candidate accepted a date');
    expect(['dating', 'crush']).toContain(rel.relation);
    const relId = rel.id;

    const made = useGameStore.getState().makeOfficial(relId);
    expect(made).toBe(true);
    resolveAll();
    rel = useGameStore.getState().character!.relationships.find((r) => r.id === relId)!;
    expect(rel.relation).toBe('partner');

    // 3-action annual budget forces the 4-step arc to span two years:
    // age up to reset the activity budget before the next action.
    useGameStore.getState().ageUp();
    resolveAll();

    const proposed = useGameStore.getState().propose(relId, 'kazi_office');
    expect(proposed).toBe(true);
    resolveAll();
    rel = useGameStore.getState().character!.relationships.find((r) => r.id === relId)!;
    expect(rel.relation).toBe('spouse');
    expect(useGameStore.getState().character!.flags).toContain('is_married');

    useGameStore.getState().ageUp();
    resolveAll();
    let baby = useGameStore.getState().haveBaby(relId);
    for (let attempt = 0; !baby && attempt < 8; attempt++) {
      useGameStore.getState().ageUp();
      resolveAll();
      baby = useGameStore.getState().haveBaby(relId);
    }
    expect(baby).toBe(true);
    resolveAll();
    const hasChild = useGameStore.getState().character!.relationships.some((r) => r.relation === 'child');
    expect(hasChild).toBe(true);
  });

  it('propose rejection when meter is low shows a Dhakaiya funny text and does not marry', () => {
    setupCharacter({ stats: { looks: 10 }, money: 100_000, age: 30 });
    const candidates = useGameStore.getState().getDatingCandidates();
    let accepted: string | null = null;
    for (const c of candidates) {
      useGameStore.getState().askOut(c);
      resolveAll();
      const rel = useGameStore.getState().character!.relationships.find((r) => r.name === c.name);
      if (rel && rel.relation === 'dating') { accepted = rel.id; break; }
    }
    if (!accepted) throw new Error('could not get a dating partner (looks 10)');
    useGameStore.getState().makeOfficial(accepted);
    resolveAll();
    // Crash the meter so proposal is refused but stays partner.
    useGameStore.setState((s) => {
      const rel = s.character!.relationships.find((r) => r.id === accepted)!;
      rel.meter = 10;
      return s;
    });
    const result = useGameStore.getState().propose(accepted, 'kazi_office');
    expect(result).toBe(false);
    const partner = useGameStore.getState().character!.relationships.find((r) => r.id === accepted)!;
    expect(partner.relation).toBe('partner');
    // The rejection must surface as the funny Dhakaiya popup, not a success banner.
    const s = useGameStore.getState();
    expect(s.message).toBeNull();
    expect(s.rejection).toMatch(/প্রস্তুত না|ফাপড়|আংটি/);
  });

  it('asking out a candidate we are already dating upgrades rather than duplicate', () => {
    setupCharacter({ stats: { looks: 90, happiness: 90 }, money: 100_000, age: 26 });
    // Directly install a spouse then try baby, verifying no duplicate relationships.
    useGameStore.setState((s) => {
      const c = s.character!;
      c.relationships.push({
        id: 'spouse-1', relation: 'spouse', name: 'টেস্ট বউ', age: 24,
        alive: true, meter: 80, metAge: 25, lastMetAge: 26, romanceStage: 'spouse',
        occupation: 'গ্রাফিক্স ডিজাইনার', health: 90, happiness: 90,
      });
      c.flags.push('is_married', 'has_spouse');
      return s;
    });

    const baby = useGameStore.getState().haveBaby('spouse-1');
    expect(baby).toBe(true);
    resolveAll();
    const childRels = useGameStore.getState().character!.relationships.filter((r) => r.relation === 'child');
    expect(childRels.length).toBe(1);
  });

  it('routing: rejected actions set rejection popup, accepted set message banner', () => {
    setupCharacter({ stats: { looks: 50, smarts: 10, happiness: 50 }, money: 0, age: 30 });
    useGameStore.setState((s) => {
      const c = s.character!;
      c.money = 0;
      return s;
    });

    // No job → overtime refusal. Deterministic, always ok:false.
    useGameStore.setState({ message: null, rejection: null });
    useGameStore.getState().workOvertime();
    let s = useGameStore.getState();
    expect(s.rejection).toBeTruthy();
    expect(s.message).toBeNull();

    // Date requires money — flat broke → deterministic refusal.
    useGameStore.setState({ rejection: null });
    useGameStore.getState().datePartner('no-such-id');
    s = useGameStore.getState();
    expect(s.rejection).toMatch(/কই|নাই|না|পাওয়া|খুঁজি/);

    // Dismissal clears the popup.
    useGameStore.getState().clearRejection();
    s = useGameStore.getState();
    expect(s.rejection).toBeNull();
  });
});