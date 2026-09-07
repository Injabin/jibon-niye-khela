import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MILESTONE_KINDS } from '@/lib/engine/moments';
import type { MilestoneKind } from '@/lib/engine/types';
import { EXPRESSION_FILE, MOMENT_STING, stingVisualsFor } from '@/lib/motion/moments';
import { EXPRESSION_META } from '@/lib/avatar/expressions';

const ANIM_DIR = join(process.cwd(), 'public', 'animations');

describe('moment sting mapping (M4, Gate 4)', () => {
  it('covers every milestone kind exactly once', () => {
    const ids = MILESTONE_KINDS.map((k) => k.id);
    expect(Object.keys(MOMENT_STING).sort()).toEqual([...ids].sort());
    for (const kind of ids) expect(stingVisualsFor(kind).file, kind).toContain(`sting-${kind}.json`);
  });

  it('maps every kind to a real, existing Lottie asset', () => {
    for (const { file } of Object.values(MOMENT_STING)) {
      expect(existsSync(join(ANIM_DIR, file.replace('/animations/', ''))), `${file} missing`).toBe(true);
    }
  });

  it('plays the right SFX per kind (and none for tombstone — death cue handles it)', () => {
    expect(MOMENT_STING.money.sfx).toBe('money_up');
    expect(MOMENT_STING.handcuffs.sfx).toBe('bad_event');
    for (const kind of Object.keys(MOMENT_STING) as MilestoneKind[]) {
      if (kind === 'tombstone') expect(MOMENT_STING[kind].sfx).toBeNull();
      else expect(MOMENT_STING[kind].sfx).toBeTypeOf('string');
    }
  });

  it('keeps every expression mapped to an existing Lottie asset', () => {
    for (const [id, meta] of Object.entries(EXPRESSION_META)) {
      expect(EXPRESSION_FILE[id as keyof typeof EXPRESSION_FILE], id).toBe(meta.file);
      expect(existsSync(join(ANIM_DIR, meta.file.replace('/animations/', ''))), `${meta.file} missing`).toBe(
        true,
      );
    }
  });

  it('expression files line up with the four known expressions', () => {
    expect(Object.keys(EXPRESSION_FILE).sort()).toEqual(['giggle', 'sparkle', 'tear', 'think']);
  });
});