import type { Character } from '@/lib/engine/types';
import { lifeStageForAge } from '@/lib/engine/life';

/**
 * Title/Rank display for the Sticky Header (UI-DESIGN.md §2.1): a pure display
 * mapping onto existing character data — no new system. Order of checks is
 * deliberate: terminal states, then the most specific available signal, then
 * age-band defaults.
 */
export function rankForLife(character: Character): string {
  if (!character.alive) return 'মরহুম / ওপারে পাড়ি দেওয়া আত্মা';
  if (character.flags.includes('in_jail')) return 'লাল দালানের কয়েদি';
  if (character.reputation.fame >= 80) return 'মহল্লার ডন ও খলিফা';
  if (character.career.jobId && (character.career.yearsAtJob >= 3 || character.career.performance >= 70)) {
    return 'পোড়খাওয়া ঘাঘু কারবারি';
  }
  if (character.career.jobId) return 'পরিশ্রমী কর্মবীর';
  if (character.traits.includes('scholar') || character.education.graduated) return 'বিদ্বান পণ্ডিত ও জ্ঞানী';
  const stage = lifeStageForAge(character.age);
  if (stage === 'senior') return 'খান্দানি মুরব্বি';
  if (character.age >= 18) return 'ড্যাশিং স্বাধীন জোয়ান';
  if (character.age >= 12) return 'চালাক চতুর ছোকরা';
  if (character.age >= 6) return 'দুরন্ত পোলাপাইন';
  return 'কোলের ছাওয়াল';
}