'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/theme';
import { STAT_META, type StatKey } from '@/lib/theme/concepts';
import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import { careerTitle } from '@/lib/engine/events/categories/career';
import type { Asset, AvatarHair, AvatarOutfit, Character } from '@/lib/engine/types';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { useGameStore } from '@/lib/store/gameStore';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './dashboard/StatBar';
import { X, Coins, Palette, Settings, Keyboard, Sliders } from 'lucide-react';
import {
  CUSTOM_LIFE_HAIR_SWATCHES,
  CUSTOM_LIFE_OUTFIT_SWATCHES,
} from '@/lib/avatar/palette';

function coinsOf(value: number): string {
  return formatMoney(value);
}

export function ProfileSheet({
  open,
  onClose,
  character,
  onOpenSettings,
  onOpenShortcuts,
  onOpenCustomLife,
}: {
  open: boolean;
  onClose: () => void;
  character: Character;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenCustomLife: () => void;
}) {
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);
  const setAvatarAppearance = useGameStore((s) => s.setAvatarAppearance);
  const statKeys: StatKey[] = ['health', 'happiness', 'smarts', 'looks'];
  const hairChoices: Array<{ id: AvatarHair; label: string }> = [
    { id: 'cocoa', label: 'কোকো' },
    { id: 'midnight', label: 'কালো' },
    { id: 'chestnut', label: 'চেস্টনাট' },
    { id: 'silver', label: 'সিলভার' },
  ];
  const outfitChoices: Array<{ id: AvatarOutfit; label: string }> = [
    { id: 'sunshine', label: 'রোদ্দুর' },
    { id: 'mint', label: 'পুদিনা' },
    { id: 'lavender', label: 'ল্যাভেন্ডার' },
    { id: 'coral', label: 'কোরাল' },
  ];

  const panelCard = 'rounded-2xl border border-border bg-surface-raised/60 p-4';
  const panelLabel = 'text-xs font-bold text-text';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay p-3 sm:p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro }}
          onClick={onClose}
          data-testid="profile-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-surface text-text shadow-2xl backdrop-blur-2xl"
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
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-base font-bold tracking-tight text-text">সম্পূর্ণ জীবনবৃত্তান্ত</h2>
              <button
                type="button"
                onClick={onClose}
                data-testid="close-profile"
                className="flex size-8 items-center justify-center rounded-full bg-surface-raised text-text-muted hover:bg-surface-raised hover:text-text transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="বৃত্তান্ত-পর্দা বন্ধ করো"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
              {/* Character Identity Card */}
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-raised/60 p-4">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface p-1 shadow-inner">
                  <Avatar character={character} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold tracking-tight text-text">
                    {character.name} {character.surname}
                  </h3>
                  <p className="text-xs font-medium text-text-muted">{rankForLife(character)}</p>
                  <p className="mt-0.5 text-xs text-text-muted capitalize">
                    {character.gender === 'male' ? 'ছেলে' : 'মেয়ে'}, জন্ম {character.birthYear}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-tone-good/30 bg-tone-good/10 px-2.5 py-0.5 text-xs font-semibold text-tone-text-good">
                    <Coins className="size-3 text-tone-good" />
                    <span>{coinsOf(character.money)} টাকা</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4" data-testid="profile-options">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-text">জীবনবৃত্তান্তের অপশন</span>
                  <span className="text-[11px] text-text-muted">দ্রুত নিয়ন্ত্রণ</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={onOpenSettings} data-testid="profile-settings" className="game-action game-action-secondary w-full flex-col gap-1 py-2">
                    <Settings className="size-4" />
                    <span>সেটিংস</span>
                  </button>
                  <button type="button" onClick={onOpenShortcuts} data-testid="profile-shortcuts" className="game-action game-action-secondary w-full flex-col gap-1 py-2">
                    <Keyboard className="size-4" />
                    <span>শর্টকাট</span>
                  </button>
                  <button type="button" onClick={onOpenCustomLife} data-testid="profile-custom-life" className="game-action game-action-secondary w-full flex-col gap-1 py-2">
                    <Sliders className="size-4" />
                    <span>কাস্টম</span>
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              <div className={panelCard}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  প্রধান আটপৌরে স্ট্যাট
                </span>
                <div className="mt-2 space-y-2.5">
                  {statKeys.map((key) => (
                    <StatBar key={key} label={STAT_META[key].label} value={character.stats[key]} statKey={key} />
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4" data-testid="avatar-customization">
                <div className="flex items-center gap-2">
                  <Palette className="size-4 text-primary-text" />
                  <span className="text-sm font-semibold text-text">চেহারার সাজ</span>
                </div>
                <div>
                  <p className="mb-2 text-xs text-text-muted">চুল</p>
                  <div className="grid grid-cols-4 gap-2">
                    {hairChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setAvatarAppearance({ hair: choice.id })}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2 text-[11px] text-text-muted transition hover:bg-surface-raised"
                        data-testid={`profile-hair-${choice.id}`}
                      >
                        <span
                          className="size-6 rounded-full border-2 border-border"
                          style={{ backgroundColor: CUSTOM_LIFE_HAIR_SWATCHES[choice.id] }}
                        />
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-text-muted">জামা</p>
                  <div className="grid grid-cols-4 gap-2">
                    {outfitChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setAvatarAppearance({ outfit: choice.id })}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2 text-[11px] text-text-muted transition hover:bg-surface-raised"
                        data-testid={`profile-outfit-${choice.id}`}
                      >
                        <span
                          className="size-6 rounded-xl border-2 border-border"
                          style={{ backgroundColor: CUSTOM_LIFE_OUTFIT_SWATCHES[choice.id] }}
                        />
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className={panelCard}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  মান-গুণ আর সম্মান
                </span>
                <dl className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between gap-3 border-b border-border pb-1.5">
                    <dt className="text-text-muted">সোভাব</dt>
                    <dd className="text-right font-medium text-text">
                      {character.traits.length ? character.traits.join(', ') : 'এখনো কিছু সোভাব খুঁজা পাওয়া যায় নাই'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-border pb-1.5">
                    <dt className="text-text-muted">নাম-ডাক</dt>
                    <dd className="text-right font-bold tabular-nums text-tone-text-good">{character.reputation.fame}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-border pb-1.5">
                    <dt className="text-text-muted">কাম-কর্ম</dt>
                    <dd className="text-right font-bold tabular-nums text-tone-text-neutral">{character.reputation.karma}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">জীবিকার পথ</dt>
                    <dd className="text-right text-text">
                      {character.career.jobId
                        ? `${careerTitle(character)} · ${character.career.yearsAtJob} বছর চাকরি`
                        : character.education.graduated
                          ? 'লেখাপড়া শিখে বেরহওয়া'
                          : 'বেকার ভাইয়া'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Holdings */}
              <div className={panelCard} data-testid="profile-holdings">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    মাল-সম্পদ ও জমিজমা
                  </span>
                  <span className="text-[10px] text-text-muted">{character.assets.length} টা জিনিস</span>
                </div>
                {character.assets.length === 0 ? (
                  <p className="mt-2 text-xs text-text-muted">এখনো কোনো সম্পদ হাতে ওঠে নাই।</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-text">
                    {character.assets.map((asset: Asset) => (
                      <li key={asset.id} className="flex justify-between rounded-xl border border-border bg-surface p-2">
                        <span className="capitalize text-text">{asset.name || asset.kind}</span>
                        <span className="font-bold tabular-nums text-tone-text-good">{coinsOf(asset.value)}</span>
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