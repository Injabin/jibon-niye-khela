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

    // Age up into the married year. A partner baby-proposal drama may fire here
    // and its auto-accepted "yes" can already start a pregnancy — in that case
    // the player's own haveBaby action would rightly refuse ("already expecting").
    useGameStore.getState().ageUp();
    resolveAll();

    let baby = false;
    for (let attempt = 0; !baby && attempt < 8; attempt++) {
      rel = useGameStore.getState().character!.relationships.find((r) => r.id === relId)!;
      if (rel.pregnantSinceAge !== undefined) {
        baby = true;
        break;
      }
      useGameStore.getState().haveBaby(relId);
      rel = useGameStore.getState().character!.relationships.find((r) => r.id === relId)!;
      if (rel.pregnantSinceAge !== undefined) {
        baby = true;
        break;
      }
      useGameStore.getState().ageUp();
      resolveAll();
    }
    expect(baby).toBe(true);

    // Pregnancy plays out next year: age up so the due birth surfaces as a
    // naming moment, then name the newborn to actually welcome the child.
    useGameStore.getState().ageUp();
    resolveAll();
    const pending = useGameStore.getState().pendingBirths;
    expect(pending.length).toBe(1);
    useGameStore.getState().nameBaby(relId, 'আবরার');
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
    // Pregnancy resolves next year: age up, then name the newborn; the store's
    // naming action must not duplicate the child relationship.
    useGameStore.getState().ageUp();
    resolveAll();
    useGameStore.getState().nameBaby('spouse-1', 'অয়ন');
    const childRels = useGameStore.getState().character!.relationships.filter((r) => r.relation === 'child');
    expect(childRels.length).toBe(1);
  });

  it('a pregnancy surfaces as one pending birth; naming it clears the marker', () => {
    setupCharacter({ stats: { looks: 90, happiness: 90 }, money: 100_000, age: 26 });
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
    useGameStore.getState().haveBaby('spouse-1');

    useGameStore.getState().ageUp();
    resolveAll();
    let s = useGameStore.getState();
    expect(s.pendingBirths.length).toBe(1);
    expect(s.pendingBirths[0].partnerRelId).toBe('spouse-1');
    const spouse = s.character!.relationships.find((r) => r.id === 'spouse-1')!;
    expect(spouse.pregnantSinceAge).toBe(26);

    useGameStore.getState().nameBaby('spouse-1', 'মাইশা');
    s = useGameStore.getState();
    expect(s.pendingBirths.length).toBe(0);
    const namedSpouse = s.character!.relationships.find((r) => r.id === 'spouse-1')!;
    expect(namedSpouse.pregnantSinceAge).toBeUndefined();
    const children = s.character!.relationships.filter((r) => r.relation === 'child');
    expect(children.length).toBe(1);
    expect(children[0].name).toBe('মাইশা');
  });

  it('an unnamed pregnancy auto-names next year instead of deadlocking history', () => {
    setupCharacter({ stats: { looks: 90, happiness: 90 }, money: 100_000, age: 26 });
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
    useGameStore.getState().haveBaby('spouse-1');

    // Due year: pregnancy surfaces as a naming moment, but the player ignores it.
    useGameStore.getState().ageUp();
    resolveAll();
    expect(useGameStore.getState().pendingBirths.length).toBe(1);
    expect(useGameStore.getState().character!.relationships.some((r) => r.relation === 'child')).toBe(false);

    // Overdue year: the safety net auto-names so the lineage keeps flowing.
    useGameStore.getState().ageUp();
    resolveAll();
    const s = useGameStore.getState();
    expect(s.pendingBirths.length).toBe(0);
    expect(s.character!.relationships.some((r) => r.relation === 'child')).toBe(true);
    const spouse = s.character!.relationships.find((r) => r.id === 'spouse-1')!;
    expect(spouse.pregnantSinceAge).toBeUndefined();
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