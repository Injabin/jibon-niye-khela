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

import type { MusicArcId, MusicTrack, SfxDef, SfxEvent, SynthStep } from './manifest';
import { CROSSFADE_SECONDS, MUSIC_MANIFEST, SFX_MANIFEST } from './manifest';
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
  startMusic(src: string, volume: number, fadeSeconds?: number): void;
  stopMusic(): void;
  setMusicVolume(volume: number): void;
  hasContext(): boolean;
}

/** Production runtime: Web Audio synth + lazily-loaded Howler for files. */
export class WebAudioRuntime implements AudioRuntime {
  private player = new SynthPlayer();
  private howler: typeof import('howler') | null = null;
  private activeHowls: import('howler').Howl[] = [];
  private currentMusic: import('howler').Howl | null = null;
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

  /**
   * Start (or crossfade into) a music track. A non-zero `fadeSeconds` fades
   * the previous track out and the next one in, so the early→late arc switch
   * never hard-cuts (Phase 7). The new Howl is pre-silenced before play so no
   * abrupt pop can occur under the fade-in.
   */
  startMusic(src: string, volume: number, fadeSeconds = 0): void {
    void this.ensureHowler().then((howler) => {
      if (!howler || typeof howler.Howl === 'undefined') return;
      const fade = Math.max(0, fadeSeconds ?? 0);
      const prev = this.currentMusic;
      const next = new howler.Howl({ src: [src], loop: true, volume: fade > 0 ? 0.0001 : volume });
      this.currentMusic = next;
      this.activeHowls.push(next);
      next.play();
      if (fade > 0) next.fade(0.0001, volume, fade);
      if (prev) {
        if (fade > 0 && typeof prev.fade === 'function') {
          prev.fade(prev.volume(), 0, fade);
          prev.once('fade', () => {
            try {
              prev.stop();
            } catch {
              // Already released.
            }
          });
        } else {
          try {
            prev.stop();
            const idx = this.activeHowls.indexOf(prev);
            if (idx >= 0) this.activeHowls.splice(idx, 1);
          } catch {
            // Already released.
          }
        }
      }
    });
  }

  stopMusic(): void {
    this.currentMusic = null;
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
  private musicArcId: MusicArcId | null = null;
  private everPlayed = false;
  /**
   * Debug-only playback logs (capped) that Playwright/Gate 7 reads via the
   * `__JNK_AUDIO__` probe to *spy* on the cues the game actually raised.
   */
  private sfxPlays: SfxEvent[] = [];
  private musicPlays: string[] = [];

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
      this.musicArcId = null;
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

  /** Debug state surfaced to Playwright via the MotionProvider (Gate 3 / 7). */
  getDebugState(): {
    contextStarted: boolean;
    everPlayed: boolean;
    muted: boolean;
    activeArc: MusicArcId | null;
    sfxPlays: readonly SfxEvent[];
    musicPlays: readonly string[];
  } {
    return {
      contextStarted: this.hasAudioContext(),
      everPlayed: this.everPlayed,
      muted: this.muted,
      activeArc: this.musicArcId,
      sfxPlays: [...this.sfxPlays],
      musicPlays: [...this.musicPlays],
    };
  }

  private logSfx(event: SfxEvent): void {
    this.sfxPlays.push(event);
    if (this.sfxPlays.length > 64) this.sfxPlays.shift();
  }

  private logMusic(file: string): void {
    this.musicPlays.push(file);
    if (this.musicPlays.length > 64) this.musicPlays.shift();
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
    this.logSfx(event);
  }

  /** Switch the ambient mood to the arc's track, crossfading from the old one. */
  startMusic(arc: MusicArcId): void {
    if (!this.config.musicEnabled) return;
    if (this.musicArcId === arc) return;
    const track: MusicTrack | undefined = MUSIC_MANIFEST[arc];
    if (!track) return;
    this.runtime.startMusic(track.file, this.config.musicVolume, CROSSFADE_SECONDS);
    this.musicArcId = arc;
    this.everPlayed = true;
    this.logMusic(track.file);
  }

  stopMusic(): void {
    this.runtime.stopMusic();
    this.musicArcId = null;
  }

  /** Ducks ambient music volume when the game is paused, or restores it when resumed. */
  duckMusic(ducked: boolean): void {
    if (!this.config.musicEnabled) return;
    const targetVolume = ducked ? this.config.musicVolume * 0.25 : this.config.musicVolume;
    this.runtime.setMusicVolume(targetVolume);
  }
}

export const soundManager = new SoundManager();