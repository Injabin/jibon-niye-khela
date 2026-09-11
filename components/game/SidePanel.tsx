'use client';

import type { Character } from '@/lib/engine/types';
import { isPeerRelation } from '@/lib/engine/relationships';
import { formatMoney } from '@/lib/ui/money';
import { relLabel } from '@/lib/ui/relations';

/**
 * SidePanel (Phase 8 right rail, desktop ≥1280px).
 * Shows traits, reputation, a quick asset count, and a family-tree shortcut.
 * Purely presentational — opens the family tree via callback.
 */
export function SidePanel({
  character,
  onOpenFamilyTree,
}: {
  character: Character;
  onOpenFamilyTree: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 p-4 pt-5">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">খ্যাতি</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">খ্যাতি</span>
            <span className="font-bold tabular-nums text-text">{character.reputation.fame}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">কর্ম</span>
            <span className="font-bold tabular-nums text-text">{character.reputation.karma}</span>
          </div>
        </div>
      </div>

      {character.traits.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">গুণাবলী</p>
          <div className="flex flex-wrap gap-1.5">
            {character.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-sm border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-text"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {character.assets.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">সম্পদ</p>
          <div className="flex flex-col gap-1">
            {character.assets.slice(0, 5).map((asset) => (
              <div key={asset.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-text-muted capitalize">{asset.kind}</span>
                <span className="ml-2 shrink-0 font-bold tabular-nums text-text">
                  {formatMoney(asset.value)}
                </span>
              </div>
            ))}
            {character.assets.length > 5 && (
              <p className="text-[11px] text-text-muted">+{character.assets.length - 5} ও অধিক</p>
            )}
          </div>
        </div>
      )}

      {character.relationships.some((r) => !isPeerRelation(r.relation)) && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">সম্পর্ক</p>
          <div className="flex flex-col gap-1">
            {character.relationships.filter((r) => !isPeerRelation(r.relation)).slice(0, 4).map((rel) => (
              <div key={rel.id} className="flex items-center justify-between text-sm">
                <span className="truncate capitalize text-text-muted">{relLabel(rel.relation)}</span>
                <span className="ml-2 shrink-0 truncate font-medium text-text">{rel.name}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenFamilyTree}
            className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            পরিবার গাছ দেখুন →
          </button>
        </div>
      )}

      {character.criminalRecord.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            অপরাধ রেকর্ড
          </p>
          <p className="text-sm text-danger-text">{character.criminalRecord.length} কেস</p>
        </div>
      )}
    </div>
  );
}
