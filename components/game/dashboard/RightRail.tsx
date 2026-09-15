'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Character, Relation, Relationship } from '@/lib/engine/types';
import { isPeerRelation } from '@/lib/engine/relationships';
import { relLabel } from '@/lib/ui/relations';
import { RelationshipModal } from '@/components/game/RelationshipModal';
import { NpcChips } from '@/components/game/NpcChips';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Heart,
  UserCheck,
  AlertTriangle,
  Flame,
  HeartHandshake,
  HeartCrack,
  Settings,
  Keyboard,
  Download,
  Upload,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface RightRailProps {
  character: Character | null;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onStartFreshLife?: () => void;
  onOpenCustomLife?: () => void;
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
  grandparent: Users,
};

export function RightRail({
  character,
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onImport,
  onReset,
  onStartFreshLife,
  onOpenCustomLife,
}: RightRailProps) {
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);

  if (!character) {
    return (
      <div className="flex h-full flex-col justify-center items-center rounded-2xl border border-border bg-surface-raised/40 p-5 text-center text-text-muted">
        <Users className="size-6 mb-2 text-text-muted" />
        <p className="text-xs font-medium">এহানে তোমার সম্পর্ক আর হালচাল দ্যাখা যাবে।</p>
      </div>
    );
  }

  // Defensive deduplication to ensure unique entries by ID. Classmates and
  // coworkers surface under ActiveMenu (study & job sections), not the
  // classic relationship rail, so they are excluded here.
  const livingRelationships = Array.from(
    new Map(character.relationships.filter((r) => r.alive && !isPeerRelation(r.relation)).map((r) => [r.id, r])).values()
  );

  return (
    <>
      <aside
        className="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-overlay"
        aria-label="বাকি পরিসংখ্যান আর বংশ-পরম্পরা"
      >
        {/* 1. Reputation & Standing */}
        <div className="flex flex-col gap-2.5 pb-4 border-b border-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            মান-মর্যাদা আর নাম-ইজ্জত
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised/40 p-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-tone-good/10 text-tone-text-good border border-tone-good/25">
                <Sparkles className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">নাম-ডাক</p>
                <p className="text-sm font-bold tabular-nums text-text">
                  {character.reputation.fame}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised/40 p-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-tone-neutral/10 text-tone-text-neutral border border-tone-neutral/25">
                <ShieldCheck className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">কাম-কর্ম</p>
                <p className="text-sm font-bold tabular-nums text-text">
                  {character.reputation.karma}
                </p>
              </div>
            </div>
          </div>

          {character.criminalRecord.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-danger-border bg-danger/10 p-2.5 text-xs text-danger-text mt-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-3.5" />
                <span>অপরাধের তালিকা</span>
              </div>
              <span className="font-semibold tabular-nums">{character.criminalRecord.length}</span>
            </div>
          )}
        </div>

        {/* 2. Traits */}
        {character.traits.length > 0 && (
          <div className="flex flex-col gap-2 pb-4 border-b border-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              সোভাব আর গুণাগুণ
            </span>
            <div className="flex flex-wrap gap-1.5">
              {character.traits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised/70 px-2.5 py-1 text-[11px] font-medium text-text hover:border-primary/30 transition-colors"
                >
                  <Award className="size-3 text-primary-text" />
                  <span>{trait}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Relationships */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              আত্মীয়স্বজন
            </span>
            <span className="text-[10px] text-text-muted tabular-nums">
              {livingRelationships.length} জন জীবিত
            </span>
          </div>

          {livingRelationships.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">এখন কারো সাথে যোগাযোগই নাই।</p>
          ) : (
            <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1.5 scrollbar-cozy" data-testid="relationships-scroll">
              {livingRelationships.map((rel, index) => {
                const RelIcon = RELATION_ICONS[rel.relation] ?? Users;
                return (
                  <button
                    type="button"
                    key={`${rel.id}-${rel.relation}-${index}`}
                    onClick={() => setSelectedRel(rel)}
                    className="group w-full text-left flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-2.5 hover:bg-surface-raised/70 hover:border-border active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-raised/70 border border-border text-text-muted group-hover:text-primary-text group-hover:border-primary/30 transition-colors">
                        <RelIcon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-medium text-text group-hover:text-text transition-colors">{rel.name}</p>
                          {rel.romanceStage !== undefined && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary-text border border-primary/25">
                              {relLabel(rel.relation)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium capitalize">
                          {rel.occupation ? `${rel.occupation} · ` : ''}{relLabel(rel.relation)}
                        </p>
                        <NpcChips
                          health={rel.health}
                          happiness={rel.happiness}
                          jobId={rel.jobId}
                          lastMetAge={rel.lastMetAge}
                        />
                      </div>
                    </div>

                    {/* Meter pill */}
                    <div className="w-14 shrink-0 flex flex-col items-end gap-1">
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${rel.meter}%` }}
                        />
                      </div>
                      <span className="text-[9px] tabular-nums font-mono text-text-muted">
                        {rel.meter}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>

<div className="space-y-2 border-t border-border pt-3" data-testid="right-rail-options">
          <div className="grid grid-cols-2 gap-2">
            {onStartFreshLife && (
              <button type="button" onClick={onStartFreshLife} data-testid="new-life-btn" className="game-action game-action-primary w-full active:scale-[0.98]">
                <Sparkles className="size-4" />নতুন জীবন
              </button>
            )}
            {onOpenCustomLife && (
              <button type="button" onClick={onOpenCustomLife} data-testid="custom-life-btn" className="game-action game-action-secondary w-full active:scale-[0.98]">
                <Sliders className="size-4" />নিজের মতো
              </button>
            )}
            <button type="button" onClick={onOpenSettings} data-testid="open-settings" className="game-action game-action-secondary w-full active:scale-[0.98]"><Settings className="size-4" />সেটিংস</button>
            <button type="button" onClick={onOpenShortcuts} data-testid="right-shortcuts" className="game-action game-action-secondary w-full active:scale-[0.98]"><Keyboard className="size-4" />শর্টকাট</button>
            <button type="button" onClick={onExport} data-testid="right-export" className="game-action game-action-secondary w-full active:scale-[0.98]"><Download className="size-4" />সেভ</button>
            <button type="button" onClick={onImport} data-testid="right-import" className="game-action game-action-secondary w-full active:scale-[0.98]"><Upload className="size-4" />লোড</button>
            <button type="button" onClick={onReset} data-testid="right-reset" className="game-action game-action-danger col-span-2 w-full active:scale-[0.98]"><RotateCcw className="size-4" />রিসেট জীবন</button>
          </div>
        </div>
      </aside>

      {selectedRel &&
        typeof document !== 'undefined' &&
        createPortal(
          <RelationshipModal
            relationship={selectedRel}
            onClose={() => setSelectedRel(null)}
          />,
          document.body,
        )}
    </>
  );
}
