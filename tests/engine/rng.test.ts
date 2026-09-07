import { describe, expect, it } from 'vitest';
import { RNG } from '@/lib/engine/rng';

describe('RNG determinism (Gate 1 / Test 1)', () => {
  it('two RNGs with the same seed produce identical sequences', () => {
    const a = new RNG(42);
    const b = new RNG(42);
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('two RNGs with different seeds diverge', () => {
    const a = new RNG(42);
    const b = new RNG(43);
    const seqA: number[] = [];
    const seqB: number[] = [];
    for (let i = 0; i < 10; i++) {
      seqA.push(a.next());
      seqB.push(b.next());
    }
    expect(seqA).not.toEqual(seqB);
  });

  it('rangeInt stays within inclusive bounds across many draws', () => {
    const rng = new RNG(7);
    for (let i = 0; i < 5000; i++) {
      const value = rng.rangeInt(3, 17);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(17);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('pick rejects empty arrays and returns members for non-empty ones', () => {
    const rng = new RNG(1);
    expect(() => rng.pick([])).toThrow();
    expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
  });

  it('save/restore of internal state resumes the same sequence', () => {
    const rng = new RNG(99);
    rng.next();
    rng.next();
    const state = rng.getState();
    const forward = rng.next();

    const restored = new RNG(0);
    restored.setState(state);
    expect(restored.next()).toBe(forward);
  });
});