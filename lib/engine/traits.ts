import { TRAITS } from '@/content/traits';
import type { Character } from './types';
import { RNG } from './rng';

export const TODDLER_TRAIT_AGE_MIN = 3;
export const TODDLER_TRAIT_AGE_MAX = 5;
export const TODDLER_TRAITS_PER_ROLL = 1;

export function getCharacterFlags(character: Character): string[] {
  return [...character.traits, ...character.flags];
}

function hasToddlerTraitRolled(character: Character): boolean {
  return character.flags.includes('toddler_trait_rolled');
}

export function rollToddlerTraits(character: Character, rng: RNG): string[] {
  if (hasToddlerTraitRolled(character)) return character.traits;
  if (character.age < TODDLER_TRAIT_AGE_MIN || character.age > TODDLER_TRAIT_AGE_MAX) {
    return character.traits;
  }

  const picked = new Set<string>();
  for (let i = 0; i < TODDLER_TRAITS_PER_ROLL; i++) {
    const remaining = TRAITS.filter((t) => !picked.has(t.id));
    if (remaining.length === 0) break;
    const trait = rng.pick(remaining);
    picked.add(trait.id);
    if (!character.traits.includes(trait.id)) {
      character.traits.push(trait.id);
    }
  }

  character.flags.push('toddler_trait_rolled');
  return character.traits;
}