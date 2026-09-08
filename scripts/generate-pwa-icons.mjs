/**
 * Generates the PWA icon PNGs in public/icons/ with zero dependencies
 * (Node zlib only): a vertical gradient tile with a white pulse ring and a
 * heartbeat line — the "life we play" mark. Committed to the repo so the
 * build has nothing external to fetch.
 *
 *   node scripts/generate-pwa-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
mkdirSync(OUT_DIR, { recursive: true });

const TOP = [8, 145, 178]; // cyan-600
const BOTTOM = [79, 70, 229]; // indigo-600

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function coverage(px, py, w, ringRadius, ringWidth, pulse) {
  const cx = w / 2;
  const cy = w / 2;
  const ring = Math.abs(Math.hypot(px - cx, py - cy) - ringRadius * w);
  let cov = clamp((ringWidth * w) / 2 - ring + 0.75, 0, 1);
  const lw = w * 0.028;
  for (let i = 0; i < pulse.length - 1; i++) {
    const [ax, ay] = pulse[i];
    const [bx, by] = pulse[i + 1];
    const d = segDist(px, py, ax * w, ay * w, bx * w, by * w);
    cov = Math.max(cov, clamp(lw / 2 - d + 0.75, 0, 1));
  }
  return Math.min(1, cov);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function render(size, scale) {
  const w = size;
  const ringRadius = 0.27 * scale;
  const ringWidth = 0.07 * scale;
  const k = 1.06;
  const pulse = [
    [0.18, 0.63],
    [0.35, 0.63],
    [0.44, 0.44 * k],
    [0.52, 0.63],
    [0.64, 0.63],
    [0.73, 0.42 * k],
    [0.85, 0.63],
  ].map(([x, y]) => [x * scale + (1 - scale) / 2, y * scale + (1 - scale) / 2]);

  const rows = [];
  for (let y = 0; y < w; y++) {
    const row = Buffer.alloc(1 + w * 4);
    row[0] = 0; // filter: none
    const t = y / (w - 1);
    const bg = mix(TOP, BOTTOM, t);
    for (let x = 0; x < w; x++) {
      const c = coverage(x, y, w, ringRadius, ringWidth, pulse);
      const [r, g, b] = mix(bg, [255, 255, 255], c);
      const o = 4 * x + 1;
      row[o] = r;
      row[o + 1] = g;
      row[o + 2] = b;
      row[o + 3] = 255;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const idat = deflateSync(raw, { level: 9 });
  return encodePng(w, w, idat);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(w, h, idat) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const files = [
  ['icon-192.png', render(192, 1)],
  ['icon-512.png', render(512, 1)],
  // Maskable keeps the mark inside the central safe zone (scale 0.72) so
  // launcher crops never clip the glyph.
  ['icon-maskable-512.png', render(512, 0.72)],
];

for (const [name, bytes] of files) {
  writeFileSync(resolve(OUT_DIR, name), bytes);
  console.log(`wrote ${name} (${bytes.length} bytes)`);
}