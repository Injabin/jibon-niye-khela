import type { Character, LifeEventDef, EventChoice } from '@/lib/engine/types';
import type { PartnerInitiative } from '@/lib/engine/romance';

/**
 * PART I: builds the forced question events for NPC-initiated initiatives.
 * Like the Part H peer events these are never registered in EVENT_REGISTRY —
 * the store injects them when rollPartnerInitiative fires, and their choices
 * resolve through resolveRomanceDramaChoice so the exact existing NPC
 * (same id, name, and pre-existing bond) becomes a dating romance on
 * acceptance, or a baby acquisition flows through the real tryForBaby chain.
 */

export function buildSingleAskoutEvent(
  character: Character,
  initiative: Extract<PartnerInitiative, { kind: 'single_askout' }>
): LifeEventDef {
  const npc = character.relationships.find((r) => r.id === initiative.npcId);
  const name = npc?.name ?? 'কেউ একজন';

  const text = `${name} এতদিন গোপনে গোপনে তোমাকে দেখছে — ভাই-বন্ধু, সহপাঠী বা সহকর্মীর হাসি ডাকের ভেতর গোপন একটা স্পন্দন। ব্যালকনিতে একা পাইয়া গলা খাঁকারি দিয়া কাঁপা কাঁপা স্বরে কৈলো: "তোর সাথে আর শুধু বন্ধুত্ব রাখবার সাহস পাই না... তুই কি রাজি?" চোখে মুখে আশা, ভয়ে বুক কাঁপে!`;

  const choices: EventChoice[] = [
    {
      id: 'askout_yes',
      text: 'হ্যাঁ! এতদিনের চেনা-জানা, মন তো সবই জানে — শুরু হোক নতুন অধ্যায়!',
      effects: { happiness: 12 },
      outcomeText: 'চেনা মানুষটার লগে গোপন থেকো মনের কথা এবার খোলা আকাশে!',
      tone: 'good',
    },
    {
      id: 'askout_no',
      text: 'আস্তে-নরমে না বলো — বন্ধুত্বটা বাঁচাইয়া রাখো',
      effects: { happiness: -4 },
      outcomeText: 'না শুনে সম্পর্কটা একটু বেখাপ্পা হইবে, তয় বন্ধুত্ব অটুট থাকবে।',
      tone: 'neutral',
    },
  ];

  return {
    id: `single_askout_${initiative.npcId}`,
    text,
    minAge: 18,
    maxAge: 99,
    weight: 0,
    tone: 'good',
    category: 'adult',
    choices,
    drama: { action: 'single_askout', relationshipIds: [initiative.npcId] },
  };
}

export function buildPartnerBabyProposalEvent(
  character: Character,
  initiative: Extract<PartnerInitiative, { kind: 'partner_baby_proposal' }>
): LifeEventDef {
  const partner = character.relationships.find((r) => r.id === initiative.partnerId);
  const name = partner?.name ?? 'সঙ্গী';

  const text = `${name} রাতের খাবারের টেবিলে ভাতের মাঝে চাঁচা কৈলো — "বিয়ের এতদিন হইলো, ঘরটায় আরেকটা ছোটে পা চাই তো!" খানিক থামিয়া আবার কৈলো: "চাইলে এবার আমরা... মানে, পরিবারটাকে একটু বড় করি?" মুখটা গরম, চোখে স্বপ্ন।`;

  const choices: EventChoice[] = [
    {
      id: 'baby_yes',
      text: 'স্বপ্নটায় রাজি — সংসার বড় করবার পথে এবার আত্মা-সাথি!',
      effects: { happiness: 10 },
      outcomeText: 'গরম ভাত থালায় ওই কথাটাই বাঁধা হইলো ভাগ্যের রেখা!',
      tone: 'good',
    },
    {
      id: 'baby_not_now',
      text: 'এখন নয় — সময় আর স্বাচ্ছন্দ্য ঠিক করবার দিন বৃথা যায় না',
      effects: { happiness: -4 },
      outcomeText: 'কথাটা থেমে গেলো, তয় কথার রেশরে আজও ধরিয়া রাখলো মন!',
      tone: 'neutral',
    },
  ];

  return {
    id: `partner_baby_proposal_${initiative.partnerId}`,
    text,
    minAge: 18,
    maxAge: 55,
    weight: 0,
    tone: 'good',
    category: 'adult',
    choices,
    drama: { action: 'partner_baby_proposal', relationshipIds: [initiative.partnerId] },
  };
}