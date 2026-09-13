import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  askMoneyFromPerson,
  giveMoneyToPerson,
  giveGiftToPerson,
  spendTimeWithPerson,
  praiseChild,
  makePeaceWithPerson,
  applyRelationshipNeglect,
  ESTRANGED_METER,
  isEstranged,
} from '@/lib/engine/relationships';
import { ADULT_EVENTS } from '@/content/events/adult';
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

/**
 * Commits every seed until a composed engine call satisfies the predicate.
 * The setup runs on the exact same fresh character shape the test then builds,
 * so the RNG stream consumed in the probe matches the real call's stream.
 */
function findSeed(
  setup: (character: Character) => void,
  fn: (rng: RNG, character: Character) => boolean
): number {
  for (let seed = 1; seed < 10000; seed++) {
    const rng = new RNG(seed);
    const character = makeCharacter(seed, 30);
    character.career.jobId = 'job_tech';
    setup(character);
    if (fn(rng, character)) return seed;
  }
  throw new Error('no seed found');
}

const mother = (character: Character): Relationship =>
  character.relationships.find((r) => r.relation === 'mother')!;

describe('PART C — ask money from family', () => {
  it('an estranged relative refuses the ask outright without touching bond', () => {
    const character = makeCharacter(1, 30);
    character.career.jobId = 'job_tech';
    mother(character).meter = ESTRANGED_METER;

    const before = character.money;
    const result = askMoneyFromPerson(character, mother(character).id, new RNG(1));

    expect(result.ok).toBe(false);
    expect(character.money).toBe(before);
    expect(mother(character).meter).toBe(ESTRANGED_METER);
  });

  it('a grown, unemployed kid gets a sermon instead of taka', () => {
    const character = makeCharacter(2, 24);
    character.career.jobId = null;
    const meterBefore = mother(character).meter;

    const result = askMoneyFromPerson(character, mother(character).id, new RNG(2));

    expect(result.ok).toBe(false);
    expect(mother(character).meter).toBeLessThan(meterBefore);
    expect(character.reputation.karma).toBe(51);
  });

  it('employment bypasses the sermon so an employed adult hits the cooldown instead', () => {
    const character = makeCharacter(3, 24);
    character.career.jobId = 'job_office';
    const m = mother(character);
    m.lastAskMoneyAge = 22;
    const meterBefore = m.meter;

    const result = askMoneyFromPerson(character, m.id, new RNG(3));

    expect(result.ok).toBe(false);
    expect(m.meter).toBe(meterBefore - 4);
    expect(m.lastAskMoneyAge).toBe(22);
  });

  it('successful asks add the coin and record the ask age for the cooldown', () => {
    const seed = findSeed(
      (char) => {
        char.career.jobId = 'job_tech';
        const m = mother(char);
        m.meter = 100;
        m.lastAskMoneyAge = undefined;
      },
      (rng, char) => askMoneyFromPerson(char, mother(char).id, rng).ok
    );

    const { character } = createCharacter(seed);
    character.age = 30;
    character.career.jobId = 'job_tech';
    const m = mother(character);
    m.meter = 100;
    m.lastAskMoneyAge = undefined;
    const before = character.money;

    const result = askMoneyFromPerson(character, m.id, new RNG(seed));

    expect(result.ok).toBe(true);
    expect(character.money - before).toBeGreaterThanOrEqual(200);
    expect(character.money - before).toBeLessThanOrEqual(1500);
    expect(m.lastAskMoneyAge).toBe(30);
    expect(m.meter).toBe(94);
  });

  it('parents keep a ~3 year cooling period between asks', () => {
    const character = makeCharacter(7, 24);
    character.career.jobId = 'job_tech';
    const m = mother(character);
    m.lastAskMoneyAge = 22;
    const meterBefore = m.meter;

    const result = askMoneyFromPerson(character, m.id, new RNG(7));

    expect(result.ok).toBe(false);
    expect(m.lastAskMoneyAge).toBe(22);
    expect(m.meter).toBe(meterBefore - 4);
  });

  it('spouse asks are not cooldown-gated', () => {
    const seed = findSeed(
      (char) => {
        char.relationships.push(relation({ id: 'spouse_1', relation: 'spouse', meter: 100, lastAskMoneyAge: 29 }));
      },
      (rng, char) => {
        const spouse = char.relationships.find((r) => r.relation === 'spouse')!;
        return askMoneyFromPerson(char, spouse.id, rng).ok;
      }
    );

    const { character } = createCharacter(seed);
    character.age = 30;
    character.career.jobId = 'job_tech';
    character.relationships.push(relation({ id: 'spouse_1', relation: 'spouse', meter: 100, lastAskMoneyAge: 29 }));
    const spouse = character.relationships.find((r) => r.relation === 'spouse')!;

    const result = askMoneyFromPerson(character, spouse.id, new RNG(seed));

    expect(result.ok).toBe(true);
    expect(spouse.lastAskMoneyAge).toBe(30);
  });
});

describe('PART C — estrangement blocks contact', () => {
  it('estranged NPCs refuse spend time, gift, and praise, and refuse to take money', () => {
    const character = makeCharacter(9, 30);
    character.relationships.push(relation({ id: 'friend_x', relation: 'friend', meter: 10 }));
    character.relationships.push(relation({ id: 'child_x', relation: 'child', meter: 10 }));
    character.money = 5000;

    const friend = character.relationships.find((r) => r.id === 'friend_x')!;

    expect(spendTimeWithPerson(character, friend.id, new RNG(9)).ok).toBe(false);
    expect(giveGiftToPerson(character, friend.id, new RNG(9)).ok).toBe(false);
    expect(character.money).toBe(5000);

    const child = character.relationships.find((r) => r.id === 'child_x')!;
    expect(isEstranged(child)).toBe(true);
    expect(praiseChild(character, child.id, new RNG(9)).ok).toBe(false);
  });

  it('giveMoneyToPerson is refused by someone estranged', () => {
    const character = makeCharacter(10, 30);
    character.relationships.push(relation({ id: 'sib_x', relation: 'sibling', meter: 10 }));
    character.money = 1000;
    const sib = character.relationships.find((r) => r.id === 'sib_x')!;

    const result = giveMoneyToPerson(character, sib.id, 200);

    expect(result.ok).toBe(false);
    expect(character.money).toBe(1000);
    expect(sib.meter).toBe(10);
  });

  it('non-estranged giveMoneyToPerson still works', () => {
    const character = makeCharacter(11, 30);
    character.relationships.push(relation({ id: 'sib_ok', relation: 'sibling', meter: 60 }));
    character.money = 1000;
    const sib = character.relationships.find((r) => r.id === 'sib_ok')!;

    const result = giveMoneyToPerson(character, sib.id, 200);

    expect(result.ok).toBe(true);
    expect(character.money).toBe(800);
    expect(sib.meter).toBeGreaterThan(60);
  });
});

describe('PART C — reconciliation (মিলন-মীমাংসা)', () => {
  it('make peace is a no-op for a healthy bond', () => {
    const character = makeCharacter(12, 30);
    character.relationships.push(relation({ id: 'fr', relation: 'friend', meter: 60 }));

    const result = makePeaceWithPerson(character, 'fr', new RNG(12));

    expect(result.ok).toBe(false);
  });

  it('a successful peace talk lifts the NPC out of estrangement', () => {
    const seed = findSeed(
      (char) => {
        char.relationships.push(relation({ id: 'mp', relation: 'friend', meter: 8 }));
      },
      (rng, char) => {
        return makePeaceWithPerson(char, 'mp', rng).ok;
      }
    );

    const { character } = createCharacter(seed);
    character.age = 30;
    character.career.jobId = 'job_tech';
    character.relationships.push(relation({ id: 'mp', relation: 'friend', meter: 8 }));
    const mp = character.relationships.find((r) => r.id === 'mp')!;

    const result = makePeaceWithPerson(character, mp.id, new RNG(seed));

    expect(result.ok).toBe(true);
    expect(mp.meter).toBe(33);
    expect(isEstranged(mp)).toBe(false);
    expect(mp.lastMakePeaceAge).toBe(30);
  });

  it('peace talks are limited to once every two years', () => {
    const character = makeCharacter(14, 30);
    character.relationships.push(relation({ id: 'enemy', relation: 'friend', meter: 8, lastMakePeaceAge: 29 }));
    const enemy = character.relationships.find((r) => r.id === 'enemy')!;

    const result = makePeaceWithPerson(character, enemy.id, new RNG(14));

    expect(result.ok).toBe(false);
    expect(enemy.meter).toBe(8);
  });
});

describe('PART C — yearly neglect decay', () => {
  it('neglected non-family relationships lose bond proportional to neglect', () => {
    const character = makeCharacter(15, 30);
    character.relationships.push(relation({ id: 'peer1', relation: 'friend', meter: 60, lastMetAge: 26 }));
    character.relationships.push(relation({ id: 'peer2', relation: 'classmate', meter: 80, lastMetAge: 22 }));

    applyRelationshipNeglect(character);

    expect(character.relationships.find((r) => r.id === 'peer1')!.meter).toBe(58);
    expect(character.relationships.find((r) => r.id === 'peer2')!.meter).toBe(76);
  });

  it('living-at-home family (lastMetAge 0) never decays from neglect', () => {
    const character = makeCharacter(16, 30);
    const m = mother(character);
    m.meter = 60;
    m.lastMetAge = 0;

    applyRelationshipNeglect(character);

    expect(m.meter).toBe(60);
  });

  it('dead relationships are skipped', () => {
    const character = makeCharacter(17, 30);
    character.relationships.push(relation({ id: 'gone', relation: 'friend', meter: 60, lastMetAge: 20, alive: false }));

    applyRelationshipNeglect(character);

    expect(character.relationships.find((r) => r.id === 'gone')!.meter).toBe(60);
  });
});

describe('PART C — cousin loan event is gated by employment', () => {
  it('unemployed characters never see the loan request event', () => {
    const event = ADULT_EVENTS.find((e) => e.id === 'ad_finance_cousin_loan_request')!;
    expect(event).toBeDefined();
    expect(event.predicate).toBeDefined();

    const unemployed = makeCharacter(18, 30);
    unemployed.career.jobId = null;
    const employed = makeCharacter(19, 30);
    employed.career.jobId = 'job_office';

    expect(event.predicate!(unemployed)).toBe(false);
    expect(event.predicate!(employed)).toBe(true);
  });
});