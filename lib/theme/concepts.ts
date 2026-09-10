import type { Tone } from '@/lib/engine/types';

/**
 * Shared icon + label + mood lookup for the "Modern Martial" theme
 * (UI-DESIGN.md §1.1 consistency rule, §2.2 icon-per-tag mapping).
 *
 * Every reskinned screen reads its stat/tone/wealth presentation from here —
 * no component defines a local hex or a local icon binding. Engine content
 * currently authors events without `tags` (the optional `LifeEventDef.tags`
 * contract is unused), so chronicle entries and event cards resolve through
 * the per-tone fallbacks below; `EVENT_TAG_ICON` is the single place to fill
 * in richer icon mappings when tagged content lands.
 */

export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks';

export type IconName =
  | 'heart'
  | 'sun'
  | 'sword'
  | 'shield'
  | 'coin'
  | 'skull'
  | 'laugh'
  | 'dot';

export interface StatMeta {
  /** Engine key (unchanged, persisted, drives aria/testids). */
  key: StatKey;
  /** Human-readable stat key for the progressbar accessible name. */
  readable: string;
  /** Display label under this theme (UI-DESIGN.md §0). */
  label: string;
  icon: IconName;
  fillVar: string;
}

const statFill = {
  health: 'var(--color-stat-health)',
  happiness: 'var(--color-stat-happiness)',
  martial: 'var(--color-stat-martial)',
  honor: 'var(--color-stat-honor)',
} as const;

/** §0 mapping: engine keys stay; rank/display name + icon change to Dhakaiya Bangla. */
export const STAT_META: Record<StatKey, StatMeta> = {
  health: { key: 'health', readable: 'Health', label: 'স্বাস্থ্য', icon: 'heart', fillVar: statFill.health },
  happiness: { key: 'happiness', readable: 'Happiness', label: 'সুখ', icon: 'sun', fillVar: statFill.happiness },
  smarts: { key: 'smarts', readable: 'Smarts', label: 'বুদ্ধি', icon: 'dot', fillVar: statFill.martial },
  looks: { key: 'looks', readable: 'Looks', label: 'চেহারা', icon: 'shield', fillVar: statFill.honor },
};

export interface ToneMeta {
  label: string;
  icon: IconName;
  /** Fill color (bars, icons, accents). */
  fillVar: string;
  /** 4.5:1-compliant text color for this tone. */
  textVar: string;
}

export const TONE_META: Record<Tone, ToneMeta> = {
  good: {
    label: 'দারুণ ব্যাপার',
    icon: 'coin',
    fillVar: 'var(--color-tone-good)',
    textVar: 'var(--color-tone-text-good)',
  },
  bad: {
    label: 'মাইঙ্কা চিপা',
    icon: 'skull',
    fillVar: 'var(--color-tone-bad)',
    textVar: 'var(--color-tone-text-bad)',
  },
  neutral: {
    label: 'জীবন এমনই',
    icon: 'dot',
    fillVar: 'var(--color-tone-neutral)',
    textVar: 'var(--color-tone-text-neutral)',
  },
  funny: {
    label: 'চরম ফান',
    icon: 'laugh',
    fillVar: 'var(--color-tone-funny)',
    textVar: 'var(--color-tone-text-funny)',
  },
};

export const WEALTH = {
  label: 'ট্যাকা',
  fillVar: 'var(--color-wealth)',
  textVar: 'var(--color-wealth-text)',
} as const;

/** DESIGN.md §10 tag → icon; current content carries no tags, so chronicle and
 *  event cards fall back to TONE_META. This is the only table to extend. */
export const EVENT_TAG_ICON: Record<string, IconName> = {
  study: 'sword',
  training: 'sword',
  combat: 'sword',
  injury: 'heart',
  healing: 'heart',
  income: 'coin',
  loss: 'coin',
  family: 'shield',
  marriage: 'heart',
  mischief: 'laugh',
  death: 'skull',
};