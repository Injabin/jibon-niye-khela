/**
 * Procedural SFX renderer (Web Audio API, no asset files).
 *
 * init.md M3 item 3 explicitly permits synthesizing simple tones for MVP
 * SFX rather than bundling third-party files — this keeps the initial audio
 * payload at zero until a separate licensed music tracker is added.
 *
 * AudioContext is created lazily and only on explicit `playCue` calls, so
 * nothing is ever attempted before a user gesture (Gate 3 requirement and
 * browser autoplay policy).
 */

import type { SynthStep } from './manifest';

const FADE_IN_SECONDS = 0.008;

export class SynthPlayer {
  private ctx: AudioContext | null = null;

  /** True once any AudioContext has been created (used by the Gate 3 no-autoplay check). */
  hasContext(): boolean {
    return this.ctx !== null;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  /** Render a single synthesized cue. No-op when no audio is available. */
  playCue(steps: SynthStep[], masterVolume: number): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return false;

    const t0 = ctx.currentTime + 0.02;
    for (const step of steps) {
      const osc = ctx.createOscillator();
      osc.type = step.type ?? 'sine';
      osc.frequency.setValueAtTime(step.freq, t0 + step.t);
      if (typeof step.freqEnd === 'number') {
        osc.frequency.linearRampToValueAtTime(step.freqEnd, t0 + step.t + step.dur);
      }

      const gain = ctx.createGain();
      const peak = (step.gain ?? 0.3) * masterVolume;
      gain.gain.setValueAtTime(0.0001, t0 + step.t);
      gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + step.t + FADE_IN_SECONDS);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step.t + step.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + step.t);
      osc.stop(t0 + step.t + step.dur + 0.05);
    }
    return true;
  }
}