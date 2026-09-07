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
 * Adaptive music layer (DESIGN.md §6 point 5): one mood track per life arc.
 * `file` is `null` until a CC0 track is proposed, approved and logged in
 * `public/audio/CREDITS.md`; until then the music layer is a silent no-op.
 */
export type MusicStageId =
  | 'infant'
  | 'child'
  | 'teen'
  | 'young-adult'
  | 'adult'
  | 'middle-aged'
  | 'senior';

export interface MusicTrack {
  id: MusicStageId;
  label: string;
  mood: string;
  file: string | null;
}

export const MUSIC_MANIFEST: Record<MusicStageId, MusicTrack> = {
  infant: { id: 'infant', label: 'Infancy', mood: 'gentle lullaby pads', file: null },
  child: { id: 'child', label: 'Childhood', mood: 'bright, playful', file: null },
  teen: { id: 'teen', label: 'Teen years', mood: 'energetic, restless', file: null },
  'young-adult': { id: 'young-adult', label: 'Young adulthood', mood: 'hopeful, forward-moving', file: null },
  adult: { id: 'adult', label: 'Adulthood', mood: 'steady, warm', file: null },
  'middle-aged': { id: 'middle-aged', label: 'Middle age', mood: 'settled, reflective', file: null },
  senior: { id: 'senior', label: 'Senior years', mood: 'calm, nostalgic', file: null },
};

/**
 * Small, pleasant synthesis presets. Durations stay within the motion-tier
 * spirit of AGENT.md §8 (micro ~150ms for ticks, moment 400-900ms for
 * life-stage/death beats).
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
  good_event: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 523, type: 'sine', dur: 0.12, gain: 0.32 },
      { t: 0.09, freq: 659, type: 'sine', dur: 0.12, gain: 0.32 },
      { t: 0.18, freq: 784, type: 'sine', dur: 0.28, gain: 0.3 },
    ],
  },
  bad_event: {
    kind: 'synth',
    steps: [
      { t: 0, freq: 196, freqEnd: 150, type: 'sawtooth', dur: 0.3, gain: 0.3 },
      { t: 0, freq: 98, type: 'sawtooth', dur: 0.34, gain: 0.2 },
    ],
  },
  neutral_event: {
    kind: 'synth',
    steps: [{ t: 0, freq: 440, type: 'triangle', dur: 0.13, gain: 0.28 }],
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
      { t: 0, freq: 220, type: 'sawtooth', dur: 0.9, gain: 0.2 },
      { t: 0, freq: 262, type: 'sine', dur: 0.9, gain: 0.16 },
      { t: 0, freq: 311, type: 'sine', dur: 0.9, gain: 0.14 },
      { t: 0.15, freq: 110, type: 'sine', dur: 0.75, gain: 0.22 },
    ],
  },
};