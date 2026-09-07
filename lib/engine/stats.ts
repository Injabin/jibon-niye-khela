import type { Character, StatEffects } from './types';

export const STAT_MIN = 0;
export const STAT_MAX = 100;
export const MONEY_MIN = -10_000_000;
export const MONEY_MAX = 10_000_000_000;

export function clamp(value: number, min = STAT_MIN, max = STAT_MAX): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function roundToInt(value: number): number {
  return Math.round(value);
}

export function applyStatEffects(character: Character, effects: StatEffects): void {
  const { stats, reputation } = character;

  stats.health = roundToInt(clamp(stats.health + (effects.health ?? 0)));
  stats.happiness = roundToInt(clamp(stats.happiness + (effects.happiness ?? 0)));
  stats.smarts = roundToInt(clamp(stats.smarts + (effects.smarts ?? 0)));
  stats.looks = roundToInt(clamp(stats.looks + (effects.looks ?? 0)));

  character.money = roundToInt(clamp(character.money + (effects.money ?? 0), MONEY_MIN, MONEY_MAX));

  reputation.fame = roundToInt(clamp(reputation.fame + (effects.fame ?? 0)));
  reputation.karma = roundToInt(clamp(reputation.karma + (effects.karma ?? 0)));

  if (effects.addTrait) {
    if (!character.traits.includes(effects.addTrait)) {
      character.traits.push(effects.addTrait);
    }
  }
  if (effects.removeTrait) {
    character.traits = character.traits.filter((t) => t !== effects.removeTrait);
  }
  if (effects.addFlag) {
    if (!character.flags.includes(effects.addFlag)) {
      character.flags.push(effects.addFlag);
    }
  }
  if (effects.removeFlag) {
    character.flags = character.flags.filter((f) => f !== effects.removeFlag);
  }
}

export function healthDecay(age: number): number {
  if (age <= 50) return 0;
  return Math.max(1, Math.floor((age - 50) / 5));
}

export function happinessDrift(value: number): number {
  if (value < 50) return 2;
  if (value > 50) return -2;
  return 0;
}

export function looksDecay(age: number): number {
  if (age <= 60) return 0;
  return Math.max(1, Math.floor((age - 60) / 12));
}

export function applyYearlyDecay(character: Character): void {
  const { stats } = character;
  stats.health = roundToInt(clamp(stats.health - healthDecay(character.age)));
  stats.happiness = roundToInt(clamp(stats.happiness + happinessDrift(stats.happiness)));
  stats.looks = roundToInt(clamp(stats.looks - looksDecay(character.age)));
}

/** Rising probability curve per DESIGN.md §5.8: meaningful risk past ~70. */
export function oldAgeDeathChance(age: number): number {
  if (age <= 68) return 0;
  return clamp((age - 68) * 0.035, 0, 1);
}