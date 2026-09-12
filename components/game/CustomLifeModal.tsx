'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Dice5, Sparkles, X, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { MALE_NAMES, FEMALE_NAMES, SURNAMES } from '@/lib/engine/romance';
import type { AvatarHair, AvatarOutfit, Gender, WealthTier } from '@/lib/engine/types';
import {
  CUSTOM_LIFE_HAIR_SWATCHES,
  CUSTOM_LIFE_OUTFIT_SWATCHES,
} from '@/lib/avatar/palette';

const SELECTABLE_TRAITS: { id: string; label: string; desc: string }[] = [
  { id: 'athletic', label: 'ব্যায়ামবীর ও তেজি', desc: 'শারীরিক শক্তি, দম ও খেলাধুলায় সেরা' },
  { id: 'bookworm', label: 'পড়ুয়া পোকা', desc: 'বইয়ের পোকা, ক্লাসে ফার্স্ট হওয়ার স্বভাব' },
  { id: 'creative', label: 'শিল্পী ও কারিগর', desc: 'গান, নকশা আর আঁকাআঁকিতে হাত পাকা' },
  { id: 'charismatic', label: 'কথার জাদুকর', desc: 'মুখের মিষ্টি কথায় মহল্লা মাত, প্রেমেও ওস্তাদ' },
  { id: 'resilient', label: 'লড়াকু হিম্মত', desc: 'মাইঙ্কা চিপায় পড়লেও ঘুরে দাঁড়ানোর খাঁটি জোর' },
  { id: 'ambitious', label: 'উচ্চাকাঙ্ক্ষী', desc: 'বড় কারবারি বা মহল্লার মাথা হওয়ার স্বপ্ন' },
];

const WEALTH_TIERS: { id: WealthTier; title: string; subtitle: string; bonus: string }[] = [
  { id: 'poor', title: 'গরিবের সংসার', subtitle: 'কষ্টের দিনকাল, হাড়ে হাড়ে খাঁটি সংগ্রাম', bonus: 'বেশি কর্ম ও হিম্মত' },
  { id: 'middle', title: 'মধ্যবিত্ত পরিবার', subtitle: 'নুন আনতে পান্তা ফুরায় না, মোটামুটি স্বস্তি', bonus: 'ভারসাম্যপূর্ণ সূচনা' },
  { id: 'wealthy', title: 'বনেদি নবাব পরিবার', subtitle: 'খানদানি রূপার চামচ, অঢেল ট্যাকা-পয়সা', bonus: 'ভরা সিন্দুক' },
];

const HAIR_CHOICES: { id: AvatarHair; label: string }[] = [
  { id: 'cocoa', label: 'কোকো' },
  { id: 'midnight', label: 'কালো' },
  { id: 'chestnut', label: 'চেস্টনাট' },
  { id: 'silver', label: 'সিলভার' },
];

const OUTFIT_CHOICES: { id: AvatarOutfit; label: string }[] = [
  { id: 'sunshine', label: 'রোদ্দুর' },
  { id: 'mint', label: 'পুদিনা' },
  { id: 'lavender', label: 'ল্যাভেন্ডার' },
  { id: 'coral', label: 'কোরাল' },
];

const field =
  'w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const unselected =
  'border border-border bg-surface-raised/60 text-text hover:bg-surface-raised';

const selected = 'border-primary/60 bg-primary/15 text-text font-semibold';

export function CustomLifeModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted?: () => void;
}) {
  const newCustomGame = useGameStore((s) => s.newCustomGame);
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  const [gender, setGender] = useState<Gender>('female');
  const [name, setName] = useState('আনিকা');
  const [surname, setSurname] = useState('চৌধুরী');
  const [birthYear, setBirthYear] = useState(2000);
  const [wealthTier, setWealthTier] = useState<WealthTier>('middle');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['creative']);
  const [hair, setHair] = useState<AvatarHair>('cocoa');
  const [outfit, setOutfit] = useState<AvatarOutfit>('sunshine');

  const randomizeName = () => {
    const pool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
    const pickedName = pool[Math.floor(Math.random() * pool.length)];
    const pickedSurname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    setName(pickedName);
    setSurname(pickedSurname);
  };

  const toggleTrait = (traitId: string) => {
    if (selectedTraits.includes(traitId)) {
      setSelectedTraits(selectedTraits.filter((t) => t !== traitId));
    } else {
      if (selectedTraits.length < 2) {
        setSelectedTraits([...selectedTraits, traitId]);
      } else {
        // Swap second trait
        setSelectedTraits([selectedTraits[0], traitId]);
      }
    }
  };

  const handleStart = () => {
    newCustomGame({
      name: name.trim() || 'জীবন',
      surname: surname.trim() || 'মিয়া',
      gender,
      birthYear,
      wealthTier,
      startingTraits: selectedTraits,
      appearance: { hair, outfit },
    });
    onStarted?.();
    onClose();
  };

  const GENDER_LABELS: Record<Gender, string> = {
    female: 'মেয়ে',
    male: 'ছেলে',
  };

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
          data-testid="custom-life-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-surface text-text shadow-2xl backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            data-testid="custom-life-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-life-title"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary-text border border-primary/20">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 id="custom-life-title" className="text-base font-bold tracking-tight text-text">
                    কাস্টম জীবন বানাও
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-tone-text-good">
                    <ShieldCheck className="size-3.5" />
                    <span>১০০% মাগনা · কোনো খরচ নাই</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করো"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 custom-scrollbar">
              {/* Gender Picker */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  পরিচয় ও লিঙ্গ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['female', 'male'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-xl px-3 py-2.5 text-xs font-medium border transition-all ${
                        gender === g ? selected : unselected
                      }`}
                    >
                      {GENDER_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Surname with Randomize Dice */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    চরিত্রের নাম
                  </label>
                  <button
                    type="button"
                    onClick={randomizeName}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-text transition-colors hover:text-text"
                  >
                    <Dice5 className="size-3.5" />
                    <span>এলোমেলো নাম</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      aria-label="প্রথম নাম"
                      placeholder="নাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="custom-name-input"
                      className={field}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      aria-label="পদবি"
                      placeholder="পদবি / বংশনাম"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      data-testid="custom-surname-input"
                      className={field}
                    />
                  </div>
                </div>
              </div>

              {/* Birth Year */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  জন্ম সাল
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1980}
                    max={2026}
                    value={birthYear}
                    onChange={(e) => setBirthYear(parseInt(e.target.value, 10) || 2000)}
                    className={`${field} w-32`}
                  />
                  <span className="text-xs text-text-muted">
                    যুগের পরিবর্তনের সাথে সাথে টেকনোলজি ও চালচলন বদলাবে
                  </span>
                </div>
              </div>

              {/* Wealth Tier */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  পারিবারিক আর্থিক অবস্থা
                </label>
                <div className="space-y-2">
                  {WEALTH_TIERS.map((tier) => {
                    const isSelected = wealthTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setWealthTier(tier.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-primary/60 bg-primary/10 text-text'
                            : unselected
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-text">{tier.title}</div>
                          <div className="mt-0.5 text-xs text-text-muted">{tier.subtitle}</div>
                        </div>
                        <span className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-text">
                          {tier.bonus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar customization */}
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-text">চেহারার সাজ</p>
                  <p className="mt-1 text-xs text-text-muted">চুল আর জামার রং পছন্দ করো।</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-text-muted">চুল</p>
                  <div className="grid grid-cols-4 gap-2">
                    {HAIR_CHOICES.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setHair(choice.id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition ${
                          hair === choice.id
                            ? 'border-primary bg-primary/15 text-primary-text'
                            : 'border-border bg-surface text-text-muted hover:bg-surface-raised'
                        }`}
                        data-testid={`custom-hair-${choice.id}`}
                      >
                        <span
                          className="size-7 rounded-full border-2 border-border"
                          style={{ backgroundColor: CUSTOM_LIFE_HAIR_SWATCHES[choice.id] }}
                        />
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-text-muted">জামা</p>
                  <div className="grid grid-cols-4 gap-2">
                    {OUTFIT_CHOICES.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setOutfit(choice.id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition ${
                          outfit === choice.id
                            ? 'border-primary bg-primary/15 text-primary-text'
                            : 'border-border bg-surface text-text-muted hover:bg-surface-raised'
                        }`}
                        data-testid={`custom-outfit-${choice.id}`}
                      >
                        <span
                          className="size-7 rounded-xl border-2 border-border"
                          style={{ backgroundColor: CUSTOM_LIFE_OUTFIT_SWATCHES[choice.id] }}
                        />
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Starting Traits (up to 2) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    শুরুর স্বভাব ও গুণ ({selectedTraits.length}/২)
                  </label>
                  <span className="text-[11px] text-text-muted">পছন্দের যেকোনো ২টি গুণ বেছে নাও</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SELECTABLE_TRAITS.map((trait) => {
                    const isPicked = selectedTraits.includes(trait.id);
                    return (
                      <button
                        key={trait.id}
                        type="button"
                        onClick={() => toggleTrait(trait.id)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isPicked ? selected : unselected
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-bold text-text">{trait.label}</span>
                          {isPicked && <Check className="size-3.5 text-primary-text" />}
                        </div>
                        <span className="mt-1 text-[11px] leading-tight text-text-muted line-clamp-2">
                          {trait.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-surface px-6 py-4">
              <Button variant="secondary" onClick={onClose}>
                বাতিল
              </Button>
              <Button variant="primary" onClick={handleStart} data-testid="start-custom-life-btn">
                <Sparkles className="size-3.5" />
                নতুন জীবন শুরু করো
              </Button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}