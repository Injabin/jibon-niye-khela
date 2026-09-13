import { EVENT_REGISTRY } from '@/content/events';
import { applyStatEffects } from '../stats';
import { getCharacterFlags } from '../traits';
import type { RNG } from '../rng';
import type { Character, LifeEventDef, Relation, RelationshipState } from '../types';
import { renderTemplate } from './template';

const MAX_YEARLY_EVENTS = 3;
export const EVENT_COOLDOWN_YEARS = 15;

/** Derive a character's current relationship states from living relations and flags. */
export function getRelationshipState(character: Character): RelationshipState[] {
  const active = character.relationships.filter((r) => r.alive);
  const hasSpouse = active.some((r) => r.relation === 'spouse');
  const hasPartner = active.some((r) => r.relation === 'partner');
  const hasDating = active.some((r) => r.relation === 'dating');

  const states: RelationshipState[] = [];
  if (hasSpouse) states.push('married');
  else if (hasPartner) states.push('partnered');
  else if (hasDating) states.push('dating');
  else states.push('single');

  if (character.flags.includes('divorced')) states.push('divorced');
  if (character.flags.includes('widowed')) states.push('widowed');
  if (active.some((r) => r.relation === 'child') || character.flags.includes('has_child')) {
    states.push('has_child');
  }
  if (character.flags.includes('has_pet')) states.push('has_pet');
  return states;
}

function isEventEligible(event: LifeEventDef, character: Character, flags: Set<string>): boolean {
  if (character.age < event.minAge || character.age > event.maxAge) return false;

  // Gender / religion targeting (default 'any')
  if (event.gender && event.gender !== 'any' && event.gender !== character.gender) return false;
  if (event.religion && event.religion !== 'any' && event.religion !== character.religion) return false;

  // Relationship-state gating
  if (event.relationshipState || event.antiRelationshipState) {
    const relStates = new Set<RelationshipState>(getRelationshipState(character));
    if (event.relationshipState && !event.relationshipState.every((s) => relStates.has(s))) return false;
    if (event.antiRelationshipState && event.antiRelationshipState.some((s) => relStates.has(s))) return false;
  }

  // Once-per-life: skip if this event has ever fired before
  if (event.oncePerLife && character.recentEventHistory?.some((r) => r.id === event.id)) return false;

  // Dynamic live condition (e.g. "has a school-aged child")
  if (event.predicate && !event.predicate(character)) return false;

  // Flag-based gating
  if (event.requiredFlags && !event.requiredFlags.every((flag) => flags.has(flag))) return false;
  if (event.antiFlags && event.antiFlags.some((flag) => flags.has(flag))) return false;

  // Anti-repetition: exclude if fired within the last 15 years
  if (character.recentEventHistory) {
    for (let i = character.recentEventHistory.length - 1; i >= 0; i--) {
      const recent = character.recentEventHistory[i];
      if (recent.id === event.id) {
        if (character.age - recent.age < EVENT_COOLDOWN_YEARS) {
          return false;
        }
        break;
      }
    }
  }

  return true;
}

export function getEligibleEventsFrom(
  registry: readonly LifeEventDef[],
  character: Character
): LifeEventDef[] {
  const flags = new Set(getCharacterFlags(character));
  return registry.filter((event) => isEventEligible(event, character, flags));
}

export function getEligibleEvents(character: Character): LifeEventDef[] {
  return getEligibleEventsFrom(EVENT_REGISTRY, character);
}

/** Weighted pick with no replacement; returns a new array without the picked item. */
export function pickWeighted(pool: readonly LifeEventDef[], rng: RNG): LifeEventDef {
  if (pool.length === 0) {
    throw new Error('Cannot pick from an empty event pool');
  }
  const totalWeight = pool.reduce((sum, event) => sum + Math.max(0, event.weight), 0);
  if (totalWeight <= 0) {
    throw new Error('Event pool has no positive weight');
  }
  let roll = rng.next() * totalWeight;
  for (const event of pool) {
    roll -= Math.max(0, event.weight);
    if (roll < 0) return event;
  }
  return pool[pool.length - 1];
}

/** Bind living NPC names to the reserved {{role}} tokens used by relationship events. */
function buildEventNames(character: Character): Record<string, string> {
  const living = character.relationships.filter((r) => r.alive);
  const first = (role: Relation) => living.find((r) => r.relation === role)?.name ?? '';
  const schoolAgedChild =
    living
      .filter((r) => r.relation === 'child')
      .sort((a, b) => (a.age ?? 0) - (b.age ?? 0))
      .find((r) => (r.age ?? character.age) >= 6 && (r.age ?? character.age) <= 17) ??
    living.find((r) => r.relation === 'child');
  return {
    spouse: first('spouse'),
    partner: first('partner'),
    mother: first('mother'),
    father: first('father'),
    sibling: first('sibling'),
    child: schoolAgedChild?.name ?? '',
    ex: first('ex'),
    university: character.education.university?.name ?? '',
  };
}

export function drawYearlyEventsFrom(
  registry: readonly LifeEventDef[],
  character: Character,
  rng: RNG
): LifeEventDef[] {
  const eligible = getEligibleEventsFrom(registry, character);
  if (eligible.length === 0) return [];

  const count = rng.rangeInt(0, MAX_YEARLY_EVENTS);
  const pool = [...eligible];
  const drawn: LifeEventDef[] = [];
  const names = buildEventNames(character);

  for (let i = 0; i < count && pool.length > 0; i++) {
    const picked = pickWeighted(pool, rng);
    const rendered: LifeEventDef = {
      ...picked,
      text: renderTemplate(picked.text, rng, names),
      choices: picked.choices.map((c) => ({
        ...c,
        text: renderTemplate(c.text, rng, names),
        outcomeText: renderTemplate(c.outcomeText, rng, names),
      })),
    };
    drawn.push(rendered);

    if (!character.recentEventHistory) {
      character.recentEventHistory = [];
    }
    character.recentEventHistory.push({ id: picked.id, age: character.age });

    pool.splice(pool.indexOf(picked), 1);
  }

  return drawn;
}

export function drawYearlyEvents(character: Character, rng: RNG): LifeEventDef[] {
  return drawYearlyEventsFrom(EVENT_REGISTRY, character, rng);
}

export function resolveEventChoice(character: Character, event: LifeEventDef, choiceId: string) {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Unknown choice "${choiceId}" for event "${event.id}"`);
  }

  applyStatEffects(character, choice.effects);
  character.history.push({
    age: character.age,
    text: `${event.text} ${choice.outcomeText}`.trim(),
    tone: choice.tone,
  });

  if (!character.recentEventHistory) {
    character.recentEventHistory = [];
  }
  if (!character.recentEventHistory.some((r) => r.id === event.id && r.age === character.age)) {
    character.recentEventHistory.push({ id: event.id, age: character.age });
  }
}