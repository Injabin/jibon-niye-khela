import type { LifeEventDef } from '@/lib/engine/types';
import { CHILDHOOD_EVENTS } from './childhood';
import { TEEN_EVENTS } from './teen';

export const EVENT_REGISTRY: readonly LifeEventDef[] = [...CHILDHOOD_EVENTS, ...TEEN_EVENTS];

export type { LifeEventDef } from '@/lib/engine/types';