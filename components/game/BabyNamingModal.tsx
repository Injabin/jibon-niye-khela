'use client';

import { useState } from 'react';
import { Baby } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store/gameStore';
import { MUSLIM_MALE_NAMES, MUSLIM_FEMALE_NAMES, HINDU_MALE_NAMES, HINDU_FEMALE_NAMES } from '@/content/names';
import type { Religion } from '@/lib/engine/types';

function nameSuggestions(religion: Religion, babyGender: 'male' | 'female'): string[] {
  const pool =
    religion === 'hinduism'
      ? babyGender === 'male'
        ? HINDU_MALE_NAMES
        : HINDU_FEMALE_NAMES
      : babyGender === 'male'
        ? MUSLIM_MALE_NAMES
        : MUSLIM_FEMALE_NAMES;
  return [...pool].slice(0, 4) as unknown as string[];
}

/**
 * Baby-naming modal (J): fires when age-up surfaces a due pregnancy. The
 * player picks/names the newborn in Dhakaiya Bangla; `nameBaby` then births
 * the child into the household. Several babies born the same year are named
 * one after another (each name removes its entry, so the next pending baby
 * slides into view). "পরে ঠিক করবো" dismisses the prompt and lets the
 * auto-name safety net settle it on the next age-up.
 */
export function BabyNamingModal() {
  const pendingBirths = useGameStore((s) => s.pendingBirths);
  const character = useGameStore((s) => s.character);
  const nameBaby = useGameStore((s) => s.nameBaby);

  const [draft, setDraft] = useState('');
  const [dismissedRelId, setDismissedRelId] = useState<string | null>(null);

  const current = pendingBirths[0];
  const open = !!current && !!character && current.partnerRelId !== dismissedRelId;

  if (!open || !current || !character) return null;

  const suggestions = nameSuggestions(character.religion, current.babyGender);
  const genderLabel = current.babyGender === 'male' ? 'ছেলে' : 'মেয়ে';

  const submit = (name: string) => {
    const finalName = name.trim() || suggestions[0];
    nameBaby(current.partnerRelId, finalName);
    setDraft('');
    setDismissedRelId(null);
  };

  return (
    <ModalOverlay
      open={open}
      onClose={() => undefined}
      id="baby-naming"
      title={`নামের ভূষি — ${genderLabel} সন্তান`}
      subtitle={`${current.partnerName}-এর কোল আলো কইরা ফুটফুটে ${genderLabel} আসতাছে — নামডা কি রাখবা?`}
      icon={<Baby className="size-6" />}
      maxWidth="max-w-md"
      scrollable={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDismissedRelId(current.partnerRelId)} className="text-xs">
            পরে ঠিক করবো
          </Button>
          <Button onClick={() => submit(draft)} className="text-xs">
            নাম রাখো
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-text transition-all hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid={`baby-name-suggest-${s}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(draft);
            }}
            placeholder="নতুন নাম লিখো…"
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            data-testid="baby-name-input"
          />
        </div>

        {pendingBirths.length > 1 && (
          <p className="text-xs text-text-muted">আরো জোড়া খবর আসতাছে — {pendingBirths.length}টা বাকি আছে</p>
        )}

        <p className="text-xs leading-relaxed text-text-muted">
          &quot;পরে ঠিক করবো&quot; কইলেও আমরা ঠিক করি, পরের বছরে ছাগলছানা নাম পাইয়া যাইবো!
        </p>
        <div className="pointer-events-none select-none text-center text-lg" aria-hidden="true">
          👶
        </div>
      </div>
    </ModalOverlay>
  );
}