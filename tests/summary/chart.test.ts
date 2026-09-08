import { describe, expect, it } from 'vitest';
import {
  defaultChartDims,
  gridlines,
  lifeChartGeometry,
  METRICS,
  type LifeChartGeometry,
} from '@/lib/summary/chart';

function sampleHistory() {
  return [
    { age: 1, health: 90, happiness: 80, smarts: 60, looks: 70 },
    { age: 20, health: 85, happiness: 70, smarts: 75, looks: 72 },
    { age: 40, health: 70, happiness: 90, smarts: 78, looks: 68 },
    { age: 60, health: 50, happiness: 60, smarts: 80, looks: 60 },
    { age: 80, health: 25, happiness: 40, smarts: 82, looks: 55 },
  ];
}

describe('lifeChartGeometry', () => {
  it('returns a geometry for every metric in METRICS', () => {
    const geo = lifeChartGeometry(sampleHistory());
    expect(geo).not.toBeNull();
    const g = geo as LifeChartGeometry;
    for (const metric of METRICS) {
      expect(g.series[metric].points).toHaveLength(5);
      expect(typeof g.series[metric].attr).toBe('string');
    }
  });

  it('maps the age axis linearly across the inner width', () => {
    const dims = defaultChartDims();
    const g = lifeChartGeometry(sampleHistory(), dims) as LifeChartGeometry;
    const first = g.series.health.points[0];
    const last = g.series.health.points[4];
    expect(first.x).toBe(dims.padL);
    expect(last.x).toBeCloseTo(dims.width - dims.padR, 2);
  });

  it('places value 100 at the top and value 0 at the bottom', () => {
    const dims = defaultChartDims();
    const top = lifeChartGeometry([sampleHistory()[0]], dims) as LifeChartGeometry;
    const point = top.series.health.points[0];
    // Point value 90 maps to 10% down from the inner-top edge.
    const expectedY = dims.padT + 0.1 * top.innerHeight;
    expect(point.y).toBeCloseTo(expectedY, 2);

    const atZero = lifeChartGeometry(
      [{ age: 5, health: 0, happiness: 0, smarts: 0, looks: 0 }],
      dims,
    ) as LifeChartGeometry;
    expect(atZero.series.health.points[0].y).toBeCloseTo(dims.padT + atZero.innerHeight, 2);
  });

  it('clamps out-of-range values into 0–100', () => {
    const g = lifeChartGeometry(
      [{ age: 10, health: 120, happiness: -20, smarts: 50, looks: 50 }],
    ) as LifeChartGeometry;
    expect(g.series.health.points[0].y).toBeCloseTo(g.dims.padT, 2);
    expect(g.series.happiness.points[0].y).toBeCloseTo(g.dims.padT + g.innerHeight, 2);
  });

  it('keeps the x-scale stable for a single-point (never advanced) life', () => {
    const dims = defaultChartDims();
    const g = lifeChartGeometry(
      [{ age: 30, health: 80, happiness: 80, smarts: 80, looks: 80 }],
      dims,
    ) as LifeChartGeometry;
    expect(g.minAge).toBe(30);
    expect(g.maxAge).toBe(30);
    expect(g.series.health.points).toHaveLength(1);
    expect(g.series.health.points[0].x).toBe(dims.padL);
  });

  it('returns null for an empty statHistory', () => {
    expect(lifeChartGeometry([])).toBeNull();
  });

  it('renders density-friendly point attrs (rounded, space-separated)', () => {
    const g = lifeChartGeometry(sampleHistory()) as LifeChartGeometry;
    const attr = g.series.smarts.attr;
    expect(attr).toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?( -?\d+(\.\d+)?,-?\d+(\.\d+)?)+$/);
  });
});

describe('gridlines', () => {
  it('emits the five stat ticks 0..100', () => {
    expect(gridlines()).toEqual([0, 25, 50, 75, 100]);
  });
});