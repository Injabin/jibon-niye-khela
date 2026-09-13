import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  activeRomances,
  resolvePeerInterestChoice,
  rollPeerRomanceInterest,
  PEER_INTEREST_ANNUAL_CHANCE,
} from '@/lib/engine/romance';
import { buildPeerRomanceInterestEvent } from '@/content/events/peerRomance';
import { seedCoworkers } from '@/lib/engine/relationships';
import type { Character, Relationship } from '@/lib/engine/types';

/**
 * Tries seeds in ascending order and returns the first deterministic seed (and
 * its character) where the roll fires with the expected conditions, or null.
 */
function findSeedFire(
  prepare: (c: Character) => void,
  check: (interest: ReturnType<typeof rollPeerRomanceInterest> | null) => boolean,
  max = 400
): { seed: number; character: Character } | null {
  for (let seed = 0; seed < max; seed++) {
    const { character } = createCharacter(seed);
    prepare(character);
    const interest = rollPeerRomanceInterest(character, new RNG(seed));
    if (check(interest)) return { seed, character };
  }
  return null;
}

function addPeer(
  c: Character,
  overrides: Partial<Relationship> & { relation: Relationship['relation'] }
): Relationship {
  const rel: Relationship = {
    id: overrides.id ?? 'peer_1',
    name: overrides.name ?? 'মজনু ভাই',
    age: c.age + 1,
    alive: true,
    meter: overrides.meter ?? 65,
    metAge: c.age - 3,
    lastMetAge: c.age - 1,
    ...overrides,
  };
  c.relationships.push(rel);
  return rel;
}

describe('PART H — NPC-initiated romantic interest from the peer pool', () => {
  it('reports the coworker NPC system the feature builds on: individually tracked coworkers', () => {
    const { character } = createCharacter(1);
    character.age = 24;
    character.career.jobId = 'job_office';
    const created = seedCoworkers(character, new RNG(11), 3);
    expect(created).toBeGreaterThanOrEqual(1);
    const coworkers = character.relationships.filter((r) => r.relation === 'coworker' && r.alive);
    expect(coworkers.length).toBeGreaterThanOrEqual(1);
    for (const co of coworkers) {
      expect(co.id).toBeTruthy();
      expect(co.name).toBeTruthy();
      expect(co.jobId).toBeTruthy();
      expect(co.meter).toBeGreaterThanOrEqual(0);
    }
  });

  it('a classmate never initiates without a pre-existing bond of ≥50', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { character } = createCharacter(seed);
      character.age = 16;
      addPeer(character, { id: 'shy', relation: 'classmate', meter: 49 });
      addPeer(character, { id: 'cold', relation: 'classmate', meter: 30 });
      expect(rollPeerRomanceInterest(character, new RNG(seed))).toBeNull();
    }
  });

  it('a classmate with prior bond initiates during the school window (16–17)', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 16;
        addPeer(c, { id: 'bonded', relation: 'classmate', name: 'সুমাইয়া', meter: 70 });
        const rel = c.relationships.find((r) => r.id === 'bonded')!;
        rel.metAge = c.age - 3;
        rel.lastMetAge = c.age - 1;
      },
      (i) => i?.kind === 'classmate_interest' && i.npcId === 'bonded'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const before = character.relationships.find((r) => r.id === 'bonded')!;
    const event = buildPeerRomanceInterestEvent(character, { kind: 'classmate_interest', npcId: 'bonded' });
    expect(event.choices.map((x) => x.id)).toEqual(['peer_accept', 'peer_decline']);

    resolvePeerInterestChoice(character, 'bonded', 'peer_accept', 'classmate_interest');
    const after = character.relationships.find((r) => r.id === 'bonded')!;
    expect(after.relation).toBe('dating');
    expect(after.romanceStage).toBe('dating');
    expect(after.name).toBe('সুমাইয়া');
    expect(after.meter).toBe(before.meter);
    expect(character.stats.happiness).toBeGreaterThan(-1);
    expect(character.history.length).toBeGreaterThan(0);
  });

  it('befriended classmates (relation friend) count as school romance candidates', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 17;
        addPeer(c, { id: 'bestie', relation: 'friend', meter: 75, name: 'রাকিব' });
      },
      (i) => i?.kind === 'classmate_interest' && i.npcId === 'bestie'
    );
    expect(found).not.toBeNull();
  });

  it('a coworker with prior bond initiates while the player is employed', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 27;
        c.career.jobId = 'job_office';
        addPeer(c, { id: 'desk', relation: 'coworker', name: 'নিশাত', meter: 62, jobId: 'job_office' });
      },
      (i) => i?.kind === 'coworker_interest' && i.npcId === 'desk'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const before = character.relationships.find((r) => r.id === 'desk')!;
    resolvePeerInterestChoice(character, 'desk', 'peer_accept', 'coworker_interest');
    const after = character.relationships.find((r) => r.id === 'desk')!;
    expect(after.relation).toBe('dating');
    expect(after.name).toBe('নিশাত');
    expect(after.meter).toBe(before.meter);
  });

  it('coworkers never initiate while unemployed', () => {
    for (let seed = 0; seed < 100; seed++) {
      const { character } = createCharacter(seed);
      character.age = 30;
      character.career.jobId = null;
      addPeer(character, { id: 'exdesk', relation: 'coworker', meter: 90 });
      expect(rollPeerRomanceInterest(character, new RNG(seed))).toBeNull();
    }
  });

  it('decline costs happiness and dents the friendship bond without starting romance', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 16;
        addPeer(c, { id: 'crushed', relation: 'classmate', meter: 66 });
      },
      (i) => i?.kind === 'classmate_interest' && i.npcId === 'crushed'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const rel = character.relationships.find((r) => r.id === 'crushed')!;
    const happinessBefore = character.stats.happiness;
    const meterBefore = rel.meter;

    resolvePeerInterestChoice(character, 'crushed', 'peer_decline', 'classmate_interest');
    expect(rel.relation).toBe('classmate');
    expect(rel.meter).toBe(meterBefore - 10);
    expect(character.stats.happiness).toBeLessThan(happinessBefore);
  });

  it('fires at roughly 35% per eligible NPC per year, capped at one interest per year', () => {
    let fires = 0;
    for (let seed = 0; seed < 200; seed++) {
      const { character } = createCharacter(seed);
      character.age = 16;
      addPeer(character, { id: 'solo', relation: 'classmate', meter: 70 });
      const interest = rollPeerRomanceInterest(character, new RNG(seed));
      if (interest) {
        expect(interest.npcId).toBe('solo');
        fires++;
      }
    }
    expect(fires).toBeGreaterThanOrEqual(55);
    expect(fires).toBeLessThanOrEqual(88);
    expect(PEER_INTEREST_ANNUAL_CHANCE).toBe(0.35);

    // With several eligible NPCs, at most ONE interest event per year, and it
    // names one of the eligible candidates; the highest-bond candidate is
    // preferred whenever it reciprocated, so it should win at least sometimes.
    let highestWon = 0;
    for (let seed = 0; seed < 100; seed++) {
      const { character } = createCharacter(seed);
      character.age = 16;
      addPeer(character, { id: 'a', relation: 'classmate', meter: 70 });
      addPeer(character, { id: 'b', relation: 'classmate', meter: 72 });
      addPeer(character, { id: 'c', relation: 'classmate', meter: 68 });
      const interest = rollPeerRomanceInterest(character, new RNG(seed));
      if (interest) {
        expect(['a', 'b', 'c']).toContain(interest.npcId);
        if (interest.npcId === 'b') highestWon++;
      }
    }
    expect(highestWon).toBeGreaterThanOrEqual(5);
  });

  it('can start a romance even while already partnered (multi-romance is Part F domain)', () => {
    const found = findSeedFire(
      (c) => {
        c.age = 16;
        addPeer(c, { id: 'existing', relation: 'dating', name: 'পুরনো প্রেম', meter: 80 });
        addPeer(c, { id: 'second', relation: 'classmate', meter: 70 });
      },
      (i) => i?.kind === 'classmate_interest' && i.npcId === 'second'
    );
    expect(found).not.toBeNull();

    const { character } = found!;
    const before = activeRomances(character).length;
    resolvePeerInterestChoice(character, 'second', 'peer_accept', 'classmate_interest');
    expect(activeRomances(character).length).toBe(before + 1);
  });

  it('routes both new drama actions through buildPeerRomanceInterestEvent', () => {
    const { character } = createCharacter(1);
    character.age = 16;
    addPeer(character, { id: 'tagged', relation: 'classmate', meter: 70 });
    const event = buildPeerRomanceInterestEvent(character, { kind: 'classmate_interest', npcId: 'tagged' });
    expect(event.drama).toEqual({ action: 'classmate_interest', relationshipIds: ['tagged'] });

    const coworkerChar = createCharacter(2).character;
    coworkerChar.age = 30;
    coworkerChar.career.jobId = 'job_tech';
    addPeer(coworkerChar, { id: 'ctagged', relation: 'coworker', meter: 70 });
    const coworkerEvent = buildPeerRomanceInterestEvent(coworkerChar, { kind: 'coworker_interest', npcId: 'ctagged' });
    expect(coworkerEvent.drama).toEqual({ action: 'coworker_interest', relationshipIds: ['ctagged'] });
  });
});