import type { LifeEventDef } from '@/lib/engine/types';

/**
 * Acceptable age band per life-stage category. Derived from the tightest
 * bounds that the union of the content registry and the fallback bank
 * actually use (allows categories to overlap at the edges, as authored).
 */
export const LIFESTAGE_BY_CATEGORY: Record<LifeEventDef['category'], [number, number]> = {
  childhood: [0, 12],
  teen: [12, 25],
  'young-adult': [18, 35],
  adult: [18, 90],
  senior: [52, 120],
  universal: [0, 120],
};