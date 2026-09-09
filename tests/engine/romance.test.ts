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
    character.money = 200;
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
});
