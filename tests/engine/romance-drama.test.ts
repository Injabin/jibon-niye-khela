import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  activeRomances,
  resolveRomanceDramaChoice,
  rollRomanceDrama,
} from '@/lib/engine/romance';
import { buildRomanceDramaEvent } from '@/content/events/infidelity';
import type { Character, Relationship } from '@/lib/engine/types';

function makeCharacter(seed: number, age: number): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  return character;
}

function romance(
  character: Character,
  id: string,
  relation: Relationship['relation'],
  meter: number
): Relationship {
  const rel: Relationship = {
    id,
    relation,
    name: relation === 'spouse' ? 'সোনালি আপু' : 'মজনু ভাই',
    age: character.age + 1,
    alive: true,
    meter,
    metAge: character.age - 2,
    romanceStage: relation === 'dating' ? 'dating' : relation === 'spouse' ? 'spouse' : 'partner',
  };
  character.relationships.push(rel);
  return rel;
}

describe('PART F — romance drama detection', () => {
  it('activeRomances only counts living committed ties', () => {
    const character = makeCharacter(1, 25);
    romance(character, 'a', 'partner', 60);
    romance(character, 'b', 'dating', 60);
    const dead = romance(character, 'c', 'spouse', 60);
    dead.alive = false;
    character.relationships.push({ id: 'x', relation: 'ex', name: 'ভুতুড়ে', age: 25, alive: true, meter: 40, metAge: 0 });

    const active = activeRomances(character).map((r) => r.id);
    expect(active.sort()).toEqual(['a', 'b']);
  });

  it('a neglected partner who gets caught triggers an npc_affair event', () => {
    const character = makeCharacter(1, 30);
    const rel = romance(character, 'affair_target', 'partner', 30);
    const drama = rollRomanceDrama(character, new RNG(7));

    expect(drama).not.toBeNull();
    expect(drama!.kind).toBe('npc_affair');
    expect(drama!.relationshipIds).toEqual(['affair_target']);
    expect(rel.affairCount).toBe(1);
  });

  it('a silent NPC affair never surfaces but quietly sours the bond', () => {
    const character = makeCharacter(1, 30);
    const rel = romance(character, 'affair_silent', 'partner', 30);
    const drama = rollRomanceDrama(character, new RNG(39));

    expect(drama).toBeNull();
    expect(rel.affairCount).toBe(1);
    expect(rel.meter).toBe(22);
  });

  it('juggling two partners for three straight years risks exposure', () => {
    const character = makeCharacter(1, 25);
    romance(character, 'p1', 'partner', 50);
    romance(character, 'p2', 'partner', 50);
    character.illicit = { sinceAge: 22 };

    const drama = rollRomanceDrama(character, new RNG(2));

    expect(drama).not.toBeNull();
    expect(drama!.kind).toBe('multi_caught');
    expect(drama!.relationshipIds.sort()).toEqual(['p1', 'p2']);
  });

  it('starting a juggle tracks from the first year without firing early', () => {
    const character = makeCharacter(1, 25);
    romance(character, 'p1', 'partner', 50);
    romance(character, 'p2', 'partner', 50);

    const drama = rollRomanceDrama(character, new RNG(2));

    expect(drama).toBeNull();
    expect(character.illicit?.sinceAge).toBe(25);
  });
});

describe('PART F — drama choice resolution', () => {
  it('forgiving a cheating partner restores bond and karma at a happiness cost', () => {
    const character = makeCharacter(1, 30);
    const rel = romance(character, 'affair_target', 'partner', 30);
    const event = buildRomanceDramaEvent(character, { kind: 'npc_affair', relationshipIds: ['affair_target'] });
    const karmaBefore = character.reputation.karma;

    resolveRomanceDramaChoice(character, event, 'affair_forgive');

    expect(rel.relation).toBe('partner');
    expect(rel.meter).toBe(45);
    expect(character.reputation.karma).toBe(karmaBefore + 6);
    expect(character.history.length).toBeGreaterThan(0);
  });

  it('ending the relationship over an affair severs it into an ex', () => {
    const character = makeCharacter(1, 30);
    const rel = romance(character, 'affair_target', 'spouse', 30);
    character.flags.push('is_married', 'has_spouse');
    const event = buildRomanceDramaEvent(character, { kind: 'npc_affair', relationshipIds: ['affair_target'] });

    resolveRomanceDramaChoice(character, event, 'affair_end');

    expect(rel.relation).toBe('ex');
    expect(rel.romanceStage).toBe('ex');
    expect(character.flags).not.toContain('is_married');
    expect(character.flags).toContain('divorced');
  });

  it('keeping one partner severs the rest and keeps the strongest bond', () => {
    const character = makeCharacter(1, 25);
    const primary = romance(character, 'p1', 'partner', 80);
    const secondary = romance(character, 'p2', 'partner', 40);
    const karmaBefore = character.reputation.karma;
    const event = buildRomanceDramaEvent(character, {
      kind: 'multi_caught',
      relationshipIds: ['p1', 'p2'],
    });
    const luckyRng = { chance: () => true } as unknown as RNG;

    resolveRomanceDramaChoice(character, event, 'multi_stay_one', luckyRng);

    expect(primary.relation).toBe('partner');
    expect(primary.meter).toBe(90);
    expect(secondary.relation).toBe('ex');
    expect(character.reputation.karma).toBe(karmaBefore + 1);
    expect(character.relationships.filter((r) => r.alive && r.relation !== 'ex').length).toBeGreaterThanOrEqual(1);
  });

  it('a rejected pick on a caught lie means even the chosen one leaves', () => {
    const character = makeCharacter(1, 25);
    const primary = romance(character, 'p1', 'partner', 80);
    const secondary = romance(character, 'p2', 'partner', 40);
    const karmaBefore = character.reputation.karma;
    const event = buildRomanceDramaEvent(character, {
      kind: 'multi_caught',
      relationshipIds: ['p1', 'p2'],
    });

    resolveRomanceDramaChoice(character, event, 'multi_stay_two');

    expect(primary.relation).toBe('ex');
    expect(secondary.relation).toBe('ex');
    expect(character.reputation.karma).toBe(karmaBefore - 5);
  });

  it('denying everything costs karma and severs every romance', () => {
    const character = makeCharacter(1, 25);
    const p1 = romance(character, 'p1', 'partner', 50);
    const p2 = romance(character, 'p2', 'partner', 50);
    const karmaBefore = character.reputation.karma;
    const event = buildRomanceDramaEvent(character, {
      kind: 'multi_caught',
      relationshipIds: ['p1', 'p2'],
    });

    resolveRomanceDramaChoice(character, event, 'multi_lie');

    expect(character.reputation.karma).toBe(karmaBefore - 18);
    expect(p1.relation).toBe('ex');
    expect(p2.relation).toBe('ex');
    expect(character.relationships.filter((r) => r.relation === 'partner').length).toBe(0);
  });
});