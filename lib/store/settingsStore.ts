/**
 * Persisted user settings (init.md M3 #4).
 *
 * Sound/music toggles + volumes, plus the reduced-motion mode that defaults
 * to "follow the OS setting" (`prefers-reduced-motion`). Every audio-facing
 * change is pushed live into the SoundManager so toggles take effect
 * instantly.
 */

import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { SoundConfig, SoundManager } from '@/lib/audio/SoundManager';
import { soundManager } from '@/lib/audio/SoundManager';
import type { SaveStorage } from '@/lib/save/storage';
import { localStorageStorage } from '@/lib/save/storage';

export type ReducedMotionMode = 'system' | 'reduced' | 'full';

export type ThemeMode = 'system' | 'light' | 'dark';

export const SETTINGS_STORAGE_KEY = 'jibon-niye-khela/settings';

const DEFAULT_SETTINGS = {
  sfxEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  reducedMotion: 'system' as ReducedMotionMode,
  theme: 'system' as ThemeMode,
};

export interface SettingsState {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  reducedMotion: ReducedMotionMode;
  theme: ThemeMode;
  isHydrated: boolean;
}

export interface SettingsActions {
  /** Restore persisted settings once per page load and apply them to audio. */
  hydrate(): void;
  setSfxEnabled(enabled: boolean): void;
  setMusicEnabled(enabled: boolean): void;
  setSfxVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  setReducedMotionMode(mode: ReducedMotionMode): void;
  setThemeMode(mode: ThemeMode): void;
}

type SettingsStore = SettingsState & SettingsActions;

const clampVolume = (value: number): number => Math.min(1, Math.max(0, value));

function sanitize(raw: Partial<SettingsState> | null | undefined): SettingsState {
  const parsed: SettingsState = { ...DEFAULT_SETTINGS, isHydrated: true };
  if (!raw) return parsed;
  if (typeof raw.sfxEnabled === 'boolean') parsed.sfxEnabled = raw.sfxEnabled;
  if (typeof raw.musicEnabled === 'boolean') parsed.musicEnabled = raw.musicEnabled;
  if (typeof raw.sfxVolume === 'number') parsed.sfxVolume = clampVolume(raw.sfxVolume);
  if (typeof raw.musicVolume === 'number') parsed.musicVolume = clampVolume(raw.musicVolume);
  if (raw.reducedMotion === 'system' || raw.reducedMotion === 'reduced' || raw.reducedMotion === 'full') {
    parsed.reducedMotion = raw.reducedMotion;
  }
  if (raw.theme === 'system' || raw.theme === 'light' || raw.theme === 'dark') {
    parsed.theme = raw.theme;
  }
  return parsed;
}

interface CreateSettingsStoreOptions {
  storage?: SaveStorage;
  /** Injectable so tests can spy on the audio side-effects. */
  audio?: Pick<SoundManager, 'configure'>;
}

export function createSettingsStore(
  options: CreateSettingsStoreOptions = {},
): UseBoundStore<StoreApi<SettingsStore>> {
  const storage = options.storage ?? localStorageStorage;
  const audio = options.audio ?? soundManager;

  function toAudioConfig(state: SettingsState): SoundConfig {
    return {
      sfxEnabled: state.sfxEnabled,
      musicEnabled: state.musicEnabled,
      sfxVolume: state.sfxVolume,
      musicVolume: state.musicVolume,
    };
  }

  return create<SettingsStore>()((set, get) => {
    function persist(): void {
      const { sfxEnabled, musicEnabled, sfxVolume, musicVolume, reducedMotion, theme } = get();
      storage.write(JSON.stringify({ sfxEnabled, musicEnabled, sfxVolume, musicVolume, reducedMotion, theme }));
    }

    return {
      ...DEFAULT_SETTINGS,
      isHydrated: false,

      hydrate() {
        if (get().isHydrated) return;
        let raw: string | null = null;
        try {
          raw = storage.read();
        } catch {
          raw = null;
        }
        const parsed = sanitize(raw ? JSON.parse(raw) : null);
        set(parsed);
        audio.configure(toAudioConfig(parsed));
      },

      setSfxEnabled(enabled) {
        set({ sfxEnabled: enabled });
        persist();
        audio.configure(toAudioConfig(get()));
      },

      setMusicEnabled(enabled) {
        set({ musicEnabled: enabled });
        persist();
        audio.configure(toAudioConfig(get()));
      },

      setSfxVolume(volume) {
        set({ sfxVolume: clampVolume(volume) });
        persist();
        audio.configure(toAudioConfig(get()));
      },

      setMusicVolume(volume) {
        set({ musicVolume: clampVolume(volume) });
        persist();
        audio.configure(toAudioConfig(get()));
      },

      setReducedMotionMode(mode) {
        set({ reducedMotion: mode });
        persist();
      },

      setThemeMode(mode) {
        set({ theme: mode });
        persist();
      },
    };
  });
}

/** The app-wide singleton settings store. */
export const settingsStore = createSettingsStore();