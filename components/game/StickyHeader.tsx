'use client';

import type { Character } from '@/lib/engine/types';
import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import { STAT_META, WEALTH, type StatKey } from '@/lib/theme/concepts';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './StatBar';
import { Icon } from '@/components/ui/Icon';

/**
 * Sticky Header (UI-DESIGN.md §2.1, top ~15%): character name + rank on the
 * left, age + coin wealth on the right, the four stat bars below. Pinned via
 * `sticky top-0`. Carries the `character-summary`/`money` testids the Gate 1
 * suite reads.
 */
export function StickyHeader({ character }: { character: Character }) {
  const statKeys: StatKey[] = ['health', 'happiness', 'smarts', 'looks'];

  return (
    <header
      className="sticky top-0 z-20 rounded-md border-b border-border bg-background/95 backdrop-blur"
      data-testid="character-summary"
    >
      <div className="mx-auto w-full max-w-xl px-4 pb-3 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-end gap-3">
            <div className="h-22 w-[4.5rem] shrink-0">
              <div className="origin-top-left scale-[0.5]">
                <Avatar character={character} />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-text">
                {character.name} {character.surname}
              </h2>
              <p className="text-[13px] text-text-muted">{rankForLife(character)}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[20px] font-bold leading-none tabular-nums text-text">
              {character.age} <span className="text-[13px] font-normal text-text-muted">years old</span>
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-border pt-2 tabular-nums">
          <Icon name="coin" size={14} className="shrink-0" styleColor={WEALTH.fillVar} />
          <span className="text-sm font-bold tabular-nums" style={{ color: WEALTH.textVar }} data-testid="money">
            {formatMoney(character.money)}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          {statKeys.map((key) => (
            <StatBar key={key} label={STAT_META[key].label} value={character.stats[key]} statKey={key} />
          ))}
        </div>
      </div>
    </header>
  );
}