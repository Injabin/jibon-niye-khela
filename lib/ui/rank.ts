import type { Character } from '@/lib/engine/types';
import { lifeStageForAge } from '@/lib/engine/life';

/**
 * Title/Rank display for the Sticky Header (UI-DESIGN.md §2.1): a pure display
 * mapping onto existing character data — no new system. Order of checks is
 * deliberate: terminal states, then the most specific available signal, then
 * age-band defaults.
 */
export function rankForLife(character: Character): string {
  if (!character.alive) return 'The Departed';
  if (character.reputation.fame >= 80) return 'Warlord';
  if (character.career.jobId && (character.career.yearsAtJob >= 3 || character.career.performance >= 70)) {
    return 'Battle-Hardened Veteran';
  }
  if (character.career.jobId) return 'Soldier of Fortune';
  if (character.traits.includes('scholar') || character.education.graduated) return 'Scholar of the Arsenal';
  const stage = lifeStageForAge(character.age);
  if (stage === 'senior') return 'Elder of the Realm';
  if (character.age >= 18) return 'Free Blade';
  if (character.age >= 12) return 'Squire';
  if (character.age >= 6) return 'Page';
  return 'Swaddled Whelp';
}