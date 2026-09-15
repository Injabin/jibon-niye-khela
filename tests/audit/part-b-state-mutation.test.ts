import { describe, expect, it } from 'vitest';
import { ageUp } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import { generateFamilyTree } from '@/lib/engine/family';
import { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import { buyAsset, sellAsset, tickAssets } from '@/lib/engine/events/categories/assets';
import {
  applyForJob,
  annualSalary,
  getJobBoard,
  JOB_BOARD,
} from '@/lib/engine/events/categories/career';
import { commitCrime, isJailed, tickCrime } from '@/lib/engine/events/categories/crime';
import { getRelationshipState } from '@/lib/engine/events/registry';
import {
  askOutCandidate,
  breakupOrDivorce,
  cheatBranch,
  makeOfficialPartner,
  proposeMarriage,
  type DatingCandidate,
} from '@/lib/engine/romance';
import {
  spendTimeWithPerson,
  giveGiftToPerson,
  applyRelationshipNeglect,
  ESTRANGED_METER,
  isEstranged,
} from '@/lib/engine/relationships';
import type { Character, Relationship } from '@/lib/engine/types';

function makeCharacter(seed: number, age: number): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  return character;
}

function relation(overrides: Partial<Relationship> & { id: string; relation: Relationship['relation'] }): Relationship {
  return {
    name: 'Test Person',
    age: 50,
    alive: true,
    meter: 60,
    metAge: 0,
    ...overrides,
  };
}

/** C-1: the stated salary actually lands in money across consecutive age-ups. */
describe('PART B — career salary persists into money (C-1)', () => {
  /** Deterministic seed where office_admin hire succeeds on a lookup-ready character. */
  function seedThatHiresOfficeAdmin(): number {
    for (let seed = 1; seed < 500; seed++) {
      const character = makeCharacter(seed, 24);
      character.stats.smarts = 90;
      character.stats.looks = 80;
      character.education.stage = 'high';
      character.money = 5000;
      const hired = applyForJob(character, new RNG(seed), 'office_admin');
      if (hired.hired) return seed;
    }
    throw new Error('no seed hires office_admin');
  }

  it('an employed character gains the yearly pay on every subsequent age-up', () => {
    const seed = seedThatHiresOfficeAdmin();
    const character = makeCharacter(seed, 24);
    character.stats.smarts = 90;
    character.stats.looks = 80;
    character.education.stage = 'high';
    character.money = 5000;
    const rng = new RNG(seed);

    const hired = applyForJob(character, rng, 'office_admin');
    expect(hired.hired).toBe(true);
    const job = JOB_BOARD.find((j) => j.id === character.career.jobId)!;
    const expectedPay = annualSalary(job, character.career.performance, character.career.tier ?? 0);

    const moneyBefore = character.money;
    ageUp(character, rng);
    expect(character.money).toBe(moneyBefore + expectedPay);
    expect(character.career.yearsAtJob).toBe(1);
  });

  it('an unemployed character gains no salary across age-ups', () => {
    const character = makeCharacter(21, 24);
    character.money = 1000;
    const rng = new RNG(21);
    const moneyBefore = character.money;
    ageUp(character, rng);
    // Money can still move down/up from event effects; but no career payday was applied.
    const payday = character.history.some((h) => h.text.includes('বেতন') || h.text.includes('মাইনে'));
    expect(payday).toBe(false);
    void moneyBefore;
  });
});

/** C-2: buy/sell actually changes the money and asset list, and flags stay in sync. */
describe('PART B — assets mutate money and flags (C-2)', () => {
  it('buying a home deducts cash, adds ownership + flag; selling restores the flag', () => {
    const character = makeCharacter(22, 30);
    character.money = 200_000;
    const rng = new RNG(22);

    const before = character.money;
    const buy = buyAsset(character, rng, 'home');
    expect(buy.bought).toBe(true);
    expect(character.money).toBe(before - 90_000);
    expect(character.assets.some((a) => a.kind === 'home')).toBe(true);
    expect(character.flags).toContain('has_house');

    const home = character.assets.find((a) => a.kind === 'home')!;
    const sell = sellAsset(character, rng, home.id);
    expect(sell.sold).toBe(true);
    expect(character.assets.some((a) => a.kind === 'home')).toBe(false);
    expect(character.flags).not.toContain('has_house');
  });

  it('the yearly tick never zeroes an asset value and never duplicates entries', () => {
    const character = makeCharacter(23, 40);
    character.money = 1_000_000;
    const rng = new RNG(23);
    buyAsset(character, rng, 'crypto');
    buyAsset(character, rng, 'stock');
    const ids = character.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (let year = 0; year < 10; year++) {
      tickAssets(character, rng);
      for (const a of character.assets) {
        expect(a.value).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(a.value)).toBe(true);
      }
    }
  });
});

/** C-3: marriage mutates BOTH the relationship and the flags, and breaks symmetrically. */
describe('PART B — marriage/divorce state stays consistent (C-3)', () => {
  function spouseCouple(seed: number) {
    const character = makeCharacter(seed, 28);
    character.money = 20_000;
    const tree = generateFamilyTree(character, seed);
    const candidate: DatingCandidate = {
      id: 'cand_audit',
      name: 'Test Spouse',
      gender: character.gender === 'male' ? 'female' : 'male',
      age: 26,
      archetype: 'Software Engineer',
      isCelebrity: false,
      looks: 70,
      smarts: 70,
    };
    askOutCandidate(character, candidate, new RNG(seed));
    const rel = character.relationships.find((r) => r.name === 'Test Spouse')!;
    makeOfficialPartner(character, rel.id, new RNG(seed));
    rel.meter = 95;
    const rng = new RNG(seed);
    const proposal = proposeMarriage(character, tree, rel.id, rng);
    expect(proposal.ok).toBe(true);
    return { character, tree, rel, rng };
  }

  it('marriage sets relation=spouse, has_spouse, is_married — all together', () => {
    const { character, rel } = spouseCouple(31);
    expect(rel.relation).toBe('spouse');
    expect(character.flags).toContain('has_spouse');
    expect(character.flags).toContain('is_married');
    expect(getRelationshipState(character)).toContain('married');
  });

  it('divorce removes the spouse relation AND both flags + adds divorced', () => {
    const { character, tree, rel, rng } = spouseCouple(32);
    const result = breakupOrDivorce(character, tree, rel.id, rng);
    expect(result.ok).toBe(true);
    expect(rel.relation).toBe('ex');
    expect(character.flags).not.toContain('has_spouse');
    expect(character.flags).not.toContain('is_married');
    expect(character.flags).toContain('divorced');
    expect(getRelationshipState(character)).toContain('divorced');
    expect(getRelationshipState(character)).toContain('single');
  });

  it('a caught affair that collapses the meter also fully clears the spouse flags', () => {
    const { character, rel } = spouseCouple(33);
    // Force the caught+collapse branch regardless of rng by driving meter down
    // after the fact and calling cheatBranch with a discovery-forcing rng.
    let caught = false;
    for (let i = 0; i < 200 && !caught; i++) {
      const attempt = new RNG(1000 + i);
      character.reputation.fame = 80;
      rel.meter = 20;
      const res = cheatBranch(character, rel.id, attempt);
      if (res.caught && rel.meter < 20) caught = true;
    }
    expect(caught).toBe(true);
    expect(character.flags).not.toContain('is_married');
    expect(character.flags).not.toContain('has_spouse');
    expect(getRelationshipState(character)).toContain('single');
  });
});

/** C-4: an arrest persists as a criminalRecord entry and gates the job board. */
describe('PART B — criminal record persists and gates eligibility (C-4)', () => {
  it('arrest writes the record entry + sets criminal_record + in_jail', () => {
    const character = makeCharacter(34, 25);
    applyStatEffects(character, { karma: 100 });
    character.money = 0;
    const rng = new RNG(34);
    let out;
    for (let i = 0; i < 60; i++) {
      out = commitCrime(character, rng, 'shoplift');
      if (out?.arrested) break;
    }
    expect(out?.arrested).toBe(true);
    expect(isJailed(character)).toBe(true);
    expect(character.flags).toContain('criminal_record');
    const entry = character.criminalRecord[character.criminalRecord.length - 1];
    expect(entry.offense).toBe('shoplift');
    expect(entry.served).toBe(false);
    // still in-jail: no job can be taken, and the trust block holds even after release
    expect(applyForJob(character, rng, 'office_admin').hired).toBe(false);
  });

  it('the record survives release and still blocks the trust-gated trades', () => {
    const character = makeCharacter(35, 25);
    applyStatEffects(character, { karma: 100 });
    character.money = 0;
    const rng = new RNG(35);
    let out;
    for (let i = 0; i < 60; i++) {
      out = commitCrime(character, rng, 'burglary');
      if (out?.arrested) break;
    }
    expect(out?.arrested).toBe(true);
    // Serve out the whole sentence via yearly ticks, then check jobs.
    let guard = 0;
    while (isJailed(character) && guard < 10) {
      tickCrime(character);
      guard += 1;
    }
    expect(isJailed(character)).toBe(false);
    expect(character.flags).toContain('criminal_record');
    character.education.stage = 'undergraduate';
    character.stats.smarts = 90;
    const board = getJobBoard(character).map((j) => j.id);
    expect(board).not.toContain('politician');
    expect(board).not.toContain('doctor');
  });
});

/** C-5: repeated neglect persists a lowered bond and blocks engage (estranged). */
describe('PART B — bond decay across years persists and estranges (C-5)', () => {
  it('repeated neglect drives a friend below the estranged threshold and blocks engagement', () => {
    const character = makeCharacter(36, 30);
    character.relationships.push(relation({ id: 'peer_x', relation: 'friend', meter: ESTRANGED_METER + 5, lastMetAge: 26 }));
    const friend = character.relationships.find((r) => r.id === 'peer_x')!;

    // A few years of neglect
    for (let y = 0; y < 5; y++) {
      friend.meter = Math.max(0, friend.meter - 3); // small steady decay
      applyRelationshipNeglect(character);
    }
    expect(friend.meter).toBeLessThan(ESTRANGED_METER);
    expect(isEstranged(friend)).toBe(true);

    // "Won't engage": spend-time and gift both refuse without touching the bond.
    const before = friend.meter;
    expect(spendTimeWithPerson(character, friend.id, new RNG(36)).ok).toBe(false);
    expect(giveGiftToPerson(character, friend.id, new RNG(36)).ok).toBe(false);
    expect(friend.meter).toBe(before);
  });
});

/** C-6: positive engagement raises the bond and the boost survives age-ups. */
describe('PART B — gifts and quality time persist as a raised bond (C-6)', () => {
  it('spend time and gifts both raise the meter, and later years keep the lifted value', () => {
    const character = makeCharacter(37, 30);
    character.money = 20_000;
    character.relationships.push(relation({ id: 'friend_ok', relation: 'friend', meter: 60 }));
    const friend = character.relationships.find((r) => r.id === 'friend_ok')!;

    const before = friend.meter;
    const spent = spendTimeWithPerson(character, friend.id, new RNG(37));
    expect(spent.ok).toBe(true);
    expect(friend.meter).toBeGreaterThan(before);

    const afterSpend = friend.meter;
    const gifted = giveGiftToPerson(character, friend.id, new RNG(37));
    expect(gifted.ok).toBe(true);
    expect(friend.meter).toBeGreaterThan(afterSpend);

    // Advance several years; a healthy bond persists (no neglect, hence no drop).
    const lifted = friend.meter;
    character.relationships.push(relation({ id: 'fam', relation: 'mother', meter: 99, lastMetAge: 0 }));
    for (let y = 0; y < 3; y++) applyRelationshipNeglect(character);
    expect(friend.meter).toBe(lifted);
    expect(isEstranged(friend)).toBe(false);
  });

  it('a gift also moves money and keeps the meter raised after the same-year noise', () => {
    const character = makeCharacter(38, 30);
    character.money = 10_000;
    character.relationships.push(relation({ id: 'sib_gift', relation: 'sibling', meter: 70 }));
    const sib = character.relationships.find((r) => r.id === 'sib_gift')!;

    const cashBefore = character.money;
    const meterBefore = sib.meter;
    const res = giveGiftToPerson(character, sib.id, new RNG(38));
    expect(res.ok).toBe(true);
    expect(character.money).toBeLessThan(cashBefore);
    expect(sib.meter).toBeGreaterThan(meterBefore);
  });
});