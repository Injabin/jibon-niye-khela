/**
 * Systems tick (init.md M5 #2, AGENT.md §5 engine-first).
 *
 * Runs each system's yearly maintenance in priority order every age-up:
 * education → career → assets → crime → health. Health runs last so an
 * incident may kill through `checkForDeath` in the same year. Outcomes that
 * are noteworthy (graduations, promotions, releases, incidents) are pushed
 * to the character's history; quiet years stay silent.
 */

import type { RNG } from '@/lib/engine/rng';
import type { Character, Tone } from '@/lib/engine/types';
import { tickAssets } from './assets';
import { tickCareer } from './career';
import { tickCrime } from './crime';
import { tickEducation } from './education';
import { tickHealth } from './health';

export interface TickReport {
  text: string;
  tone: Tone;
}

export function tickSystems(character: Character, rng: RNG): TickReport[] {
  if (!character.alive) return [];

  const reports: (TickReport | null)[] = [
    tickEducation(character, rng),
    tickCareer(character, rng),
    tickAssets(character, rng),
    tickCrime(character),
    tickHealth(character, rng),
  ];

  const noteworthy = reports.filter((r): r is TickReport => r !== null);
  for (const report of noteworthy) {
    character.history.push({ age: character.age, text: report.text, tone: report.tone });
  }
  return noteworthy;
}