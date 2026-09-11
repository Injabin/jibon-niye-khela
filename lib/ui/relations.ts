import type { Relation } from '@/lib/engine/types';

/** Dhakaiya Bangla labels for every engine relation id (kill any English fallback). */
export const RELATION_LABELS: Record<Relation, string> = {
  mother: 'আম্মা (মা)',
  father: 'আব্বা (বাবা)',
  grandparent: 'দাদা-নানারা',
  sibling: 'ভাই-বোন',
  spouse: 'বউ / স্বামী',
  child: 'সন্তান (ছেলে-মেয়ে)',
  partner: 'মনের মানুষ',
  friend: 'কাছের দোস্ত',
  pet: 'লাইফের পোষা সাথী',
  crush: 'ক্রাশ (পছন্দের জন)',
  dating: 'প্রেমের সম্পর্ক (ডেটিং)',
  ex: 'প্রাক্তন (সাবেক প্রেম)',
  classmate: 'সহপাঠী',
  coworker: 'সহকর্মী',
};

/** Always returns a Dhakaiya label; unknown ids degrade to the raw token wrapped in parens. */
export function relLabel(relation: string): string {
  return RELATION_LABELS[relation as Relation] ?? `(${relation})`;
}