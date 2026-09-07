import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface LottieShapeGroup {
  ty: string;
  it?: Array<{ ty: string; [k: string]: unknown }>;
}

interface LottieLayer {
  ty: number;
  nm: string;
  ks: {
    o: { a: number; k: unknown };
    r: { a: number; k: unknown };
    p: { a: number; k: unknown };
    a: { a: number; k: unknown };
    s: { a: number; k: unknown };
  };
  shapes?: LottieShapeGroup[];
  ip: number;
  op: number;
}

interface LottieDoc {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  layers: LottieLayer[];
}

const ANIM_DIR = join(process.cwd(), 'public', 'animations');

/** Every M4 animation + one extra assertion each for the stings used in-game. */
const EXPECTED_FILES = [
  'expression-sparkle.json',
  'expression-tear.json',
  'expression-think.json',
  'expression-giggle.json',
  'sting-confetti.json',
  'sting-money.json',
  'sting-diploma.json',
  'sting-wedding.json',
  'sting-handcuffs.json',
  'sting-tombstone.json',
  'sting-birth.json',
  'sting-sparkles.json',
  'sting-heart.json',
  'sting-house.json',
];

function load(file: string): LottieDoc {
  return JSON.parse(readFileSync(join(ANIM_DIR, file), 'utf8')) as LottieDoc;
}

describe('public/animations (M4 Lottie assets, Gate 4 lazy-load)', () => {
  it('ships the full expression + stinger set', () => {
    const files = readdirSync(ANIM_DIR).filter((f) => f.endsWith('.json'));
    expect(new Set(files)).toEqual(new Set(EXPECTED_FILES));
  });

  it('every animation is structurally valid Lottie v5', () => {
    const files = readdirSync(ANIM_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const doc = load(file);
      expect(doc.v.startsWith('5.'), `${file} version`).toBe(true);
      expect(doc.fr).toBeGreaterThan(0);
      expect(doc.op).toBeGreaterThan(doc.ip);
      expect(doc.w).toBeGreaterThan(0);
      expect(doc.h).toBeGreaterThan(0);
      expect(doc.layers.length).toBeGreaterThan(0);
      for (const layer of doc.layers) {
        expect(layer.ty).toBe(4);
        expect(layer.nm.length).toBeGreaterThan(0);
        for (const key of ['o', 'r', 'p', 's'] as const) {
          const v = layer.ks[key];
          if (v.a === 1) {
            const frames = v.k as Array<{ t: number; s: unknown; e: unknown }>;
            expect(frames.length).toBeGreaterThan(0);
            expect(frames[0].t).toBeTypeOf('number');
            expect(frames[0].s).toBeDefined();
            expect(frames[0].e).toBeDefined();
          } else {
            expect(typeof v.k === 'number' || Array.isArray(v.k)).toBe(true);
          }
        }
        // anchor point is never animated in our assets
        expect(layer.ks.a.a).toBe(0);
        if (Array.isArray(layer.shapes)) {
          for (const grp of layer.shapes) {
            expect(grp.ty).toBe('gr');
            expect(grp.it?.length ?? 0).toBeGreaterThan(0);
            const kinds = new Set(grp.it?.map((it) => it.ty));
            expect(kinds.has('tr')).toBe(true);
          }
        }
      }
    }
  });

  it('keeps every asset under the ~ lean JSON budget (AGENT.md §7)', () => {
    const files = readdirSync(ANIM_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const size = statSync(join(ANIM_DIR, file)).size;
      expect(size, `${file} is ${size} bytes`).toBeLessThan(24_000);
    }
  });

  it('expressions are small overlays (200x200) and stingers are 400x400', () => {
    for (const file of ['expression-sparkle.json', 'expression-tear.json', 'expression-think.json', 'expression-giggle.json']) {
      expect(load(file).w).toBe(200);
      expect(load(file).h).toBe(200);
    }
    const stings = EXPECTED_FILES.filter((f) => f.startsWith('sting-'));
    for (const file of stings) {
      expect(load(file).w).toBe(400);
      expect(load(file).h).toBe(400);
    }
  });
});