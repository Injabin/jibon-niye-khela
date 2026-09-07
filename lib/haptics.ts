/**
 * Haptic feedback (DESIGN.md §6 point 6, init.md M3 #5).
 *
 * Mirrors key audio beats on mobile via `navigator.vibrate` where supported.
 * Patterns are deliberately short; the call is guarded so unsupported
 * environments (desktop, privacy-restricted) are a silent no-op.
 */

import type { SfxEvent } from './audio/manifest';

const PATTERNS: Partial<Record<SfxEvent, number | number[]>> = {
  button_press: 8,
  stat_up: 15,
  money_up: 20,
  stat_down: [14, 35, 14],
  money_down: [14, 35, 14],
  good_event: 25,
  bad_event: [20, 45, 20],
  neutral_event: 10,
  age_up: 10,
  life_stage_change: [30, 50, 30],
  death: [50, 70, 50, 70, 50],
};

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  const navigatorWithVibrate = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof navigatorWithVibrate.vibrate !== 'function') return;
  try {
    navigatorWithVibrate.vibrate(pattern);
  } catch {
    // Vibration can be denied by permission policies; ignore.
  }
}

/** Fire the haptic pattern paired with an SFX event. */
export function hapticForSfx(event: SfxEvent): void {
  const pattern = PATTERNS[event];
  if (pattern !== undefined) vibrate(pattern);
}