'use client';

import { Briefcase, Heart, Smile } from 'lucide-react';

interface NpcChipsProps {
  health?: number;
  happiness?: number;
  jobId?: string;
  lastMetAge?: number;
}

const JOB_LABELS: Record<string, string> = {
  job_retail: 'দোকান',
  job_service: 'সেবা',
  job_office: 'অফিস',
  job_tech: 'টেক',
  job_medical: 'ডাক্তারি',
  job_legal: 'আইন',
  job_finance: 'ব্যাংক',
  job_art: 'শিল্প',
  job_trade: 'কারিগর',
  job_military: 'সেনা',
  job_entertainer: 'শিল্পী',
  job_politics: 'রাজনীতি',
  job_sports: 'খেলাধুলা',
  job_business: 'ব্যবসা',
};

function toneClass(value: number): string {
  if (value >= 70) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (value >= 40) return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
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
        <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-300">
          <Briefcase className="size-2.5" />
          {JOB_LABELS[jobId]}
        </span>
      )}
      {lastMetAge !== undefined && (
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-zinc-400">
          মিলন {lastMetAge}
        </span>
      )}
    </div>
  );
}