import { Character } from './types';
import { RNG } from './rng';

const MALE_NAMES = ['Aarav', 'Rohan', 'Kabir', 'Vivaan', 'Aditya', 'Arjun', 'Sai'];
const FEMALE_NAMES = ['Diya', 'Ananya', 'Kiara', 'Sanya', 'Priya', 'Aisha', 'Meera'];
const SURNAMES = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Das', 'Roy'];

export function createCharacter(seed: number): { character: Character, rng: RNG } {
  const rng = new RNG(seed);
  const gender = rng.chance(0.5) ? 'male' : 'female';
  const name = gender === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
  const surname = rng.pick(SURNAMES);
  
  const character: Character = {
    id: rng.rangeInt(100000, 999999).toString(),
    name,
    surname,
    gender,
    birthYear: new Date().getFullYear(),
    stats: {
      health: rng.rangeInt(80, 100),
      happiness: rng.rangeInt(70, 100),
      smarts: rng.rangeInt(20, 100),
      looks: rng.rangeInt(10, 100),
    },
    money: 0,
    age: 0,
    alive: true,
    traits: [],
    history: [{
      age: 0,
      text: `You were born a ${gender}. Your name is ${name} ${surname}.`,
      tone: 'neutral'
    }]
  };

  return { character, rng };
}
