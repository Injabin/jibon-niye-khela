import { Character, StatEffects } from './types';
import { RNG } from './rng';

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function applyStatEffects(character: Character, effects: StatEffects): void {
  if (effects.health !== undefined) character.stats.health = clamp(character.stats.health + effects.health);
  if (effects.happiness !== undefined) character.stats.happiness = clamp(character.stats.happiness + effects.happiness);
  if (effects.smarts !== undefined) character.stats.smarts = clamp(character.stats.smarts + effects.smarts);
  if (effects.looks !== undefined) character.stats.looks = clamp(character.stats.looks + effects.looks);
  if (effects.money !== undefined) character.money = Math.max(0, character.money + effects.money);
}

export function applyYearlyDecay(character: Character, rng: RNG): void {
  // Health decay past age 50
  if (character.age > 50) {
    // e.g. age 60 -> 10/5 = 2. rangeInt(1, 3)
    const healthDecay = rng.rangeInt(1, Math.floor((character.age - 50) / 5) + 1);
    applyStatEffects(character, { health: -healthDecay });
  }

  // Happiness mean reversion (drifts towards 50 slightly at the extremes)
  if (character.stats.happiness > 80) {
    applyStatEffects(character, { happiness: -rng.rangeInt(1, 3) });
  } else if (character.stats.happiness < 20) {
    applyStatEffects(character, { happiness: rng.rangeInt(1, 3) });
  }
}
