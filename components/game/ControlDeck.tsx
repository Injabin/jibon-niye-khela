'use client';

import { useEffect, useRef, useState } from 'react';
import type { Tab } from './ActiveMenu';
import {
  Sparkles,
  User,
  Swords,
  Users,
  Sliders,
  Settings,
  Download,
  Upload,
  Keyboard,
  MoreHorizontal,
} from 'lucide-react';

interface ControlDeckProps {
  hasCharacter: boolean;
  canAgeUp: boolean;
  isGeneratingEvent?: boolean;
  onAgeUp: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
  onOpenActions: (initialTab?: Tab) => void;
  onOpenProfile: () => void;
  onOpenRelations: () => void;
  onStartFreshLife: () => void;
  onOpenCustomLife: () => void;
}

export function ControlDeck({
  hasCharacter,
  canAgeUp,
  isGeneratingEvent,
  onAgeUp,
  onExport,
  onImportClick,
  onOpenSettings,
  onOpenShortcuts,
  onOpenActions,
  onOpenProfile,
  onOpenRelations,
  onStartFreshLife,
  onOpenCustomLife,
}: ControlDeckProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the overflow menu on any tap outside it. Document-level (not a
  // fixed backdrop): the footer's backdrop-blur makes it the containing block
  // for fixed descendants, so an inset-0 backdrop would only cover the deck
  // strip instead of the viewport.
  useEffect(() => {
    if (!overflowOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOverflowOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [overflowOpen]);

  const run = (callback: () => void) => {
    setOverflowOpen(false);
    callback();
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-surface/95 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-xl px-3 py-2 flex flex-col gap-2">
        {/* Tactile Primary Candy Button for Mobile */}
        {hasCharacter && (
          <button
            type="button"
            onClick={onAgeUp}
            disabled={!canAgeUp}
            aria-busy={isGeneratingEvent}
            data-testid="age-up"
            className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:brightness-110 border-b-4 border-b-primary-text active:border-b-0 active:translate-y-1 shadow-lg shadow-primary/25 px-4 text-xs font-bold uppercase tracking-widest text-on-primary transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text"
          >
            {isGeneratingEvent ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                <span>ভাবছে…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>বয়স (+১ বছর)</span>
              </>
            )}
          </button>
        )}

        {/* 4 Bottom Navigation Tabs */}
        <nav className="relative grid grid-cols-4 gap-1" aria-label="নিয়ন্ত্রণ">
          <button
            type="button"
            onClick={onOpenProfile}
            data-testid="deck-tab-profile"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-all disabled:opacity-40"
          >
            <User className="size-4" />
            <span className="text-[10px] font-medium mt-1">প্রোফাইল</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenActions('school')}
            data-testid="open-actions"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-all disabled:opacity-40"
          >
            <Swords className="size-4" />
            <span className="text-[10px] font-medium mt-1">কাজকর্ম</span>
          </button>

          <button
            type="button"
            onClick={onOpenRelations}
            data-testid="deck-tab-relatives"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-all disabled:opacity-40"
          >
            <Users className="size-4" />
            <span className="text-[10px] font-medium mt-1">আত্মীয়স্বজন</span>
          </button>

          {/* ⋯ trigger: the whole deck collapses here — new/custom life,
              settings, shortcuts, save and load all live in this one menu so
              the four tabs stay perfectly clean (nothing sits below them). */}
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            data-testid="deck-more"
            ref={triggerRef}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-all"
          >
            <MoreHorizontal className="size-4" />
            <span className="text-[10px] font-medium mt-1">আরও</span>
          </button>

          {overflowOpen && (
            <div
              role="menu"
              aria-label="আরও বিকল্প"
              data-testid="deck-more-menu"
              ref={menuRef}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOverflowOpen(false); triggerRef.current?.focus(); } }}
              className="absolute bottom-full right-0 z-40 mb-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl shadow-black/20"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onStartFreshLife)}
                data-testid="deck-new-life"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors"
              >
                <Sparkles className="size-3.5" />
                <span>নতুন জীবন</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onOpenCustomLife)}
                data-testid="deck-custom-life"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors"
              >
                <Sliders className="size-3.5" />
                <span>নিজের মতো</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onOpenSettings)}
                data-testid="deck-open-settings"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors"
              >
                <Settings className="size-3.5" />
                <span>সেটিংস</span>
              </button>
              {onOpenShortcuts && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => run(onOpenShortcuts)}
                  data-testid="deck-open-shortcuts"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors"
                >
                  <Keyboard className="size-3.5" />
                  <span>শর্টকাট</span>
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onExport)}
                disabled={!hasCharacter}
                data-testid="export-save"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors disabled:opacity-40"
              >
                <Download className="size-3.5" />
                <span>সেভ</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onImportClick)}
                data-testid="deck-import-save"
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-xs font-semibold text-text hover:bg-surface-raised hover:text-text transition-colors"
              >
                <Upload className="size-3.5" />
                <span>লোড</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </footer>
  );
}