/**
 * Life-stage classification (pure, non-random).
 *
 * Drives the adaptive music layer (DESIGN.md §6 point 5) and can gate
 * content/audio cues by the character's current life arc.
 */

export type LifeStage =
  | 'infant'
  | 'child'
  | 'teen'
  | 'young-adult'
  | 'adult'
  | 'middle-aged'
  | 'senior';

/**
 * Classify an age into a broad life arc. Thresholds are inclusive at the
 * lower bound; `senior` begins at the same age the engine starts applying
 * meaningful old-age death risk.
 */
export function lifeStageForAge(age: number): LifeStage {
  if (age < 0) return 'infant';
  if (age <= 3) return 'infant';
  if (age <= 12) return 'child';
  if (age <= 17) return 'teen';
  if (age <= 25) return 'young-adult';
  if (age <= 40) return 'adult';
  if (age <= 65) return 'middle-aged';
  return 'senior';
}
