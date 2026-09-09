import { describe, expect, it } from 'vitest';
import { CROSSFADE_SECONDS, MUSIC_MANIFEST, musicArcForAge } from '@/lib/audio/manifest';

describe('music arcs (Gate 7)', () => {
  it('keeps the manifest to exactly two tracks that exist on disk', () => {
    expect(Object.keys(MUSIC_MANIFEST)).toEqual(['early', 'late']);
    const files = Object.values(MUSIC_MANIFEST).map((track) => track.file);
    expect(files.some((file) => file.endsWith('lofi.ogg'))).toBe(true);
    expect(files.some((file) => file.endsWith('ambient.ogg'))).toBe(true);
    expect(files.filter((file) => file.endsWith('.ogg'))).toHaveLength(2);
  });

  it('crossfades are short and always positive', () => {
    expect(CROSSFADE_SECONDS).toBeGreaterThan(0);
    expect(CROSSFADE_SECONDS).toBeLessThan(3);
  });

  it('maps the early arc on the character\'s 17th birthday and the late arc after', () => {
    expect(musicArcForAge(0)).toBe('early');
    expect(musicArcForAge(10)).toBe('early');
    expect(musicArcForAge(17)).toBe('early');
    expect(musicArcForAge(18)).toBe('late');
    expect(musicArcForAge(40)).toBe('late');
    expect(musicArcForAge(120)).toBe('late');
  });

  it('gives each arc a distinct label and mood for the settings copy', () => {
    expect(MUSIC_MANIFEST.early.label).toMatch(/early/i);
    expect(MUSIC_MANIFEST.late.label).toMatch(/late/i);
    expect(MUSIC_MANIFEST.early.mood).toBeTruthy();
    expect(MUSIC_MANIFEST.late.mood).toBeTruthy();
    expect(MUSIC_MANIFEST.early.file).not.toBe(MUSIC_MANIFEST.late.file);
  });

  it('no longer references the retired per-stage tracks', () => {
    const referenced = Object.values(MUSIC_MANIFEST).map((track) => track.file);
    for (const retired of ['heavenly.ogg', 'jump.ogg', 'fastsong.ogg']) {
      expect(referenced.some((file) => file.includes(retired))).toBe(false);
    }
  });
});