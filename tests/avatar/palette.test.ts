import { describe, expect, it } from 'vitest';
import { AVATAR_PALETTE, AVATAR_STAGES, avatarVisualsFor } from '@/lib/avatar/palette';

describe('avatar palette (DESIGN.md §2/§7)', () => {
  it('covers every life stage for both genders with matching keys', () => {
    for (const stage of AVATAR_STAGES) {
      for (const gender of ['male', 'female'] as const) {
        const visuals = avatarVisualsFor(stage, gender);
        expect(visuals.skin.length, `${stage}/${gender} skin`).toBeGreaterThan(0);
        expect(visuals.hair.length, `${stage}/${gender} hair`).toBeGreaterThan(0);
        expect(visuals.outfit.length, `${stage}/${gender} outfit`).toBeGreaterThan(0);
        expect(visuals.outfitAccent.length, `${stage}/${gender} accent`).toBeGreaterThan(0);
      }
    }
  });

  it('the palette table spans all seven engine life stages', () => {
    expect(['infant', 'child', 'teen', 'young-adult', 'adult', 'middle-aged', 'senior']).toEqual(
      expect.arrayContaining([...AVATAR_STAGES]),
    );
    expect(Object.keys(AVATAR_PALETTE)).toHaveLength(7);
  });

  it('heads are largest in infancy and smallest in old age', () => {
    const infant = avatarVisualsFor('infant', 'female');
    const senior = avatarVisualsFor('senior', 'male');
    expect(infant.headScale).toBeGreaterThan(senior.headScale);
    expect(senior.headScale).toBeLessThanOrEqual(1);
  });

  it('glasses appear only from middle age onward', () => {
    const early = ['infant', 'child', 'teen', 'young-adult', 'adult'] as const;
    for (const stage of early) {
      for (const gender of ['male', 'female'] as const) {
        expect(avatarVisualsFor(stage, gender).glasses).toBe(false);
      }
    }
    for (const stage of ['middle-aged', 'senior'] as const) {
      for (const gender of ['male', 'female'] as const) {
        expect(avatarVisualsFor(stage, gender).glasses).toBe(true);
      }
    }
  });
});