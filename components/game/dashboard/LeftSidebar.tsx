'use client';

import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import type { Character } from '@/lib/engine/types';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './StatBar';
import {
  Sparkles,
  User,
  Swords,
  Users,
  Coins,
  Settings,
  Download,
  Upload,
  RotateCcw,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import type { Tab } from '../ActiveMenu';

interface LeftSidebarProps {
  character: Character | null;
  canAgeUp: boolean;
  onAgeUp: () => void;
  onOpenProfile: () => void;
  onOpenActions: (tab?: Tab) => void;
  onOpenFamilyTree: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onReset: () => void;
}

export function LeftSidebar({
  character,
  canAgeUp,
  onAgeUp,
  onOpenProfile,
  onOpenActions,
  onOpenFamilyTree,
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onImportClick,
  onReset,
}: LeftSidebarProps) {
  if (!character) {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 mb-3">
            <User className="size-6" />
          </div>
          <p className="text-sm font-medium text-zinc-300">কোনো জীবন চলতাছে না</p>
          <p className="text-xs text-zinc-400 mt-1">উপরে গিয়া যাত্রা শুরু কইরা জীবন গুছাও!</p>
        </div>
      </div>
    );
  }

  return (
    <aside
      className="flex h-full flex-col justify-between rounded-3xl border border-white/[0.06] bg-zinc-900/90 p-5 backdrop-blur-xl shadow-xl shadow-black/20"
      aria-label="চরিত্র আর নিয়ন্ত্রণ"
    >
      <div className="flex flex-col gap-4">
        {/* Profile Card with Full Prominent Avatar Display */}
        <div
          className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          data-testid="character-summary"
        >
          {/* Avatar Hero Frame — Centered, uncropped, fully visible */}
          <div
            className="h-28 w-28 flex items-center justify-center overflow-visible"
          >
            <Avatar character={character} className="h-full w-full object-contain" />
          </div>

          <div className="text-center mt-2 w-full">
            <h2 className="truncate text-base font-bold text-white tracking-tight">
              {character.name} {character.surname}
            </h2>
            <p className="text-[11px] font-medium text-zinc-400 truncate">
              {rankForLife(character)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs font-semibold tabular-nums text-zinc-200">
                {character.age} <span className="text-[10px] font-normal text-zinc-400">বছর বয়স</span>
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <div className="flex items-center gap-1" data-testid="money">
                <Coins className="size-3 text-amber-400" />
                <span className="text-xs font-bold tabular-nums text-amber-300">
                  ৳{formatMoney(character.money)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Rounded-Full Stat Progress Bars */}
        <div className="flex flex-col gap-2.5 py-0.5">
          <StatBar label="স্বাস্থ্য" value={character.stats.health} statKey="health" />
          <StatBar label="সুখ" value={character.stats.happiness} statKey="happiness" />
          <StatBar label="বুদ্ধি" value={character.stats.smarts} statKey="smarts" />
          <StatBar label="চেহারা" value={character.stats.looks} statKey="looks" />
        </div>

        {/* Tactile 3D Candy Button — Restored Classic Crimson Palette */}
        <button
          type="button"
          onClick={onAgeUp}
          disabled={!canAgeUp}
          data-testid="age-up"
          className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 shadow-lg shadow-rose-950/40 px-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Sparkles className="size-4" />
          <span>বয়স বাড়াও (+১ বছর)</span>
        </button>

        {/* Minimal Vertical Navigation with smooth transition hover states */}
        <nav className="flex flex-col gap-1 border-t border-white/[0.06] pt-3" aria-label="নেভিগেশন">
          <span className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            কাজকর্ম ও জীবনধারা
          </span>
          <button
            type="button"
            onClick={onOpenProfile}
            data-testid="deck-tab-profile"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <div className="flex items-center gap-2.5">
              <User className="size-4 text-zinc-400" />
              <span>জীবনবৃত্তান্ত (প্রোফাইল)</span>
            </div>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => onOpenActions('school')}
            data-testid="open-actions"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <div className="flex items-center gap-2.5">
              <Swords className="size-4 text-zinc-400" />
              <span>কাজকর্ম ও ব্যস্ততা</span>
            </div>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={onOpenFamilyTree}
            data-testid="open-family-tree"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <div className="flex items-center gap-2.5">
              <Users className="size-4 text-zinc-400" />
              <span>পরিবার ও আত্মীয়স্বজন</span>
            </div>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => onOpenActions('assets')}
            data-testid="deck-tab-assets"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <div className="flex items-center gap-2.5">
              <Coins className="size-4 text-zinc-400" />
              <span>সম্পদ ও ট্যাকা-পয়সা</span>
            </div>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>
        </nav>
      </div>

      {/* Utilities & Settings Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 mt-3 text-xs">
        <button
          type="button"
          onClick={onOpenSettings}
          data-testid="open-settings"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-text-muted hover:text-text hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
        >
          <Settings className="size-3.5" />
          <span>সেটিংস</span>
        </button>

        <div className="flex items-center gap-1">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              data-testid="open-shortcuts"
              title="কিবোর্ড শর্টকাট (?)"
              aria-label="কিবোর্ড শর্টকাট"
              className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
            >
              <Keyboard className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onExport}
            data-testid="export-save"
            title="সেভ নামাইয়া নাও"
            aria-label="সেভ নামাইয়া নাও"
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <Download className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onImportClick}
            title="সেভ ঢুকাইয়া দাও"
            aria-label="সেভ ঢুকাইয়া দাও"
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <Upload className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onReset}
            data-testid="reset"
            title="খেলা রিসেট করো"
            aria-label="খেলা রিসেট করো"
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
