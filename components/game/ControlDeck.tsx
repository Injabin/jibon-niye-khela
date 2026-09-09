'use client';

import type { Tab } from './ActiveMenu';
import { Sparkles, User, Swords, Users, Coins, Settings, Download, Upload, RotateCcw } from 'lucide-react';

interface ControlDeckProps {
  hasCharacter: boolean;
  canAgeUp: boolean;
  onAgeUp: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenActions: (initialTab?: Tab) => void;
  onOpenFamilyTree: () => void;
  onOpenProfile: () => void;
}

export function ControlDeck({
  hasCharacter,
  canAgeUp,
  onAgeUp,
  onExport,
  onImportClick,
  onOpenSettings,
  onReset,
  onOpenActions,
  onOpenFamilyTree,
  onOpenProfile,
}: ControlDeckProps) {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-20 border-t border-white/[0.08] bg-zinc-950/90 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-xl px-3 py-2 flex flex-col gap-2">
        {/* Tactile Crimson Candy Button for Mobile */}
        {hasCharacter && (
          <button
            type="button"
            onClick={onAgeUp}
            disabled={!canAgeUp}
            data-testid="age-up"
            className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:brightness-110 border-b-4 border-b-primary-text active:border-b-0 active:translate-y-1 shadow-lg shadow-black/40 px-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Sparkles className="size-4" />
            <span>Age (+1 Year)</span>
          </button>
        )}

        {/* 4 Bottom Navigation Tabs */}
        <nav className="grid grid-cols-4 gap-1" aria-label="Controls">
          <button
            type="button"
            onClick={onOpenProfile}
            data-testid="deck-tab-profile"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            <User className="size-4" />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenActions('school')}
            data-testid="open-actions"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            <Swords className="size-4" />
            <span className="text-[10px] font-medium mt-1">Activities</span>
          </button>

          <button
            type="button"
            onClick={onOpenFamilyTree}
            data-testid="open-family-tree"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            <Users className="size-4" />
            <span className="text-[10px] font-medium mt-1">Relations</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenActions('assets')}
            data-testid="deck-tab-assets"
            disabled={!hasCharacter}
            className="flex flex-col items-center justify-center py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-40"
          >
            <Coins className="size-4" />
            <span className="text-[10px] font-medium mt-1">Assets</span>
          </button>
        </nav>

        {/* Secondary utilities bar */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-1.5 px-1 text-[11px]">
          <button
            type="button"
            onClick={onOpenSettings}
            data-testid="open-settings"
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Settings className="size-3" />
            <span>Settings</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExport}
              disabled={!hasCharacter}
              data-testid="export-save"
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40"
            >
              <Download className="size-3" />
              <span>Export</span>
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={onImportClick}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Upload className="size-3" />
              <span>Import</span>
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={onReset}
              disabled={!hasCharacter}
              data-testid="reset"
              className="flex items-center gap-1 text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}