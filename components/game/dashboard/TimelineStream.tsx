'use client';

import { useEffect, useRef } from 'react';
import type { LifeEventLogEntry, Tone } from '@/lib/engine/types';
import { Sparkles, AlertCircle, Smile, HelpCircle } from 'lucide-react';

interface TimelineStreamProps {
  history: LifeEventLogEntry[];
  scrollContainerId?: string;
}

const TONE_STYLES: Record<
  Tone,
  {
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }
> = {
  good: {
    border: 'border-l-tone-good/60',
    icon: Sparkles,
    iconColor: 'text-tone-text-good',
  },
  bad: {
    border: 'border-l-tone-bad/60',
    icon: AlertCircle,
    iconColor: 'text-tone-text-bad',
  },
  funny: {
    border: 'border-l-tone-funny/60',
    icon: Smile,
    iconColor: 'text-tone-text-funny',
  },
  neutral: {
    border: 'border-l-tone-neutral/60',
    icon: HelpCircle,
    iconColor: 'text-tone-text-neutral',
  },
};

export function TimelineStream({ history, scrollContainerId }: TimelineStreamProps) {
  const endRef = useRef<HTMLLIElement>(null);
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
      <div
        className="flex flex-col items-center justify-center py-20 text-center text-text-muted"
        data-testid="chronicle-stream"
      >
        <p className="text-sm font-medium">তোমার জীবনের পান্ডুলিপি শুরু হয় পহিলা বছর থেইকা।</p>
        <p className="text-xs text-text-muted mt-1">যাত্রা শুরু করতে বয়স বাড়াও।</p>
      </div>
    );
  }

  // Group events by age utilizing Gestalt proximity
  const byAge = new Map<number, LifeEventLogEntry[]>();
  for (const entry of history) {
    const list = byAge.get(entry.age) ?? [];
    list.push(entry);
    byAge.set(entry.age, list);
  }
  const years = [...byAge.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <ol className="flex flex-col gap-6 py-2" data-testid="chronicle-stream">
      {years.map(([age, entries]) => (
        <li key={age} aria-label={`বয়স ${age}`} className="flex flex-col gap-3">
          {/* Year Marker Badge */}
          <div className="sticky top-0 z-10 flex items-center gap-3 py-1 bg-background/85 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 shadow-sm">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-muted">
                বয়স {age}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>

          {/* Group of Events for this Year */}
          <ul className="flex flex-col gap-2.5 pl-2 sm:pl-3 border-l border-border ml-3.5">
            {entries.map((entry, index) => {
              const style = TONE_STYLES[entry.tone] ?? TONE_STYLES.neutral;
              const IconComp = style.icon;
              return (
                <li
                  key={`${entry.age}-${index}`}
                  data-tone={entry.tone}
                  className={`group relative rounded-xl border border-border border-l-[3px] ${style.border} bg-surface-raised/40 hover:bg-surface-raised/70 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-200 shadow-sm hover:shadow-md hover:border-border`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-surface-raised/70 border border-border">
                      <IconComp className={`size-3 ${style.iconColor}`} />
                    </div>
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-text font-normal">
                      {entry.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
      <li ref={endRef} aria-hidden="true" className="list-none" />
    </ol>
  );
}
