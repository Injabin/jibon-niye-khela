/**
 * Expression overlay metadata (DESIGN.md §7, §Color · AGENT.md §8).
 *
 * Each outcome tone maps to a Lottie expression overlay; when motion is
 * reduced those overlays are swapped for a static icon + fade. This module
 * holds the icon/label per expression so both the Lottie player and the
 * static fallback agree on what a "sparkle" or a "tear" means.
 */

import type { ExpressionId } from '@/lib/engine/moments';

export interface ExpressionMeta {
  /** Static fallback glyph shown when motion is reduced. */
  icon: string;
  /** Accessible label for the overlay. */
  label: string;
  /** Accent used by the static badge. */
  color: string;
  /** Lottie JSON path (runtime-fetched, Gate 4 lazy-load). */
  file: string;
}

export const EXPRESSION_META: Record<ExpressionId, ExpressionMeta> = {
  sparkle: { icon: '✦', label: 'delighted', color: '#f6c344', file: '/animations/expression-sparkle.json' },
  tear: { icon: '✶', label: 'upset', color: '#5aa9f7', file: '/animations/expression-tear.json' },
  think: { icon: '…', label: 'thoughtful', color: '#9aa7b8', file: '/animations/expression-think.json' },
  giggle: { icon: '⌣', label: 'giggling', color: '#e88bbb', file: '/animations/expression-giggle.json' },
};

export function expressionMeta(expression: ExpressionId): ExpressionMeta {
  return EXPRESSION_META[expression];
}