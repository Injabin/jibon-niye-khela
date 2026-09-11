import type { Character } from './types';

/**
 * Per-year action budget (Dhakaiya-engine economy): every deliberate
 * ActiveMenu action costs one of a small number of annual slots, so a
 * player must choose between gym, work, crime, and romance instead of
 * stacking every stat booster in a single year. Right-rail relationship
 * chats stay free; the budget resets on each age-up.
 */
export const ACTIVITY_BUDGET_PER_YEAR = 3;

/** Job-performance hit a leisure action inflicts while the character is employed. */
export const LEISURE_PERFORMANCE_PENALTY = 5;

export const ACTIVITY_BUDGET_EXCEEDED_MESSAGE =
  'এই বছরের কাজের সীমা (৩টা) ছুইরা ফেলস। চাচ্চু আইলা কইলে কীভাবে এত কাজ করস? পরের বছর নতুন করে শুরু করো!';

/** True while the character still has an action slot left this year. */
export function canSpendAction(character: Character): boolean {
  return (character.activityBudgetUsed ?? 0) < ACTIVITY_BUDGET_PER_YEAR;
}

/** Consume one action slot. Call only after the action actually executed. */
export function spendAction(character: Character): void {
  character.activityBudgetUsed = (character.activityBudgetUsed ?? 0) + 1;
}

/** New game year: the budget refreshes. */
export function resetActivityBudget(character: Character): void {
  character.activityBudgetUsed = 0;
}

/**
 * The gym/movie/hustle trade-off: leisure while employed costs a little
 * focus on the day job. No-op for the unemployed.
 */
export function applyLeisureTradeoff(character: Character): void {
  if (!character.career.jobId) return;
  character.career.performance = Math.max(
    0,
    character.career.performance - LEISURE_PERFORMANCE_PENALTY,
  );
}