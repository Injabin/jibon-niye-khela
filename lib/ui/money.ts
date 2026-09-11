/**
 * Unified money presentation for the "Modern Martial" theme (UI-DESIGN.md §1.3:
 * tabular-nums, no $ sign, no K/M/B jitter). Engine `money` stays an integer;
 * only the rendering changes.
 */
export function formatMoney(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}