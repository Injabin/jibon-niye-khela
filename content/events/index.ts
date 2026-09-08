import type { LifeEventDef } from '@/lib/engine/types';
import { CHILDHOOD_EVENTS } from './childhood';
import { TEEN_EVENTS } from './teen';
import { YOUNG_ADULT_EVENTS } from './youngAdult';
import { ADULT_EVENTS } from './adult';
import { SENIOR_EVENTS } from './senior';
import { UNIVERSAL_EVENTS } from './universal';

export const EVENT_REGISTRY: readonly LifeEventDef[] = [
  ...CHILDHOOD_EVENTS,
  ...TEEN_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...ADULT_EVENTS,
  ...SENIOR_EVENTS,
  ...UNIVERSAL_EVENTS,
];

export type { LifeEventDef } from '@/lib/engine/types';