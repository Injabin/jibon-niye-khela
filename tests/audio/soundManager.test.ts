import { describe, expect, it } from 'vitest';
import { SoundManager } from '@/lib/audio/SoundManager';
import type { AudioRuntime, SoundConfig } from '@/lib/audio/SoundManager';
import { CROSSFADE_SECONDS, MUSIC_MANIFEST, SFX_MANIFEST, type SfxEvent } from '@/lib/audio/manifest';
import { createInMemoryStorage } from '@/lib/save/storage';
import { createSettingsStore } from '@/lib/store/settingsStore';

interface Recorder {
  /** Playback events (synth/file/music start/stop). */
  calls: string[];
  /** Configuration-only events (volume sync). */
  configCalls: string[];
  runtime: AudioRuntime;
}

function spyRuntime(): Recorder {
  const calls: string[] = [];
  const configCalls: string[] = [];
  const runtime: AudioRuntime = {
    playSynth(steps, volume) {
      calls.push(`synth:${steps.length}@${volume}`);
      return true;
    },
    playFile(src, volume) {
      calls.push(`file:${src}@${volume}`);
    },
    startMusic(src, volume, fadeSeconds) {
      calls.push(`music:start:${src}@${volume}:fade${fadeSeconds}`);
    },
    stopMusic() {
      calls.push('music:stop');
    },
    setMusicVolume(volume) {
      configCalls.push(`music:volume:${volume}`);
    },
    hasContext() {
      return false;
    },
  };
  return { calls, configCalls, runtime };
}

function config(c: Partial<SoundConfig>): SoundConfig {
  return { sfxEnabled: true, musicEnabled: true, sfxVolume: 0.8, musicVolume: 0.5, ...c };
}

/** Point a manifest track at a real file for the duration of a test. */
function withMusicFile(block: () => void): void {
  const original = MUSIC_MANIFEST.early.file;
  MUSIC_MANIFEST.early.file = '/audio/test-track.ogg';
  try {
    block();
  } finally {
    MUSIC_MANIFEST.early.file = original;
  }
}

describe('SoundManager (Gate 3)', () => {
  it('plays nothing before the first gesture and only routes known events', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({}));

    // No interaction yet: the runtime must not have been touched.
    expect(recorder.calls).toEqual([]);
    expect(manager.hasAudioContext()).toBe(false);

    manager.play('button_press');
    expect(recorder.calls.length).toBe(1);
    expect(recorder.calls[0]).toMatch(/^synth:/);
  });

  it('scales each synthesized cue by the configured SFX volume', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({ sfxVolume: 0.5 }));

    manager.play('stat_up');
    expect(recorder.calls).toEqual(['synth:2@0.5']);
    expect(recorder.calls[0]).not.toMatch(/@0.8$/);
  });

  it('muted sound effects produce zero playback calls', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({ sfxEnabled: false }));

    manager.play('stat_up');
    manager.play('bad_event');
    manager.play('death');

    expect(recorder.calls).toEqual([]);
    expect(manager.muted).toBe(true);
  });

  it('disabling music stops the current track', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({ musicEnabled: true }));

    withMusicFile(() => {
      manager.startMusic('early');
      expect(recorder.calls.some((call) => call.startsWith('music:start'))).toBe(true);

      manager.configure(config({ musicEnabled: false }));
      expect(recorder.calls).toContain('music:stop');
    });
  });

  it('does not restart the same music arc twice', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({}));

    withMusicFile(() => {
      manager.startMusic('early');
      manager.startMusic('early');
      expect(recorder.calls.filter((call) => call.startsWith('music:start'))).toHaveLength(1);
    });
  });

  it('logs music-plays so the Gate 7 probe can spy on the early→late switch', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({}));

    manager.startMusic('early');
    manager.startMusic('late');

    expect(manager.getDebugState()).toMatchObject({
      activeArc: 'late',
      musicPlays: [MUSIC_MANIFEST.early.file, MUSIC_MANIFEST.late.file],
    });
  });
});

describe('SoundManager (Gate 7 crossfade)', () => {
  it('crossfades into a new arc with the manifest fade instead of a hard cut', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({}));

    manager.startMusic('early');
    manager.startMusic('late');
    manager.stopMusic();

    expect(recorder.calls).toEqual([
      `music:start:${MUSIC_MANIFEST.early.file}@0.5:fade${CROSSFADE_SECONDS}`,
      `music:start:${MUSIC_MANIFEST.late.file}@0.5:fade${CROSSFADE_SECONDS}`,
      'music:stop',
    ]);
  });

  it('tracks the active arc and caps the debug-playback logs', () => {
    const recorder = spyRuntime();
    const manager = new SoundManager(recorder.runtime);
    manager.configure(config({}));

    for (let i = 0; i < 80; i += 1) manager.play('stat_up');
    expect(manager.getDebugState().sfxPlays).toHaveLength(64);
    expect(manager.getDebugState().sfxPlays[0]).toBe('stat_up');
  });
});

describe('settings → SoundManager integration (Gate 3 mute toggle)', () => {
  it('toggling sound off in Settings silences playback through the manager', () => {
    const recorder = spyRuntime();
    const audio = new SoundManager(recorder.runtime);
    const store = createSettingsStore({ storage: createInMemoryStorage(), audio });

    store.getState().hydrate();
    expect(audio.soundEnabled).toBe(true);

    audio.play('stat_up');
    expect(recorder.calls).toHaveLength(1);

    store.getState().setSfxEnabled(false);
    expect(audio.soundEnabled).toBe(false);
    audio.play('stat_down');
    audio.play('good_event');
    expect(recorder.calls).toHaveLength(1); // no new playback while muted

    store.getState().setSfxEnabled(true);
    audio.play('money_up');
    expect(recorder.calls).toHaveLength(2);
  });

  it('persists the settings that were toggled for the next session', () => {
    const storage = createInMemoryStorage();
    const dummyAudio = new SoundManager(spyRuntime().runtime);
    const store = createSettingsStore({ storage, audio: dummyAudio });
    store.getState().hydrate();

    store.getState().setSfxEnabled(false);
    store.getState().setReducedMotionMode('reduced');

    const persisted = JSON.parse(storage.read() as string);
    expect(persisted.sfxEnabled).toBe(false);
    expect(persisted.reducedMotion).toBe('reduced');

    // A fresh store hydrates back to the same values.
    const freshStore = createSettingsStore({ storage, audio: dummyAudio });
    freshStore.getState().hydrate();
    expect(freshStore.getState().sfxEnabled).toBe(false);
    expect(freshStore.getState().reducedMotion).toBe('reduced');
  });

  it('clamps out-of-range volumes when persisted', () => {
    const storage = createInMemoryStorage(
      JSON.stringify({ sfxEnabled: true, musicEnabled: true, sfxVolume: 3, musicVolume: -1, reducedMotion: 'full' }),
    );
    const dummyAudio = new SoundManager(spyRuntime().runtime);
    const store = createSettingsStore({ storage, audio: dummyAudio });
    store.getState().hydrate();
    expect(store.getState().sfxVolume).toBe(1);
    expect(store.getState().musicVolume).toBe(0);
  });
});

describe('manifest completeness (Gate 3 + Gate 7)', () => {
  it('covers every semantic SFX event the game can raise', () => {
    const events: SfxEvent[] = [
      'button_press',
      'stat_up',
      'stat_down',
      'money_up',
      'money_down',
      'good_event',
      'bad_event',
      'neutral_event',
      'funny_event',
      'age_up',
      'life_stage_change',
      'death',
      'birth',
    ];
    for (const event of events) {
      const def = SFX_MANIFEST[event];
      expect(def, `missing manifest entry for ${event}`).toBeTruthy();
      if (def?.kind === 'synth') expect(def.steps.length).toBeGreaterThan(0);
    }
  });
});