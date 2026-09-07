import type { Character } from './types';
import { clamp } from './stats';

export const REPUTATION_MIN = 0;
export const REPUTATION_MAX = 100;

/** Fame and karma drift gently toward a neutral 50 each year (DESIGN.md §3). */
export function applyReputationDrift(character: Character): void {
  const drift = (value: number): number => {
    if (value < 50) return clamp(value + 1, REPUTATION_MIN, REPUTATION_MAX);
    if (value > 50) return clamp(value - 1, REPUTATION_MIN, REPUTATION_MAX);
    return value;
  };

  const before = { fame: character.reputation.fame, karma: character.reputation.karma };
  character.reputation.fame = drift(character.reputation.fame);
  character.reputation.karma = drift(character.reputation.karma);

  if (before.fame !== character.reputation.fame || before.karma !== character.reputation.karma) {
    return;
  }
}