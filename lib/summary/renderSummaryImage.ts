/**
 * Canvas-rendered life postcard for shareable export (init.md M5 #3).
 *
 * Pure-browser: draws the finished life (name, span, cause, final stats,
 * net worth, the stat-over-lifetime chart, ribbons) onto a 2d canvas and
 * returns a PNG data URL for download. No DOM capture, no chart lib.
 */

import type { Character } from '@/lib/engine/types';
import { RIBBONS } from '@/lib/engine/achievements';
import { lifeChartGeometry, METRICS, type Metric } from '@/lib/summary/chart';

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 933;

const PALETTE = {
  bgTop: '#0f172a',
  bgBottom: '#1e293b',
  panel: '#1f2a44',
  panelBorder: 'rgba(148, 163, 184, 0.18)',
  text: '#f8fafc',
  muted: '#94a3b8',
  accent: '#38bdf8',
  faint: 'rgba(148, 163, 184, 0.35)',
  money: '#fbbf24',
};

const METRIC_COLOR: Record<Metric, string> = {
  health: '#34d399',
  happiness: '#fbbf24',
  smarts: '#818cf8',
  looks: '#c084fc',
};

const METRIC_LABEL: Record<Metric, string> = {
  health: 'Health',
  happiness: 'Happiness',
  smarts: 'Smarts',
  looks: 'Looks',
};

export interface SummaryPostcardInput {
  character: Character;
  ribbons: string[];
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStatBars(ctx: CanvasRenderingContext2D, character: Character, x: number, y: number, width: number) {
  ctx.save();
  METRICS.forEach((metric, i) => {
    const rowY = y + i * 46;
    const value = Math.max(0, Math.min(100, Math.round(character.stats[metric])));

    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(METRIC_LABEL[metric], x, rowY + 18);

    const trackY = rowY + 24;
    roundedRect(ctx, x, trackY, width, 10, 5);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.fill();
    roundedRect(ctx, x, trackY, (width * value) / 100, 10, 5);
    ctx.fillStyle = METRIC_COLOR[metric];
    ctx.fill();

    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 18px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(value), x + width, rowY + 18);
  });
  ctx.restore();
}

function drawMiniChart(ctx: CanvasRenderingContext2D, character: Character, x: number, y: number, w: number, h: number) {
  const geometry = lifeChartGeometry(character.statHistory, {
    width: w,
    height: h,
    padL: 36,
    padR: 12,
    padT: 12,
    padB: 24,
  });
  if (!geometry) return;

  ctx.save();
  const { dims, minAge, maxAge, innerHeight } = geometry;

  for (const tick of [0, 50, 100]) {
    const gy = dims.padT + (1 - tick / 100) * innerHeight;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dims.padL, gy);
    ctx.lineTo(w - dims.padR, gy);
    ctx.stroke();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(tick), dims.padL - 8, gy + 4);
  }

  METRICS.forEach((metric) => {
    const { points } = geometry.series[metric];
    if (points.length < 2) return;
    ctx.strokeStyle = METRIC_COLOR[metric];
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  });

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`age ${minAge}`, dims.padL, h - 6);
  ctx.textAlign = 'right';
  ctx.fillText(`age ${maxAge}`, w - dims.padR, h - 6);
  ctx.restore();
}

function drawRibbons(ctx: CanvasRenderingContext2D, ribbonIds: string[], x: number, y: number) {
  const defs = ribbonIds.map((id) => RIBBONS.find((r) => r.id === id)).filter(Boolean) as Array<(typeof RIBBONS)[number]>;
  if (defs.length === 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '300 24px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('No ribbons earned this life.', x, y);
    return;
  }

  ctx.save();
  ctx.font = '600 18px system-ui, sans-serif';
  let cursorX = x;
  defs.slice(0, 6).forEach((def) => {
    const textWidth = ctx.measureText(def.name).width;
    const chipWidth = textWidth + 42;
    roundedRect(ctx, cursorX, y - 20, chipWidth, 32, 16);
    ctx.fillStyle = PALETTE.panel;
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cursorX + 17, y - 4, 6, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.accent;
    ctx.fill();

    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.fillText(def.name, cursorX + 31, y + 1);
    cursorX += chipWidth + 12;
  });
  if (defs.length > 6) {
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = 'left';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`+${defs.length - 6} more`, cursorX, y + 1);
  }
  ctx.restore();
}

/**
 * Renders the shareable postcard and returns a PNG data URL. Throws outside
 * of a browser (no canvas), so callers gate rendering on the live client.
 */
export function renderSummaryPostcard({ character, ribbons }: SummaryPostcardInput): string {
  if (typeof document === 'undefined') {
    throw new Error('renderSummaryPostcard requires a browser canvas');
  }
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('This browser cannot create a 2d canvas context');
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, PALETTE.bgTop);
  gradient.addColorStop(1, PALETTE.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.fillText('THE LIFE OF', 72, 84);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 72px system-ui, sans-serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(`${character.name} ${character.surname}`, 72, 156);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 28px system-ui, sans-serif';
  ctx.fillText(`${character.age} years · ${character.causeOfDeath ?? 'ended quietly'}`, 74, 198);

  ctx.font = '700 44px ui-monospace, monospace';
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'right';
  ctx.fillText(`${character.age}`, CANVAS_WIDTH - 72, 100);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 22px system-ui, sans-serif';
  ctx.fillText('year old', CANVAS_WIDTH - 72, 130);
  ctx.fillStyle = PALETTE.money;
  ctx.font = '700 34px ui-monospace, monospace';
  ctx.fillText(`Net worth: $ ${character.money.toLocaleString('en-US')}`, CANVAS_WIDTH - 72, 182);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PALETTE.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(84, 48);
  ctx.lineTo(CANVAS_WIDTH - 84, 48);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, 72, 236, CANVAS_WIDTH - 144, CANVAS_HEIGHT - 342, 24);
  ctx.fillStyle = PALETTE.panel;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PALETTE.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  drawStatBars(ctx, character, 120, 286, 460);

  ctx.save();
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.fillText('A life, year by year', 120, 460);
  ctx.restore();
  ctx.save();
  roundedRect(ctx, 120, 480, 700, 290, 14);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.fill();
  drawMiniChart(ctx, character, 136, 494, 660, 260);
  ctx.restore();

  ctx.save();
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.fillText('Ribbons', 886, 286);
  drawRibbons(ctx, ribbons, 886, 344);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Jibon Niye Khela — one life, one year at a time.', 72, CANVAS_HEIGHT - 56);
  ctx.restore();

  return canvas.toDataURL('image/png');
}