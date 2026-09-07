import { Character } from './types';
import { applyStatEffects } from './stats';
import { RNG } from './rng';

export interface ActivityDef {
  id: string;
  name: string;
  description: string;
  minAge: number;
  cost: number;
  perform: (character: Character, rng: RNG) => string;
}

export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'study',
    name: 'Study Harder',
    description: 'Hit the books. Increases smarts but decreases happiness.',
    minAge: 6,
    cost: 0,
    perform: (c, rng) => {
      applyStatEffects(c, { smarts: rng.rangeInt(2, 6), happiness: -rng.rangeInt(1, 4) });
      return 'You studied hard and feel a bit smarter, but also tired.';
    }
  },
  {
    id: 'gym',
    name: 'Go to the Gym',
    description: 'Work out to improve your health and looks. Costs $50.',
    minAge: 16,
    cost: 50,
    perform: (c, rng) => {
      applyStatEffects(c, { health: rng.rangeInt(2, 5), looks: rng.rangeInt(1, 3), money: -50 });
      return 'You had a great workout. You feel stronger.';
    }
  },
  {
    id: 'doctor',
    name: 'See the Doctor',
    description: 'Get a full checkup to drastically improve health. Costs $500.',
    minAge: 0,
    cost: 500,
    perform: (c, rng) => {
      applyStatEffects(c, { health: rng.rangeInt(10, 25), money: -500 });
      return 'The doctor fixed you up. You feel much healthier.';
    }
  },
  {
    id: 'vacation',
    name: 'Take a Vacation',
    description: 'Relax and unwind. Massive happiness boost. Costs $2000.',
    minAge: 18,
    cost: 2000,
    perform: (c, rng) => {
      applyStatEffects(c, { happiness: rng.rangeInt(20, 40), health: rng.rangeInt(5, 10), money: -2000 });
      return 'You took a lovely vacation and feel completely refreshed.';
    }
  },
  {
    id: 'plastic_surgery',
    name: 'Plastic Surgery',
    description: 'Improve your looks drastically, but carries a small risk. Costs $5000.',
    minAge: 18,
    cost: 5000,
    perform: (c, rng) => {
      applyStatEffects(c, { money: -5000 });
      if (rng.chance(0.1)) {
        // Botched
        applyStatEffects(c, { looks: -rng.rangeInt(10, 30), happiness: -20, health: -10 });
        return 'The surgery was botched! You look and feel terrible.';
      } else {
        applyStatEffects(c, { looks: rng.rangeInt(15, 30), happiness: 10 });
        return 'The surgery was a success! You look stunning.';
      }
    }
  }
];

export function getAvailableActivities(character: Character): ActivityDef[] {
  return ACTIVITIES.filter(a => character.age >= a.minAge && character.money >= a.cost);
}
