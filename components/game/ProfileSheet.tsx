'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/theme';
import { STAT_META, WEALTH, type StatKey } from '@/lib/theme/concepts';
import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import type { Asset, Character } from '@/lib/engine/types';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { Avatar } from '@/components/avatar/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { StatBar } from './StatBar';

/**
 * Profile sheet (UI-DESIGN.md §2.4 → "Profile → Stats/Traits/Lineage"): the
 * existing character-detail view as a bottom sheet. Pure presentation over
 * the same character data — stats bound to the §0 display labels.
 */

function coinsOf(value: number): string {
  return formatMoney(value);
}

export function ProfileSheet({
  open,
  onClose,
  character,
  onOpenFamilyTree,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
  onOpenFamilyTree: () => void;
}) {
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);
  const statKeys: StatKey[] = ['health', 'happiness', 'smarts', 'looks'];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.micro }}
            onClick={onClose}
            data-testid="profile-backdrop"
          />
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-border bg-surface shadow-lg"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            data-testid="profile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Character profile"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <h2 className="text-lg font-bold tracking-tight text-text">Profile</h2>
              <Button variant="secondary" onClick={onClose} data-testid="close-profile">
                Close
              </Button>
            </div>

            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar character={character} />
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold tracking-tight text-text">
                    {character.name} {character.surname}
                  </h3>
                  <p className="text-sm text-text-muted">{rankForLife(character)}</p>
                  <p className="text-sm text-text-muted">
                    {character.gender}, born {character.birthYear}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 border border-border bg-surface-raised px-3 py-2">
                <Icon name="coin" size={16} className="shrink-0" styleColor={WEALTH.fillVar} />
                <span className="text-sm font-semibold text-text">{WEALTH.label}:</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: WEALTH.textVar }}>
                  {coinsOf(character.money)}
                </span>
              </div>

              <div className="mt-4 space-y-1.5">
                {statKeys.map((key) => (
                  <StatBar key={key} label={STAT_META[key].label} value={character.stats[key]} statKey={key} />
                ))}
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">Traits</dt>
                  <dd className="text-right text-text">
                    {character.traits.length ? character.traits.join(', ') : 'none discovered yet'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">Fame</dt>
                  <dd className="text-right font-bold tabular-nums text-text">{character.reputation.fame}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">Karma</dt>
                  <dd className="text-right font-bold tabular-nums text-text">{character.reputation.karma}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">Calling</dt>
                  <dd className="text-right text-text">
                    {character.career.jobId
                      ? `${character.career.jobId} · year ${character.career.yearsAtJob}`
                      : character.education.graduated
                        ? 'Studied the arts of war'
                        : 'Unsworn'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-col gap-1.5" data-testid="profile-lineage">
                <p className="text-xs font-semibold uppercase tracking-[0.04em] text-text-muted">Lineage</p>
                <ul className="space-y-1 text-sm text-text">
                  {character.relationships.length === 0 ? (
                    <li className="text-text-muted">No kindred found yet.</li>
                  ) : (
                    character.relationships.map((r) => (
                      <li key={r.id} className="flex justify-between gap-3">
                        <span>{r.name}</span>
                        <span className="text-text-muted">{r.relation}</span>
                      </li>
                    ))
                  )}
                </ul>
                <Button variant="secondary" onClick={onOpenFamilyTree} data-testid="profile-open-family-tree" className="mt-1">
                  Open the family tree
                </Button>
              </div>

              <div className="mt-4" data-testid="profile-holdings">
                <p className="text-xs font-semibold uppercase tracking-[0.04em] text-text-muted">Holdings</p>
                {character.assets.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">No holdings yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm text-text">
                    {character.assets.map((asset: Asset) => (
                      <li key={asset.id} className="flex justify-between gap-3">
                        <span>{asset.name}</span>
                        <span className="font-bold tabular-nums text-text">{coinsOf(asset.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}