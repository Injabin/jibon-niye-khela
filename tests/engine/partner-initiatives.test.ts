import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  activeRomances,
  resolveRomanceDramaChoice,
  rollPartnerInitiative,
} from '@/lib/engine/romance';
import {
  buildSingleAskoutEvent,
  buildPartnerBabyProposalEvent,
} from '@/content/events/partnerInitiatives';
import { generateFamilyTree, type FamilyTree } from '@/lib/engine/family';
import type { Character, Relationship } from '@/lib/engine/types';

function makeCharacter(seed: number, age: number): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  return character;
}

function pushFriend(
  character: Character,
  id: string,
  age: number,
  meter: number,
  relation: Relationship['relation'] = 'friend'
): Relationship {
  const rel: Relationship = {
    id,
    relation,
    name: 'রফিক ভাই',
    age,
    alive: true,
    meter,
    metAge: character.age - 5,
    lastMetAge: character.age - 1,
  };
  character.relationships.push(rel);
  return rel;
}

function findSeedFire(
  prepare: (c: Character) => void,
  check: (initiative: ReturnType<typeof rollPartnerInitiative> | null) => boolean,
  max = 400
): { seed: number; character: Character } | null {
  for (let seed = 0; seed < max; seed++) {
    const { character } = createCharacter(seed);
    prepare(character);
    const initiative = rollPartnerInitiative(character, new RNG(seed));
    if (check(initiative)) return { seed, character };
  }
  return null;
}

describe('PART I — NPC-initiated events from the player\u2019s entourage', () => {
  it('a lone NPC asks a single player out once bond, age floor and age gap line up', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 22;
        pushFriend(c, 'crush', c.age - 1, 70);
      },
      (i) => i?.kind === 'single_askout' && i.npcId === 'crush'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const rel = character.relationships.find((r) => r.id === 'crush')!;
    const happinessBefore = character.stats.happiness;
    const event = buildSingleAskoutEvent(character, { kind: 'single_askout', npcId: 'crush' });
    expect(event.drama).toEqual({ action: 'single_askout', relationshipIds: ['crush'] });
    expect(event.choices.map((x) => x.id)).toEqual(['askout_yes', 'askout_no']);

    resolveRomanceDramaChoice(character, event, 'askout_yes');
    expect(rel.relation).toBe('dating');
    expect(rel.romanceStage).toBe('dating');
    expect(character.stats.happiness).toBeGreaterThan(happinessBefore);
    expect(character.history.length).toBeGreaterThan(0);
    expect(activeRomances(character).map((r) => r.id)).toContain('crush');
  });

  it('no askout before age 18, even with a strong bond', () => {
    for (let seed = 0; seed < 150; seed++) {
      const character = makeCharacter(seed, 16);
      pushFriend(character, 'kid', 17, 90);
      expect(rollPartnerInitiative(character, new RNG(seed))).toBeNull();
    }
  });

  it('no askout while the player is already dating, partnered or married', () => {
    for (let seed = 0; seed < 150; seed++) {
      const character = makeCharacter(seed, 25);
      pushFriend(character, 'older_friend', 27, 90);
      character.relationships.push({
        id: 'current', relation: 'dating', name: 'পুরনো প্রেম', age: 26, alive: true, meter: 80, metAge: 24, romanceStage: 'dating',
      });
      expect(rollPartnerInitiative(character, new RNG(seed))).toBeNull();
    }
  });

  it('an NPC too far apart in age never solicits', () => {
    for (let seed = 0; seed < 150; seed++) {
      const character = makeCharacter(seed, 20);
      pushFriend(character, 'old_timer', 45, 85);
      expect(rollPartnerInitiative(character, new RNG(seed))).toBeNull();
    }
  });

  it('declining an askout dents the bond without starting romance', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 24;
        pushFriend(c, 'shy_guy', c.age - 1, 68);
      },
      (i) => i?.kind === 'single_askout' && i.npcId === 'shy_guy'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const rel = character.relationships.find((r) => r.id === 'shy_guy')!;
    const meterBefore = rel.meter;
    const happinessBefore = character.stats.happiness;
    const event = buildSingleAskoutEvent(character, { kind: 'single_askout', npcId: 'shy_guy' });
    resolveRomanceDramaChoice(character, event, 'askout_no');

    expect(rel.relation).toBe('friend');
    expect(rel.meter).toBe(meterBefore - 12);
    expect(character.stats.happiness).toBeLessThan(happinessBefore);
  });

  it('a committed, childless partner proposes; yes runs the real tryForBaby chain', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 28;
        c.relationships.push({
          id: 'nego', relation: 'partner', name: 'নীলা', age: c.age - 2, alive: true, meter: 70, metAge: 22, romanceStage: 'partner',
        });
      },
      (i) => i?.kind === 'partner_baby_proposal' && i.partnerId === 'nego'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const partner = character.relationships.find((r) => r.id === 'nego')!;
    const tree = generateFamilyTree(character, found!.seed);
    const membersBefore = tree.members.length;
    const event = buildPartnerBabyProposalEvent(character, { kind: 'partner_baby_proposal', partnerId: 'nego' });
    expect(event.drama).toEqual({ action: 'partner_baby_proposal', relationshipIds: ['nego'] });
    expect(event.choices.map((x) => x.id)).toEqual(['baby_yes', 'baby_not_now']);

    const outcome = resolveRomanceDramaChoice(character, event, 'baby_yes', new RNG(found!.seed + 3), tree);
    expect(outcome).toEqual({ pregnancyStarted: true });
    expect(character.flags).not.toContain('has_child');
    expect(character.relationships.some((r) => r.relation === 'child' && r.age === 0)).toBe(false);
    expect(partner.pregnantSinceAge).toBe(character.age);
    expect(tree.members.length).toBe(membersBefore);
    expect(partner.relation).toBe('partner');
  });

  it('baby proposal never fires for low-bond, aged-out, or already-parent couples', () => {
    for (let seed = 0; seed < 150; seed++) {
      const character = makeCharacter(seed, 30);
      character.relationships.push({
        id: 'cool', relation: 'spouse', name: 'সোনালি আপু', age: 28, alive: true, meter: 40, metAge: 24, romanceStage: 'spouse',
      });
      character.flags.push('has_child');
      expect(rollPartnerInitiative(character, new RNG(seed))).toBeNull();
    }
  });

  it('baby_not_now leaves the couple childless and faintly worn', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 30;
        c.relationships.push({
          id: 'bird', relation: 'spouse', name: 'পরী', age: c.age - 1, alive: true, meter: 75, metAge: 26, romanceStage: 'spouse',
        });
      },
      (i) => i?.kind === 'partner_baby_proposal' && i.partnerId === 'bird'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const partner = character.relationships.find((r) => r.id === 'bird')!;
    const happinessBefore = character.stats.happiness;
    const event = buildPartnerBabyProposalEvent(character, { kind: 'partner_baby_proposal', partnerId: 'bird' });
    const tree: FamilyTree = generateFamilyTree(character, found!.seed);
    const membersBefore = tree.members.length;

    const outcome = resolveRomanceDramaChoice(character, event, 'baby_not_now', new RNG(found!.seed), tree);
    expect(outcome).toBeNull();
    expect(character.flags).not.toContain('has_child');
    expect(tree.members.length).toBe(membersBefore);
    expect(partner.meter).toBe(69);
    expect(character.stats.happiness).toBeLessThan(happinessBefore);
  });
});