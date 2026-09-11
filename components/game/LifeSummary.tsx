'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import type { Character, Tone } from '@/lib/engine/types';
import { motion as motionTokens, colors } from '@/lib/theme';
import { STAT_META, type StatKey } from '@/lib/theme/concepts';
import { formatMoney } from '@/lib/ui/money';
import { evaluateRibbons, RIBBONS } from '@/lib/engine/achievements';
import { renderSummaryPostcard } from '@/lib/summary/renderSummaryImage';
import { StatBar } from './StatBar';
import { LifeChart } from './LifeChart';

const TONE_DOT: Record<Tone, string> = colors.tone;

const TONE_ICON: Record<Tone, string> = {
  good: '✦',
  bad: '✗',
  neutral: '·',
  funny: '☺',
};

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
  const statKeys: StatKey[] = ['health', 'happiness', 'smarts', 'looks'];

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
          <h2 className="text-xl font-semibold tracking-tight text-text">জীবন শেষ</h2>
          <p className="mt-1 text-sm text-text-muted">
            {character.name} {character.surname} মোট {character.age} বছর এই দুনিয়ায় ঘুরাঘুরি করেছে।
          </p>
          <p className="mt-2 text-text">
            মৃত্যুর কারণ: <span className="font-medium">{character.causeOfDeath}</span>
          </p>
          <p className="mt-1 text-sm text-text-muted">
            কবরে নামার আগে হাতে-গণা ট্যাকা:{' '}
            <span className="font-bold tabular-nums" style={{ color: 'var(--color-wealth-text)' }}>
              {formatMoney(character.money)}
            </span>{' '}
            টাকা
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary transition-colors hover:opacity-90"
          data-testid="export-summary-image"
        >
          ছবি বানাইয়া নামাও
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {statKeys.map((key) => (
          <StatBar key={key} label={STAT_META[key].label} value={character.stats[key]} statKey={key} />
        ))}
      </div>

      {character.statHistory.length > 0 && (
        <section className="mt-6" aria-label="জীবনজুড়ে পরিসংখ্যান" data-testid="life-chart-section">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">তোমার জীবনের অংক-কিতাব</h3>
          <LifeChart statHistory={character.statHistory} />
        </section>
      )}

      <section className="mt-6" aria-label="সনদপত্র" data-testid="life-ribbons">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">সনদপত্র</h3>
        {ribbonDefs.length === 0 ? (
          <p className="text-sm text-text-muted">এই জীবনে কোনো সনদ জেতা হয় নাই। হাল ছাড়িস না — কবর থেকেও নতুন শুরু সম্ভব!</p>
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

      <section className="mt-6" aria-label="জীবন-খাতা" data-testid="life-timeline">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-text">গল্পটা, বছর ধরে ধরে</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-text-muted">এই জীবন কোনো চিহ্নই রাখে নাই।</p>
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
                  {TONE_ICON[entry.tone]}
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