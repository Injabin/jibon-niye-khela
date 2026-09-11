import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { generateFamilyTree } from '@/lib/engine/family';
import { RNG } from '@/lib/engine/rng';
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
  FICTIONAL_CELEBRITY_ARCHETYPES,
  type DatingCandidate,
} from '@/lib/engine/romance';
import { EVENT_REGISTRY } from '@/content/events';

describe('Romance Progression Engine (Gate 9 / Additional_plus_improved_plan.md)', () => {
  it('generates age-appropriate procedural dating pool', () => {
    const rng = new RNG(12345);
    const { character } = createCharacter(42);
    character.age = 22;

    const pool = generateDatingPool(character, rng, 6);
    expect(pool.length).toBe(6);

    for (const candidate of pool) {
      expect(candidate.name).toBeTruthy();
      expect(candidate.age).toBeGreaterThanOrEqual(18);
      expect(candidate.age).toBeLessThanOrEqual(28);
      expect(candidate.archetype).toBeTruthy();
    }
  });

  it('runs through full romance arc: ask out -> official -> propose -> cheat -> divorce', () => {
    const rng = new RNG(999);
    const { character } = createCharacter(42);
    character.age = 24;
    character.money = 10000;
    const tree = generateFamilyTree(character, 999);

    const candidate: DatingCandidate = {
      id: 'cand_shakib',
      name: 'Nabil Hasan',
      gender: 'male',
      age: 24,
      archetype: 'Software Engineer',
      isCelebrity: false,
      looks: 75,
      smarts: 80,
    };

    // 1. Ask out candidate
    const askOutResult = askOutCandidate(character, candidate, rng);
    expect(askOutResult.ok).toBe(true);

    const rel = character.relationships.find((r) => r.name === 'Nabil Hasan');
    expect(rel).toBeDefined();
    expect(rel!.relation).toBe('dating');
    expect(rel!.romanceStage).toBeDefined();
    expect(character.flags).toContain('has_partner');

    // 2. Make official partner
    const officialResult = makeOfficialPartner(character, rel!.id, rng);
    expect(officialResult.ok).toBe(true);
    expect(rel!.relation).toBe('partner');
    expect(rel!.romanceStage).toBe('partner');

    // 3. Propose marriage
    // Boost bond meter to ensure high acceptance probability
    rel!.meter = 95;
    const proposeResult = proposeMarriage(character, tree, rel!.id, rng);
    expect(proposeResult.ok).toBe(true);
    expect(rel!.relation).toBe('spouse');
    expect(character.flags).toContain('has_spouse');

    // Verify spouse added to FamilyTree
    const spouseInTree = tree.members.find((m) => m.role === 'spouse' && m.name === 'Nabil Hasan');
    expect(spouseInTree).toBeDefined();

    // 4. Cheat branch (consequence-driven karma / meter hit)
    const initialKarma = character.reputation.karma;
    const initialMeter = rel!.meter;
    const cheatResult = cheatBranch(character, rel!.id, rng);

    expect(character.reputation.karma).toBeLessThan(initialKarma);
    expect(rel!.meter).toBeLessThan(initialMeter);
    expect(cheatResult.text).toBeTruthy();

    // 5. Divorce / Breakup
    const divorceResult = breakupOrDivorce(character, tree, rel!.id, rng);
    expect(divorceResult.ok).toBe(true);
    expect(rel!.relation).toBe('ex');
    expect(character.flags).not.toContain('has_spouse');
    expect(character.flags).toContain('divorced');

    // Verify spouse role removed from FamilyTree
    const spouseStillInTree = tree.members.find((m) => m.role === 'spouse' && m.alive);
    expect(spouseStillInTree).toBeUndefined();
  });
});

describe('Sensitive Content Boundaries & Archetype Integrity (Gate 9 / DESIGN.md §11)', () => {
  // Real public figure names to strictly exclude
  const REAL_CELEBRITIES = [
    'Shakib Al Hasan',
    'Mashrafe Mortaza',
    'Tamim Iqbal',
    'Sheikh Hasina',
    'Khaleda Zia',
    'Ziaur Rahman',
    'Sheikh Mujibur Rahman',
    'Humayun Ahmed',
    'Tahsan',
    'Afran Nisho',
    'Mehazabien',
    'Nusrat Faria',
    'Hero Alom',
    'Salman Khan',
    'Shah Rukh Khan',
    'Taylor Swift',
  ];

  it('contains zero real celebrity or public figure names in archetypes or candidate generation', () => {
    // Check archetype definitions
    for (const archetype of FICTIONAL_CELEBRITY_ARCHETYPES) {
      for (const realName of REAL_CELEBRITIES) {
        expect(archetype.toLowerCase()).not.toContain(realName.toLowerCase());
      }
    }

    // Generate 500 candidates across diverse seeds and verify
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new RNG(seed);
      const { character } = createCharacter(seed);
      character.age = 25;
      const pool = generateDatingPool(character, rng, 10);

      for (const candidate of pool) {
        for (const realName of REAL_CELEBRITIES) {
          expect(candidate.name.toLowerCase()).not.toBe(realName.toLowerCase());
        }
      }
    }
  });

  it('strictly zero explicit or sexual content for characters under age 18 across all events', () => {
    const EXPLICIT_PATTERNS = [
      /\bsex\b/i,
      /sexual/i,
      /undress/i,
      /intimate touch/i,
      /kiss on the lips/i,
      /seduce/i,
      /naked/i,
    ];

    for (const event of EVENT_REGISTRY) {
      if (event.minAge < 18 || event.maxAge < 18 || event.category === 'childhood' || event.category === 'teen') {
        const fullText = [
          event.text,
          ...event.choices.map((c) => `${c.text} ${c.outcomeText}`),
        ].join(' ');

        for (const pattern of EXPLICIT_PATTERNS) {
          expect(
            fullText,
            `Event ${event.id} (minAge ${event.minAge}, category ${event.category}) matched explicit pattern ${pattern}`
          ).not.toMatch(pattern);
        }
      }
    }
  });

  it('dating pool generator refuses or returns empty pool for characters under 16', () => {
    const rng = new RNG(42);
    const { character } = createCharacter(42);
    character.age = 14;

    const pool = generateDatingPool(character, rng, 5);
    expect(pool.length).toBe(0);
  });

  it('deduplicates existing relationships when asking out an existing contact/crush', () => {
    const rng = new RNG(55);
    const { character } = createCharacter(42);
    character.age = 17;
    character.stats.looks = 95;
    character.money = 3000;

    const candidate: DatingCandidate = {
      id: 'crush_orpa',
      name: 'Orpa Mondol',
      gender: 'female',
      age: 17,
      archetype: 'ইশকুলের সহপাঠী',
      isCelebrity: false,
      looks: 60,
      smarts: 60,
    };

    // First ask out -> added as crush
    const firstResult = askOutCandidate(character, candidate, rng);
    expect(firstResult.ok).toBe(true);
    const matchesBefore = character.relationships.filter((r) => r.name === 'Orpa Mondol');
    expect(matchesBefore.length).toBe(1);

    // Second ask out with same candidate id -> upgrades in-place, NEVER duplicates
    const secondResult = askOutCandidate(character, candidate, rng);
    expect(secondResult.ok).toBe(true);
    const matchesAfter = character.relationships.filter((r) => r.name === 'Orpa Mondol');
    expect(matchesAfter.length).toBe(1);
    expect(matchesAfter[0].id).toBe('crush_orpa');
  });

  it('supports dating and gifting with partner', () => {
    const rng = new RNG(42);
    const { character } = createCharacter(42);
    character.age = 22;
    character.stats.looks = 95;
    character.money = 3000;

    const candidate: DatingCandidate = {
      id: 'rel_nusrat',
      name: 'Nusrat Jahan',
      gender: 'female',
      age: 21,
      archetype: 'গ্রাফিক্স ডিজাইনার',
      isCelebrity: false,
      looks: 70,
      smarts: 70,
    };

    const askOutResult = askOutCandidate(character, candidate, rng);
    expect(askOutResult.ok).toBe(true);
    const rel = character.relationships.find((r) => r.id === 'rel_nusrat')!;
    expect(rel).toBeDefined();
    const initialMeter = rel.meter;

    // Date
    const dateResult = dateCandidateOrPartner(character, rel.id, rng);
    expect(dateResult.ok).toBe(true);
    expect(character.money).toBe(2800); // 3000 - 200
    expect(rel.meter).toBeGreaterThan(initialMeter);

    // Gift
    const giftResult = giveGiftToPartner(character, rel.id, rng);
    expect(giftResult.ok).toBe(true);
    expect(character.money).toBe(2400); // 2800 - 400
  });

  it('supports having a baby with spouse and adds child to family tree and relationships', () => {
    const rng = new RNG(1);
    const { character } = createCharacter(42);
    character.age = 26;
    character.money = 2000;
    character.stats.health = 90;
    const tree = generateFamilyTree(character, 1);

    // Add spouse
    character.relationships.push({
      id: 'spouse_fatima',
      relation: 'spouse',
      name: 'Fatima Begum',
      age: 24,
      alive: true,
      meter: 90,
      metAge: 22,
    });
    character.flags.push('is_married');

    const babyResult = tryForBaby(character, tree, 'spouse_fatima', rng);
    expect(babyResult.ok).toBe(true);
    expect(character.flags).toContain('has_child');

    // Child in relationships
    const childRel = character.relationships.find((r) => r.relation === 'child');
    expect(childRel).toBeDefined();
    expect(childRel!.age).toBe(0);

    // Child in family tree
    const childTreeMember = tree.members.find((m) => m.role === 'child');
    expect(childTreeMember).toBeDefined();
    expect(childTreeMember!.age).toBe(0);
  });
});

describe('Wedding Styles (Kazi Office vs Community Center)', () => {
  it('kazi_office marriage costs 2050 total and sets spouse relation with appropriate text', () => {
    const rng = new RNG(7001);
    const { character } = createCharacter(7001);
    character.age = 26;
    character.money = 10000;
    const tree = generateFamilyTree(character, 7001);
    character.relationships.push({
      id: 'fiance_ruma',
      relation: 'partner',
      romanceStage: 'partner',
      name: 'Ruma Akter',
      age: 24,
      alive: true,
      meter: 90,
      metAge: 22,
    });

    const result = proposeMarriage(character, tree, 'fiance_ruma', rng, 'kazi_office');
    expect(result.ok).toBe(true);
    expect(character.money).toBe(10000 - 50 - 2000);
    expect(result.text).toContain('নিকাহ');
    const spouse = tree.members.find((m) => m.role === 'spouse');
    expect(spouse).toBeDefined();
  });

  it('community_center marriage costs 8050 and text mentions community center', () => {
    const rng = new RNG(7002);
    const { character } = createCharacter(7002);
    character.age = 28;
    character.money = 20000;
    const tree = generateFamilyTree(character, 7002);
    character.relationships.push({
      id: 'fiance_samir',
      relation: 'partner',
      romanceStage: 'partner',
      name: 'Samir Das',
      age: 27,
      alive: true,
      meter: 90,
      metAge: 22,
    });

    const result = proposeMarriage(character, tree, 'fiance_samir', rng, 'community_center');
    expect(result.ok).toBe(true);
    expect(character.money).toBe(20000 - 50 - 8000);
    expect(result.text).toContain('কমিউনিটি সেন্টার');
  });

  it('rejects when funds are insufficient for the chosen style', () => {
    const rng = new RNG(7003);
    const { character } = createCharacter(7003);
    character.age = 25;
    character.money = 3000;
    const tree = generateFamilyTree(character, 7003);
    character.relationships.push({
      id: 'fiance_low',
      relation: 'partner',
      romanceStage: 'partner',
      name: 'Low Funds',
      age: 24,
      alive: true,
      meter: 90,
      metAge: 22,
    });

    const result = proposeMarriage(character, tree, 'fiance_low', rng, 'community_center');
    expect(result.ok).toBe(false);
    expect(result.text).toContain('৳');
  });

  it('defaults to kazi_office when style is omitted', () => {
    const rng = new RNG(7004);
    const { character } = createCharacter(7004);
    character.age = 25;
    character.money = 10000;
    const tree = generateFamilyTree(character, 7004);
    character.relationships.push({
      id: 'fiance_default',
      relation: 'partner',
      romanceStage: 'partner',
      name: 'Default Test',
      age: 23,
      alive: true,
      meter: 90,
      metAge: 22,
    });

    const result = proposeMarriage(character, tree, 'fiance_default', rng);
    expect(result.ok).toBe(true);
    expect(character.money).toBe(10000 - 50 - 2000);
  });
});
