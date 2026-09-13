import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { RNG } from '@/lib/engine/rng';
import {
  drawYearlyEventsFrom,
  getEligibleEventsFrom,
  getRelationshipState,
  resolveEventChoice,
} from '@/lib/engine/events/registry';
import { renderTemplate } from '@/lib/engine/events/template';
import { CHILDHOOD_EVENTS } from '@/content/events/childhood';
import { ADULT_EVENTS } from '@/content/events/adult';
import type { Character, LifeEventDef, Relationship } from '@/lib/engine/types';

function makeCharacter(seed: number, age: number): Character {
  const { character } = createCharacter(seed);
  character.age = age;
  return character;
}

function makeEvent(overrides: Partial<LifeEventDef> & { id: string }): LifeEventDef {
  return {
    text: overrides.id,
    minAge: 0,
    maxAge: 99,
    weight: 50,
    tone: 'neutral',
    category: 'universal',
    choices: [{ id: 'c', text: 'a', effects: {}, outcomeText: 'o', tone: 'neutral' }],
    ...overrides,
  };
}

function addRelation(character: Character, relation: Relationship) {
  character.relationships.push(relation);
}

describe('event eligibility — gender & religion (PART A)', () => {
  it('male-only events never fire for female characters and vice versa', () => {
    const maleOnly = makeEvent({ id: 'male_only', gender: 'male' });
    const femaleOnly = makeEvent({ id: 'female_only', gender: 'female' });

    const boy = makeCharacter(1, 20);
    const girl = makeCharacter(2, 20);
    girl.gender = 'female';
    // ensure both are same-typed; set explicitly
    boy.gender = 'male';

    expect(getEligibleEventsFrom([maleOnly], boy).some((e) => e.id === 'male_only')).toBe(true);
    expect(getEligibleEventsFrom([maleOnly], girl).some((e) => e.id === 'male_only')).toBe(false);
    expect(getEligibleEventsFrom([femaleOnly], girl).some((e) => e.id === 'female_only')).toBe(true);
    expect(getEligibleEventsFrom([femaleOnly], boy).some((e) => e.id === 'female_only')).toBe(false);
  });

  it('the default gender is any', () => {
    const ungendered = makeEvent({ id: 'ungendered' });
    const boy = makeCharacter(3, 20);
    const girl = makeCharacter(4, 20);
    girl.gender = 'female';
    expect(getEligibleEventsFrom([ungendered], boy).some((e) => e.id === 'ungendered')).toBe(true);
    expect(getEligibleEventsFrom([ungendered], girl).some((e) => e.id === 'ungendered')).toBe(true);
  });

  it('religion-targeted events only fire for the matching religion', () => {
    const islamOnly = makeEvent({ id: 'islam_only', religion: 'islam' });
    const hinduOnly = makeEvent({ id: 'hindu_only', religion: 'hinduism' });

    const muslim = makeCharacter(5, 20);
    muslim.religion = 'islam';
    const hindu = makeCharacter(6, 20);
    hindu.religion = 'hinduism';

    expect(getEligibleEventsFrom([islamOnly], muslim).some((e) => e.id === 'islam_only')).toBe(true);
    expect(getEligibleEventsFrom([islamOnly], hindu).some((e) => e.id === 'islam_only')).toBe(false);
    expect(getEligibleEventsFrom([hinduOnly], hindu).some((e) => e.id === 'hindu_only')).toBe(true);
    expect(getEligibleEventsFrom([hinduOnly], muslim).some((e) => e.id === 'hindu_only')).toBe(false);
  });

  it('real content: Eid salami is Muslim-only; wife-pregnancy events are male-only', () => {
    const eid = CHILDHOOD_EVENTS.find((e) => e.id === 'child_eid_salami');
    expect(eid?.religion).toBe('islam');

    const babyNews = ADULT_EVENTS.find((e) => e.id === 'ad_baby_news');
    expect(babyNews?.gender).toBe('male');
    expect(babyNews?.oncePerLife).toBe(true);
    const secondChild = ADULT_EVENTS.find((e) => e.id === 'ad_second_child');
    expect(secondChild?.gender).toBe('male');

    const muslimKid = makeCharacter(7, 7);
    muslimKid.religion = 'islam';
    const { character: hinduKid } = createCharacter(8, { religion: 'hinduism' });
    hinduKid.age = 7;
    expect(muslimKid.flags).toContain('religion_muslim');

    expect(getEligibleEventsFrom([eid!], muslimKid).some((e) => e.id === 'child_eid_salami')).toBe(true);
    expect(getEligibleEventsFrom([eid!], hinduKid).some((e) => e.id === 'child_eid_salami')).toBe(false);

    const father = makeCharacter(9, 30);
    father.gender = 'male';
    const mother = makeCharacter(10, 30);
    mother.gender = 'female';
    father.flags.push('has_spouse');
    mother.flags.push('has_spouse');
    expect(getEligibleEventsFrom([babyNews!], father).some((e) => e.id === 'ad_baby_news')).toBe(true);
    expect(getEligibleEventsFrom([babyNews!], mother).some((e) => e.id === 'ad_baby_news')).toBe(false);
  });
});

describe('event eligibility — relationship state (PART A)', () => {
  it('getRelationshipState reflects single/dating/partnered/married snapshots', () => {
    const solo = makeCharacter(11, 30);
    addRelation(solo, { id: 'r1', relation: 'dating', name: 'A', age: 25, alive: true, meter: 60, metAge: 28 });
    expect(getRelationshipState(solo)).toContain('dating');
    expect(getRelationshipState(solo)).not.toContain('single');

    const partitioned = makeCharacter(12, 30);
    addRelation(partitioned, { id: 'r2', relation: 'partner', name: 'B', age: 25, alive: true, meter: 70, metAge: 27 });
    expect(getRelationshipState(partitioned)).toContain('partnered');

    const wed = makeCharacter(13, 30);
    addRelation(wed, { id: 'r3', relation: 'spouse', name: 'C', age: 25, alive: true, meter: 80, metAge: 26 });
    expect(getRelationshipState(wed)).toContain('married');

    const alone = makeCharacter(14, 30);
    expect(getRelationshipState(alone)).toContain('single');
  });

  it('dead partners no longer count toward a state', () => {
    const widower = makeCharacter(15, 40);
    addRelation(widower, { id: 'r4', relation: 'spouse', name: 'D', age: 50, alive: false, meter: 20, metAge: 25 });
    widower.flags.push('widowed');
    expect(getRelationshipState(widower)).toContain('widowed');
    expect(getRelationshipState(widower)).not.toContain('married');
    expect(getRelationshipState(widower)).toContain('single');
  });

  it('relationshipState (required) gates eligibility', () => {
    const needKid = makeEvent({ id: 'needs_kid', relationshipState: ['has_child'] });
    const noKid = makeCharacter(16, 30);
    const withKid = makeCharacter(17, 30);
    withKid.flags.push('has_child');
    expect(getEligibleEventsFrom([needKid], noKid).some((e) => e.id === 'needs_kid')).toBe(false);
    expect(getEligibleEventsFrom([needKid], withKid).some((e) => e.id === 'needs_kid')).toBe(true);
  });

  it('antiRelationshipState (exclude) gates eligibility', () => {
    const noSpouse = makeEvent({ id: 'no_spouse', antiRelationshipState: ['married'] });
    const wed = makeCharacter(18, 30);
    addRelation(wed, { id: 'r5', relation: 'spouse', name: 'E', age: 30, alive: true, meter: 80, metAge: 25 });
    const solo = makeCharacter(19, 30);
    expect(getEligibleEventsFrom([noSpouse], wed).some((e) => e.id === 'no_spouse')).toBe(false);
    expect(getEligibleEventsFrom([noSpouse], solo).some((e) => e.id === 'no_spouse')).toBe(true);
  });
});

describe('event eligibility — anti-repetition (PART A)', () => {
  it('oncePerLife blocks a refire even past the 15-year cooldown', () => {
    const once = makeEvent({ id: 'once_event', oncePerLife: true });
    const character = makeCharacter(20, 30);
    character.recentEventHistory = [{ id: 'once_event', age: 10 }];
    expect(getEligibleEventsFrom([once], character).some((e) => e.id === 'once_event')).toBe(false);
  });

  it('oncePerLife fires when it has never fired before', () => {
    const once = makeEvent({ id: 'once_event_2', oncePerLife: true });
    const character = makeCharacter(21, 30);
    expect(getEligibleEventsFrom([once], character).some((e) => e.id === 'once_event_2')).toBe(true);
  });

  it('universal events respect the 15-year cooldown (no more universal exemption)', () => {
    const univ = makeEvent({ id: 'univ_event' });
    const young = makeCharacter(22, 20);
    young.recentEventHistory = [{ id: 'univ_event', age: 15 }];
    // 5 years ago -> blocked
    expect(getEligibleEventsFrom([univ], young).some((e) => e.id === 'univ_event')).toBe(false);

    const old = makeCharacter(23, 35);
    old.recentEventHistory = [{ id: 'univ_event', age: 15 }];
    // 20 years ago -> allowed again
    expect(getEligibleEventsFrom([univ], old).some((e) => e.id === 'univ_event')).toBe(true);
  });

  it('oncePerLife + never drawn means draw still works through the full pipeline', () => {
    const once = makeEvent({ id: 'univ_once_draw', oncePerLife: true });
    const character = makeCharacter(24, 25);
    const rng = new RNG(24);
    // getEligibleEventsFrom must include it
    expect(getEligibleEventsFrom([once], character).some((e) => e.id === 'univ_once_draw')).toBe(true);
    void rng;
  });
});

describe('event eligibility — relationship targeting & NPC names (PART B)', () => {
  it('renderTemplate substitutes {{role}} tokens with names, then slot picks', () => {
    const text = '{{spouse}} {তোমারে|তোরে} ডাকতাছে, {{child}}-ও পেছনে!';
    const out = renderTemplate(text, new RNG(1), { spouse: 'রাহিম', child: 'সুমন' });
    expect(out).toContain('রাহিম');
    expect(out).toContain('সুমন');
    expect(out).not.toContain('{{');
  });

  it('renderTemplate falls back to a grammar label when no NPC exists', () => {
    const out = renderTemplate('কথা কইলো {{spouse}} সাথ', new RNG(2), {});
    expect(out).toContain('সঙ্গী');
  });

  it('choice bond effects adjust living relationship meters only for the targeted role', () => {
    const event = makeEvent({
      id: 'bond_event',
      choices: [
        { id: 'c', text: 'c', effects: { bond: { role: 'spouse', amount: 10 } }, outcomeText: 'o', tone: 'good' },
      ],
    });
    const { character } = createCharacter(30);
    character.age = 30;
    character.flags.push('has_spouse');
    addRelation(character, { id: 'sp1', relation: 'spouse', name: 'রাহিমা', age: 27, alive: true, meter: 50, metAge: 25 });
    addRelation(character, { id: 'ex1', relation: 'ex', name: 'পুরনো', age: 30, alive: true, meter: 30, metAge: 20 });

    resolveEventChoice(character, event, 'c');
    expect(character.relationships.find((r) => r.id === 'sp1')!.meter).toBe(60);
    expect(character.relationships.find((r) => r.id === 'ex1')!.meter).toBe(30);
  });

  it('real content: anniversary / spouse-sick events require a living spouse', () => {
    const anniv = ADULT_EVENTS.find((e) => e.id === 'ad_spouse_anniversary');
    const care = ADULT_EVENTS.find((e) => e.id === 'ad_spouse_care');
    expect(anniv).toBeDefined();
    expect(care).toBeDefined();
    if (!anniv || !care) return;

    const wed = makeCharacter(31, 35);
    addRelation(wed, { id: 'sp2', relation: 'spouse', name: 'সালমা', age: 30, alive: true, meter: 70, metAge: 26 });
    const single = makeCharacter(32, 35);

    expect(getEligibleEventsFrom([anniv], wed).some((e) => e.id === 'ad_spouse_anniversary')).toBe(true);
    expect(getEligibleEventsFrom([anniv], single).some((e) => e.id === 'ad_spouse_anniversary')).toBe(false);
    expect(getEligibleEventsFrom([care], single).some((e) => e.id === 'ad_spouse_care')).toBe(false);

    // a dead spouse no longer satisfies 'married'
    const widower = makeCharacter(33, 45);
    addRelation(widower, { id: 'sp3', relation: 'spouse', name: 'N/A', age: 50, alive: false, meter: 10, metAge: 25 });
    widower.flags.push('widowed');
    expect(getEligibleEventsFrom([anniv], widower).some((e) => e.id === 'ad_spouse_anniversary')).toBe(false);
  });

  it('real content: the school-fee event is gated on a living school-aged child via predicate', () => {
    const fee = ADULT_EVENTS.find((e) => e.id === 'ad_kid_school_fee');
    expect(fee).toBeDefined();
    if (!fee) return;

    const withSchoolKid = makeCharacter(34, 38);
    addRelation(withSchoolKid, { id: 'k1', relation: 'child', name: 'শিহাব', age: 11, alive: true, meter: 80, metAge: 30 });
    const withBaby = makeCharacter(35, 38);
    addRelation(withBaby, { id: 'k2', relation: 'child', name: 'আইরা', age: 3, alive: true, meter: 90, metAge: 35 });
    const noKid = makeCharacter(36, 38);

    expect(getEligibleEventsFrom([fee], withSchoolKid).some((e) => e.id === 'ad_kid_school_fee')).toBe(true);
    expect(getEligibleEventsFrom([fee], withBaby).some((e) => e.id === 'ad_kid_school_fee')).toBe(false);
    expect(getEligibleEventsFrom([fee], noKid).some((e) => e.id === 'ad_kid_school_fee')).toBe(false);
  });

  it('drawYearlyEventsFrom binds real NPC names into the rendered event text', () => {
    const marriedAged = makeCharacter(37, 40);
    addRelation(marriedAged, { id: 'sp4', relation: 'spouse', name: 'নুসরাত', age: 36, alive: true, meter: 75, metAge: 28 });
    const anniv = ADULT_EVENTS.find((e) => e.id === 'ad_spouse_anniversary')!;
    const drawn = [];
    for (let seed = 0; seed < 30; seed++) {
      drawn.push(...drawYearlyEventsFrom([anniv], marriedAged, new RNG(seed)));
    }
    expect(drawn.length).toBeGreaterThan(0);
    for (const event of drawn) {
      expect(event.text).not.toContain('{{');
      expect(event.text).toContain('নুসরাত');
    }
  });

  it('real content: partner-meets-family requires a partnered (not married) state', () => {
    const meet = ADULT_EVENTS.find((e) => e.id === 'ad_partner_meet_family');
    expect(meet).toBeDefined();
    if (!meet) return;

    const partnered = makeCharacter(38, 28);
    addRelation(partnered, { id: 'p1', relation: 'partner', name: 'ফাইযা', age: 25, alive: true, meter: 66, metAge: 24 });
    const wed = makeCharacter(39, 28);
    addRelation(wed, { id: 'p2', relation: 'spouse', name: 'মুনা', age: 25, alive: true, meter: 80, metAge: 24 });

    expect(getEligibleEventsFrom([meet], partnered).some((e) => e.id === 'ad_partner_meet_family')).toBe(true);
    expect(getEligibleEventsFrom([meet], wed).some((e) => e.id === 'ad_partner_meet_family')).toBe(false);
  });
});