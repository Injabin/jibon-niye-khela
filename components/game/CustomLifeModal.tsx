'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Dice5, Sparkles, X, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { MALE_NAMES, FEMALE_NAMES, SURNAMES } from '@/lib/engine/romance';
import type { Gender, WealthTier } from '@/lib/engine/types';

const SELECTABLE_TRAITS: { id: string; label: string; desc: string }[] = [
  { id: 'athletic', label: 'Athletic', desc: 'Higher physical stamina & sports affinity' },
  { id: 'bookworm', label: 'Bookworm', desc: 'Fast reader with natural academic focus' },
  { id: 'creative', label: 'Creative', desc: 'Thrives in music, writing, and arts' },
  { id: 'charismatic', label: 'Charismatic', desc: 'Magnetic charm in conversations & romance' },
  { id: 'resilient', label: 'Resilient', desc: 'Bounces back stronger from hardship' },
  { id: 'ambitious', label: 'Ambitious', desc: 'Driven to conquer leadership & career heights' },
];

const WEALTH_TIERS: { id: WealthTier; title: string; subtitle: string; bonus: string }[] = [
  { id: 'poor', title: 'Humble Beginnings', subtitle: 'Modest upbringing, built on grit', bonus: 'High Karma & Grit' },
  { id: 'middle', title: 'Middle Class', subtitle: 'Comfortable family, balanced footing', bonus: 'Balanced Foundation' },
  { id: 'wealthy', title: 'High Society', subtitle: 'Family fortune & early financial safety net', bonus: 'Substantial Savings' },
];

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
  const [name, setName] = useState('Anika');
  const [surname, setSurname] = useState('Rahman');
  const [birthYear, setBirthYear] = useState(2000);
  const [wealthTier, setWealthTier] = useState<WealthTier>('middle');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['creative']);

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
      name: name.trim() || 'Protagonist',
      surname: surname.trim() || 'Roy',
      gender,
      birthYear,
      wealthTier,
      startingTraits: selectedTraits,
    });
    onStarted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro }}
          onClick={onClose}
          data-testid="custom-life-backdrop"
        >
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            className="relative flex h-full max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/80 backdrop-blur-2xl"
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
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 id="custom-life-title" className="text-base font-bold tracking-tight text-white">
                    Custom Life Creator
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <ShieldCheck className="size-3.5" />
                    <span>100% Free · No Paywalls</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
              {/* Gender Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Identity & Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['female', 'male', 'non-binary'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-xl px-3 py-2.5 text-xs font-medium capitalize border transition-all ${
                        gender === g
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold'
                          : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Surname with Randomize Dice */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Character Name
                  </label>
                  <button
                    type="button"
                    onClick={randomizeName}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Dice5 className="size-3.5" />
                    <span>Randomize</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      aria-label="First Name"
                      placeholder="First Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="custom-name-input"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      aria-label="Surname"
                      placeholder="Surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      data-testid="custom-surname-input"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Birth Year */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Birth Year
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1980}
                    max={2026}
                    value={birthYear}
                    onChange={(e) => setBirthYear(parseInt(e.target.value, 10) || 2000)}
                    className="w-32 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-zinc-500">
                    Era simulation will adjust starting tech & historical calendar
                  </span>
                </div>
              </div>

              {/* Wealth Tier */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Starting Wealth Background
                </label>
                <div className="space-y-2">
                  {WEALTH_TIERS.map((tier) => {
                    const isSelected = wealthTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setWealthTier(tier.id)}
                        className={`w-full flex items-center justify-between rounded-xl p-3.5 border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                            : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">{tier.title}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{tier.subtitle}</div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {tier.bonus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Starting Traits (up to 2) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Starting Traits ({selectedTraits.length}/2)
                  </label>
                  <span className="text-[11px] text-zinc-500">Pick up to 2 distinct traits</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SELECTABLE_TRAITS.map((trait) => {
                    const isPicked = selectedTraits.includes(trait.id);
                    return (
                      <button
                        key={trait.id}
                        type="button"
                        onClick={() => toggleTrait(trait.id)}
                        className={`flex flex-col items-start rounded-xl p-3 border text-left transition-all ${
                          isPicked
                            ? 'border-emerald-500 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">{trait.label}</span>
                          {isPicked && <Check className="size-3.5 text-emerald-400" />}
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                          {trait.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] bg-white/[0.02] px-6 py-4">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleStart}
                data-testid="start-custom-life-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-2.5 text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Sparkles className="size-3.5" />
                <span>Begin Custom Life</span>
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
