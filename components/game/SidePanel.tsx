'use client';

import type { Character } from '@/lib/engine/types';
import { formatMoney } from '@/lib/ui/money';

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
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Reputation</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Fame</span>
            <span className="font-bold tabular-nums text-text">{character.reputation.fame}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Karma</span>
            <span className="font-bold tabular-nums text-text">{character.reputation.karma}</span>
          </div>
        </div>
      </div>

      {character.traits.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Traits</p>
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
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Assets</p>
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
              <p className="text-[11px] text-text-muted">+{character.assets.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {character.relationships.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Relationships</p>
          <div className="flex flex-col gap-1">
            {character.relationships.slice(0, 4).map((rel) => (
              <div key={rel.id} className="flex items-center justify-between text-sm">
                <span className="truncate capitalize text-text-muted">{rel.relation}</span>
                <span className="ml-2 shrink-0 truncate font-medium text-text">{rel.name}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenFamilyTree}
            className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            View family tree →
          </button>
        </div>
      )}

      {character.criminalRecord.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            Criminal Record
          </p>
          <p className="text-sm text-danger-text">{character.criminalRecord.length} offense(s)</p>
        </div>
      )}
    </div>
  );
}
