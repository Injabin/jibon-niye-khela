import { Character, LifeEventDef } from './types';
import { applyYearlyDecay, applyStatEffects } from './stats';
import { applyYearlyIncome } from './economy';
import { RNG } from './rng';
import { drawYearlyEvents } from './events/registry';

export interface AgeUpResult {
  character: Character;
  firedEvents: LifeEventDef[];
}

export function ageUp(character: Character, rng: RNG): AgeUpResult {
  if (!character.alive) return { character, firedEvents: [] };

  character.age += 1;

  // Apply yearly decay and economy
  applyYearlyDecay(character, rng);
  applyYearlyIncome(character, rng);

  // Check for death via health
  if (character.stats.health <= 0) {
    character.alive = false;
    character.causeOfDeath = 'health complications';
    character.history.push({
      age: character.age,
      text: `You died at the age of ${character.age} from health complications.`,
      tone: 'bad'
    });
    return { character, firedEvents: [] };
  }

  // Very simple old age death risk past 70
  if (character.age >= 70) {
    const deathChance = (character.age - 60) * 0.02; // e.g. age 70 = 20%, 80 = 40%
    if (rng.chance(deathChance)) {
      character.alive = false;
      character.causeOfDeath = 'old age';
      character.history.push({
        age: character.age,
        text: `You passed away peacefully from old age at ${character.age}.`,
        tone: 'neutral'
      });
      return { character, firedEvents: [] };
    }
  }

  const firedEvents = drawYearlyEvents(character, rng);

  return { character, firedEvents };
}

// Helper to simulate an event choice
export function resolveEventChoice(character: Character, eventId: string, choiceId: string, registry: LifeEventDef[]): void {
  const event = registry.find(e => e.id === eventId);
  if (!event) return;
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return;

  applyStatEffects(character, choice.effects);
  character.history.push({
    age: character.age,
    text: choice.outcomeText,
    tone: choice.tone
  });
  
  // Death check after event
  if (character.stats.health <= 0 && character.alive) {
    character.alive = false;
    character.causeOfDeath = 'fatal event complication';
    character.history.push({
      age: character.age,
      text: `You succumbed to your injuries at age ${character.age}.`,
      tone: 'bad'
    });
  }
}
