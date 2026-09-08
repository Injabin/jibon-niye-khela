'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import type { MusicStageId, SfxEvent } from '@/lib/audio/manifest';
import { lifeStageForAge } from '@/lib/engine/life';
import { eligibleHeirs } from '@/lib/engine/legacy';
import type { Character, LifeEventDef } from '@/lib/engine/types';
import { hapticForSfx } from '@/lib/haptics';
import { useGameStore } from '@/lib/store/gameStore';
import { motion as motionTokens } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { MomentSting } from '@/components/motion/MomentSting';
import { ActiveMenu, type Tab } from './ActiveMenu';
import { ChronicleStream } from './ChronicleStream';
import { ControlDeck } from './ControlDeck';
import { EventCard } from './EventCard';
import { HeirOffer } from './HeirOffer';
import { LifeSummary } from './LifeSummary';
import { ProfileSheet } from './ProfileSheet';
import { SettingsPanel } from './SettingsPanel';
import { StickyHeader } from './StickyHeader';

// Lazy-loaded with the rest of the graph chunk so the family tree (with Framer
// Motion) never touches the initial payload (TESTING.md Gate 4 budget).
const FamilyTreeView = dynamic(() => import('@/components/family/FamilyTreeView').then((m) => m.FamilyTreeView), {
  ssr: false,
  loading: () => null,
});

interface Snapshot {
  alive: boolean;
  age: number;
  stage: string;
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
  funny: 'neutral_event',
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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function playCue(event: SfxEvent) {
    if (!soundManager.soundEnabled) return;
    soundManager.play(event);
    hapticForSfx(event);
  }

  // DESIGN.md §6.5 — sound as feedback: every meaningful state change has a
  // distinct cue (life-stage transition, each stat/money move, death).
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
      soundManager.startMusic(snapshotOf(character).stage as MusicStageId);
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
      soundManager.startMusic(next.stage as MusicStageId);
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
    return <p className="py-12 text-center text-text-muted">Loading your life…</p>;
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
    // A milestone moment carries its own stronger sting cue; plain events use
    // the per-tone feedback cue (DESIGN.md §6.5).
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

  const noCharacter = !character;
  const dead = character && !character.alive && pendingEvents.length === 0;
  const currentEvent = pendingEvents.length > 0 ? pendingEvents[currentEventIndex] : null;
  const heirs = dead ? eligibleHeirs(character, familyTree) : [];
  const canAgeUp = Boolean(character && character.alive && pendingEvents.length === 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <h1 className="sr-only">Jibon Niye Khela — a life you play</h1>

      {character && <StickyHeader character={character} />}

      <main className="flex-1">
        <div className="px-4 pt-3">
          {message && (
            <p className="mb-3 border border-border bg-surface px-3 py-2 text-sm text-text" data-testid="message">
              {message}
            </p>
          )}
          {error && (
            <p
              className="mb-3 border border-danger-border bg-danger/10 px-3 py-2 text-sm text-danger-text"
              data-testid="error"
            >
              {error}
            </p>
          )}
        </div>

        {noCharacter && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            className="m-4 border border-border bg-surface p-6 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-text">A new life awaits</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
              Be born, grow up, make choices, and see how the story ends — one year at a time.
            </p>
            <Button
              onClick={() => newGame()}
              data-testid="new-game"
              className="mt-6 px-8 py-3 text-base"
            >
              Start life
            </Button>
          </motion.section>
        )}

        {character && character.alive && <ChronicleStream history={character.history} />}

        {character && character.alive && (
          <AnimatePresence>
            {currentEvent && (
              <EventCard key={currentEvent.id} event={currentEvent} onChoose={(choiceId) => onChoose(currentEvent, choiceId)} />
            )}
          </AnimatePresence>
        )}

        {dead && (
          <div className="px-4 py-4">
            <LifeSummary character={character} />
            <HeirOffer heirs={heirs} onContinue={continueAsHeir} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => newGame()} data-testid="new-life">
                Start a new life
              </Button>
              <Button variant="secondary" onClick={resetGame}>
                Forget this life
              </Button>
            </div>
          </div>
        )}
      </main>

      <ControlDeck
        hasCharacter={Boolean(character)}
        canAgeUp={canAgeUp}
        onAgeUp={onAgeUp}
        onExport={onExport}
        onImportClick={() => fileInputRef.current?.click()}
        importInputRef={fileInputRef}
        onImportFile={onImportFile}
        onOpenSettings={() => setSettingsOpen(true)}
        onReset={resetGame}
        onOpenActions={openActions}
        onOpenFamilyTree={() => setFamilyTreeOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

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