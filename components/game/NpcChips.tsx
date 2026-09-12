'use client';

import { Briefcase, Heart, Smile } from 'lucide-react';
import { JOB_LABELS } from '@/lib/ui/jobs';

interface NpcChipsProps {
  health?: number;
  happiness?: number;
  jobId?: string;
  lastMetAge?: number;
}

function toneClass(value: number): string {
  if (value >= 70) return 'border-tone-good/25 bg-tone-good/10 text-tone-text-good';
  if (value >= 40) return 'border-tone-neutral/30 bg-tone-neutral/10 text-tone-text-neutral';
  return 'border-tone-bad/25 bg-tone-bad/10 text-tone-text-bad';
}

export function NpcChips({ health, happiness, jobId, lastMetAge }: NpcChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {health !== undefined && (
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${toneClass(health)}`}
        >
          <Heart className="size-2.5" />
          {health}
        </span>
      )}
      {happiness !== undefined && (
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${toneClass(happiness)}`}
        >
          <Smile className="size-2.5" />
          {happiness}
        </span>
      )}
      {jobId && JOB_LABELS[jobId] && (
        <span className="inline-flex items-center gap-1 rounded-md border border-tone-neutral/30 bg-tone-neutral/10 px-1.5 py-0.5 text-[9px] font-semibold text-tone-text-neutral">
          <Briefcase className="size-2.5" />
          {JOB_LABELS[jobId]}
        </span>
      )}
      {lastMetAge !== undefined && (
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-text-muted">
          মিলন {lastMetAge}
        </span>
      )}
    </div>
  );
}