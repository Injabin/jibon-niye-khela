/**
 * Sound manifest — the single registry of every audible event.
 *
 * DESIGN.md §6 point 5: every button press, stat change, good/bad event and
 * life-stage transition has a distinct short SFX. init.md M3: cues are
 * keyed by semantic event names. SFX may be either procedurally synthesized
 * (Web Audio, no files to license) or a bundled CC0 file (once approved and
 * logged in `public/audio/CREDITS.md`).
 */

export type SfxEvent =
  | 'button_press'
  | 'stat_up'
  | 'stat_down'
  | 'money_up'
  | 'money_down'
  | 'good_event'
  | 'bad_event'
  | 'neutral_event'
  | 'funny_event'
  | 'birth'
  | 'age_up'
  | 'life_stage_change'
  | 'death';

export interface SynthStep {
  /** Start time in seconds from cue onset. */
  t: number;
  freq: number;
  /** Target frequency for a linear slide (glissando). */
  freqEnd?: number;
  type?: OscillatorType;
  /** Duration in seconds. */
  dur: number;
  /** Relative peak gain (0..1); scaled by the master SFX volume. */
  gain?: number;
}

export interface SynthSfx {
  kind: 'synth';
  steps: SynthStep[];
}

export interface FileSfx {
  kind: 'file';
  /** Path under /public. Played through Howler.js. */
  src: string;
}

export type SfxDef = SynthSfx | FileSfx;

/**
 * Adaptive music layer (Additional_plus_improved_plan Phase 7): exactly **two**
 * mood tracks total, one per life arc, instead of a per-stage rotation.
 * `early_life` spans birth through age 17; `late_life` from age 18 onward.
 * Tracks crossfade when the age boundary is crossed during an Age Up.
 */
export type MusicArcId = 'early' | 'late';

export interface MusicTrack {
  id: MusicArcId;
  label: string;
  mood: string;
  file: string;
}

export const CROSSFADE_SECONDS = 1.5;

export const MUSIC_MANIFEST: Record<MusicArcId, MusicTrack> = {
  early: { id: 'early', label: 'Early life (ages 0–17)', mood: 'lighter, warmer', file: '/audio/lofi.ogg' },
  late: { id: 'late', label: 'Late life (ages 18+)', mood: 'more mature, weightier', file: '/audio/ambient.ogg' },
};

/**
 * The arc boundary: birth → end of the Teen life stage (DESIGN.md §4, teen is
 * 13–17) plays `early`; Young Adult onward (18+) plays `late`. Inclusive at
 * the lower bound, so 18 is the first late-life year.
 */
export function musicArcForAge(age: number): MusicArcId {
  return age <= 17 ? 'early' : 'late';
}

/**
 * Small, pleasant synthesis presets. Durations stay within the motion-tier
 * spirit of AGENT.md §8 (micro ~150ms for ticks, moment 400-900ms for
 * life-stage/death beats).
 *
 * Phase 7 emotional audio: the good/bad/death/birth/funny cues are shaped
 * like short human vocalizations — pitch contours (glissandi) and overlapping
 * voices approximate a baby cry, an affirming "oh nice", a dismayed "oh no"
 * and a warm "ugh/ah" fall — rendered procedurally, so no external sample is
 * licensed or bundled (see public/audio/CREDITS.md).
 */
export const SFX_MANIFEST: Record<SfxEvent, SfxDef> = {
  button_press: {
    kind: 'synth',
    steps: [{ t: 0, freq: 720, type: 'square', dur: 0.03, gain: 0.16 }],
  },
  stat_up: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 523, type: 'sine', dur: 0.09, gain: 0.4 },
      { t: 0.06, freq: 784, type: 'sine', dur: 0.12, gain: 0.35 },
    ],
  },
  money_up: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 659, type: 'triangle', dur: 0.08, gain: 0.4 },
      { t: 0.07, freq: 988, type: 'triangle', dur: 0.14, gain: 0.35 },
    ],
  },
  stat_down: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 330, type: 'square', dur: 0.09, gain: 0.28 },
      { t: 0.08, freq: 220, type: 'square', dur: 0.13, gain: 0.26 },
    ],
  },
  money_down: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 262, type: 'sawtooth', dur: 0.09, gain: 0.26 },
      { t: 0.08, freq: 196, type: 'sawtooth', dur: 0.13, gain: 0.22 },
    ],
  },
  birth: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 620, freqEnd: 780, type: 'sine', dur: 0.16, gain: 0.42 },
      { t: 0.02, freq: 500, freqEnd: 640, type: 'sine', dur: 0.16, gain: 0.4 },
      { t: 0.16, freq: 700, freqEnd: 840, type: 'sine', dur: 0.2, gain: 0.42 },
      { t: 0.18, freq: 560, freqEnd: 700, type: 'sine', dur: 0.2, gain: 0.38 },
    ],
  },
  good_event: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 392, freqEnd: 466, type: 'sine', dur: 0.14, gain: 0.34 },
      { t: 0.1, freq: 523, freqEnd: 587, type: 'sine', dur: 0.18, gain: 0.32 },
      { t: 0.2, freq: 659, freqEnd: 698, type: 'sine', dur: 0.3, gain: 0.26 },
    ],
  },
  bad_event: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 466, freqEnd: 440, type: 'sine', dur: 0.16, gain: 0.34 },
      { t: 0.12, freq: 440, freqEnd: 392, type: 'sine', dur: 0.26, gain: 0.32 },
      { t: 0.22, freq: 311, freqEnd: 277, type: 'triangle', dur: 0.34, gain: 0.3 },
    ],
  },
  neutral_event: {
    kind: 'synth',
    steps: [{ t: 0, freq: 440, type: 'triangle', dur: 0.13, gain: 0.28 }],
  },
  funny_event: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 330, freqEnd: 660, type: 'square', dur: 0.1, gain: 0.18 },
      { t: 0.09, freq: 660, freqEnd: 990, type: 'square', dur: 0.12, gain: 0.16 },
      { t: 0.2, freq: 494, type: 'sine', dur: 0.16, gain: 0.2 },
    ],
  },
  age_up: {
    kind: 'synth',
    steps: [{ t: 0, freq: 880, type: 'triangle', dur: 0.05, gain: 0.22 }],
  },
  life_stage_change: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 330, freqEnd: 660, type: 'square', dur: 0.4, gain: 0.18 },
      { t: 0.02, freq: 880, type: 'sine', dur: 0.3, gain: 0.12 },
    ],
  },
  death: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 146.83, type: 'sine', dur: 1.1, gain: 0.22 },
      { t: 0, freq: 174.61, type: 'sine', dur: 1.1, gain: 0.14 },
      { t: 0, freq: 220, type: 'sine', dur: 1.1, gain: 0.1 },
      { t: 0.3, freq: 110, type: 'sine', dur: 0.8, gain: 0.2 },
    ],
  },
};