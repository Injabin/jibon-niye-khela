'use client';

import { useId } from 'react';
import { colors } from '@/lib/theme';
import { gridlines, lifeChartGeometry, METRICS, type ChartDims, type Metric } from '@/lib/summary/chart';

const METRIC_COLOR: Record<Metric, string> = {
  health: colors.tone.good,
  happiness: colors.accent,
  smarts: colors.secondary,
  looks: colors.tone.funny,
};

const METRIC_LABEL: Record<Metric, string> = {
  health: 'স্বাস্থ্য',
  happiness: 'সুখ',
  smarts: 'বুদ্ধি',
  looks: 'চেহারা',
};

/**
 * Stat-over-lifetime chart (init.md M5 #3): a hand-rolled inline SVG line
 * chart of the four stats against age, computed from the pure geometry in
 * `lib/summary/chart.ts`. UseReducedMotion not needed — the SVG is static.
 */
export function LifeChart({
  statHistory,
  dims,
}: {
  statHistory: Array<{ age: number; health: number; happiness: number; smarts: number; looks: number }>;
  dims?: ChartDims;
}) {
  const gradientId = useId();
  const geometry = lifeChartGeometry(statHistory, dims);
  if (!geometry) return null;

  const { dims: d, minAge, maxAge, innerHeight } = geometry;

  return (
    <figure data-testid="life-chart" className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${d.width} ${d.height}`}
        role="img"
        aria-label="তোমার চারটা স্ট্যাট, গোটা জীবনের হিসাবমতো"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.surfaceRaised} />
            <stop offset="100%" stopColor={colors.background} />
          </linearGradient>
        </defs>
        <rect width={d.width} height={d.height} fill={`url(#${gradientId})`} rx={8} />

        {gridlines().map((tick) => {
          const y = d.padT + (1 - tick / 100) * innerHeight;
          return (
            <g key={tick}>
              <line
                x1={d.padL}
                x2={d.width - d.padR}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeDasharray="2 4"
              />
              <text x={d.padL - 6} y={y + 3} textAnchor="end" fontSize={10} fill={colors.textMuted}>
                {tick}
              </text>
            </g>
          );
        })}

        {METRICS.map((metric) => (
          <polyline
            key={metric}
            data-testid={`life-chart-line-${metric}`}
            points={geometry.series[metric].attr}
            fill="none"
            stroke={METRIC_COLOR[metric]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        <text x={d.padL} y={d.height - 8} fontSize={10} fill={colors.textMuted}>
          বয়স {minAge}
        </text>
        <text x={d.width - d.padR} y={d.height - 8} textAnchor="end" fontSize={10} fill={colors.textMuted}>
          বয়স {maxAge}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        {METRICS.map((metric) => (
          <span key={metric} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: METRIC_COLOR[metric] }}
            />
            {METRIC_LABEL[metric]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}