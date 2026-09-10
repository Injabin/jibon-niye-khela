/**
 * Assets & finance system engine (DESIGN.md §5.5, init.md M5 #2).
 *
 * Buy/sell cars, homes, jewelry, collectibles, and the opt-in fictional
 * stock/crypto line. A yearly market drift moves asset values on a
 * per-kind volatility curve (cars depreciate, crypto swings hardest).
 * Speculative buys need cash; real-property buys can be leveraged into
 * debt (which flips the `has_debt` flag for the content pool).
 */

import type { RNG } from '@/lib/engine/rng';
import { applyStatEffects } from '@/lib/engine/stats';
import type { AssetKind, Character, Tone } from '@/lib/engine/types';

export interface AssetOutcome {
  text: string;
  tone: Tone;
}

export interface BuyAssetResult extends AssetOutcome {
  bought: boolean;
}

export interface SellAssetResult extends AssetOutcome {
  sold: boolean;
  proceeds: number;
}

const DEFAULT_PRICE: Record<AssetKind, number> = {
  car: 8_500,
  home: 90_000,
  jewelry: 1_200,
  collectible: 600,
  stock: 1_000,
  crypto: 500,
};

const NAMES: Record<AssetKind, readonly string[]> = {
  car: ['সেকেন্ডহ্যান্ড রানার মোটরবাইক', 'টয়োটা করোলা নোয়া গাড়ি', 'ইয়ামাহা এফজেডএস বাইক', 'চকচকে হোন্ডা সিভিক'],
  home: ['নাজিরাবাজারের ২ রুমের ফ্ল্যাট', 'পুরান ঢাকার ছাদওয়ালা দোতলা বাড়ি', 'ধানমন্ডির বিলাসবহুল ফ্ল্যাট', 'কেরানীগঞ্জের পৈতৃক ভিটা'],
  jewelry: ['তাঁতিবাজারের খাঁটি সোনার চেইন', 'রূপার কারুকাজ করা ব্রেসলেট', 'সোনার নেকলেস', 'বিয়ের আংটি'],
  collectible: ['পুরান ঢাকার ঐতিহ্যবাহী কাঁসার থালা', 'ভিক্টোরিয়ান আমলের কয়েন কালেকশন', 'সাকরাইনের ভিন্টেজ ঘুড়ি কালেকশন', '১৯৭১ সালের ঐতিহাসিক পোস্টার'],
  stock: ['মতিঝিল স্টক এক্সচেঞ্জের ব্লু-চিপ শেয়ার', 'পাওয়ার ও গ্রিড কোম্পানির বন্ড', 'বড় ওষুধ কোম্পানির লভ্যাংশ শেয়ার'],
  crypto: ['উদ্বায়ী বিটকয়েন ও অল্টকয়েন', 'উরাধুরা মেমকয়েন', 'ডিজিটাল ক্রিপ্টো পোর্টফোলিও'],
};

function hasFlag(character: Character, flag: string): boolean {
  return character.flags.includes(flag);
}

function setFlag(character: Character, flag: string): void {
  if (!hasFlag(character, flag)) character.flags.push(flag);
}

function removeFlag(character: Character, flag: string): void {
  character.flags = character.flags.filter((f) => f !== flag);
}

/** One signed drift draw for a given asset kind (in [-spread, +spread]). */
function driftFor(kind: AssetKind, rng: RNG): number {
  switch (kind) {
    case 'car':
      // Cars only depreciate.
      return -(0.03 + rng.next() * 0.05);
    case 'home':
      return rng.chance(0.5) ? 0.02 + rng.next() * 0.04 : -(0.02 + rng.next() * 0.04);
    case 'jewelry':
      return rng.chance(0.5) ? rng.next() * 0.06 : -(rng.next() * 0.06);
    case 'collectible':
      return rng.chance(0.5) ? rng.next() * 0.08 : -(rng.next() * 0.08);
    case 'stock':
      return rng.chance(0.5) ? rng.next() * 0.12 : -(rng.next() * 0.12);
    case 'crypto':
      return rng.chance(0.5) ? rng.next() * 0.2 : -(rng.next() * 0.2);
  }
  return 0;
}

function makeAsset(character: Character, rng: RNG, kind: AssetKind, price: number, name?: string): void {
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += 'abcdefghijklmnopqrstuvwxyz0123456789'[rng.rangeInt(0, 35)];
  }
  character.assets.push({
    id,
    kind,
    name: name ?? rng.pick(NAMES[kind]),
    purchasePrice: price,
    value: price,
    acquiredAge: character.age,
  });
}

export function buyAsset(
  character: Character,
  rng: RNG,
  kind: AssetKind,
  options: { name?: string; price?: number } = {},
): BuyAssetResult {
  if (!character.alive) return { bought: false, text: 'এহন তো কেনাকাটা করার অবস্থা নাই।', tone: 'bad' };
  const price = Math.max(0, Math.round(options.price ?? DEFAULT_PRICE[kind]));

  const speculative = kind === 'stock' || kind === 'crypto';
  if (speculative && character.money < price) {
    return { bought: false, text: 'শেয়ার বা ক্রিপ্টো বাজারে নগদে কারবার—পকেটে পর্যাপ্ত ট্যাকা নাই!', tone: 'neutral' };
  }

  applyStatEffects(character, { money: -price });
  makeAsset(character, rng, kind, price, options.name);

  if (kind === 'car') setFlag(character, 'has_car');
  else if (kind === 'home') setFlag(character, 'has_house');
  else setFlag(character, 'has_investment');

  const leveraged = character.money < 0;
  if (leveraged) setFlag(character, 'has_debt');

  const assetName = options.name ?? NAMES[kind][0];

  return {
    bought: true,
    text: leveraged
      ? `তুমি কিস্তিতে ও ঋণে ${assetName} কিনলা। ব্যাংক হাসতাছে, আর তোমার কপালে চিন্তার ভাঁজ!`
      : `এক্কেরে নগদ ট্যাকা দিয়া ${assetName} কিনলা! পুরাই জমিদারী ভাব!`,
    tone: leveraged ? 'neutral' : 'good',
  };
}

export function sellAsset(character: Character, rng: RNG, assetId: string): SellAssetResult {
  const index = character.assets.findIndex((a) => a.id === assetId);
  if (index === -1) return { sold: false, proceeds: 0, text: 'এই জিনিস তো তোমার নাই!', tone: 'neutral' };
  const [asset] = character.assets.splice(index, 1);
  applyStatEffects(character, { money: asset.value });
  if (character.money >= 0) removeFlag(character, 'has_debt');
  // Dropping the last asset of a kind retires its ownership flag for content gating.
  if (asset.kind === 'car' && !character.assets.some((a) => a.kind === 'car')) removeFlag(character, 'has_car');
  if (asset.kind === 'home' && !character.assets.some((a) => a.kind === 'home')) removeFlag(character, 'has_house');
  if (
    asset.kind !== 'car' &&
    asset.kind !== 'home' &&
    !character.assets.some((a) => a.kind !== 'car' && a.kind !== 'home')
  ) {
    removeFlag(character, 'has_investment');
  }
  return { sold: true, proceeds: asset.value, text: `${asset.name} বেইচা দিলা, হাতে আইলো ৳${asset.value.toLocaleString()}!`, tone: 'good' };
}

/**
 * Yearly maintenance: drift every asset's value on its kind's curve. Mostly
 * silent; only a notable single-asset gain (> 15%) surfaces as a windfall line.
 */
export function tickAssets(character: Character, rng: RNG): AssetOutcome | null {
  let windfall = false;
  for (const asset of character.assets) {
    const drift = driftFor(asset.kind, rng);
    const nextValue = Math.max(1, Math.round(asset.value * (1 + drift)));
    if (nextValue > asset.value * 1.15) windfall = true;
    asset.value = nextValue;
  }
  if (character.assets.some((a) => a.kind === 'home') && character.money < 0 && !hasFlag(character, 'has_debt')) {
    setFlag(character, 'has_debt');
  }
  return windfall
    ? { text: 'তোমার সম্পত্তির দাম বাজারে হু হু কইরা বাইড়া গেল—এই বছর কপাল পুরাই খুলছে!', tone: 'good' }
    : null;
}