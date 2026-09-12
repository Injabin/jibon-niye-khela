'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLayoutTier } from '@/lib/hooks/useLayoutTier';
import { soundManager } from '@/lib/audio/SoundManager';
import { musicArcForAge, type MusicArcId, type SfxEvent } from '@/lib/audio/manifest';
import { lifeStageForAge } from '@/lib/engine/life';
import { eligibleHeirs } from '@/lib/engine/legacy';
import type { Character, LifeEventDef } from '@/lib/engine/types';
import { hapticForSfx } from '@/lib/haptics';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { MomentSting } from '@/components/motion/MomentSting';
import { ActiveMenu, type Tab } from './ActiveMenu';
import { ControlDeck } from './ControlDeck';
import { HeirOffer } from './HeirOffer';
import { LifeSummary } from './LifeSummary';
import { ProfileSheet } from './ProfileSheet';
import { SettingsPanel } from './SettingsPanel';
import { StickyHeader } from './StickyHeader';
import { CustomLifeModal } from './CustomLifeModal';
import { PauseMenu } from './PauseMenu';
import { ShortcutsModal } from './ShortcutsModal';

import { LeftSidebar } from './dashboard/LeftSidebar';
import { RightRail } from './dashboard/RightRail';
import { TimelineStream } from './dashboard/TimelineStream';
import { EventCard } from './dashboard/EventCard';
import { Sparkles, AlertCircle, Sliders, Settings, ThumbsDown, X } from 'lucide-react';

const FamilyTreeView = dynamic(() => import('@/components/family/FamilyTreeView').then((m) => m.FamilyTreeView), {
  ssr: false,
  loading: () => null,
});

interface Snapshot {
  alive: boolean;
  age: number;
  stage: string;
  arc: MusicArcId;
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
  money: number;
}

function snapshotOf(character: Character): Snapshot {
  return {
    alive: character.alive,
    age: character.age,
    stage: lifeStageForAge(character.age),
    arc: musicArcForAge(character.age),
    health: character.stats.health,
    happiness: character.stats.happiness,
    smarts: character.stats.smarts,
    looks: character.stats.looks,
    money: character.money,
  };
}

const toneCue: Record<LifeEventDef['tone'], SfxEvent> = {
  good: 'good_event',
  bad: 'bad_event',
  neutral: 'neutral_event',
  funny: 'funny_event',
};

const STAGE_HINT: Record<ReturnType<typeof lifeStageForAge>, { label: string; hint: string }> = {
  infant: { label: 'শিশুকাল', hint: 'আম্মা-আব্বার যত্নে বড়ো হও' },
  child: { label: 'ছেলেবেলা', hint: 'স্কুলে ভর্তি হইয়া পড়ালেখায় মন দাও' },
  teen: { label: 'কৈশোর', hint: 'রেজাল্ট ভালো করো, পাক্কা বন্ধু গড়ো' },
  'young-adult': { label: 'তরুণ বয়স', hint: 'পড়াশোনা, চাকরি কিংবা ব্যবসা — যেভাবে পারো আগায়া যাও' },
  adult: { label: 'যৌবন', hint: 'সংসার, কারবার আর খাতির-পাতির পাল্লা সামলাও' },
  'middle-aged': { label: 'মধ্যবয়স', hint: 'সম্পদ গছাও, বাচ্চাদের ভবিষ্যতের ফিকির করো' },
  senior: { label: 'বার্ধক্য', hint: 'শরীর সামলাও — গতরে গতরে গল্প জমাইয়া রাখো' },
};

export function GameHub() {
  const character = useGameStore((s) => s.character);
  const familyTree = useGameStore((s) => s.familyTree);
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const currentEventIndex = useGameStore((s) => s.currentEventIndex);
  const isHydrated = useGameStore((s) => s.isHydrated);
  const message = useGameStore((s) => s.message);
  const rejection = useGameStore((s) => s.rejection);
  const error = useGameStore((s) => s.error);
  const pendingSting = useGameStore((s) => s.pendingSting);
  const stingToken = useGameStore((s) => s.stingToken);

  const hydrate = useGameStore((s) => s.hydrate);
  const newGame = useGameStore((s) => s.newGame);
  const ageUpAsync = useGameStore((s) => s.ageUpAsync);
  const isGeneratingEvent = useGameStore((s) => s.isGeneratingEvent);
  const resolveCurrentChoice = useGameStore((s) => s.resolveCurrentChoice);
  const exportToJson = useGameStore((s) => s.exportToJson);
  const importFromRaw = useGameStore((s) => s.importFromRaw);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearRejection = useGameStore((s) => s.clearRejection);
  const continueAsHeir = useGameStore((s) => s.continueAsHeir);
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsTab, setActionsTab] = useState<Tab>('school');
  const [profileOpen, setProfileOpen] = useState(false);
  const [customLifeOpen, setCustomLifeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [familyTreeOpen, setFamilyTreeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSnapshot = useRef<Snapshot | null>(null);
  const deathPlayed = useRef(false);
  const layoutTier = useLayoutTier();
  const router = useRouter();
  const paramsHandled = useRef(false);
  const isMobile = layoutTier === 'mobile';
  const isTablet = layoutTier === 'tablet';
  const isDesktop = layoutTier === 'desktop';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function playCue(event: SfxEvent) {
    if (!soundManager.soundEnabled) return;
    soundManager.play(event);
    hapticForSfx(event);
  }

  useEffect(() => {
    if (!character) {
      prevSnapshot.current = null;
      deathPlayed.current = false;
      soundManager.stopMusic();
      return;
    }

    const prev = prevSnapshot.current;
    if (!prev) {
      prevSnapshot.current = snapshotOf(character);
      soundManager.startMusic(snapshotOf(character).arc);
      return;
    }

    if (prev.alive && !character.alive) {
      if (!deathPlayed.current) {
        deathPlayed.current = true;
        playCue('death');
      }
      prevSnapshot.current = snapshotOf(character);
      return;
    }
    if (!prev.alive) return;

    const next = snapshotOf(character);
    if (next.stage !== prev.stage) {
      playCue('life_stage_change');
    }
    if (next.arc !== prev.arc) {
      soundManager.startMusic(next.arc);
    }

    if (next.health < prev.health) playCue('stat_down');
    else if (next.health > prev.health) playCue('stat_up');
    if (next.happiness < prev.happiness) playCue('stat_down');
    else if (next.happiness > prev.happiness) playCue('stat_up');
    if (next.smarts < prev.smarts) playCue('stat_down');
    else if (next.smarts > prev.smarts) playCue('stat_up');
    if (next.looks < prev.looks) playCue('stat_down');
    else if (next.looks > prev.looks) playCue('stat_up');

    if (next.money < prev.money) playCue('money_down');
    else if (next.money > prev.money) playCue('money_up');

    prevSnapshot.current = next;
  }, [character]);

  const onExport = () => {
    const json = exportToJson();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jibon-niye-khela-save.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => importFromRaw(String(reader.result ?? ''));
    reader.onerror = () => {
      useGameStore.setState({ error: 'ফাইলডা পড়া গেলো না মিয়া — ফরম্যাট ঠিক আছে তো?' });
    };
    reader.readAsText(file);
  };

  const onChoose = (event: LifeEventDef, choiceId: string) => {
    const applied = resolveCurrentChoice(choiceId);
    if (!applied) return;
    if (!event.moment) playCue(toneCue[event.tone]);
  };

  const onAgeUp = useCallback(async () => {
    const applied = await ageUpAsync();
    if (applied) {
      soundManager.play('age_up');
      hapticForSfx('age_up');
    }
  }, [ageUpAsync]);

  const openActions = (initialTab: Tab = 'school') => {
    setActionsTab(initialTab);
    setActionsOpen(true);
  };

  const startFreshLife = useCallback(() => {
    const seed = newGame();
    playCue('birth');
    return seed;
  }, [newGame]);

  const onContinueAsHeir = (heirId: string) => {
    if (continueAsHeir(heirId)) playCue('birth');
  };

  useEffect(() => {
    if (!isHydrated || paramsHandled.current) return;
    if (typeof window === 'undefined') return;
    paramsHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('start') === '1' && !character) {
      startFreshLife();
      router.replace('/play');
    } else if (params.get('custom') === '1') {
      setTimeout(() => setCustomLifeOpen(true), 0);
      router.replace('/play');
    }
  }, [isHydrated, character, startFreshLife, router]);

  const noCharacter = !character;
  const dead = Boolean(character && !character.alive && pendingEvents.length === 0);
  const currentEvent = pendingEvents.length > 0 ? pendingEvents[currentEventIndex] : null;
  const heirs = dead && character ? eligibleHeirs(character, familyTree) : [];
  const canAgeUp = Boolean(character && character.alive && pendingEvents.length === 0 && !isGeneratingEvent);

  // When any overlay is up, the dashboard panels behind it must stay fully
  // neutral + inactive: `inert` disables clicks, keyboard focus and :hover
  // highlights so stale focus/hover rings never bleed through the scrim.
  const anyOverlayOpen = Boolean(
    settingsOpen ||
      actionsOpen ||
      profileOpen ||
      customLifeOpen ||
      shortcutsOpen ||
      familyTreeOpen ||
      isPaused ||
      Boolean(currentEvent),
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Text input safety: do not fire game shortcuts if typing in any form input
      const target = document.activeElement as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) {
        // If typing in input, let normal keys (1-4, ?, Space) pass through.
        return;
      }

      // 2. Shortcuts modal toggle ('?' or 'Shift+/')
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // 3. Escape key handling (strict hierarchy):
      // - Close topmost open modal first
      // - If pause menu is open (isPaused), resume game
      // - If in active game with nothing open, open pause menu
      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          e.preventDefault();
          setShortcutsOpen(false);
          return;
        }
        if (settingsOpen) {
          e.preventDefault();
          setSettingsOpen(false);
          return;
        }
        if (customLifeOpen) {
          e.preventDefault();
          setCustomLifeOpen(false);
          return;
        }
        if (actionsOpen) {
          e.preventDefault();
          setActionsOpen(false);
          return;
        }
        if (profileOpen) {
          e.preventDefault();
          setProfileOpen(false);
          return;
        }

        if (isPaused) {
          e.preventDefault();
          setPaused(false);
          return;
        }

        if (character && character.alive) {
          e.preventDefault();
          setPaused(true);
          return;
        }
      }

      // 4. Space for primary action (Age Up when on dashboard and not in modal/paused/event)
      if (e.key === ' ' || e.key === 'Spacebar') {
        const isInteractiveFocused =
          target &&
          (target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.getAttribute('role') === 'button');

        // If focus is not on an interactive element, Space triggers primary action
        if (
          !isInteractiveFocused &&
          canAgeUp &&
          !isPaused &&
          !shortcutsOpen &&
          !settingsOpen &&
          !customLifeOpen &&
          !actionsOpen &&
          !profileOpen
        ) {
          e.preventDefault();
          onAgeUp();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    shortcutsOpen,
    settingsOpen,
    customLifeOpen,
    actionsOpen,
    profileOpen,
    isPaused,
    character,
    canAgeUp,
    setPaused,
    onAgeUp,
  ]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">দুনিয়া গুছানো হইতেছে…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-text selection:bg-primary/20 selection:text-primary-text font-sans">
      <h1 className="sr-only">জীবন নিয়ে খেলা — এক লাইফ সিমুলেশন</h1>

      {/* Ambient background glow accents for depth and specular reflection */}
      <div
        inert={anyOverlayOpen}
        aria-hidden={anyOverlayOpen || undefined}
        data-game-background="true"
      >
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 size-[650px] rounded-full bg-primary/[0.04] blur-[140px]" />
          <div className="absolute top-1/3 -right-20 size-[500px] rounded-full bg-secondary/[0.035] blur-[120px]" />
          <div className="absolute -bottom-40 left-1/3 size-[650px] rounded-full bg-accent/[0.03] blur-[140px]" />
        </div>
      </div>

      <AnimatePresence>
        {rejection && (
          <motion.div
            className="pointer-events-none fixed inset-x-3 top-3 z-[70] flex justify-center sm:inset-x-auto sm:right-5 sm:top-5"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
          >
            <div
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-danger-border bg-surface p-4 text-sm font-medium text-text shadow-overlay backdrop-blur-xl"
              role="alert"
              aria-live="assertive"
              data-testid="rejection-popup"
            >
              <ThumbsDown className="mt-0.5 size-5 shrink-0 text-danger-text" aria-hidden="true" />
              <p className="min-w-0 flex-1 leading-relaxed">{rejection}</p>
              <button
                type="button"
                onClick={clearRejection}
                data-testid="dismiss-rejection"
                className="shrink-0 rounded-lg p-1 text-danger-text transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-text"
                aria-label="রিজেকশনের বার্তা বন্ধ করো"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar on Mobile (< 768px) */}
      <div
        inert={anyOverlayOpen}
        aria-hidden={anyOverlayOpen || undefined}
        data-game-background="true"
      >
        {isMobile && character && (
          <div className="relative z-20">
            <StickyHeader character={character} compact />
          </div>
        )}

      {/* Main Layout:
          - Mobile (< 768px): 1-Column stack (tight side margins, pb-36)
          - Tablet (768px–1279px): 2-Column split (LeftSidebar col-span-5 : Chronicle col-span-7)
          - Desktop (≥ 1280px): 3-Region layout (LeftSidebar col-span-3 : Chronicle col-span-6 : RightRail col-span-3)
      */}
      <div className="relative z-10 mx-auto h-[100dvh] w-full max-w-[1700px] overflow-hidden px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:py-4 xl:px-8">
        <div
          className={`grid h-full min-h-0 items-stretch ${isMobile
            ? 'grid-cols-1'
            : isTablet
              ? 'grid-cols-12 gap-5'
              : 'grid-cols-12 gap-6'
            }`}
        >
          {/* Left Column (Sticky Sidebar): 5 cols on Tablet, 3 cols on Desktop */}
          {!isMobile && (
            <div
              className={`${isTablet ? 'col-span-5' : 'col-span-3'} sticky top-0 h-full min-h-0`}
            >
              <LeftSidebar
                character={character}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenActions={openActions}
                onOpenFamilyTree={() => setFamilyTreeOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenShortcuts={() => setShortcutsOpen(true)}
                onExport={onExport}
                onImportClick={() => fileInputRef.current?.click()}
                onReset={resetGame}
              />
            </div>
          )}

          {/* Center Column (Scrollable Event Timeline):
              - Mobile: full width, pb-36
              - Tablet: 7 cols, dedicated internal scroll container
              - Desktop: 6 cols, dedicated internal scroll container
          */}
          <main
            id="chronicle-scroll"
            className={`${isMobile
              ? 'pb-36'
              : isTablet
                ? 'col-span-7 h-full overflow-y-auto pr-2'
                : 'col-span-6 h-full overflow-y-auto pr-2'
              } flex flex-col min-h-0 scrollbar-none`}
          >
            {/* Life-stage Hub Row (gives the center column its own identity) */}
            {character && character.alive && !isMobile && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    জীবনের ধাপ
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-text">
                      {STAGE_HINT[lifeStageForAge(character.age)].label}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-text">
                      বয়স {character.age}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {STAGE_HINT[lifeStageForAge(character.age)].hint}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary-text sm:hidden">
                  বয়স {character.age}
                </span>
              </div>
            )}

            {/* Ambient Alerts / Feedback */}
            {message && (
              <div
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised/60 p-3.5 text-xs font-medium text-text shadow-sm"
                data-testid="message"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-danger-border bg-danger/10 p-3.5 text-xs font-medium text-danger-text shadow-sm"
                data-testid="error"
              >
                <AlertCircle className="size-4 text-danger-text shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Empty State / Start Journey Card */}
            {noCharacter && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
                className="my-auto flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-raised/50 p-8 sm:p-12 text-center shadow-overlay"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary-text mb-4">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                  নতুন জীবন শুরু করো
                </h2>
                <p className="mt-2 max-w-sm text-sm text-text-muted font-normal leading-relaxed">
                  সিদ্ধান্ত নিয়া, সম্পর্ক গড়ো, ভাগ্য গুছাও — আর দেখো জীবন কোন্ কোন্ অপ্রত্যাশিত মোড়ে ঘুইরা যায়!
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startFreshLife}
                    data-testid="new-game"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary hover:brightness-110 border-b-4 border-b-primary-text active:border-b-0 active:translate-y-1 shadow-lg shadow-primary/25 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-on-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text"
                  >
                    <Sparkles className="size-4" />
                    <span>যাত্রা শুরু করো</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomLifeOpen(true)}
                    data-testid="open-custom-life-btn"
                    className="inline-flex items-center gap-2 rounded-2xl border border-tone-good/30 bg-tone-good/10 hover:bg-tone-good/20 text-tone-text-good px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tone-text-good"
                  >
                    <Sliders className="size-4" />
                    <span>নিজের মতো জীবন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    data-testid="open-settings"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface hover:bg-surface-raised text-text px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text"
                  >
                    <Settings className="size-4" />
                    <span>সেটিংস</span>
                  </button>
                </div>
              </motion.section>
            )}

            {/* Timeline Stream */}
            {character && character.alive && (
              <TimelineStream
                history={character.history}
                scrollContainerId={isMobile ? undefined : 'chronicle-scroll'}
              />
            )}

            {/* Life Summary Screen on Death */}
            {dead && character && (
              <div className="flex flex-col gap-6 py-4">
                <LifeSummary character={character} />
                <HeirOffer heirs={heirs} onContinue={onContinueAsHeir} />
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startFreshLife}
                    data-testid="new-life"
                    className="rounded-2xl bg-primary hover:brightness-110 border-b-2 border-b-primary-text active:border-b-0 active:translate-y-0.5 shadow-md shadow-primary/25 px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-primary transition-all duration-150"
                  >
                    আবার নতুন জীবন শুরু করো
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomLifeOpen(true)}
                    data-testid="new-custom-life"
                    className="rounded-2xl border border-tone-good/30 bg-tone-good/10 hover:bg-tone-good/20 px-6 py-3 text-xs font-bold uppercase tracking-wider text-tone-text-good transition-all duration-150"
                  >
                    নিজের মতো জীবন
                  </button>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-xl border border-danger-border bg-danger/10 px-6 py-3 text-xs font-medium text-danger-text hover:bg-danger/20 transition-all"
                  >
                    রিসেট
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Age-Up Dock — anchored bottom-center of the center pane */}
            {character && character.alive && !isMobile && (
              <div className="sticky bottom-0 z-10 mt-auto flex justify-center rounded-t-2xl bg-background/85 px-2 pb-2 pt-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onAgeUp}
                  disabled={!canAgeUp}
                  data-testid="age-up"
                  className="group relative inline-flex h-11 w-auto items-center justify-center gap-2 rounded-2xl bg-primary hover:brightness-110 border-b-4 border-b-primary-text active:border-b-0 active:translate-y-1 shadow-lg shadow-primary/25 px-5 text-xs font-bold uppercase tracking-widest text-on-primary transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  <span>বয়স বাড়াও (+১ বছর)</span>
                </button>
              </div>
            )}
          </main>

          {/* Right Column (Secondary Stats Rail): 3 cols on Desktop */}
          {isDesktop && (
            <div className="relative z-40 col-span-3 sticky top-0 h-full min-h-0">
              <RightRail
                character={character}
                onOpenFamilyTree={() => setFamilyTreeOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenShortcuts={() => setShortcutsOpen(true)}
                onExport={onExport}
                onImport={() => fileInputRef.current?.click()}
                onReset={resetGame}
                onStartFreshLife={startFreshLife}
                onOpenCustomLife={() => setCustomLifeOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Control Deck (< 768px) */}
        {isMobile && (
          <ControlDeck
            hasCharacter={Boolean(character)}
            canAgeUp={canAgeUp}
            onAgeUp={onAgeUp}
            onExport={onExport}
            onImportClick={() => fileInputRef.current?.click()}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onReset={resetGame}
            onOpenActions={openActions}
            onOpenFamilyTree={() => setFamilyTreeOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
          />
        )}
      </div>

      {/* Interactive Dilemma / Event Card — rendered above the inert background so
          the wrapped dashboard stays fully inactive while a life question is open */}
      {character && character.alive && (
        <AnimatePresence>
          {currentEvent && (
            <EventCard
              key={currentEvent.id}
              event={currentEvent}
              onChoose={(choiceId) => onChoose(currentEvent, choiceId)}
            />
          )}
        </AnimatePresence>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        data-testid="import-save"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) onImportFile(file);
          e.currentTarget.value = '';
        }}
      />

      {/* Modals & Overlays */}
      {character && (
        <ProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          character={character}
          onOpenSettings={() => {
            setProfileOpen(false);
            setSettingsOpen(true);
          }}
          onOpenShortcuts={() => {
            setProfileOpen(false);
            setShortcutsOpen(true);
          }}
          onOpenCustomLife={() => {
            setProfileOpen(false);
            setCustomLifeOpen(true);
          }}
        />
      )}

      <CustomLifeModal
        open={customLifeOpen}
        onClose={() => setCustomLifeOpen(false)}
        onStarted={() => playCue('birth')}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ActiveMenu key={actionsTab} open={actionsOpen} onClose={() => setActionsOpen(false)} initialTab={actionsTab} />
      {familyTreeOpen && <FamilyTreeView open={familyTreeOpen} onClose={() => setFamilyTreeOpen(false)} />}
      <PauseMenu
        open={isPaused}
        onResume={() => setPaused(false)}
        onOpenSettings={() => {
          setPaused(false);
          setSettingsOpen(true);
        }}
        onOpenShortcuts={() => {
          setPaused(false);
          setShortcutsOpen(true);
        }}
        onExport={onExport}
        onQuitToLanding={() => {
          setPaused(false);
          resetGame();
          router.push('/');
        }}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MomentSting key={stingToken} kind={pendingSting} token={stingToken} />
    </div>
  );
}