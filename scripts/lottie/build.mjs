/**
 * Milestone 4 Lottie asset generator (AGENT.md §9: original/CC0 assets only).
 *
 * Emits small, self-contained Lottie v5 JSON files for the avatar expression
 * overlays and the 10 milestone stingers, into `public/animations/`.
 *
 * Everything is procedurally built from basic shapes (ellipse, rect, star,
 * path) and transform keyframes — no external artwork, so every file is
 * original and licensed as the project's own CC0 content. Deterministic
 * (seeded RNG) so regeneration is stable.
 *
 * Run: `node scripts/lottie/build.mjs`
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'animations');
const FR = 60;

// ---- deterministic RNG (mulberry32) -------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- tiny helpers --------------------------------------------------------
const c = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

/** Wrap a value as either a static or animated Lottie property. */
function prop(value) {
  const animated = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object';
  return { a: animated ? 1 : 0, k: value };
}

/** A keyframe with smooth ease in/out across the segment. */
function kf(t, s, e) {
  return { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t, s, e };
}

/** Position keyframe (spatial). */
function pkf(t, from, to) {
  return { ...kf(t, [from[0], from[1], 0], [to[0], to[1], 0]) };
}

/** Static transform used inside every shape group. */
function tr(p = [0, 0], rot = 0, scale = [100, 100], op = 100) {
  return { ty: 'tr', p: prop(p), a: prop([0, 0]), s: prop(scale), r: prop(rot), o: prop(op), sk: prop(0), sa: prop(0) };
}

/** A filled group of shapes. */
function group(children, transform) {
  return { ty: 'gr', it: [...children, transform ?? tr()] };
}

function ellipse(cx, cy, w, h) {
  return { ty: 'el', p: prop([cx, cy]), s: prop([w, h]) };
}

function rectShape(cx, cy, w, h, round = 0) {
  return { ty: 'rc', p: prop([cx, cy]), s: prop([w, h]), r: prop(round) };
}

function star(cx, cy, outer, inner, rotation = 0) {
  return { ty: 'sr', sy: 1, d: 1, p: prop([cx, cy]), s: prop(outer), r: prop(rotation), ir: prop(inner), is: prop(0), or: prop(0) };
}

function fill(colorHex, opacity = 100) {
  return { ty: 'fl', c: prop(c(colorHex)), o: prop(opacity) };
}

function stroke(colorHex, width, opacity = 100) {
  return { ty: 'st', c: prop(c(colorHex)), o: prop(opacity), w: prop(width), lc: 2, lj: 2 };
}

/** A shape layer. `opacityAnim`, `posAnim`, `scaleAnim`, `rotAnim` are Lottie keyframe arrays. */
function layer({ name, ind, shapes, opacityAnim, posAnim, scaleAnim, rotAnim, ip = 0, op }) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: prop(opacityAnim ?? 100),
      r: prop(rotAnim ?? 0),
      p: prop(posAnim ?? [0, 0, 0]),
      a: prop([0, 0, 0]),
      s: prop(scaleAnim ?? [100, 100, 100]),
    },
    ao: 0,
    shapes,
    ip,
    op,
    st: 0,
    bm: 0,
  };
}

function compose(name, w, h, layers, op = 96) {
  return {
    v: '5.7.4',
    fr: FR,
    ip: 0,
    op,
    w,
    h,
    nm: name,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  };
}

/** Round every numeric to fixed decimals so keyframes stay lean (AGENT.md §7). */
function sanitize(doc, decimals = 1) {
  const factor = 10 ** decimals;
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      for (const key of Object.keys(node)) node[key] = walk(node[key]);
      return node;
    }
    return typeof node === 'number' ? Math.round(node * factor) / factor : node;
  };
  return walk(doc);
}

const json = (obj, name) => writeFileSync(join(OUT_DIR, name), JSON.stringify(sanitize(obj)));

// ---- expressions (200x200, layered over the avatar head) -----------------
const E_W = 200;
const E_H = 200;

function sparkle() {
  const layers = [];
  const add = (x, y, outer, inner, colorHex, delay, scalePeak) => {
    const group47 = group([
      star(0, 0, outer, inner, 45),
      fill(colorHex),
      stroke('#ffffff', 1.2, 30),
    ]);
    // two pulses then a fade
    layers.push(
      layer({
        name: `star_${x}_${y}`,
        ind: layers.length + 1,
        shapes: [group47],
        posAnim: [pkf(0, [x, y], [x, y]), pkf(delay + 78, [x, y], [x + 6, y - 8])],
        scaleAnim: [
          kf(0, [0, 0, 100], [scalePeak * 100, scalePeak * 100, 100]),
          kf(14, [scalePeak * 100, scalePeak * 100, 100], [80, 80, 100]),
          kf(26, [80, 80, 100], [scalePeak * 100, scalePeak * 100, 100]),
          kf(40, [scalePeak * 100, scalePeak * 100, 100], [scalePeak * 100, scalePeak * 100, 100]),
        ],
        opacityAnim: [kf(0, [0], [100]), kf(30, [100], [100]), kf(74, [100], [0])],
        op: 80,
      }),
    );
  };
  add(74, 66, 24, 9, '#f6c344', 0, 1);
  add(126, 58, 14, 5, '#f0b84f', 6, 0.85);
  add(100, 84, 12, 5, '#fff3c2', 12, 0.8);
  return compose('expression-sparkle', E_W, E_H, layers, 84);
}

function tear() {
  const drop = (x, colorHex, fall, delay) =>
    layer({
      name: `tear_${x}`,
      ind: 1,
      shapes: [
        group([
          ellipse(0, 0, 22, 26),
          fill(colorHex),
          { ty: 'el', p: prop([-3, -4]), s: prop([6, 6]) },
          fill('#ffffff'),
        ]),
      ],
      posAnim: [pkf(delay, [x, 58], [x, 58]), pkf(delay + 12, [x, 60], [x, 60]), pkf(delay + fall, [x, 60], [x, 60 + fall]), pkf(delay + fall + 10, [x, 60 + fall], [x, 60 + fall + 26])],
      opacityAnim: [kf(0, [0], [0]), kf(delay + 2, [0], [100]), kf(delay + fall + 6, [100], [90]), kf(delay + fall + 12, [90], [0])],
      op: 84,
    });
  return compose('expression-tear', E_W, E_H, [drop(86, '#5aa9f7', 46, 6), drop(112, '#7dc2ff', 34, 14)], 88);
}

function think() {
  const dot = (x, y) =>
    layer({
      name: `dot_${x}`,
      ind: 1,
      shapes: [group([ellipse(0, 0, 14, 14), fill('#9aa7b8')])],
      posAnim: [pkf(0, [x, y], [x, y]), pkf(40, [x, y], [x + 14, y - 4]), pkf(78, [x + 14, y - 4], [x, y])],
      opacityAnim: [kf(0, [0], [0]), kf(6, [0], [80]), kf(64, [80], [80]), kf(78, [80], [0])],
      op: 80,
    });
  return compose(
    'expression-think',
    E_W,
    E_H,
    [dot(120, 46), dot(142, 32), dot(164, 18)],
    84,
  );
}

function giggle() {
  const blob = (x, y, height, colorHex, delay, squash) =>
    layer({
      name: `blob_${x}`,
      ind: 1,
      shapes: [group([ellipse(0, 0, 26, 20), fill(colorHex)])],
      posAnim: [pkf(0, [x, y], [x, y]), pkf(14, [x, y], [x, y - squash]), pkf(28, [x, y - squash], [x, y]), pkf(42, [x, y], [x, y - squash]), pkf(56, [x, y - squash], [x, y])],
      opacityAnim: [kf(0, [0], [0]), kf(6, [0], [100]), kf(58, [100], [90]), kf(64, [90], [0])],
      op: 80,
    });
  return compose(
    'expression-giggle',
    E_W,
    E_H,
    [blob(84, 92, 20, '#e88bbb', 0, 6), blob(116, 92, 20, '#f4a9d0', 4, 7), blob(100, 60, 16, '#ffd0e8', 10, 5)],
    84,
  );
}

// ---- geometry helpers for the stingers ----------------------------------
const ping = (cx, cy, size, colorHex, strokeHex, delay, rad = size * 0.62) =>
  layer({
    name: `ping_${delay}`,
    ind: 1,
    shapes: [
      group([
        ellipse(0, 0, size, size),
        stroke(strokeHex, 6, 100),
        fill(colorHex, 0),
      ]),
    ],
    posAnim: [pkf(0, [cx, cy], [cx, cy])],
    scaleAnim: [kf(0, [0, 0, 100], [30, 30, 100]), kf(delay + 22, [100, 100, 100], [rad * 2.6, rad * 2.6, 100])],
    opacityAnim: [kf(0, [0], [0]), kf(delay + 2, [0], [100]), kf(delay + 14, [100], [100]), kf(delay + 22, [100], [0])],
    op: 96,
  });

/** A heart built from two ellipses + a rotated square. */
function heartGroup(cx, cy, size, colorHex) {
  const r = size;
  return group(
    [
      ellipse(cx - r * 0.42, cy - r * 0.32, r * 1.05, r * 1.05),
      ellipse(cx + r * 0.42, cy - r * 0.32, r * 1.05, r * 1.05),
      rectShape(cx, cy + r * 0.16, r * 1.05, r * 1.05, 0),
      fill(colorHex),
    ],
    tr([cx, cy], 45, [100, 100]),
  );
}

const CONFETTI_COLORS = ['#f6c344', '#5fce8e', '#5aa9f7', '#e88bbb', '#b58bf2', '#ef5b5b'];

function confetti() {
  const layers = [];
  const rand = mulberry32(20260407);
  const cx = 200;
  const cy = 170;
  for (let i = 0; i < 18; i += 1) {
    const angle = rand() * Math.PI * 2;
    const speed = 90 + rand() * 170;
    const dist = speed * 0.9;
    const x0 = cx + (rand() - 0.5) * 24;
    const y0 = cy + (rand() - 0.5) * 24;
    const xt = x0 + Math.cos(angle) * dist;
    const yt = y0 + Math.sin(angle) * dist + 46; // gravity pull
    const w = 9 + rand() * 7;
    const hgt = 4 + rand() * 5;
    const color = CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)];
    const spinDir = rand() > 0.5 ? 1 : -1;
    const delay = Math.floor(rand() * 8);
    layers.push(
      layer({
        name: `conf_${i}`,
        ind: i + 1,
        shapes: [group([rectShape(0, 0, w, hgt, 1.5), fill(color)])],
        posAnim: [pkf(delay, [x0, y0], [x0, y0]), pkf(delay + 34, [x0, y0], [xt, yt])],
        rotAnim: [kf(delay, [0], [0]), kf(delay + 34, [0], [spinDir * (360 + rand() * 400)])],
        opacityAnim: [kf(delay + 4, [0], [100]), kf(delay + 34, [100], [0])],
        ip: delay,
        op: 92,
      }),
    );
  }
  return compose('sting-confetti', 400, 400, [...layers, ping(200, 170, 70, '#fff3c2', '#f6c344', 0)], 92);
}

function money() {
  const layers = [];
  const rand = mulberry32(70701);
  for (let i = 0; i < 13; i += 1) {
    const x = 30 + rand() * 340;
    const y = -30 - rand() * 60;
    const color = rand() > 0.35 ? '#f6c344' : '#f0b84f';
    const w = 22 + rand() * 10;
    const hgt = w * 0.92;
    const sway = (rand() - 0.5) * 90;
    const delay = Math.floor(rand() * 16);
    layers.push(
      layer({
        name: `coin_${i}`,
        ind: i + 1,
        shapes: [
          group([ellipse(0, 0, w, hgt), fill(color), stroke('#e09a2f', 2, 100)]),
          group([ellipse(0, 0, w * 0.5, hgt * 0.5), fill('#ffe9a8')]),
        ],
        posAnim: [pkf(delay, [x, y], [x, y]), pkf(delay + 58, [x, y], [x + sway, 340 + rand() * 30])],
        rotAnim: [kf(delay, [(rand() - 0.5) * 30], [(rand() - 0.5) * 30]), kf(delay + 58, [(rand() - 0.5) * 30], [(rand() - 0.5) * 90])],
        opacityAnim: [kf(delay + 3, [0], [100]), kf(delay + 58, [100], [0])],
        ip: delay,
        op: 84,
      }),
    );
  }
  return compose('sting-money', 400, 400, layers, 88);
}

function sparkles() {
  const layers = [];
  const rand = mulberry32(5151);
  for (let i = 0; i < 9; i += 1) {
    const x = 110 + rand() * 180;
    const y = 90 + rand() * 150;
    const outer = 14 + rand() * 16;
    const color = ['#f6c344', '#f0b84f', '#fff3c2', '#ffe9a8'][Math.floor(rand() * 4)];
    const delay = Math.floor(rand() * 48);
    const peak = 0.9 + rand() * 0.6;
    layers.push(
      layer({
        name: `spark_${i}`,
        ind: i + 1,
        shapes: [group([star(0, 0, outer, outer * 0.42, 0), fill(color)])],
        posAnim: [pkf(0, [x, y], [x, y]), pkf(90, [x, y], [x + 10, y - 12])],
        scaleAnim: [
          kf(delay, [0, 0, 100], [100 * peak, 100 * peak, 100]),
          kf(delay + 16, [100 * peak, 100 * peak, 100], [55, 55, 100]),
          kf(delay + 32, [55, 55, 100], [100 * peak, 100 * peak, 100]),
          kf(delay + 70, [100 * peak, 100 * peak, 100], [100 * peak, 100 * peak, 100]),
        ],
        opacityAnim: [kf(0, [0], [0]), kf(delay + 6, [0], [100]), kf(delay + 62, [100], [100]), kf(delay + 74, [100], [0])],
        op: 84,
      }),
    );
  }
  return compose('sting-sparkles', 400, 400, layers, 88);
}

function birth() {
  const layers = [];
  const stars = [
    { x: 165, y: 170, c: '#f6c344' },
    { x: 235, y: 190, c: '#ffd9a0' },
    { x: 200, y: 130, c: '#fff3c2' },
  ];
  stars.forEach((s, i) => {
    layers.push(
      layer({
        name: `starbaby_${i}`,
        ind: i + 3,
        shapes: [group([star(0, 0, 22, 9, 45), fill(s.c)])],
        posAnim: [pkf(0, [s.x, s.y - 130], [s.x, s.y - 130]), pkf(54, [s.x, s.y - 130], [s.x, s.y])],
        scaleAnim: [kf(0, [0, 0, 100], [120, 120, 100]), kf(28, [120, 120, 100], [100, 100, 100]), kf(54, [100, 100, 100], [100, 100, 100])],
        opacityAnim: [kf(0, [0], [0]), kf(6, [0], [100]), kf(48, [100], [100]), kf(56, [100], [0])],
        op: 84,
      }),
    );
  });
  layers.push(ping(200, 200, 80, '#fff3c2', '#ffe9a8', 16));
  return compose('sting-birth', 400, 400, layers, 92);
}

function heart() {
  const layers = [];
  const rand = mulberry32(1313);
  const colors = ['#ef5b7e', '#f28ba8', '#f6a9bf', '#ffd0dc'];
  for (let i = 0; i < 12; i += 1) {
    const radius = 130;
    const a = rand() * Math.PI * 2;
    const size = 16 + rand() * 16;
    const destX = 200 + Math.cos(a) * radius * (0.5 + rand() * 0.5);
    const destY = 200 + Math.sin(a) * radius * (0.5 + rand() * 0.5);
    const delay = Math.floor(rand() * 10);
    const color = colors[i % colors.length];
    layers.push(
      layer({
        name: `heart_${i}`,
        ind: i + 1,
        shapes: [heartGroup(0, 0, size, color)],
        posAnim: [pkf(delay, [200, 220], [200, 220]), pkf(delay + 40, [200, 220], [destX, destY])],
        rotAnim: [kf(delay, [0], [0]), kf(delay + 40, [0], [(rand() - 0.5) * 80])],
        opacityAnim: [kf(0, [0], [0]), kf(delay + 4, [0], [100]), kf(delay + 34, [100], [95]), kf(delay + 42, [95], [0])],
        op: 88,
      }),
    );
  }
  return compose('sting-heart', 400, 400, layers, 92);
}

function house() {
  const layers = [];
  // body
  const body = layer({
    name: 'house_body',
    ind: 1,
    shapes: [group([rectShape(0, 0, 150, 116, 8), fill('#eae2d2'), stroke('#c9b89a', 3, 100)])],
    posAnim: [pkf(0, [137, 300], [137, 300]), pkf(34, [137, 300], [137, 220])],
    scaleAnim: [kf(0, [20, 20, 100], [104, 104, 100]), kf(30, [104, 104, 100], [100, 100, 100]), kf(36, [100, 100, 100], [98, 98, 100]), kf(42, [98, 98, 100], [100, 100, 100])],
    opacityAnim: [kf(0, [0], [0]), kf(6, [0], [100])],
    op: 74,
  });
  // roof
  const roof = layer({
    name: 'house_roof',
    ind: 2,
    shapes: [
      group(
        [rectShape(212, 148, 150, 112, 0), fill('#ef5b5b')],
        tr([212, 148], 45, [100, 100]),
      ),
    ],
    posAnim: [pkf(0, [260, 300], [260, 300]), pkf(34, [260, 300], [260, 216])],
    scaleAnim: [kf(0, [20, 20, 100], [104, 104, 100]), kf(30, [104, 104, 100], [100, 100, 100]), kf(36, [100, 100, 100], [98, 98, 100]), kf(42, [98, 98, 100], [100, 100, 100])],
    opacityAnim: [kf(0, [0], [0]), kf(6, [0], [100])],
    op: 76,
  });
  // door
  const door = layer({
    name: 'house_door',
    ind: 3,
    shapes: [group([rectShape(200, 268, 32, 52, 4), fill('#7c5a3a')]), group([ellipse(214, 288, 6, 6), fill('#f6c344')])],
    posAnim: [pkf(8, [200, 292], [200, 292]), pkf(44, [200, 292], [200, 268])],
    opacityAnim: [kf(0, [0], [0]), kf(12, [0], [100])],
    op: 80,
  });
  // windows
  const win = (x, y, t) =>
    layer({
      name: `house_win_${t}`,
      ind: 4,
      shapes: [group([rectShape(0, 0, 30, 30, 4), fill('#5aa9f7'), stroke('#c9b89a', 3, 100)])],
      posAnim: [pkf(10, [x, y + 20], [x, y + 20]), pkf(48, [x, y + 20], [x, y])],
      opacityAnim: [kf(0, [0], [0]), kf(16, [0], [100])],
      op: 84,
    });
  layers.push(body, roof, door, win(158, 214, 0), win(242, 214, 1));
  // a few landing sparkles
  layers.push(
    layer({
      name: 'house_s1',
      ind: 6,
      shapes: [group([star(0, 0, 16, 6, 45), fill('#f6c344')])],
      posAnim: [pkf(34, [150, 160], [150, 160]), pkf(74, [150, 160], [146, 150])],
      scaleAnim: [kf(34, [0, 0, 100], [100, 100, 100]), kf(58, [100, 100, 100], [70, 70, 100])],
      opacityAnim: [kf(30, [0], [0]), kf(40, [0], [100]), kf(72, [100], [0])],
      op: 78,
    }),
    layer({
      name: 'house_s2',
      ind: 7,
      shapes: [group([star(0, 0, 14, 5, 45), fill('#f0b84f')])],
      posAnim: [pkf(38, [268, 168], [268, 168]), pkf(78, [268, 168], [272, 156])],
      scaleAnim: [kf(38, [0, 0, 100], [100, 100, 100]), kf(62, [100, 100, 100], [64, 64, 100])],
      opacityAnim: [kf(34, [0], [0]), kf(44, [0], [100]), kf(76, [100], [0])],
      op: 78,
    }),
  );
  return compose('sting-house', 400, 400, layers, 84);
}

function tombstone() {
  const layers = [];
  // moon behind
  layers.push(
    layer({
      name: 'moon',
      ind: 1,
      shapes: [group([ellipse(0, 0, 90, 90), fill('#dfe6ee', 45)])],
      posAnim: [pkf(0, [300, 96], [300, 96]), pkf(20, [300, 96], [300, 96])],
      opacityAnim: [kf(0, [0], [0]), kf(18, [0], [100])],
      op: 96,
    }),
  );
  // grass base
  layers.push(
    layer({
      name: 'grass',
      ind: 2,
      shapes: [group([rectShape(200, 330, 300, 26, 8), fill('#5f9e6b', 80)])],
      posAnim: [pkf(0, [200, 356], [200, 356]), pkf(14, [200, 356], [200, 330])],
      opacityAnim: [kf(0, [0], [0]), kf(10, [0], [100])],
      op: 96,
    }),
  );
  // tombstone
  layers.push(
    layer({
      name: 'tomb',
      ind: 3,
      shapes: [
        group([rectShape(200, 170, 110, 150, 20), fill('#8f9aa8'), stroke('#6f7a88', 3, 100)]),
        group([rectShape(200, 145, 60, 36, 10), fill('#6f7a88')]),
      ],
      posAnim: [pkf(0, [200, 356], [200, 356]), pkf(20, [200, 356], [200, 206])],
      scaleAnim: [kf(0, [30, 30, 100], [104, 104, 100]), kf(18, [104, 104, 100], [100, 100, 100]), kf(24, [100, 100, 100], [102, 102, 100]), kf(30, [102, 102, 100], [100, 100, 100])],
      opacityAnim: [kf(0, [0], [0]), kf(8, [0], [100])],
      op: 96,
    }),
  );
  return compose('sting-tombstone', 400, 400, layers, 78);
}

function diploma() {
  const layers = [];
  // ribbon (behind)
  layers.push(
    layer({
      name: 'ribbon',
      ind: 1,
      shapes: [group([rectShape(128, 208, 54, 104, 6), fill('#ef5b5b')])],
      posAnim: [pkf(0, [128, 300], [128, 300]), pkf(26, [128, 300], [128, 208])],
      opacityAnim: [kf(0, [0], [0]), kf(8, [0], [100])],
      op: 96,
    }),
  );
  // scroll body
  layers.push(
    layer({
      name: 'scroll',
      ind: 2,
      shapes: [
        group([rectShape(200, 204, 116, 96, 10), fill('#fdf3d8'), stroke('#c9b89a', 3, 100)]),
        group([ellipse(142, 204, 22, 96), fill('#f7e7bd'), stroke('#c9b89a', 3, 100)]),
        group([ellipse(258, 204, 22, 96), fill('#f7e7bd'), stroke('#c9b89a', 3, 100)]),
        group([rectShape(200, 196, 52, 16, 4), fill('#3f9d63')]),
      ],
      opacityAnim: [kf(0, [0], [0]), kf(10, [0], [100])],
      posAnim: [pkf(0, [200, 300], [200, 300]), pkf(28, [200, 300], [200, 204])],
      scaleAnim: [kf(0, [30, 30, 100], [106, 106, 100]), kf(26, [106, 106, 100], [100, 100, 100])],
      op: 96,
    }),
  );
  layers.push(ping(200, 190, 60, '#fff3c2', '#3f9d63', 30));
  // sparkles
  const sp = (x, y, t, cy2, op2) =>
    layer({
      name: `dip_sp_${t}`,
      ind: 4,
      shapes: [group([star(0, 0, 16, 6, 45), fill('#f6c344')])],
      posAnim: [pkf(t, [x, y], [x, y]), pkf(88, [x, y], [x - 8, y - 10])],
      scaleAnim: [kf(t, [0, 0, 100], [100, 100, 100]), kf(t + 20, [100, 100, 100], [66, 66, 100])],
      opacityAnim: [kf(t - 4, [0], [0]), kf(t + 2, [0], [100]), kf(86, [100], [0])],
      op: op2,
    });
  layers.push(sp(120, 130, 30, 14, 84), sp(280, 120, 38, 14, 84), sp(200, 92, 44, 12, 84));
  return compose('sting-diploma', 400, 400, layers, 96);
}

function wedding() {
  const layers = [];
  const ring = (x, colorHex, t, flip) =>
    layer({
      name: `ring_${t}`,
      ind: 1,
      shapes: [group([ellipse(0, 0, 108, 108), stroke(colorHex, 8, 100), fill('none', 0)])],
      posAnim: [pkf(t, [x, 400], [x, 400]), pkf(t + 26, [x, 400], [flip ? 248 : 152, 244])],
      opacityAnim: [kf(0, [0], [0]), kf(t + 4, [0], [100]), kf(t + 40, [100], [100]), kf(t + 54, [100], [0])],
      rotAnim: [kf(t, [0], [0]), kf(t + 26, [0], [flip ? -12 : 12])],
      op: 96,
    });
  layers.push(ring(40, '#efc75e', 2, false), ring(360, '#e8e3da', 4, true));
  // heart burst
  const colors = ['#f28ba8', '#f6a9bf', '#ffd0dc'];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const size = 18;
    const destX = 200 + Math.cos(a) * 96;
    const destY = 216 + Math.sin(a) * 88;
    layers.push(
      layer({
        name: `wed_heart_${i}`,
        ind: 9,
        shapes: [heartGroup(0, 0, size, colors[i % colors.length])],
        posAnim: [pkf(26, [200, 236], [200, 236]), pkf(66, [200, 236], [destX, destY])],
        opacityAnim: [kf(22, [0], [0]), kf(30, [0], [100]), kf(60, [100], [95]), kf(68, [95], [0])],
        op: 96,
      }),
    );
  }
  return compose('sting-wedding', 400, 400, layers, 100);
}

function handcuffs() {
  const layers = [];
  const cuff = (x, t) =>
    layer({
      name: `cuff_${t}`,
      ind: 1,
      shapes: [
        group([ellipse(0, 0, 88, 72), fill('#aab4c2'), stroke('#77839a', 4, 100)]),
        group([ellipse(0, 0, 52, 38), fill('#eef2f6', 0), stroke('#77839a', 4, 100)]),
      ],
      posAnim: [pkf(t, [x, 60], [x, 60]), pkf(t + 30, [x, 60], [x, 250])],
      scaleAnim: [kf(t, [30, 30, 100], [104, 104, 100]), kf(t + 28, [104, 104, 100], [100, 100, 100]), kf(t + 36, [100, 100, 100], [96, 96, 100]), kf(t + 42, [96, 96, 100], [100, 100, 100])],
      opacityAnim: [kf(0, [0], [0]), kf(t + 4, [0], [100])],
      op: 96,
    });
  layers.push(cuff(144, 2), cuff(256, 8));
  // chain between
  layers.push(
    layer({
      name: 'chain',
      ind: 8,
      shapes: [group([rectShape(200, 214, 66, 18, 9), fill('#77839a')])],
      posAnim: [pkf(10, [200, 214], [200, 214])],
      opacityAnim: [kf(0, [0], [0]), kf(18, [0], [100])],
      op: 96,
    }),
  );
  // zap flash
  layers.push(ping(200, 60, 40, '#d9e2ff', '#7c96c4', 26, 90));
  return compose('sting-handcuffs', 400, 400, layers, 92);
}

// ---- build everything -----------------------------------------------------
const builds = {
  'expression-sparkle.json': sparkle(),
  'expression-tear.json': tear(),
  'expression-think.json': think(),
  'expression-giggle.json': giggle(),
  'sting-confetti.json': confetti(),
  'sting-money.json': money(),
  'sting-diploma.json': diploma(),
  'sting-wedding.json': wedding(),
  'sting-handcuffs.json': handcuffs(),
  'sting-tombstone.json': tombstone(),
  'sting-birth.json': birth(),
  'sting-sparkles.json': sparkles(),
  'sting-heart.json': heart(),
  'sting-house.json': house(),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, doc] of Object.entries(builds)) {
  json(doc, name);
}
console.log(`Wrote ${Object.keys(builds).length} Lottie files to ${OUT_DIR}`);