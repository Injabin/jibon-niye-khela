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
    border: 'border-l-emerald-500/60',
    icon: Sparkles,
    iconColor: 'text-emerald-400',
  },
  bad: {
    border: 'border-l-rose-500/60',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
  },
  funny: {
    border: 'border-l-violet-500/60',
    icon: Smile,
    iconColor: 'text-violet-400',
  },
  neutral: {
    border: 'border-l-zinc-600/60',
    icon: HelpCircle,
    iconColor: 'text-zinc-500',
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
        className="flex flex-col items-center justify-center py-20 text-center text-zinc-500"
        data-testid="chronicle-stream"
      >
        <p className="text-sm font-medium">The chronicle of your life begins with your first year.</p>
        <p className="text-xs text-zinc-600 mt-1">Advance age to begin your journey.</p>
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
        <li key={age} aria-label={`Year ${age}`} className="flex flex-col gap-3">
          {/* Year Marker Badge */}
          <div className="sticky top-0 z-10 flex items-center gap-3 py-1 bg-zinc-950/80 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-zinc-300">
                Year {age}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
          </div>

          {/* Group of Events for this Year */}
          <ul className="flex flex-col gap-2.5 pl-2 sm:pl-3 border-l border-white/[0.04] ml-3.5">
            {entries.map((entry, index) => {
              const style = TONE_STYLES[entry.tone] ?? TONE_STYLES.neutral;
              const IconComp = style.icon;
              return (
                <li
                  key={`${entry.age}-${index}`}
                  data-tone={entry.tone}
                  className={`group relative rounded-xl border border-white/[0.06] border-l-[3px] ${style.border} bg-white/[0.025] hover:bg-white/[0.05] p-3.5 sm:p-4 backdrop-blur-md transition-all duration-200 shadow-sm hover:shadow-md hover:border-white/[0.1]`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.05]">
                      <IconComp className={`size-3 ${style.iconColor}`} />
                    </div>
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-200 font-normal">
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
