'use client';

import { useEffect, useRef } from 'react';
import type { LifeEventLogEntry } from '@/lib/engine/types';
import { TONE_META } from '@/lib/theme/concepts';
import { Icon } from '@/components/ui/Icon';

/**
 * Chronicle Stream (UI-DESIGN.md §2.2, the middle ~70% scroll body): the flat
 * life-log list becomes a vertical timeline grouped by year. Each age begins
 * with a thin hairline + "Year N" label; each entry renders a flat tone icon
 * anchor from the shared lookup. On Age Up the newest entry scrolls into view
 * (instant when reduced motion is forcing).
 */
export function ChronicleStream({
  history,
  scrollContainerId,
}: {
  history: LifeEventLogEntry[];
  /** ID of the scroll container element (tablet/desktop internal scroll). */
  scrollContainerId?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const initialScroll = useRef(true);

  useEffect(() => {
    if (initialScroll.current) {
      initialScroll.current = false;
      return;
    }
    const end = endRef.current;
    if (!end) return;
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    if (scrollContainerId) {
      const container = document.getElementById(scrollContainerId);
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
    }
    end.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [history.length, scrollContainerId]);

  if (history.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-text-muted" data-testid="chronicle-stream">
        The chronicle of your life begins with the first year that passes.
      </div>
    );
  }

  const byAge = new Map<number, LifeEventLogEntry[]>();
  for (const entry of history) {
    const list = byAge.get(entry.age) ?? [];
    list.push(entry);
    byAge.set(entry.age, list);
  }
  const years = [...byAge.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <ol className="py-4" data-testid="chronicle-stream">
      {years.map(([age, entries]) => (
        <li key={age} aria-label={`Year ${age}`}>
          <div className="flex items-center gap-2 px-4">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">
              Year {age}
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <ul className="mt-2 space-y-2 px-4">
            {entries.map((entry, index) => {
              const tone = TONE_META[entry.tone];
              return (
                <li
                  key={`${entry.age}-${entry.text.slice(0, 20)}-${index}`}
                  className="flex items-start gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
                  data-tone={entry.tone}
                >
                  <span
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center border border-border"
                    style={{ color: tone.fillVar }}
                    aria-hidden="true"
                  >
                    <Icon name={tone.icon} size={14} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-text">{entry.text}</p>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
      <div ref={endRef} aria-hidden="true" />
    </ol>
  );
}