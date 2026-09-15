import type { Character, LifeEventDef, Tone, EventChoice } from '@/lib/engine/types';
import type { PeerRomanceInterest } from '@/lib/engine/romance';

/**
 * PART H: builds the forced question events for NPC-initiated romance from the
 * peer pool. Like the Part F drama events these are never registered in
 * EVENT_REGISTRY — the store injects them when rollPeerRomanceInterest fires,
 * and their choices resolve through resolvePeerInterestChoice so the exact
 * existing NPC (same id, name, and pre-existing bond) becomes a dating
 * romance on acceptance instead of a freshly generated stranger.
 */

export function buildPeerRomanceInterestEvent(
  character: Character,
  interest: PeerRomanceInterest
): LifeEventDef {
  const npc = character.relationships.find((r) => r.id === interest.npcId);
  const name = npc?.name ?? 'কেউ একজন';
  const tone: Tone = interest.kind === 'classmate_interest' ? 'good' : 'neutral';

  const text =
    interest.kind === 'classmate_interest'
      ? `${name} ক্লাসের শেষ ঘণ্টায় পাশের বেঞ্চে চুপচাপ জড়সড়, হাতে একটা ভাঁজ করা নোট। কোনো কথা না বলে তোমার দিকে তাকাইয়া ঝিলমিল চোখে হাসলো—তুমি বুঝলা, এ আর নিছক বন্ধুত্বের আলাপ নয়। গলা খাঁকারি দিয়া নিচু স্বরে বললো: "তুই কি শুধু সহপাঠী নাই থিকায়, আমার কাছে একটু বেশি হইতে পারিস...?"`
      : `${name} অফিসের বারান্দায় কফির কাপ ঠান্ডা করতেছিল, তোমায় দেখে আস্তে করেসে—"এই শোন, কিছু একটা শুধাইবার ছিল।" দুই দিন ধইরারে চোখেমুখে একটা বেখাপ্পা ভাব; তুমি বুঝলা, এ আর অফিসের নিয়ম-নীতির ভেতর ঢোকে। সহকর্মী থেকে যেন আরেকটু বেশি কিছু হইবার চেষ্টা!`;

  const choices: EventChoice[] = [
    {
      id: 'peer_accept',
      text: 'এতদিনের চেনা-জানা, মনও তো তোমার দিকে টানে—হ্যাঁ বলো!',
      effects: { happiness: 12 },
      outcomeText: 'অস্বাভাবিক ভালোবাসা! চেনা মানুষটার লগে এহন নতুন এক সম্পর্কের সূচনা হবে।',
      tone: 'good',
    },
    {
      id: 'peer_decline',
      text: 'আস্তে-নরমে না বলো — বন্ধুত্বটা বাঁচাইয়া রাখো',
      effects: { happiness: -4 },
      outcomeText: 'না শুনে সম্পর্কটা একটু বেখাপ্পা হইবে, তয় বন্ধুত্ব অটুট।',
      tone: 'neutral',
    },
  ];

  return {
    id: `${interest.kind}_${interest.npcId}`,
    text,
    minAge: interest.kind === 'classmate_interest' ? 16 : 18,
    maxAge: 99,
    weight: 0,
    tone,
    category: interest.kind === 'classmate_interest' ? 'teen' : 'adult',
    choices,
    drama: { action: interest.kind, relationshipIds: [interest.npcId] },
  };
}