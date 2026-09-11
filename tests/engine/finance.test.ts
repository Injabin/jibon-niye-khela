import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { generateFamilyTree } from '@/lib/engine/family';
import { createHeirCharacter, eligibleHeirs } from '@/lib/engine/legacy';
import { tickSystems } from '@/lib/engine/events/categories';
import { RNG } from '@/lib/engine/rng';
import type { Character } from '@/lib/engine/types';
import {
  BANKRUPTCY_BLOCK_YEARS,
  declareBankruptcy,
  depositSavings,
  getFinance,
  liquidateEstate,
  netWorth,
  repayLoan,
  SAVINGS_RATE,
  takeLoan,
  tickFinance,
  withdrawSavings,
} from '@/lib/engine/finance';

function survivor(seed: number): { character: Character; rng: RNG } {
  const { character, rng } = createCharacter(seed);
  character.age = 30;
  character.money = 100_000;
  return { character, rng };
}

describe('savings (DESIGN.md §5.5)', () => {
  it('deposit moves cash to savings and withdraw reverses it', () => {
    const { character } = survivor(1);
    expect(depositSavings(character, 10_000).ok).toBe(true);
    expect(character.money).toBe(90_000);
    expect(getFinance(character).savings).toBe(10_000);

    expect(withdrawSavings(character, 4_000).ok).toBe(true);
    expect(character.money).toBe(94_000);
    expect(getFinance(character).savings).toBe(6_000);
  });

  it('cannot deposit cash you do not hold or withdraw savings you lack', () => {
    const { character } = survivor(2);
    character.money = 100;
    expect(depositSavings(character, 1_000).ok).toBe(false);
    expect(character.money).toBe(100);
    expect(withdrawSavings(character, 1_000).ok).toBe(false);
  });

  it('savings earn the annual simple interest rate on the yearly tick', () => {
    const { character } = survivor(3);
    depositSavings(character, 10_000);
    tickFinance(character);
    expect(getFinance(character).savings).toBe(10_000 + Math.floor(10_000 * SAVINGS_RATE));
  });
});

describe('loans (DESIGN.md §5.5)', () => {
  it('taking a loan credits cash and marks the debt flag', () => {
    const { character, rng } = survivor(4);
    expect(takeLoan(character, rng, 50_000, 'personal').ok).toBe(true);
    expect(character.money).toBe(150_000);
    expect(getFinance(character).loans).toHaveLength(1);
    expect(getFinance(character).loans[0].balance).toBe(50_000);
    expect(character.flags).toContain('has_debt');
  });

  it('loan balances accrue simple interest each year', () => {
    const { character, rng } = survivor(5);
    takeLoan(character, rng, 10_000, 'personal');
    tickFinance(character);
    // personal loans carry an 8% annual rate.
    expect(getFinance(character).loans[0].balance).toBe(10_800);
  });

  it('repaying a loan clears it and, with no other debt, the flag too', () => {
    const { character, rng } = survivor(6);
    takeLoan(character, rng, 5_000, 'personal');
    const loanId = getFinance(character).loans[0].id;
    expect(repayLoan(character, loanId).ok).toBe(true);
    expect(getFinance(character).loans).toHaveLength(0);
    expect(character.money).toBe(100_000);
    expect(character.flags).not.toContain('has_debt');
  });

  it('cannot repay more cash than you currently hold', () => {
    const { character, rng } = survivor(7);
    character.money = 0;
    takeLoan(character, rng, 50_000, 'personal');
    character.money = 0; // blow the borrowed cash
    const loanId = getFinance(character).loans[0].id;
    expect(repayLoan(character, loanId).ok).toBe(false);
    expect(getFinance(character).loans).toHaveLength(1);
  });
});

describe('bankruptcy (DESIGN.md §5.2 business/bankrupt)', () => {
  it('refuses while solvent', () => {
    const { character } = survivor(8);
    expect(netWorth(character)).toBeGreaterThanOrEqual(0);
    expect(declareBankruptcy(character).ok).toBe(false);
  });

  it('discharges debt only when insolvent, liquidating assets at a firesale', () => {
    const { character, rng } = survivor(9);
    character.money = 0;
    takeLoan(character, rng, 20_000, 'personal');
    character.money = 0; // blow the borrowed cash
    character.assets.push({
      id: 'home1',
      kind: 'home',
      name: 'ধানমন্ডির ফ্ল্যাট',
      purchasePrice: 10_000,
      value: 9_000,
      acquiredAge: 25,
    });
    expect(netWorth(character)).toBe(0 + 0 + 9_000 - 20_000);

    const out = declareBankruptcy(character);
    expect(out.ok).toBe(true);
    expect(character.assets).toHaveLength(0);
    expect(getFinance(character).loans).toHaveLength(0);
    expect(character.money).toBe(0);
    expect(character.flags).toContain('bankrupt');
    expect(character.flags).not.toContain('has_debt');
    expect(getFinance(character).bankruptcies).toBe(1);
    expect(getFinance(character).bankruptcyBlockUntilAge).toBe(30 + BANKRUPTCY_BLOCK_YEARS);
  });

  it('blocks new borrowing for the bankruptcy term', () => {
    const { character, rng } = survivor(10);
    character.money = 0;
    takeLoan(character, rng, 1_000, 'personal');
    character.money = 0;
    expect(declareBankruptcy(character).ok).toBe(true);
    expect(takeLoan(character, rng, 1_000, 'personal').ok).toBe(false);
  });
});

describe('net worth and estate (will — DESIGN.md §5.8)', () => {
  it('net worth combines cash, savings and assets, and subtracts debts', () => {
    const { character, rng } = survivor(11);
    depositSavings(character, 1_000);
    character.money = 5_000;
    character.assets.push({
      id: 'j1',
      kind: 'jewelry',
      name: 'সোনার আংটি',
      purchasePrice: 2_000,
      value: 2_000,
      acquiredAge: 29,
    });
    takeLoan(character, rng, 3_000, 'personal');
    character.money = 5_000; // the borrowed cash is gone again, only the debt remains
    expect(netWorth(character)).toBe(5_000 + 1_000 + 2_000 - 3_000);
  });

  it('the will liquidates assets and savings into a cash estate, settles debts, and floors at zero', () => {
    const { character, rng } = survivor(12);
    takeLoan(character, rng, 1_000, 'personal');
    depositSavings(character, 2_000);
    character.assets.push({
      id: 'h1',
      kind: 'home',
      name: 'বাসা',
      purchasePrice: 10_000,
      value: 12_000,
      acquiredAge: 28,
    });
    character.money = 5_000;
    character.alive = false;
    expect(liquidateEstate(character)).toBe(5_000 + 2_000 + 12_000 - 1_000);

    // A crushing debt swallows the whole estate — debt is never inherited.
    getFinance(character).loans[0].balance = 100_000;
    expect(liquidateEstate(character)).toBe(0);
  });

  it('heirs split the liquidated estate (cash + assets + savings − debts)', () => {
    const { character } = survivor(13);
    depositSavings(character, 2_000);
    character.money = 30; // cash spent on the way out
    character.assets.push({
      id: 'h1',
      kind: 'home',
      name: 'বাসা',
      purchasePrice: 5_000,
      value: 5_000,
      acquiredAge: 40,
    });
    character.age = 60;
    character.alive = false;
    character.birthYear = 1960;

    const tree = generateFamilyTree(character, 13);
    const withHeir = {
      ...tree,
      members: [
        ...tree.members,
        {
          id: 'child-f1',
          name: 'Declan X',
          gender: 'male' as const,
          role: 'child' as const,
          age: 25,
          alive: true,
          bond: 60,
          metAge: 40,
          lastSpentAge: -1,
        },
      ],
    };
    const [heir] = eligibleHeirs(character, withHeir);
    const heirCharacter = createHeirCharacter(character, heir!, 2, new RNG(14));
    expect(heirCharacter.money).toBe((30 + 2_000 + 5_000) / 2);
  });
});

describe('systems integration (tickSystems)', () => {
  it('the yearly systems tick accrues finance interest alongside the others', () => {
    const { character, rng } = survivor(20);
    depositSavings(character, 10_000);
    takeLoan(character, rng, 10_000, 'personal');

    tickSystems(character, rng);

    expect(getFinance(character).savings).toBe(10_400);
    expect(getFinance(character).loans[0].balance).toBe(10_800);
  });
});