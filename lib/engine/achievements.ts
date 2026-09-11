/**
 * Achievements / "Ribbons" (DESIGN.md §5.9, init.md M5 #2, TESTING.md Gate 5).
 *
 * Meta-progression evaluated against a finished (or ongoing) character —
 * purely cosmetic replay incentive, no gameplay power. A ribbon's predicate
 * reads the structured character state (age, money, education, career,
 * criminal record, flags) so lives that actually diverged earn different
 * sets. Evaluation is pure and deterministic; the *store* owns persistence.
 */

import type { Character } from './types';

export interface RibbonDef {
  id: string;
  name: string;
  description: string;
  evaluate(character: Character): boolean;
}

export const RIBBONS: readonly RibbonDef[] = [
  {
    id: 'long_life',
    name: 'দীর্ঘায়ু বাবাজি',
    description: 'মোটে ৯০ বছর এই দুনিয়ায় ঘোরা-ফেরা করেছে.',
    evaluate: (c) => c.age >= 90,
  },
  {
    id: 'scholar',
    name: 'টুপি-গাউন পরা পণ্ডিত',
    description: 'উচ্চশিক্ষা শেষ কইরা বাইর হইছে.',
    evaluate: (c) => c.education.graduated === true,
  },
  {
    id: 'straight_a',
    name: 'চাঁদের সাক্ষী ভালো ছাত্র',
    description: 'স্কুলজীবনে জিপিএ-র পাল্লা নামায় নাই।',
    evaluate: (c) => c.flags.includes('gpa_high'),
  },
  {
    id: 'tycoon',
    name: 'ট্যাকা-পাগলা ধনকুবের',
    description: 'হাতে ২ লাখ টাকা গাদা কইরা রাখছে।',
    evaluate: (c) => c.money >= 200_000,
  },
  {
    id: 'homeowner',
    name: 'ঘরের চাবি কড়া হাতে',
    description: 'আপনা-আপনার ঘর কিনছে।',
    evaluate: (c) => c.flags.includes('has_house'),
  },
  {
    id: 'family_life',
    name: 'পরের প্রজন্ম',
    description: 'ছেলে-মেয়ের মুখ দ্যাখা হইছে।',
    evaluate: (c) => c.flags.includes('has_child'),
  },
  {
    id: 'veteran',
    name: 'পদক আর কাঁধের ক্রেস্ট',
    description: 'সেনাবাহিনীতে চাকরি দিয়া বাইর হইছে।',
    evaluate: (c) => c.flags.includes('job_military'),
  },
  {
    id: 'excon',
    name: 'ঘুরে দাঁড়ানোর গল্প',
    description: 'সাজা খাইয়া উট্টা আবার ভাত-কাপড়ের পথে ফিরছে।',
    evaluate: (c) => c.criminalRecord.some((e) => e.served === true),
  },
  {
    id: 'celebrity',
    name: 'মহল্লার চেনা-জানা নাম',
    description: '৮০ পয়েন্ট খ্যাতি গড়া কইরা ফেলছে।',
    evaluate: (c) => c.reputation.fame >= 80,
  },
];

export function evaluateRibbons(character: Character): string[] {
  return RIBBONS.filter((ribbon) => ribbon.evaluate(character)).map((ribbon) => ribbon.id);
}

export function ribbonById(id: string): RibbonDef | undefined {
  return RIBBONS.find((r) => r.id === id);
}