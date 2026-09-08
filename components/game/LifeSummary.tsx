'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import type { Character, Tone } from '@/lib/engine/types';
import { motion as motionTokens, colors } from '@/lib/theme';
import { evaluateRibbons, RIBBONS } from '@/lib/engine/achievements';
import { renderSummaryPostcard } from '@/lib/summary/renderSummaryImage';
import { StatBar } from './StatBar';
import { LifeChart } from './LifeChart';

const TONE_DOT: Record<Tone, string> = {
  good: colors.tone.good,
  bad: colors.tone.bad,
  neutral: colors.tone.neutral,
  funny: colors.tone.funny,
};

function formatCoins(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

/**
 * Life Summary screen (init.md M5 #3, DESIGN.md §6.4): the finished life —
 * cause of death, final stats, net worth, a stat-over-lifetime SVG chart, the
 * story timeline, earned ribbons, and a canvas-rendered shareable image
 * export. Rendered once the character is dead; deterministic and cost-free.
 */
export function LifeSummary({ character }: { character: Character }) {
  const ribbons = useMemo(() => evaluateRibbons(character), [character]);
  const ribbonDefs = useMemo(
    () => ribbons.map((id) => RIBBONS.find((r) => r.id === id)).filter((r): r is (typeof RIBBONS)[number] => Boolean(r)),
    [ribbons],
  );
  const emojiByTone: Record<Tone, string> = { good: '✦', bad: '✗', neutral: '·', funny: '☺' };

  const timeline = useMemo(() => {
    const entries = [...character.history].sort((a, b) => a.age - b.age);
    return entries.length > 80 ? entries.slice(entries.length - 80) : entries;
  }, [character.history]);

  const handleExport = useCallback(() => {
    const url = renderSummaryPostcard({ character, ribbons });
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name}-${character.surname}-life.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [character, ribbons]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-surface p-5 shadow-md"
      data-testid="life-summary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text">Life over</h2>
          <p className="mt-1 text-sm text-text-muted">
            {character.name} {character.surname} lived for {character.age} years.
          </p>
          <p className="mt-2 text-text">
            Cause of death: <span className="font-medium">{character.causeOfDeath}</span>
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Final worth: <span className="font-semibold text-accent">$ {formatCoins(character.money)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
          data-testid="export-summary-image"
        >
          Save as image
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </div>

      {character.statHistory.length > 0 && (
        <section className="mt-6" aria-label="Stats over lifetime" data-testid="life-chart-section">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">Your life in numbers</h3>
          <LifeChart statHistory={character.statHistory} />
        </section>
      )}

      <section className="mt-6" aria-label="Ribbons" data-testid="life-ribbons">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">Ribbons</h3>
        {ribbonDefs.length === 0 ? (
          <p className="text-sm text-text-muted">No ribbons earned in this life. Every grave is a fresh start.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {ribbonDefs.map((ribbon) => (
              <li
                key={ribbon.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-text"
                title={ribbon.description}
              >
                <span aria-hidden="true" className="text-accent">
                  ★
                </span>
                {ribbon.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6" aria-label="Story timeline" data-testid="life-timeline">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">The story, one year at a time</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-text-muted">This life left no record.</p>
        ) : (
          <ol className="relative ml-2 space-y-3 border-l border-border pl-4">
            {timeline.map((entry, index) => (
              <li key={`${entry.age}-${index}`} className="relative text-sm">
                <span
                  aria-hidden="true"
                  className="absolute -left-[21.5px] top-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: TONE_DOT[entry.tone] }}
                />
                <span className="mr-2 inline-block w-8 text-right font-mono text-xs tabular-nums text-text-muted">
                  {entry.age}
                </span>
                <span className="mr-1 text-text-muted" aria-hidden="true">
                  {emojiByTone[entry.tone]}
                </span>
                <span className="text-text">{entry.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </motion.section>
  );
}