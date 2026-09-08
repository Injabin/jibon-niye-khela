/**
 * Life-summary chart geometry (init.md M5 #3).
 *
 * Pure, dependency-free mapping of the per-year `statHistory` into SVG/canvas
 * coordinates for the stat-over-lifetime chart — hand-rolled, no chart lib
 * (the M5 spec explicitly rejects heavy chart dependencies). Returns null for
 * a lifetime with no recorded points so callers can hide the chart.
 */

export type Metric = 'health' | 'happiness' | 'smarts' | 'looks';

export const METRICS: readonly Metric[] = ['health', 'happiness', 'smarts', 'looks'];

export interface ChartDims {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
}

export interface ChartSeries {
  points: Array<{ x: number; y: number }>;
  attr: string;
}

export interface LifeChartGeometry {
  dims: ChartDims;
  minAge: number;
  maxAge: number;
  innerWidth: number;
  innerHeight: number;
  series: Record<Metric, ChartSeries>;
}

export function defaultChartDims(): ChartDims {
  return { width: 640, height: 220, padL: 34, padR: 12, padT: 14, padB: 24 };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Y gridline values (stat ticks 0..100, one line every 25). */
export function gridlines(): number[] {
  return [0, 25, 50, 75, 100];
}

/**
 * Map a life's per-year stat record into plot coordinates. Values are clamped
 * to 0–100 and the age axis spans [first point age, last point age].
 */
export function lifeChartGeometry(
  statHistory: ReadonlyArray<{ age: number; health: number; happiness: number; smarts: number; looks: number }>,
  dims: ChartDims = defaultChartDims(),
): LifeChartGeometry | null {
  if (statHistory.length === 0) return null;

  const minAge = statHistory[0].age;
  const maxAge = statHistory[statHistory.length - 1].age;
  const innerWidth = dims.width - dims.padL - dims.padR;
  const innerHeight = dims.height - dims.padT - dims.padB;
  const ageSpan = Math.max(1, maxAge - minAge);

  const build = (metric: Metric): ChartSeries => {
    const points = statHistory.map((point) => ({
      x: dims.padL + ((point.age - minAge) / ageSpan) * innerWidth,
      y: dims.padT + (1 - clamp(point[metric]) / 100) * innerHeight,
    }));
    return {
      points,
      attr: points.map((p) => `${round(p.x)},${round(p.y)}`).join(' '),
    };
  };

  return {
    dims,
    minAge,
    maxAge,
    innerWidth,
    innerHeight,
    series: {
      health: build('health'),
      happiness: build('happiness'),
      smarts: build('smarts'),
      looks: build('looks'),
    },
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}