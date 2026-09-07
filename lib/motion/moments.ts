/**
 * Moment-sting UI mapping (DESIGN.md §7, AGENT.md §5/§8).
 *
 * The engine layer only knows the milestone *kind*; this module is the one
 * place that pairs each kind with its Lottie asset, accent colour and SFX so
 * all ten stingers stay consistent. Assets are runtime-fetched from
 * `/public/animations` (never bundled), honouring the Gate 4 lazy-load rule.
 */

import type { SfxEvent } from '@/lib/audio/manifest';
import type { MilestoneKind } from '@/lib/engine/types';
import type { ExpressionId } from '@/lib/engine/moments';

export interface StingVisuals {
  /** Lottie JSON path under /public, fetched at runtime. */
  file: string;
  /** Cue played when the sting fires; null = rely on an existing cue (death). */
  sfx: SfxEvent | null;
  /** Accent used by the reduced-motion static fallback. */
  accent: string;
}

export const MOMENT_STING: Record<MilestoneKind, StingVisuals> = {
  confetti: { file: '/animations/sting-confetti.json', sfx: 'good_event', accent: '#f6c344' },
  money: { file: '/animations/sting-money.json', sfx: 'money_up', accent: '#f0b84f' },
  diploma: { file: '/animations/sting-diploma.json', sfx: 'life_stage_change', accent: '#3f9d63' },
  wedding: { file: '/animations/sting-wedding.json', sfx: 'life_stage_change', accent: '#e88bbb' },
  handcuffs: { file: '/animations/sting-handcuffs.json', sfx: 'bad_event', accent: '#77839a' },
  tombstone: { file: '/animations/sting-tombstone.json', sfx: null, accent: '#6f7a88' },
  birth: { file: '/animations/sting-birth.json', sfx: 'good_event', accent: '#5aa9f7' },
  sparkles: { file: '/animations/sting-sparkles.json', sfx: 'good_event', accent: '#ffe9a8' },
  heart: { file: '/animations/sting-heart.json', sfx: 'good_event', accent: '#ef5b7e' },
  house: { file: '/animations/sting-house.json', sfx: 'good_event', accent: '#5fce8e' },
};

export const EXPRESSION_FILE: Record<ExpressionId, string> = {
  sparkle: '/animations/expression-sparkle.json',
  tear: '/animations/expression-tear.json',
  think: '/animations/expression-think.json',
  giggle: '/animations/expression-giggle.json',
};

export function stingVisualsFor(kind: MilestoneKind): StingVisuals {
  return MOMENT_STING[kind];
}