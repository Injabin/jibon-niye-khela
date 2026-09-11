import { describe, expect, it } from 'vitest';
import { ageUp } from '@/lib/engine/aging';
import { createCharacter } from '@/lib/engine/character';
import {
  ACTIVITY_BUDGET_PER_YEAR,
  LEISURE_PERFORMANCE_PENALTY,
  applyLeisureTradeoff,
  canSpendAction,
  resetActivityBudget,
  spendAction,
} from '@/lib/engine/activity';

describe('activity budget (A: action economy)', () => {
  it('allows exactly ACTIVITY_BUDGET_PER_YEAR actions then refuses', () => {
    const { character } = createCharacter(1);
    expect(canSpendAction(character)).toBe(true);
    for (let i = 0; i < ACTIVITY_BUDGET_PER_YEAR; i++) spendAction(character);
    expect(character.activityBudgetUsed).toBe(ACTIVITY_BUDGET_PER_YEAR);
    expect(canSpendAction(character)).toBe(false);
  });

  it('resetActivityBudget re-opens the budget', () => {
    const { character } = createCharacter(1);
    for (let i = 0; i < ACTIVITY_BUDGET_PER_YEAR; i++) spendAction(character);
    resetActivityBudget(character);
    expect(character.activityBudgetUsed).toBe(0);
    expect(canSpendAction(character)).toBe(true);
  });

  it('ageUp resets a partially-spent budget for the new year', () => {
    const { character, rng } = createCharacter(7);
    spendAction(character);
    spendAction(character);
    expect(character.activityBudgetUsed).toBe(2);
    ageUp(character, rng);
    expect(character.activityBudgetUsed).toBe(0);
  });

  it('applyLeisureTradeoff costs job performance only while employed', () => {
    const { character } = createCharacter(2);
    const employed = structuredClone(character);
    employed.career = { jobId: 'warehouse', performance: 40, yearsAtJob: 1 };
    applyLeisureTradeoff(employed);
    expect(employed.career.performance).toBe(40 - LEISURE_PERFORMANCE_PENALTY);

    const unemployed = structuredClone(character);
    unemployed.career = { jobId: null, performance: 40, yearsAtJob: 0 };
    applyLeisureTradeoff(unemployed);
    expect(unemployed.career.performance).toBe(40);
  });

  it('applyLeisureTradeoff clamps performance at zero', () => {
    const { character } = createCharacter(2);
    character.career = { jobId: 'warehouse', performance: 2, yearsAtJob: 1 };
    applyLeisureTradeoff(character);
    expect(character.career.performance).toBe(0);
  });
});