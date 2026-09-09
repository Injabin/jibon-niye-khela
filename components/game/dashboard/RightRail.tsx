'use client';

import type { Character, Relation } from '@/lib/engine/types';
import { formatMoney } from '@/lib/ui/money';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Heart,
  Car,
  Home,
  Gem,
  Coins,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Flame,
  HeartHandshake,
  HeartCrack,
} from 'lucide-react';

interface RightRailProps {
  character: Character | null;
  onOpenFamilyTree: () => void;
}

const RELATION_ICONS: Partial<Record<Relation, React.ComponentType<{ className?: string }>>> = {
  mother: UserCheck,
  father: UserCheck,
  spouse: Heart,
  partner: HeartHandshake,
  dating: Heart,
  crush: Flame,
  ex: HeartCrack,
  child: Users,
  sibling: Users,
  friend: Sparkles,
};

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  home: Home,
  jewelry: Gem,
  stock: Coins,
  crypto: Coins,
  collectible: Award,
};

export function RightRail({ character, onOpenFamilyTree }: RightRailProps) {
  if (!character) {
    return (
      <div className="flex h-full flex-col justify-center items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-center text-zinc-400 backdrop-blur-xl">
        <Users className="size-6 mb-2 text-zinc-400" />
        <p className="text-xs font-medium">Relationships & status appear here.</p>
      </div>
    );
  }

  const livingRelationships = character.relationships.filter((r) => r.alive);

  return (
    <aside
      className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-white/[0.06] bg-zinc-900/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20 scrollbar-none"
      aria-label="Secondary stats and lineage"
    >
      {/* 1. Reputation & Standing */}
      <div className="flex flex-col gap-2.5 pb-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Standing & Reputation
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Fame</p>
              <p className="text-sm font-bold tabular-nums text-white">
                {character.reputation.fame}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Karma</p>
              <p className="text-sm font-bold tabular-nums text-white">
                {character.reputation.karma}
              </p>
            </div>
          </div>
        </div>

        {character.criminalRecord.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs text-rose-400 mt-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5" />
              <span>Criminal History</span>
            </div>
            <span className="font-semibold tabular-nums">{character.criminalRecord.length}</span>
          </div>
        )}
      </div>

      {/* 2. Traits */}
      {character.traits.length > 0 && (
        <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Traits & Attributes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {character.traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-100 hover:border-zinc-500 transition-colors"
              >
                <Award className="size-3 text-zinc-300" />
                <span>{trait}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Relationships */}
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Relationships
          </span>
          <span className="text-[10px] text-zinc-400 tabular-nums">
            {livingRelationships.length} alive
          </span>
        </div>

        {livingRelationships.length === 0 ? (
          <p className="text-xs text-zinc-400 py-3 text-center">No current contacts.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {livingRelationships.slice(0, 5).map((rel) => {
              const RelIcon = RELATION_ICONS[rel.relation] ?? Users;
              return (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                      <RelIcon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-medium text-zinc-200">{rel.name}</p>
                        {rel.romanceStage !== undefined && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/20">
                            {rel.relation}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium capitalize">
                        {rel.occupation ? `${rel.occupation} · ` : ''}{rel.relation}
                      </p>
                    </div>
                  </div>

                  {/* Meter pill */}
                  <div className="w-14 shrink-0 flex flex-col items-end gap-1">
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        style={{ width: `${rel.meter}%` }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums font-mono text-zinc-400">
                      {rel.meter}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onOpenFamilyTree}
          className="group mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
        >
          <span>Explore Family Tree</span>
          <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 4. Assets Glance */}
      {character.assets.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Key Holdings
            </span>
            <span className="text-[10px] text-zinc-400 tabular-nums">
              {character.assets.length} items
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {character.assets.slice(0, 3).map((asset) => {
              const AssetIcon = ASSET_ICONS[asset.kind] ?? Coins;
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AssetIcon className="size-3 text-zinc-400 shrink-0" />
                    <span className="truncate text-zinc-300 capitalize">{asset.name || asset.kind}</span>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums text-zinc-200">
                    {formatMoney(asset.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
