'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Character, Relation, Relationship } from '@/lib/engine/types';
import { isPeerRelation } from '@/lib/engine/relationships';
import { relLabel } from '@/lib/ui/relations';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { RelationshipModal } from '@/components/game/RelationshipModal';
import { NpcChips } from '@/components/game/NpcChips';
import { Users, Heart, HeartHandshake, HeartCrack, Flame, UserCheck, Sparkles, X } from 'lucide-react';
import type { ComponentType } from 'react';

const RELATION_ICONS: Partial<Record<Relation, ComponentType<{ className?: string }>>> = {
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

export function RelationsSheet({
  open,
  onClose,
  character,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
}) {
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);

  // Same deduplication rule as the desktop rail: peers (classmates, coworkers)
  // live in the ActiveMenu instead, so they are excluded here.
  const livingRelationships = Array.from(
    new Map(
      character.relationships
        .filter((r) => r.alive && !isPeerRelation(r.relation))
        .map((r) => [r.id, r]),
    ).values(),
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-surface-overlay p-3 sm:items-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.micro }}
            onClick={onClose}
            data-testid="relations-backdrop"
          >
            <motion.section
              ref={overlayRef as React.Ref<HTMLElement>}
              className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-surface text-text shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              data-testid="relations-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="আত্মীয়স্বজন"
              onKeyDown={trapKeyDown}
              tabIndex={-1}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-text-muted" aria-hidden="true" />
                  <h2 className="text-base font-bold tracking-tight text-text">আত্মীয়স্বজন</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="close-relations"
                  className="flex size-8 items-center justify-center rounded-full bg-surface-raised text-text-muted hover:bg-surface-raised hover:text-text transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="আত্মীয়স্বজনের তালিকা বন্ধ করো"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted">জীবিত লোকজন</p>
                  <span className="text-[10px] text-text-muted tabular-nums">
                    {livingRelationships.length} জন
                  </span>
                </div>

                {livingRelationships.length === 0 ? (
                  <p className="text-sm text-text-muted py-6 text-center">
                    এখন কারো সাথে যোগাযোগই নাই।
                  </p>
                ) : (
                  <div className="space-y-1.5" data-testid="relations-scroll">
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
                                <p className="truncate text-xs font-medium text-text group-hover:text-text transition-colors">
                                  {rel.name}
                                </p>
                                {rel.romanceStage !== undefined && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary-text border border-primary/25">
                                    {relLabel(rel.relation)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium capitalize">
                                {rel.occupation ? `${rel.occupation} · ` : ''}
                                {relLabel(rel.relation)}
                              </p>
                              <NpcChips
                                health={rel.health}
                                happiness={rel.happiness}
                                jobId={rel.jobId}
                                lastMetAge={rel.lastMetAge}
                              />
                            </div>
                          </div>

                          <div className="w-14 shrink-0 flex flex-col items-end gap-1">
                            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${rel.meter}%` }} />
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
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedRel &&
        typeof document !== 'undefined' &&
        createPortal(
          <RelationshipModal relationship={selectedRel} onClose={() => setSelectedRel(null)} />,
          document.body,
        )}
    </>
  );
}