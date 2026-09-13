import type { Character, LifeEventDef, Tone, EventChoice } from '@/lib/engine/types';
import type { RomanceDrama } from '@/lib/engine/romance';

/**
 * Part F: builds the forced question events for romance drama. These are never
 * registered in EVENT_REGISTRY — the store injects them directly when
 * rollRomanceDrama fires, and their choices resolve through the custom drama
 * resolver (resolveRomanceDramaChoice) rather than stat-only effects.
 */

const TONE: Tone = 'bad';

function partnerOf(character: Character, id: string): { name: string; relation: string } {
  const rel = character.relationships.find((r) => r.id === id);
  const relation =
    rel?.relation === 'spouse'
      ? character.gender === 'male'
        ? 'বউ'
        : 'বর'
      : character.gender === 'male'
        ? 'সঙ্গিনী'
        : 'সঙ্গী';
  return { name: rel?.name ?? 'কেউ', relation };
}

export function buildRomanceDramaEvent(character: Character, drama: RomanceDrama): LifeEventDef {
  if (drama.kind === 'npc_affair') {
    const { name, relation } = partnerOf(character, drama.relationshipIds[0]);
    const choices: EventChoice[] = [
      {
        id: 'affair_forgive',
        text: 'ক্ষমা করো — ওকে আবার সুযোগ দাও',
        effects: { happiness: -10, karma: 6 },
        outcomeText: `ক্ষমা কইরা ${name}-রে বুকে টানলা; বিশ্বাস আবার বানাইবার চেষ্টা শুরু করলা।`,
        tone: 'neutral',
      },
      {
        id: 'affair_end',
        text: 'সম্পর্ক চিরতরে শেষ করো',
        effects: { happiness: -12, karma: -2 },
        outcomeText: `বিশ্বাস ভাঙা ভালোবাসা আর জোড়া লাগে না—তুমি ${name}-র লগে সম্পর্ক ছিঁড়াইলা।`,
        tone: 'bad',
      },
      {
        id: 'affair_revenge',
        text: 'প্রতিশোধ — তুমিও পরকীয়া সারো',
        effects: { happiness: -15, karma: -18 },
        outcomeText: 'এক চোখের বদলে দুই চোখ! প্রতিশোধের আগুনে পুরা সম্পর্ক পুড়া ছাই।',
        tone: 'bad',
      },
    ];

    return {
      id: `npc_affair_${drama.relationshipIds[0]}`,
      text: `সন্দেহের ছুরি বুকের মধ্যে ঘুরাইয়া দিলো! ${name} (${relation})-র ফোনে অচেনা একজনের ভালোবাসার টেক্সট আর রঙিন স্টিকারের মিঠে বুলি ধরাই পড়লো। কেউ কইলো গুজব, কেউ কইলো সত্যি—তয় দুই হাতে সুখ খুঁজবার স্বভাবটা সবার লাহান নাজেহাল কাণ্ড। এবার হিসাব চাওয়ার পালা!`,
      minAge: 18,
      maxAge: 99,
      weight: 0,
      tone: TONE,
      category: 'adult',
      choices,
      drama: { action: 'npc_affair', relationshipIds: drama.relationshipIds },
    };
  }

  const names = drama.relationshipIds
    .map((id) => partnerOf(character, id).name)
    .filter((n, i, arr) => arr.indexOf(n) === i);

  const choices: EventChoice[] = [
    {
      id: 'multi_stay_one',
      text: `প্রথম প্রিয়জনকে বাঁচাও${names[0] ? ` (${names[0]})` : ''} — বাকি সবার লগে সম্পর্ক শেষ করো`,
      effects: { happiness: -12, karma: -5 },
      outcomeText: 'পছন্দের আসলে খুঁইজা বাকি সম্পর্ক খতম করা হইলো।',
      tone: 'bad',
    },
    {
      id: 'multi_stay_two',
      text: `দ্বিতীয় প্রিয়জনকে বাঁচাও${names.length > 1 ? ` (${names[1]})` : ''} — বাকি সবার লগে সম্পর্ক শেষ করো`,
      effects: { happiness: -12, karma: -5 },
      outcomeText: 'তীরে আইসা ভিন্ন রুপে ভালোবাসা খুঁইজা চূড়ান্ত সিদ্ধান্ত নিলা।',
      tone: 'bad',
    },
    {
      id: 'multi_lie',
      text: 'মিছা দিয়া সত্যি গুপ্ত রাখো — ধরা পড়লে পুরা গল্পই শেষ',
      effects: { happiness: -6, karma: -18 },
      outcomeText: 'মিছার বুননে উড়াইয়া দিলা, কিন্তু ধরা পড়বার দিন যতই কাছে টানছে।',
      tone: 'bad',
    },
  ];

  return {
    id: `multi_caught_${character.age}`,
    text: `দুই হাতে দুই ভাগের কারবার ভাঙিলো! ${
      names.length > 1 ? `${names.slice(0, -1).join(', ')} আর ${names[names.length - 1]}` : names[0]
    }—সবাইকে একই জীবনের স্বপ্ন দেখাইয়া বছরের পর বছর টানাটানি। এবার মহল্লায় ফাঁস হইয়া গেলো, চারদিকে ফিসফিস-গুজব! এবার সিদ্ধান্ত নেওয়ার সময়: কোন পথে যাবা?`,
    minAge: 18,
    maxAge: 99,
    weight: 0,
    tone: TONE,
    category: 'adult',
    choices,
    drama: { action: 'multi_caught', relationshipIds: drama.relationshipIds },
  };
}