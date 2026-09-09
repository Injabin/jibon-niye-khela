'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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

import { LeftSidebar } from './dashboard/LeftSidebar';
import { RightRail } from './dashboard/RightRail';
import { TimelineStream } from './dashboard/TimelineStream';
import { EventCard } from './dashboard/EventCard';
import { Sparkles, AlertCircle } from 'lucide-react';

// Lazy-loaded family tree
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

export function GameHub() {
  const character = useGameStore((s) => s.character);
  const familyTree = useGameStore((s) => s.familyTree);
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const currentEventIndex = useGameStore((s) => s.currentEventIndex);
  const isHydrated = useGameStore((s) => s.isHydrated);
  const message = useGameStore((s) => s.message);
  const error = useGameStore((s) => s.error);
  const pendingSting = useGameStore((s) => s.pendingSting);
  const stingToken = useGameStore((s) => s.stingToken);

  const hydrate = useGameStore((s) => s.hydrate);
  const newGame = useGameStore((s) => s.newGame);
  const ageUp = useGameStore((s) => s.ageUp);
  const resolveCurrentChoice = useGameStore((s) => s.resolveCurrentChoice);
  const exportToJson = useGameStore((s) => s.exportToJson);
  const importFromRaw = useGameStore((s) => s.importFromRaw);
  const resetGame = useGameStore((s) => s.resetGame);
  const continueAsHeir = useGameStore((s) => s.continueAsHeir);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [familyTreeOpen, setFamilyTreeOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsTab, setActionsTab] = useState<Tab>('school');
  const [profileOpen, setProfileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSnapshot = useRef<Snapshot | null>(null);
  const deathPlayed = useRef(false);
  const layoutTier = useLayoutTier();
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

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium">Initializing state…</p>
        </div>
      </div>
    );
  }

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
      useGameStore.setState({ error: 'The file could not be read.' });
    };
    reader.readAsText(file);
  };

  const onChoose = (event: LifeEventDef, choiceId: string) => {
    const applied = resolveCurrentChoice(choiceId);
    if (!applied) return;
    if (!event.moment) playCue(toneCue[event.tone]);
  };

  const onAgeUp = () => {
    const applied = ageUp();
    if (applied) {
      soundManager.play('age_up');
      hapticForSfx('age_up');
    }
  };

  const openActions = (initialTab: Tab = 'school') => {
    setActionsTab(initialTab);
    setActionsOpen(true);
  };

  const startFreshLife = () => {
    const seed = newGame();
    playCue('birth');
    return seed;
  };

  const onContinueAsHeir = (heirId: string) => {
    if (continueAsHeir(heirId)) playCue('birth');
  };

  const noCharacter = !character;
  const dead = character && !character.alive && pendingEvents.length === 0;
  const currentEvent = pendingEvents.length > 0 ? pendingEvents[currentEventIndex] : null;
  const heirs = dead ? eligibleHeirs(character, familyTree) : [];
  const canAgeUp = Boolean(character && character.alive && pendingEvents.length === 0);

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-200 font-sans">
      <h1 className="sr-only">Jibon Niye Khela — A Life Simulation</h1>

      {/* Ambient background glow accents for depth and specular reflection */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 size-[650px] rounded-full bg-emerald-500/[0.035] blur-[140px]" />
        <div className="absolute top-1/3 -right-20 size-[500px] rounded-full bg-teal-500/[0.025] blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 size-[650px] rounded-full bg-sky-500/[0.02] blur-[140px]" />
      </div>

      {/* Top bar on Mobile (< 768px) */}
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
      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-3 sm:px-4 md:px-6 xl:px-8 py-3 sm:py-4 lg:py-6">
        <div
          className={`grid items-start ${
            isMobile
              ? 'grid-cols-1'
              : isTablet
                ? 'grid-cols-12 gap-5'
                : 'grid-cols-12 gap-6'
          }`}
        >
          {/* Left Column (Sticky Sidebar): 5 cols on Tablet, 3 cols on Desktop */}
          {!isMobile && (
            <div
              className={`${
                isTablet ? 'col-span-5' : 'col-span-3'
              } sticky top-6 h-[calc(100vh-3rem)]`}
            >
              <LeftSidebar
                character={character}
                canAgeUp={canAgeUp}
                onAgeUp={onAgeUp}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenActions={openActions}
                onOpenFamilyTree={() => setFamilyTreeOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
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
            className={`${
              isMobile
                ? 'pb-36'
                : isTablet
                  ? 'col-span-7 h-[calc(100vh-3rem)] overflow-y-auto pr-2'
                  : 'col-span-6 h-[calc(100vh-3rem)] overflow-y-auto pr-2'
            } flex flex-col min-h-0 scrollbar-none`}
          >
            {/* Ambient Alerts / Feedback */}
            {message && (
              <div
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md text-xs font-medium text-zinc-200 shadow-sm"
                data-testid="message"
              >
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 backdrop-blur-md text-xs font-medium text-rose-300 shadow-sm"
                data-testid="error"
              >
                <AlertCircle className="size-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Empty State / Start Journey Card */}
            {noCharacter && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
                className="my-auto flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Begin a New Life
                </h2>
                <p className="mt-2 max-w-sm text-sm text-zinc-400 font-normal leading-relaxed">
                  Make decisions, nurture relationships, build fortunes, and navigate unpredictable twists.
                </p>
                <button
                  type="button"
                  onClick={startFreshLife}
                  data-testid="new-game"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-4 border-b-[#7a1c1d] active:border-b-0 active:translate-y-1 shadow-lg shadow-rose-950/40 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <Sparkles className="size-4" />
                  <span>Start Journey</span>
                </button>
              </motion.section>
            )}

            {/* Timeline Stream */}
            {character && character.alive && (
              <TimelineStream
                history={character.history}
                scrollContainerId={isMobile ? undefined : 'chronicle-scroll'}
              />
            )}

            {/* Interactive Dilemma / Event Card */}
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

            {/* Life Summary Screen on Death */}
            {dead && (
              <div className="flex flex-col gap-6 py-4">
                <LifeSummary character={character} />
                <HeirOffer heirs={heirs} onContinue={onContinueAsHeir} />
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startFreshLife}
                    data-testid="new-life"
                    className="rounded-2xl bg-[#b23a3b] hover:bg-[#c44344] border-b-2 border-b-[#7a1c1d] active:border-b-0 active:translate-y-0.5 shadow-md shadow-rose-950/40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-150"
                  >
                    Start a new life
                  </button>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Right Column (Secondary Stats & Relationships Rail): 3 cols on Desktop */}
          {isDesktop && (
            <div className="col-span-3 sticky top-6 h-[calc(100vh-3rem)]">
              <RightRail
                character={character}
                onOpenFamilyTree={() => setFamilyTreeOpen(true)}
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
          onReset={resetGame}
          onOpenActions={openActions}
          onOpenFamilyTree={() => setFamilyTreeOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />
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
          onOpenFamilyTree={() => {
            setProfileOpen(false);
            setFamilyTreeOpen(true);
          }}
        />
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ActiveMenu key={actionsTab} open={actionsOpen} onClose={() => setActionsOpen(false)} initialTab={actionsTab} />
      {familyTreeOpen && <FamilyTreeView open={familyTreeOpen} onClose={() => setFamilyTreeOpen(false)} />}
      <MomentSting key={stingToken} kind={pendingSting} token={stingToken} />
    </div>
  );
}