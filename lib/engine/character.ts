import { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';
import { RNG } from './rng';
import { clamp } from './stats';
import type { Character, CreateCharacterResult, Gender } from './types';

export function generateId(rng: RNG): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars[rng.rangeInt(0, chars.length - 1)];
  }
  return id;
}

function rollGender(rng: RNG): Gender {
  return rng.chance(0.5) ? 'male' : 'female';
}

function generateFirstName(gender: Gender, rng: RNG): string {
  return gender === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
}

export function createCharacter(seed: number): CreateCharacterResult {
  const rng = new RNG(seed);
  const gender = rollGender(rng);
  const name = generateFirstName(gender, rng);
  const surname = rng.pick(SURNAMES);

  const motherName = `${rng.pick(FEMALE_NAMES)} ${surname}`;
  const fatherName = `${rng.pick(MALE_NAMES)} ${surname}`;

  const motherLooks = rng.rangeInt(45, 90);
  const fatherLooks = rng.rangeInt(45, 90);

  const birthYear = rng.rangeInt(1998, 2010);

  const stats = {
    health: rng.rangeInt(65, 100),
    happiness: rng.rangeInt(55, 85),
    smarts: rng.rangeInt(35, 90),
    looks: clamp(Math.round((motherLooks + fatherLooks) / 2) + rng.rangeInt(-10, 10)),
  };

  const character: Character = {
    id: generateId(rng),
    name,
    surname,
    gender,
    birthYear,
    stats,
    money: 30,
    age: 0,
    alive: true,
    traits: [],
    flags: [],
    reputation: { fame: 35, karma: 55 },
    education: {
      stage: 'none',
      enrolled: false,
      gpa: 0,
      major: '',
      graduated: false,
    },
    career: { jobId: null, performance: 50, yearsAtJob: 0 },
    assets: [],
    relationships: [
      {
        id: generateId(rng),
        relation: 'mother',
        name: motherName,
        age: rng.rangeInt(24, 38),
        alive: true,
        meter: 80,
        metAge: 0,
      },
      {
        id: generateId(rng),
        relation: 'father',
        name: fatherName,
        age: rng.rangeInt(26, 42),
        alive: true,
        meter: 78,
        metAge: 0,
      },
    ],
    criminalRecord: [],
    history: [
      {
        age: 0,
        text: `You were born in ${birthYear} as ${name} ${surname}. Relatives compare you to a potato with eyelashes.`,
        tone: 'funny',
      },
    ],
    statHistory: [
      {
        age: 0,
        health: stats.health,
        happiness: stats.happiness,
        smarts: stats.smarts,
        looks: stats.looks,
      },
    ],
  };

  return { character, rng };
}