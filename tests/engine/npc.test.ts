import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import { ageUp, ageNonFamilyNpcs, npcDeathChance } from '@/lib/engine/aging';
import { ageFamilyMembers, generateFamilyTree } from '@/lib/engine/family';
import { createCharacter } from '@/lib/engine/character';
import { seedClassmates, seedCoworkers } from '@/lib/engine/relationships';
import { RNG } from '@/lib/engine/rng';
import type { Character, Relationship } from '@/lib/engine/types';

function atAge(seed: number, age: number, flags: string[] = []): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  character.flags.push(...flags);
  return character;
}

function pushRel(character: Character, rel: Partial<Relationship>): Relationship {
  const full: Relationship = {
    id: rel.id ?? 'R1',
    relation: rel.relation ?? 'friend',
    name: rel.name ?? 'বন্ধু',
    age: rel.age ?? character.age,
    alive: rel.alive ?? true,
    meter: rel.meter ?? 60,
    metAge: rel.metAge ?? 0,
    health: rel.health,
    happiness: rel.happiness,
    jobId: rel.jobId,
    lastMetAge: rel.lastMetAge,
  };
  character.relationships.push(full);
  return full;
}

beforeEach(() => {
  useGameStore.getState().resetGame();
  localStorage.clear();
});

describe('C: NPC vitals at creation', () => {
  it('parents start with health, happiness and lastMetAge', () => {
    const { character } = createCharacter(1);
    const mother = character.relationships.find((r) => r.relation === 'mother');
    const father = character.relationships.find((r) => r.relation === 'father');
    expect(mother?.health).toBeDefined();
    expect(mother?.happiness).toBeDefined();
    expect(mother?.lastMetAge).toBe(0);
    expect(father?.health).toBeDefined();
    expect(father?.happiness).toBeDefined();
    expect(father?.lastMetAge).toBe(0);
  });

  it('classmates carry vitals and coworkers carry a jobId', () => {
    const { character, rng } = createCharacter(2);
    seedClassmates(character, rng);
    seedCoworkers(character, rng);
    const classmates = character.relationships.filter((r) => r.relation === 'classmate');
    const coworkers = character.relationships.filter((r) => r.relation === 'coworker');
    expect(classmates.length).toBeGreaterThan(0);
    expect(coworkers.length).toBeGreaterThan(0);
    for (const cm of classmates) {
      expect(cm.health).toBeGreaterThanOrEqual(70);
      expect(cm.happiness).toBeTruthy();
    }
    for (const cw of coworkers) {
      expect(cw.jobId).toMatch(/^job_/);
      expect(cw.health).toBeDefined();
    }
  });
});

describe('C: passive decay and death rolls', () => {
  it('death chance is monotonic and small for the young', () => {
    expect(npcDeathChance(20)).toBeLessThan(npcDeathChance(60));
    expect(npcDeathChance(60)).toBeLessThan(npcDeathChance(80));
    expect(npcDeathChance(80)).toBeLessThan(npcDeathChance(100));
    expect(npcDeathChance(20)).toBe(0.0015);
  });

  it('non-family meters decay each year; family meters are untouched by NPC aging', () => {
    const char = atAge(3, 30);
    pushRel(char, { id: 'friend', relation: 'friend', meter: 80, health: 90, happiness: 80 });
    const father = char.relationships.find((r) => r.relation === 'father')!;
    const fatherBefore = father.meter;
    const friend = char.relationships.find((r) => r.id === 'friend')!;
    const friendBefore = friend.meter;

    const rng = new RNG(8);
    ageNonFamilyNpcs(char, rng);

    expect(friend.meter).toBe(friendBefore - 1);
    expect(friend.health).toBeLessThanOrEqual(90);
    expect(father.meter).toBe(fatherBefore);
    expect(father.alive).toBe(true);
  });

  it('skips family-owned relations even at extreme age', () => {
    const char = atAge(4, 30);
    pushRel(char, { id: 'spouse', relation: 'spouse', age: 100, alive: true });
    pushRel(char, { id: 'child', relation: 'child', age: 5, alive: true });
    const rng = new RNG(9);
    for (let i = 0; i < 20; i++) ageNonFamilyNpcs(char, rng);
    expect(char.relationships.find((r) => r.id === 'spouse')!.alive).toBe(true);
    expect(char.relationships.find((r) => r.id === 'child')!.alive).toBe(true);
  });

  it('a very old friend eventually dies over a deterministic run', () => {
    const { character, rng } = createCharacter(5);
    character.age = 30;
    pushRel(character, { id: 'oldfriend', relation: 'friend', age: 99, health: 60, happiness: 40 });
    const friend = character.relationships.find((r) => r.id === 'oldfriend')!;

    let years = 0;
    while (character.alive && friend.alive && years < 40) {
      ageUp(character, rng);
      years += 1;
    }
    expect(friend.alive).toBe(false);
    expect(years).toBeLessThanOrEqual(40);
  });

  it('NPC death gets logged to the timeline', () => {
    const char = atAge(6, 30);
    const friend = pushRel(char, { id: 'doom', relation: 'friend', age: 99, health: 1, happiness: 10 });
    const rng = new RNG(11);
    const before = char.history.length;
    let deathLogged = false;
    for (let i = 0; i < 60 && !deathLogged; i++) {
      const { character: grown } = ageUp(char, rng);
      deathLogged =
        grown.history.length > before &&
        grown.history.some((h) => h.text.includes(friend.name));
      void grown;
    }
    expect(deathLogged).toBe(true);
  });
});

describe('C: family bond decay', () => {
  it('ageFamilyMembers cools bonds by one per year, floored at 30', () => {
    const { character } = createCharacter(7);
    const tree = generateFamilyTree(character, 7);
    const motherBefore = tree.members.find((m) => m.role === 'mother')!.bond;
    const aged = ageFamilyMembers(tree, 1, new RNG(13));
    const mother = aged.members.find((m) => m.role === 'mother')!;
    expect(mother.bond).toBe(Math.max(30, motherBefore - 1));
  });
});

describe('C: lastMetAge updates on interaction (store)', () => {
  it('interactWithPerson records the current character age', () => {
    useGameStore.getState().newGame(9);
    useGameStore.setState((st) => ({
      character:
        st.character && {
          ...st.character,
          age: 25,
          relationships: [
            ...st.character.relationships,
            {
              id: 'buddy',
              relation: 'friend',
              name: 'রবিন',
              age: 25,
              alive: true,
              meter: 60,
              metAge: 20,
              health: 90,
              happiness: 80,
              lastMetAge: 20,
            },
          ],
        },
    }));

    expect(useGameStore.getState().interactWithPerson('buddy', 'chat')).toBe(true);
    const rel = useGameStore.getState().character!.relationships.find((r) => r.id === 'buddy')!;
    expect(rel.lastMetAge).toBe(25);
  });
});