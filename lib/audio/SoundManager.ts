/**
 * SoundManager — the single facade every component/store talks to.
 *
 * AGENT.md §3/§4: audio runs through one SoundManager service in `/lib/audio`.
 * It routes procedural cues to the Web Audio renderer and file-based cues
 * (music, licensed SFX once approved) to Howler.js, which is lazy-imported so
 * it never enters the initial bundle until a file actually plays
 * (AGENT.md §7 ~200KB first-load budget).
 *
 * Nothing plays before the first user gesture: `play`/`startMusic` only
 * create an AudioContext/Howl instance at call time (Gate 3 no-autoplay, and
 * browser autoplay policy).
 */

import type { MusicStageId, MusicTrack, SfxDef, SfxEvent, SynthStep } from './manifest';
import { MUSIC_MANIFEST, SFX_MANIFEST } from './manifest';
import { SynthPlayer } from './synth';

export interface SoundConfig {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

/** Everything the facade touches is swappable so tests can spy on it. */
export interface AudioRuntime {
  playSynth(steps: SynthStep[], volume: number): boolean;
  playFile(src: string, volume: number, loop?: boolean): void;
  startMusic(src: string, volume: number): void;
  stopMusic(): void;
  setMusicVolume(volume: number): void;
  hasContext(): boolean;
}

/** Production runtime: Web Audio synth + lazily-loaded Howler for files. */
export class WebAudioRuntime implements AudioRuntime {
  private player = new SynthPlayer();
  private howler: typeof import('howler') | null = null;
  private activeHowls: import('howler').Howl[] = [];
  private howlerLoadPromise: Promise<typeof import('howler')> | null = null;

  private async ensureHowler(): Promise<typeof import('howler') | null> {
    if (typeof window === 'undefined') return null;
    if (this.howler) return this.howler;
    if (!this.howlerLoadPromise) {
      this.howlerLoadPromise = import('howler').then((mod) => {
        this.howler = mod;
        return mod;
      });
    }
    return this.howlerLoadPromise;
  }

  playSynth(steps: SynthStep[], volume: number): boolean {
    return this.player.playCue(steps, volume);
  }

  async playFile(src: string, volume: number, loop = false): Promise<void> {
    const howler = await this.ensureHowler();
    if (!howler || typeof howler.Howl === 'undefined') return;
    const howl = new howler.Howl({ src: [src], volume, loop });
    this.activeHowls.push(howl);
    howl.play();
  }

  startMusic(src: string, volume: number): void {
    void this.playFile(src, volume, true);
  }

  stopMusic(): void {
    for (const howl of this.activeHowls) {
      try {
        howl.stop();
      } catch {
        // Already released.
      }
    }
    this.activeHowls = [];
  }

  setMusicVolume(volume: number): void {
    for (const howl of this.activeHowls) {
      try {
        howl.volume(volume);
      } catch {
        // Ignore.
      }
    }
  }

  hasContext(): boolean {
    return this.player.hasContext();
  }
}

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  sfxEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.5,
};

export class SoundManager {
  private runtime: AudioRuntime;
  private config: SoundConfig = { ...DEFAULT_SOUND_CONFIG };
  private musicTrackId: MusicStageId | null = null;
  private everPlayed = false;

  constructor(runtime: AudioRuntime = new WebAudioRuntime()) {
    this.runtime = runtime;
  }

  /** Reflects persisted settings into the runtime immediately. */
  configure(config: SoundConfig): void {
    const musicWasEnabled = this.config.musicEnabled;
    this.config = { ...config };
    this.runtime.setMusicVolume(this.config.musicVolume);
    if (musicWasEnabled && !config.musicEnabled) {
      this.runtime.stopMusic();
      this.musicTrackId = null;
    }
  }

  get muted(): boolean {
    return !this.config.sfxEnabled;
  }

  get soundEnabled(): boolean {
    return this.config.sfxEnabled;
  }

  get musicEnabled(): boolean {
    return this.config.musicEnabled;
  }

  hasAudioContext(): boolean {
    return this.runtime.hasContext();
  }

  /** Debug state surfaced to Playwright via the MotionProvider (Gate 3). */
  getDebugState(): { contextStarted: boolean; everPlayed: boolean; muted: boolean } {
    return {
      contextStarted: this.hasAudioContext(),
      everPlayed: this.everPlayed,
      muted: this.muted,
    };
  }

  /** Play a short SFX by semantic name. Silently no-ops when disabled. */
  play(event: SfxEvent, volumeMod = 1): void {
    if (!this.config.sfxEnabled) return;
    const def: SfxDef = SFX_MANIFEST[event];
    if (!def) return;
    const volume = this.config.sfxVolume * volumeMod;
    if (def.kind === 'synth') {
      this.runtime.playSynth(def.steps, volume);
    } else {
      this.runtime.playFile(def.src, volume);
    }
    this.everPlayed = true;
  }

  /** Switch the ambient mood to the track for a life stage. */
  startMusic(stage: MusicStageId): void {
    if (!this.config.musicEnabled) return;
    if (this.musicTrackId === stage) return;
    const track: MusicTrack | undefined = MUSIC_MANIFEST[stage];
    if (!track || !track.file) return;
    this.runtime.stopMusic();
    this.runtime.startMusic(track.file, this.config.musicVolume);
    this.musicTrackId = stage;
    this.everPlayed = true;
  }

  stopMusic(): void {
    this.runtime.stopMusic();
    this.musicTrackId = null;
  }
}

export const soundManager = new SoundManager();