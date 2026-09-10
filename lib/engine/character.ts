import { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '@/content/names';
import { RNG } from './rng';
import { clamp } from './stats';
import type { Character, CreateCharacterResult, CustomCharacterOptions, Gender } from './types';

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

export function createCharacter(seed: number, options?: CustomCharacterOptions): CreateCharacterResult {
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
    aiCallsUsed: 0,
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
        text: `${birthYear} সালে পুরান ঢাকায় ${name} ${surname} নামে তোমার জন্ম হইলো! পাড়ার মুরব্বিরা কইলো—"মাশাল্লাহ, এক্কেরে চাঁদের টুকরা, তয় চিল্লাচিল্লি দেখলে মনে হয় আস্ত সাইরেন!"`,
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
    recentEventHistory: [],
  };

  // Apply custom life overrides if requested
  if (options) {
    if (options.gender) character.gender = options.gender;
    if (options.name) character.name = options.name;
    if (options.surname) {
      character.surname = options.surname;
      // Update parental surnames to match
      const mother = character.relationships.find((r) => r.relation === 'mother');
      if (mother) mother.name = `${mother.name.split(' ')[0]} ${options.surname}`;
      const father = character.relationships.find((r) => r.relation === 'father');
      if (father) father.name = `${father.name.split(' ')[0]} ${options.surname}`;
    }
    if (options.birthYear !== undefined) character.birthYear = options.birthYear;

    character.history[0] = {
      age: 0,
      text: `${character.birthYear} সালে পুরান ঢাকায় ${character.name} ${character.surname} নামে তোমার জন্ম হইলো! পাড়ার মুরব্বিরা কইলো—"মাশাল্লাহ, এক্কেরে চাঁদের টুকরা, তয় চিল্লাচিল্লি দেখলে মনে হয় আস্ত সাইরেন!"`,
      tone: 'funny',
    };

    if (options.wealthTier === 'poor') {
      character.money = 10;
      character.reputation.karma = clamp(character.reputation.karma + 15);
      character.stats.happiness = clamp(character.stats.happiness - 10);
      character.stats.health = clamp(character.stats.health - 5);
    } else if (options.wealthTier === 'wealthy') {
      character.money = 2500;
      character.stats.happiness = clamp(character.stats.happiness + 10);
      character.stats.looks = clamp(character.stats.looks + 5);
    } else if (options.wealthTier === 'middle') {
      character.money = 250;
    }

    if (options.startingTraits && options.startingTraits.length > 0) {
      character.traits = [...new Set(options.startingTraits.slice(0, 2))];
    }

    character.statHistory[0] = {
      age: 0,
      health: character.stats.health,
      happiness: character.stats.happiness,
      smarts: character.stats.smarts,
      looks: character.stats.looks,
    };
  }

  return { character, rng };
}