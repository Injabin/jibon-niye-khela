'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/theme';
import { STAT_META, type StatKey } from '@/lib/theme/concepts';
import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import { careerTitle } from '@/lib/engine/events/categories/career';
import { relLabel } from '@/lib/ui/relations';
import type { Asset, Character } from '@/lib/engine/types';
import { isPeerRelation } from '@/lib/engine/relationships';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './StatBar';
import { X, Users, Coins } from 'lucide-react';

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
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro }}
          onClick={onClose}
          data-testid="profile-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/80 backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            data-testid="profile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="জীবনবৃত্তান্ত"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
              <h2 className="text-base font-bold tracking-tight text-white">সম্পূর্ণ জীবনবৃত্তান্ত</h2>
              <button
                type="button"
                onClick={onClose}
                data-testid="close-profile"
                className="flex size-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                aria-label="বৃত্তান্ত-পর্দা বন্ধ করো"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col gap-5">
              {/* Character Identity Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="size-20 shrink-0 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 p-1 shadow-inner">
                  <Avatar character={character} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold tracking-tight text-white">
                    {character.name} {character.surname}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">{rankForLife(character)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                    {character.gender === 'male' ? 'ছেলে' : 'মেয়ে'}, জন্ম {character.birthYear}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    <Coins className="size-3 text-amber-400" />
                    <span>{coinsOf(character.money)} টাকা</span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  প্রধান আটপৌরে স্ট্যাট
                </span>
                <div className="mt-2 space-y-2.5">
                  {statKeys.map((key) => (
                    <StatBar key={key} label={STAT_META[key].label} value={character.stats[key]} statKey={key} />
                  ))}
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  মান-গুণ আর সম্মান
                </span>
                <dl className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between gap-3 border-b border-white/[0.04] pb-1.5">
                    <dt className="text-zinc-400">সোভাব</dt>
                    <dd className="text-right font-medium text-white">
                      {character.traits.length ? character.traits.join(', ') : 'এখনো কিছু সোভাব খুঁজা পাওয়া যায় নাই'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/[0.04] pb-1.5">
                    <dt className="text-zinc-400">নাম-ডাক</dt>
                    <dd className="text-right font-bold tabular-nums text-amber-300">{character.reputation.fame}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/[0.04] pb-1.5">
                    <dt className="text-zinc-400">কাম-কর্ম</dt>
                    <dd className="text-right font-bold tabular-nums text-teal-300">{character.reputation.karma}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-400">জীবিকার পথ</dt>
                    <dd className="text-right text-zinc-200">
                      {character.career.jobId
                        ? `${careerTitle(character)} · ${character.career.yearsAtJob} বছর চাকরি`
                        : character.education.graduated
                          ? 'লেখাপড়া শিখে বেরহওয়া'
                          : 'বেকার ভাইয়া'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Lineage / Kindred */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]" data-testid="profile-lineage">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    বংশ ও আত্মীয় গণ্ডা
                  </span>
                  <span className="text-[10px] text-zinc-500">{character.relationships.filter((r) => !isPeerRelation(r.relation)).length} জন</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-200">
                  {character.relationships.filter((r) => !isPeerRelation(r.relation)).length === 0 ? (
                    <li className="text-zinc-500">এখনো কোনো গরিষ্ঠ-আত্মীয় খুঁজা পাওয়া যায় নাই।</li>
                  ) : (
                    character.relationships.filter((r) => !isPeerRelation(r.relation)).map((r) => (
                      <li key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                        <span className="font-medium text-white">{r.name}</span>
                        <span className="capitalize text-zinc-400 text-[11px]">{relLabel(r.relation)}</span>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  type="button"
                  onClick={onOpenFamilyTree}
                  data-testid="profile-open-family-tree"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Users className="size-3.5" />
                  <span>ইন্টারঅ্যাক্টিভ পারিবারিক গোছ খোলো</span>
                </button>
              </div>

              {/* Holdings */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]" data-testid="profile-holdings">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    মাল-সম্পদ ও জমিজমা
                  </span>
                  <span className="text-[10px] text-zinc-500">{character.assets.length} টা জিনিস</span>
                </div>
                {character.assets.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">এখনো কোনো সম্পদ হাতে ওঠে নাই।</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-zinc-200">
                    {character.assets.map((asset: Asset) => (
                      <li key={asset.id} className="flex justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                        <span className="capitalize text-zinc-300">{asset.name || asset.kind}</span>
                        <span className="font-bold tabular-nums text-amber-300">{coinsOf(asset.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}