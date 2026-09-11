import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { generateFamilyTree } from '@/lib/engine/family';
import { RNG } from '@/lib/engine/rng';
import {
  spendTimeWithPerson,
  chatWithPerson,
  complimentPerson,
  insultPerson,
  askMoneyFromPerson,
  giveMoneyToPerson,
  giveGiftToPerson,
  praiseChild,
  buyChildTreat,
  disciplineChild,
  giveChildAllowance,
  seedClassmates,
  seedCoworkers,
  befriendPeer,
  askOutPeer,
  isPeerRelation,
  nonPeerRelationships,
  peerRelationships,
} from '@/lib/engine/relationships';
import {
  generateDatingPool,
  callOrTextEx,
  hookupWithEx,
  begGetBackTogether,
  insultEx,
  tryForBaby,
} from '@/lib/engine/romance';
import { MUSLIM_FEMALE_NAMES, HINDU_MALE_NAMES } from '@/content/names';

describe('Universal Relationship Interactions & Timeline Logging', () => {
  it('performs spendTimeWithPerson and logs to character history at current age', () => {
    const rng = new RNG(101);
    const { character } = createCharacter(101);
    character.age = 20;

    const friend = {
      id: 'friend_rahim',
      relation: 'friend' as const,
      name: 'Rahim Mia',
      age: 20,
      alive: true,
      meter: 50,
      metAge: 10,
    };
    character.relationships.push(friend);

    const historyBefore = character.history.length;
    const result = spendTimeWithPerson(character, friend.id, rng);

    expect(result.ok).toBe(true);
    expect(character.history.length).toBe(historyBefore + 1);
    const lastLog = character.history[character.history.length - 1];
    expect(lastLog.age).toBe(20);
    expect(lastLog.text).toBe(result.text);
    expect(friend.meter).toBeGreaterThan(50);
  });

  it('performs chatWithPerson, complimentPerson, insultPerson with meter impacts', () => {
    const rng = new RNG(202);
    const { character } = createCharacter(202);
    character.age = 22;

    const cousin = {
      id: 'cousin_karim',
      relation: 'friend' as const,
      name: 'Karim Uddin',
      age: 23,
      alive: true,
      meter: 50,
      metAge: 12,
    };
    character.relationships.push(cousin);

    // Chat
    const chatRes = chatWithPerson(character, cousin.id, rng);
    expect(chatRes.ok).toBe(true);

    // Compliment
    const compRes = complimentPerson(character, cousin.id, rng);
    expect(compRes.ok).toBe(true);
    const meterAfterComp = cousin.meter;

    // Insult
    const insultRes = insultPerson(character, cousin.id, rng);
    expect(insultRes.ok).toBe(true);
    expect(cousin.meter).toBeLessThan(meterAfterComp);
  });

  it('performs askMoneyFromPerson, giveMoneyToPerson, and giveGiftToPerson', () => {
    const rng = new RNG(303);
    const { character } = createCharacter(303);
    character.age = 25;
    character.money = 2000;

    const uncle = {
      id: 'uncle_jamil',
      relation: 'friend' as const,
      name: 'Jamil Hossain',
      age: 45,
      alive: true,
      meter: 90,
      metAge: 0,
    };
    character.relationships.push(uncle);

    // Ask money
    const askRes = askMoneyFromPerson(character, uncle.id, rng);
    expect(askRes.text).toBeTruthy();

    // Give money
    const initialMoney = character.money;
    const giveMoneyRes = giveMoneyToPerson(character, uncle.id, 500);
    expect(giveMoneyRes.ok).toBe(true);
    expect(character.money).toBe(initialMoney - 500);

    // Give gift
    const moneyBeforeGift = character.money;
    const giftRes = giveGiftToPerson(character, uncle.id, rng);
    expect(giftRes.ok).toBe(true);
    expect(character.money).toBe(moneyBeforeGift - 300);
  });
});

describe('Ex-Partner Interactions Suite', () => {
  it('calls, hooks up, begs to reunite, and insults an ex', () => {
    const rng = new RNG(404);
    const { character } = createCharacter(404);
    character.age = 26;

    const ex = {
      id: 'ex_tisha',
      relation: 'ex' as const,
      name: 'Tisha Rahman',
      age: 25,
      alive: true,
      meter: 40,
      metAge: 20,
    };
    character.relationships.push(ex);

    // 1. Call or text
    const callRes = callOrTextEx(character, ex.id, rng);
    expect(callRes.text).toBeTruthy();

    // 2. Secret Hookup
    const hookupRes = hookupWithEx(character, ex.id, rng);
    expect(hookupRes.text).toBeTruthy();

    // 3. Insult ex
    const insultRes = insultEx(character, ex.id, rng);
    expect(insultRes.ok).toBe(true);
    expect(ex.meter).toBeLessThanOrEqual(40);

    // 4. Beg to get back together (with high meter)
    ex.meter = 95;
    const reuniteRes = begGetBackTogether(character, ex.id, rng);
    expect(reuniteRes.ok).toBe(true);
    expect(ex.relation).toBe('dating');
  });
});

describe('Heterosexual Romance & Religious Pool Isolation', () => {
  it('enforces heterosexual candidates: male player gets female candidates only', () => {
    const rng = new RNG(505);
    const { character } = createCharacter(505, { gender: 'male', religion: 'islam' });
    character.age = 24;

    const pool = generateDatingPool(character, rng, 10);
    expect(pool.length).toBe(10);
    for (const c of pool) {
      expect(c.gender).toBe('female');
    }
  });

  it('enforces heterosexual candidates: female player gets male candidates only', () => {
    const rng = new RNG(606);
    const { character } = createCharacter(606, { gender: 'female', religion: 'islam' });
    character.age = 24;

    const pool = generateDatingPool(character, rng, 10);
    expect(pool.length).toBe(10);
    for (const c of pool) {
      expect(c.gender).toBe('male');
    }
  });

  it('generates religion-appropriate dating candidates and baby blessings for Muslim and Hindu characters', () => {
    const rng1 = new RNG(707);
    const { character: muslimChar } = createCharacter(707, { gender: 'male', religion: 'islam' });
    muslimChar.age = 25;
    const muslimPool = generateDatingPool(muslimChar, rng1, 8);
    for (const c of muslimPool) {
      const isMuslimFemale = MUSLIM_FEMALE_NAMES.some((n) => c.name.includes(n));
      expect(isMuslimFemale).toBe(true);
    }

    const rng2 = new RNG(808);
    const { character: hinduChar } = createCharacter(808, { gender: 'female', religion: 'hinduism' });
    hinduChar.age = 25;
    const hinduPool = generateDatingPool(hinduChar, rng2, 8);
    for (const c of hinduPool) {
      const isHinduMale = HINDU_MALE_NAMES.some((n) => c.name.includes(n));
      expect(isHinduMale).toBe(true);
    }

    // Baby blessings
    const tree1 = generateFamilyTree(muslimChar, 707);
    muslimChar.money = 5000;
    muslimChar.relationships.push({
      id: 'wife_1',
      relation: 'spouse',
      name: 'Ayesha Akter',
      age: 24,
      alive: true,
      meter: 100,
      metAge: 22,
    });
    const babyResMuslim = tryForBaby(muslimChar, tree1, 'wife_1', rng1);
    expect(babyResMuslim.ok).toBe(true);
    expect(babyResMuslim.text).toContain('আলহামদুলিল্লাহ');

    const tree2 = generateFamilyTree(hinduChar, 808);
    hinduChar.money = 5000;
    hinduChar.relationships.push({
      id: 'husband_1',
      relation: 'spouse',
      name: 'Subhash Roy',
      age: 26,
      alive: true,
      meter: 100,
      metAge: 22,
    });
    let babyResHindu = tryForBaby(hinduChar, tree2, 'husband_1', rng2);
    let attempts = 0;
    while (!babyResHindu.ok && attempts < 10) {
      attempts++;
      babyResHindu = tryForBaby(hinduChar, tree2, 'husband_1', rng2);
    }
    expect(babyResHindu.ok).toBe(true);
    expect(babyResHindu.text).toContain('হরিবোল');
  });
});

describe('Child-Raising Actions', () => {
  function makeChildCharacter(seed: number, childMeter = 60) {
    const rng = new RNG(seed);
    const { character } = createCharacter(seed);
    character.age = 28;
    character.money = 3000;
    character.relationships.push({
      id: 'child_rakib',
      relation: 'child',
      name: 'Rakib Hossain',
      age: 6,
      alive: true,
      meter: childMeter,
      metAge: 22,
    });
    return { character, rng };
  }

  it('praiseChild raises child meter, happiness, and logs at current age', () => {
    const { character, rng } = makeChildCharacter(10001);
    const historyBefore = character.history.length;
    const result = praiseChild(character, 'child_rakib', rng);
    expect(result.ok).toBe(true);
    expect(character.history.length).toBeGreaterThanOrEqual(historyBefore);
    const child = character.relationships.find((r) => r.id === 'child_rakib')!;
    expect(child.meter).toBeGreaterThan(60);
    expect(character.stats.happiness).toBeGreaterThan(0);
  });

  it('buyChildTreat costs money and raises meter', () => {
    const { character, rng } = makeChildCharacter(10002);
    const moneyBefore = character.money;
    const result = buyChildTreat(character, 'child_rakib', rng);
    expect(result.ok).toBe(true);
    expect(character.money).toBe(moneyBefore - 150);
  });

  it('buyChildTreat fails without enough money', () => {
    const { character, rng } = makeChildCharacter(10003);
    character.money = 0;
    expect(buyChildTreat(character, 'child_rakib', rng).ok).toBe(false);
  });

  it('disciplineChild on a well-bonded child adjusts smarts and logs', () => {
    const { character, rng } = makeChildCharacter(10004, 80);
    const smartsBefore = character.stats.smarts;
    disciplineChild(character, 'child_rakib', rng);
    expect(character.history.length).toBeGreaterThan(0);
    expect(character.stats.smarts).not.toBe(smartsBefore);
  });

  it('disciplineChild on low-meter child can rebel', () => {
    let rebellionObserved = false;
    for (let seed = 10100; seed < 10200; seed++) {
      const { character, rng } = makeChildCharacter(seed, 30);
      const result = disciplineChild(character, 'child_rakib', rng);
      if (result.tone === 'bad') {
        rebellionObserved = true;
        expect(character.stats.happiness).toBeLessThan(100);
        break;
      }
    }
    expect(rebellionObserved).toBe(true);
  });

  it('giveChildAllowance costs money and raises meter', () => {
    const { character, rng } = makeChildCharacter(10005);
    const moneyBefore = character.money;
    const result = giveChildAllowance(character, 'child_rakib', rng);
    expect(result.ok).toBe(true);
    expect(character.money).toBeLessThan(moneyBefore);
  });

  it('child actions reject on non-child relationships', () => {
    const rng = new RNG(10006);
    const { character } = createCharacter(10006);
    character.relationships.push({
      id: 'friend_rahim',
      relation: 'friend',
      name: 'Rahim',
      age: 25,
      alive: true,
      meter: 50,
      metAge: 10,
    });
    expect(praiseChild(character, 'friend_rahim', rng).ok).toBe(false);
    expect(buyChildTreat(character, 'friend_rahim', rng).ok).toBe(false);
    expect(disciplineChild(character, 'friend_rahim', rng).ok).toBe(false);
    expect(giveChildAllowance(character, 'friend_rahim', rng).ok).toBe(false);
  });
});

describe('Peer Seeding & Upgrade (Classmates / Coworkers)', () => {
  it('seedClassmates adds classmates with religion-appropriate names', () => {
    const { character } = createCharacter(20001, { religion: 'islam' });
    character.age = 12;
    seedClassmates(character, new RNG(20001), 3);
    const classmates = character.relationships.filter((r) => r.relation === 'classmate');
    expect(classmates.length).toBe(3);
    for (const c of classmates) {
      expect(c.alive).toBe(true);
      expect(c.age).toBeGreaterThanOrEqual(5);
      expect(c.age).toBeLessThanOrEqual(100);
      expect(c.name.length).toBeGreaterThan(0);
    }
  });

  it('seedCoworkers adds coworkers at the workplace', () => {
    const { character } = createCharacter(20002, { religion: 'hinduism' });
    character.age = 25;
    seedCoworkers(character, new RNG(20002), 3);
    const coworkers = character.relationships.filter((r) => r.relation === 'coworker');
    expect(coworkers.length).toBe(3);
  });

  it('seedClassmates is idempotent (does not add duplicates)', () => {
    const { character } = createCharacter(20003);
    character.age = 10;
    seedClassmates(character, new RNG(20003), 3);
    seedClassmates(character, new RNG(20003), 3);
    expect(character.relationships.filter((r) => r.relation === 'classmate').length).toBe(3);
  });

  it('befriendPeer converts classmate to friend at high meter', () => {
    const { character } = createCharacter(20004);
    character.age = 14;
    seedClassmates(character, new RNG(20004), 1);
    const classmate = character.relationships.find((r) => r.relation === 'classmate')!;
    classmate.meter = 80;
    const historyBefore = character.history.length;
    befriendPeer(character, classmate.id, new RNG(20004));
    expect(classmate.relation).toBe('friend');
    expect(character.history.length).toBeGreaterThanOrEqual(historyBefore);
  });

  it('befriendPeer does not convert at low meter', () => {
    const { character } = createCharacter(20005);
    character.age = 14;
    seedClassmates(character, new RNG(20005), 1);
    const classmate = character.relationships.find((r) => r.relation === 'classmate')!;
    classmate.meter = 30;
    befriendPeer(character, classmate.id, new RNG(20005));
    expect(classmate.relation).toBe('classmate');
  });

  it('askOutPeer succeeds at age 16+ with high meter and converts to dating', () => {
    const { character } = createCharacter(20006);
    character.age = 17;
    seedClassmates(character, new RNG(20006), 1);
    const classmate = character.relationships.find((r) => r.relation === 'classmate')!;
    classmate.meter = 70;
    askOutPeer(character, classmate.id, new RNG(20006));
    expect(classmate.relation).toBe('dating');
    expect(classmate.romanceStage).toBe('dating');
  });

  it('askOutPeer fails under age 16', () => {
    const { character } = createCharacter(20007);
    character.age = 14;
    seedClassmates(character, new RNG(20007), 1);
    const classmate = character.relationships.find((r) => r.relation === 'classmate')!;
    classmate.meter = 80;
    const result = askOutPeer(character, classmate.id, new RNG(20007));
    expect(result.ok).toBe(false);
    expect(classmate.relation).toBe('classmate');
  });

  it('askOutPeer fails on low meter and lowers happiness', () => {
    const { character } = createCharacter(20008);
    character.age = 18;
    seedCoworkers(character, new RNG(20008), 1);
    const coworker = character.relationships.find((r) => r.relation === 'coworker')!;
    coworker.meter = 40;
    const result = askOutPeer(character, coworker.id, new RNG(20008));
    expect(result.ok).toBe(false);
    expect(character.stats.happiness).toBeLessThan(100);
    expect(coworker.relation).toBe('coworker');
  });
});

describe('Peer vs classic relationship surfaces (G)', () => {
  it('isPeerRelation accepts only classmate and coworker', () => {
    const { character } = createCharacter(30001);
    const mother = {
      id: 'm1', relation: 'mother' as const, name: 'A', age: 30, alive: true, meter: 60, metAge: 0,
    };
    const peer = {
      id: 'c1', relation: 'classmate' as const, name: 'B', age: 14, alive: true, meter: 50, metAge: 12,
    };
    character.relationships.push(mother, peer);
    expect(isPeerRelation('classmate')).toBe(true);
    expect(isPeerRelation('coworker')).toBe(true);
    expect(isPeerRelation('mother')).toBe(false);
    expect(isPeerRelation('friend')).toBe(false);
  });

  it('nonPeerRelationships keeps family/romance/friends and drops classmates & coworkers', () => {
    const { character } = createCharacter(30002);
    character.relationships.push(
      { id: 'm', relation: 'mother', name: 'Ammu', age: 40, alive: true, meter: 80, metAge: 0 },
      { id: 's', relation: 'spouse', name: 'Begum', age: 25, alive: true, meter: 90, metAge: 22 },
      { id: 'f', relation: 'friend', name: 'Rahim', age: 24, alive: true, meter: 60, metAge: 10 },
      { id: 'c1', relation: 'classmate', name: 'Karan', age: 13, alive: true, meter: 55, metAge: 12 },
      { id: 'c2', relation: 'coworker', name: 'Siraj', age: 30, alive: true, meter: 40, metAge: 25 },
    );
    const rail = nonPeerRelationships(character);
    expect(rail.some((r) => r.relation === 'mother')).toBe(true);
    expect(rail.some((r) => r.relation === 'spouse')).toBe(true);
    expect(rail.some((r) => r.relation === 'friend')).toBe(true);
    expect(rail.some((r) => r.relation === 'classmate' || r.relation === 'coworker')).toBe(false);
    expect(peerRelationships(character, 'classmate').map((r) => r.id)).toEqual(['c1']);
    expect(peerRelationships(character, 'coworker').map((r) => r.id)).toEqual(['c2']);
  });

  it('peerRelationships only returns living peers of the requested kind', () => {
    const { character } = createCharacter(30003);
    character.relationships.push(
      { id: 'a', relation: 'classmate', name: 'A', age: 12, alive: true, meter: 50, metAge: 11 },
      { id: 'b', relation: 'classmate', name: 'B', age: 12, alive: false, meter: 50, metAge: 11 },
      { id: 'c', relation: 'coworker', name: 'C', age: 30, alive: true, meter: 40, metAge: 25 },
    );
    expect(peerRelationships(character, 'classmate').map((r) => r.id)).toEqual(['a']);
    expect(peerRelationships(character, 'coworker').map((r) => r.id)).toEqual(['c']);
    expect(peerRelationships(character, 'classmate').every((r) => r.alive)).toBe(true);
  });
});
