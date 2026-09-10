import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import { ACTIVITY_BUDGET_PER_YEAR, LEISURE_PERFORMANCE_PENALTY } from '@/lib/engine/activity';

beforeEach(() => {
  useGameStore.getState().resetGame();
  localStorage.clear();
});

describe('action economy (A: 3/yr budget)', () => {
  it('menu actions consume the yearly budget once each', () => {
    useGameStore.getState().newGame(3);
    // pray is free of prerequisites and always succeeds
    for (let i = 0; i < ACTIVITY_BUDGET_PER_YEAR; i++) {
      expect(useGameStore.getState().prayOrWorship()).toBe(true);
    }
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(ACTIVITY_BUDGET_PER_YEAR);
    expect(useGameStore.getState().prayOrWorship()).toBe(false);
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(ACTIVITY_BUDGET_PER_YEAR);
  });

  it('does not consume budget on money-blocked actions', () => {
    useGameStore.getState().newGame(4);
    // starting money (30) < gym fee (150)
    expect(useGameStore.getState().doGymWorkout()).toBe(false);
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(0);
  });

  it('bespoke menu actions consume the budget too', () => {
    useGameStore.getState().newGame(6);
    useGameStore.setState((s) => ({
      character:
        s.character && {
          ...s.character,
          money: 10_000,
          education: { ...s.character.education, enrolled: true },
        },
    }));

    for (let i = 0; i < ACTIVITY_BUDGET_PER_YEAR; i++) {
      expect(useGameStore.getState().studyHarder()).toBe(true);
    }
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(ACTIVITY_BUDGET_PER_YEAR);
    expect(useGameStore.getState().studyHarder()).toBe(false);
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(ACTIVITY_BUDGET_PER_YEAR);
  });

  it('leisure actions cost job performance while employed', () => {
    useGameStore.getState().newGame(5);
    useGameStore.setState((s) => ({
      character:
        s.character && {
          ...s.character,
          money: 10_000,
          career: { jobId: 'warehouse', performance: 60, yearsAtJob: 1 },
        },
    }));

    expect(useGameStore.getState().doGymWorkout()).toBe(true);
    expect(useGameStore.getState().character!.career.performance).toBe(
      60 - LEISURE_PERFORMANCE_PENALTY,
    );
  });

  it('leisure actions do not cost performance when unemployed', () => {
    useGameStore.getState().newGame(7);
    useGameStore.setState((s) => ({
      character: s.character && { ...s.character, money: 10_000 },
    }));

    expect(useGameStore.getState().doGymWorkout()).toBe(true);
    expect(useGameStore.getState().character!.career.performance).toBe(50);
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(1);
  });

  it('budget resets when the year turns', () => {
    useGameStore.getState().newGame(9);
    useGameStore.getState().prayOrWorship();
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(1);

    useGameStore.getState().ageUp();
    expect(useGameStore.getState().character!.activityBudgetUsed).toBe(0);
  });
});