/**
 * Avatar visual palette — pure data (DESIGN.md §2, §7).
 *
 * The layered 2D portrait drives its colour and shape from the character's
 * life stage and gender. Keeping this as a pure module mirrors the
 * engine-first rule (AGENT.md §5): the `<Avatar>` component just renders the
 * table below, and tests can lock coverage for all 7 stages × 2 genders.
 */

import type { LifeStage } from '@/lib/engine/life';

export type HairStyle = 'short' | 'long' | 'bob' | 'bald-ish';

export interface AvatarVisuals {
  skin: string;
  hair: string;
  hairHighlight: string;
  outfit: string;
  outfitAccent: string;
  hairStyle: HairStyle;
  /** Larger heads read as younger (DESIGN.md §2 "visibly ages"). */
  headScale: number;
  /** Glasses appear in middle age and stay. */
  glasses: boolean;
}

/** Face/base proportions are shared; only palettes vary per stage/gender. */
const SKIN = {
  baby: '#f8cdab',
  child: '#f3c19c',
  teen: '#eab98d',
  adult: '#e2a872',
  senior: '#d79a66',
};

const HAIR = {
  brown: '#6b4f3a',
  darkBrown: '#4e3628',
  chestnut: '#7a5c43',
  black: '#3a3a38',
  salt: '#8b8078',
  gray: '#cfd4d8',
};

const OUTFIT = {
  onesie: '#ffd54f',
  tshirt: '#4f8ef7',
  hoodie: '#7e57c2',
  tee: '#26a69a',
  shirt: '#5c6bc0',
  cardigan: '#ef8a4f',
  cardiganDark: '#90a4ae',
};

const FEMALE_BIAS: Record<HairStyle, boolean> = { long: true, bob: true, short: false, 'bald-ish': false };

function visuals(
  stage: LifeStage,
  gender: 'male' | 'female',
  partial: Omit<AvatarVisuals, 'hairStyle' | 'headScale' | 'glasses'> & {
    hairStyle?: HairStyle;
    headScale?: number;
    glasses?: boolean;
  },
): AvatarVisuals {
  const wish = partial.hairStyle ?? (gender === 'female' ? 'long' : 'short');
  return {
    skin: partial.skin,
    hair: partial.hair,
    hairHighlight: partial.hairHighlight,
    outfit: partial.outfit,
    outfitAccent: partial.outfitAccent,
    hairStyle: wish,
    headScale: partial.headScale ?? 1,
    glasses: partial.glasses ?? false,
  };
}

/** Full coverage table: every stage and gender gets explicit values. */
export const AVATAR_PALETTE: Record<LifeStage, Record<'male' | 'female', AvatarVisuals>> = {
  infant: {
    male: visuals('infant', 'male', { skin: SKIN.baby, hair: HAIR.brown, hairHighlight: HAIR.chestnut, outfit: OUTFIT.onesie, outfitAccent: '#fff3c2', hairStyle: 'bald-ish', headScale: 1.18 }),
    female: visuals('infant', 'female', { skin: SKIN.baby, hair: HAIR.brown, hairHighlight: HAIR.chestnut, outfit: OUTFIT.onesie, outfitAccent: '#fff3c2', hairStyle: 'bald-ish', headScale: 1.18 }),
  },
  child: {
    male: visuals('child', 'male', { skin: SKIN.child, hair: HAIR.brown, hairHighlight: HAIR.chestnut, outfit: OUTFIT.tshirt, outfitAccent: '#c6dcff', hairStyle: 'short', headScale: 1.1 }),
    female: visuals('child', 'female', { skin: SKIN.child, hair: HAIR.chestnut, hairHighlight: HAIR.brown, outfit: OUTFIT.tshirt, outfitAccent: '#ffd1e8', hairStyle: 'bob', headScale: 1.1 }),
  },
  teen: {
    male: visuals('teen', 'male', { skin: SKIN.teen, hair: HAIR.darkBrown, hairHighlight: HAIR.black, outfit: OUTFIT.hoodie, outfitAccent: '#d1b8f0', hairStyle: 'short', headScale: 1.05 }),
    female: visuals('teen', 'female', { skin: SKIN.teen, hair: HAIR.black, hairHighlight: HAIR.darkBrown, outfit: OUTFIT.hoodie, outfitAccent: '#f0b8d8', hairStyle: 'long', headScale: 1.05 }),
  },
  'young-adult': {
    male: visuals('young-adult', 'male', { skin: SKIN.adult, hair: HAIR.darkBrown, hairHighlight: HAIR.brown, outfit: OUTFIT.tee, outfitAccent: '#b2dfdb', hairStyle: 'short', headScale: 1 }),
    female: visuals('young-adult', 'female', { skin: SKIN.adult, hair: HAIR.darkBrown, hairHighlight: HAIR.chestnut, outfit: OUTFIT.tee, outfitAccent: '#ffd6e8', hairStyle: 'long', headScale: 1 }),
  },
  adult: {
    male: visuals('adult', 'male', { skin: SKIN.adult, hair: HAIR.black, hairHighlight: HAIR.darkBrown, outfit: OUTFIT.shirt, outfitAccent: '#c9d2ff', hairStyle: 'short', headScale: 1 }),
    female: visuals('adult', 'female', { skin: SKIN.adult, hair: HAIR.darkBrown, hairHighlight: HAIR.brown, outfit: OUTFIT.shirt, outfitAccent: '#ffc9e8', hairStyle: 'long', headScale: 1 }),
  },
  'middle-aged': {
    male: visuals('middle-aged', 'male', { skin: SKIN.adult, hair: HAIR.salt, hairHighlight: HAIR.gray, outfit: OUTFIT.cardigan, outfitAccent: '#ffe0b8', hairStyle: 'short', headScale: 1, glasses: true }),
    female: visuals('middle-aged', 'female', { skin: SKIN.adult, hair: HAIR.salt, hairHighlight: HAIR.gray, outfit: OUTFIT.cardigan, outfitAccent: '#ffd9e0', hairStyle: 'bob', headScale: 1, glasses: true }),
  },
  senior: {
    male: visuals('senior', 'male', { skin: SKIN.senior, hair: HAIR.gray, hairHighlight: '#e8ebee', outfit: OUTFIT.cardiganDark, outfitAccent: '#cfd8dc', hairStyle: 'short', headScale: 0.98, glasses: true }),
    female: visuals('senior', 'female', { skin: SKIN.senior, hair: HAIR.gray, hairHighlight: '#eef1f4', outfit: OUTFIT.cardiganDark, outfitAccent: '#e0c8d4', hairStyle: 'bob', headScale: 0.98, glasses: true }),
  },
};

export function avatarVisualsFor(stage: LifeStage, gender: 'male' | 'female'): AvatarVisuals {
  return AVATAR_PALETTE[stage][gender];
}

/** The character ages through these stages; painter uses `lifeStageForAge`. */
export const AVATAR_STAGES: readonly LifeStage[] = [
  'infant',
  'child',
  'teen',
  'young-adult',
  'adult',
  'middle-aged',
  'senior',
];

export { FEMALE_BIAS };