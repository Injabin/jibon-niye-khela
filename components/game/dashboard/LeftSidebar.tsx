'use client';

import { rankForLife } from '@/lib/ui/rank';
import { formatMoney } from '@/lib/ui/money';
import type { Character } from '@/lib/engine/types';
import { Avatar } from '@/components/avatar/Avatar';
import { StatBar } from './StatBar';
import {
  User,
  Swords,
  Coins,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Heart,
  Activity,
  Flame,
  Car,
  Landmark,
} from 'lucide-react';
import type { Tab } from '../ActiveMenu';
import { Settings as SettingsIcon, Download, Upload, RotateCcw, Keyboard } from 'lucide-react';
import { useLayoutTier } from '@/lib/hooks/useLayoutTier';

interface LeftSidebarProps {
  character: Character | null;
  onOpenProfile: () => void;
  onOpenActions: (tab?: Tab) => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  onExport?: () => void;
  onImportClick?: () => void;
  onReset?: () => void;
}

export function LeftSidebar({
  character,
  onOpenProfile,
  onOpenActions,
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onImportClick,
  onReset,
}: LeftSidebarProps) {
  // Desktop already exposes settings through the RightRail; this link shows
  // only on tablet so a single `open-settings` control exists per viewport.
  // (Mobile uses the ControlDeck.)
  const showRailLinks = useLayoutTier() === 'tablet';
  if (!character) {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl border border-border bg-surface-raised/40 p-5">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface-raised/70 text-text-muted mb-3">
            <User className="size-6" />
          </div>
          <p className="text-sm font-medium text-text">কোনো জীবন চলতাছে না</p>
          <p className="text-xs text-text-muted mt-1">উপরে গিয়া যাত্রা শুরু কইরা জীবন গুছাও!</p>
        </div>
      </div>
    );
  }

  return (
    <aside
      className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-overlay"
      aria-label="চরিত্র আর নিয়ন্ত্রণ"
    >
      <div className="flex flex-col gap-2.5 pb-4">
        {/* Profile Card with Full Prominent Avatar Display */}
        <div
          className="flex flex-col items-center px-3 py-2.5 rounded-2xl bg-surface-raised/50 border border-border"
          data-testid="character-summary"
        >
          {/* Avatar Hero Frame — Centered, uncropped, fully visible */}
          <div
            className="h-20 w-20 flex items-center justify-center overflow-visible"
          >
            <Avatar character={character} className="h-full w-full object-contain" />
          </div>

          <div className="text-center mt-1.5 w-full">
            <h2 className="truncate text-base font-bold text-text tracking-tight">
              {character.name} {character.surname}
            </h2>
            <p className="text-[11px] font-medium text-text-muted truncate">
              {rankForLife(character)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="text-xs font-semibold tabular-nums text-text">
                {character.age} <span className="text-[10px] font-normal text-text-muted">বছর বয়স</span>
              </span>
              <span className="text-text-muted text-xs">•</span>
              <div className="flex items-center gap-1" data-testid="money">
                <Coins className="size-3 text-wealth" />
                <span className="text-xs font-bold tabular-nums text-wealth-text">
                  ৳{formatMoney(character.money)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Rounded-Full Stat Progress Bars */}
        <div className="flex flex-col gap-1.5">
          <StatBar label="স্বাস্থ্য" value={character.stats.health} statKey="health" />
          <StatBar label="সুখ" value={character.stats.happiness} statKey="happiness" />
          <StatBar label="বুদ্ধি" value={character.stats.smarts} statKey="smarts" />
          <StatBar label="চেহারা" value={character.stats.looks} statKey="looks" />
        </div>

        {/* Minimal Vertical Navigation with smooth transition hover states */}
        <nav className="flex flex-col gap-1.5 border-t border-border pt-2" aria-label="নেভিগেশন">
          <button
            type="button"
            onClick={onOpenProfile}
            data-testid="deck-tab-profile"
            className="flex items-center justify-between rounded-xl px-3 py-1 text-xs font-medium text-text hover:text-text hover:bg-surface-raised active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
          >
            <div className="flex items-center gap-2.5">
              <User className="size-4 text-text-muted" />
              <span>জীবনবৃত্তান্ত (প্রোফাইল)</span>
            </div>
            <ChevronRight className="size-3.5 text-text-muted" />
          </button>

          {/* কাজকর্ম ও ব্যস্ততা Section & Options */}
          <div className="space-y-2 overflow-hidden rounded-2xl border border-border bg-surface-raised/40 p-3 pb-2.5">
            <button
              type="button"
              onClick={() => onOpenActions(character.age >= 18 ? 'career' : 'school')}
              data-testid="open-actions"
              className="flex w-full items-center justify-between gap-2 text-xs font-semibold text-text hover:text-primary-text transition-colors focus-visible:outline-none"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Swords className="size-4 shrink-0 text-primary-text" />
                <span className="truncate">কাজকর্ম ও ব্যস্ততা</span>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-text-muted" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenActions('school')}
                data-testid="left-tab-school"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <GraduationCap className="size-3 shrink-0 text-tone-text-neutral" />
                <span className="truncate">পড়াশোনা</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenActions('career')}
                data-testid="left-tab-career"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <Briefcase className="size-3 shrink-0 text-tone-text-good" />
                <span className="truncate">চাকরি ও রুজি</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenActions('romance')}
                data-testid="left-tab-romance"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <Heart className="size-3 shrink-0 text-primary-text" />
                <span className="truncate">প্রেম-ভালোবাসা</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenActions('health')}
                data-testid="left-tab-health"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <Activity className="size-3 shrink-0 text-tone-text-good" />
                <span className="truncate">স্বাস্থ্য ও জিম</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenActions('crime')}
                data-testid="left-tab-crime"
                className="col-span-2 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <Flame className="size-3 shrink-0 text-tone-text-bad" />
                  <span className="truncate">ধান্ধাবাজি (অপরাধ)</span>
                </div>
                {character.age < 10 && (
                  <span className="shrink-0 text-[9px] text-text-muted font-normal">১০ বছর বয়স লাগবো</span>
                )}
              </button>
            </div>
          </div>

          {/* সম্পদ ও ট্যাকা-পয়সা Section & Options */}
          <div className="space-y-2 overflow-hidden rounded-2xl border border-border bg-surface-raised/40 p-3 pb-2.5">
            <button
              type="button"
              onClick={() => onOpenActions('assets')}
              data-testid="deck-tab-assets"
              className="flex w-full items-center justify-between gap-2 text-xs font-semibold text-text hover:text-wealth-text transition-colors focus-visible:outline-none"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Coins className="size-4 shrink-0 text-wealth" />
                <span className="truncate">সম্পদ ও ট্যাকা-পয়সা</span>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-text-muted" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenActions('assets')}
                data-testid="left-tab-assets-buy"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <Car className="size-3 shrink-0 text-tone-text-good" />
                <span className="truncate">গাড়ি, বাড়ি ও সোনা</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenActions('assets')}
                data-testid="left-tab-assets-bank"
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/50 px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-raised active:scale-[0.98] transition-all text-left"
              >
                <Landmark className="size-3 shrink-0 text-tone-text-neutral" />
                <span className="truncate">ব্যাংক ও লোন</span>
              </button>
            </div>
          </div>

{showRailLinks && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              data-testid="open-settings"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
            >
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="size-4 text-text-muted" />
                <span>সেটিংস</span>
              </div>
              <ChevronRight className="size-3.5 text-text-muted" />
            </button>
          )}

          {(onOpenShortcuts || onExport || onImportClick || onReset) && (
            <div className="flex items-center gap-1 px-3 pt-0.5">
              {onOpenShortcuts && (
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  data-testid="open-shortcuts"
                  title="কিবোর্ড শর্টকাট (?)"
                  aria-label="কিবোর্ড শর্টকাট"
                  className="flex size-7 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
                >
                  <Keyboard className="size-3.5" />
                </button>
              )}

              {onExport && (
                <button
                  type="button"
                  onClick={onExport}
                  data-testid="export-save"
                  title="সেভ নামাইয়া নাও"
                  aria-label="সেভ নামাইয়া নাও"
                  className="flex size-7 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
                >
                  <Download className="size-3.5" />
                </button>
              )}

              {onImportClick && (
                <button
                  type="button"
                  onClick={onImportClick}
                  title="সেভ ঢুকাইয়া দাও"
                  aria-label="সেভ ঢুকাইয়া দাও"
                  className="flex size-7 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-text"
                >
                  <Upload className="size-3.5" />
                </button>
              )}

              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  data-testid="reset"
                  title="খেলা রিসেট করো"
                  aria-label="খেলা রিসেট করো"
                  className="flex size-7 items-center justify-center rounded-lg text-text-muted hover:text-danger-text hover:bg-danger/10 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger-text"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}