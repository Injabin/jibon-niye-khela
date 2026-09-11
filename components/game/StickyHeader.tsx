'use client';

import type { Character } from '@/lib/engine/types';
import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './dashboard/StatBar';
import { STAT_META } from '@/lib/theme/concepts';
import { Coins } from 'lucide-react';

interface StickyHeaderProps {
  character: Character;
  compact?: boolean;
}

/**
 * Responsive Mobile Header.
 * Carries data-testid="character-summary" and data-testid="money" for testing contracts.
 */
export function StickyHeader({ character }: StickyHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 rounded-md border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl"
      data-testid="character-summary"
    >
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="size-12 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 p-1 flex items-center justify-center shadow-inner"
            >
              <Avatar character={character} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold tracking-tight text-white">
                {character.name} {character.surname}
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium truncate">
                {rankForLife(character)}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums text-white">
              {character.age}{' '}
              <span className="text-[11px] font-normal text-zinc-400">বছর বয়স</span>
            </p>
            <div
              className="mt-0.5 flex items-center justify-end gap-1 text-xs font-bold tabular-nums text-amber-300"
              data-testid="money"
            >
              <Coins className="size-3 text-amber-400" />
              <span>৳{formatMoney(character.money)}</span>
            </div>
          </div>
        </div>

        {/* Mobile Quick Stat Bars */}
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-white/[0.04]">
          <StatBar label={STAT_META.health.label} value={character.stats.health} statKey="health" />
          <StatBar label={STAT_META.happiness.label} value={character.stats.happiness} statKey="happiness" />
          <StatBar label={STAT_META.smarts.label} value={character.stats.smarts} statKey="smarts" />
          <StatBar label={STAT_META.looks.label} value={character.stats.looks} statKey="looks" />
        </div>
      </div>
    </header>
  );
}