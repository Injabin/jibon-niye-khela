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
    name: 'The Long View',
    description: 'Lived to at least 90.',
    evaluate: (c) => c.age >= 90,
  },
  {
    id: 'scholar',
    name: 'Cap and Gown',
    description: 'Completed post-secondary education.',
    evaluate: (c) => c.education.graduated === true,
  },
  {
    id: 'straight_a',
    name: 'Valedictorian Energy',
    description: 'Kept a high GPA through school.',
    evaluate: (c) => c.flags.includes('gpa_high'),
  },
  {
    id: 'tycoon',
    name: 'Serious Money',
    description: 'Banked 200,000 coins.',
    evaluate: (c) => c.money >= 200_000,
  },
  {
    id: 'homeowner',
    name: 'Keys to the Door',
    description: 'Bought a home.',
    evaluate: (c) => c.flags.includes('has_house'),
  },
  {
    id: 'family_life',
    name: 'Next Generation',
    description: 'Had a child.',
    evaluate: (c) => c.flags.includes('has_child'),
  },
  {
    id: 'veteran',
    name: 'Bars and Ribbons',
    description: 'Served in the military.',
    evaluate: (c) => c.flags.includes('job_military'),
  },
  {
    id: 'excon',
    name: 'Rehabilitation Story',
    description: 'Served a sentence and came back.',
    evaluate: (c) => c.criminalRecord.some((e) => e.served === true),
  },
  {
    id: 'celebrity',
    name: 'Household Name',
    description: 'Reached 80 fame.',
    evaluate: (c) => c.reputation.fame >= 80,
  },
];

export function evaluateRibbons(character: Character): string[] {
  return RIBBONS.filter((ribbon) => ribbon.evaluate(character)).map((ribbon) => ribbon.id);
}

export function ribbonById(id: string): RibbonDef | undefined {
  return RIBBONS.find((r) => r.id === id);
}