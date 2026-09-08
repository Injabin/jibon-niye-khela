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
import { ActiveMenu } from './ActiveMenu';
import { CharacterSummary } from './CharacterSummary';
import { EventCard } from './EventCard';
import { HeirOffer } from './HeirOffer';
import { LifeSummary } from './LifeSummary';
import { SettingsPanel } from './SettingsPanel';

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

  const noCharacter = !character;
  const dead = character && !character.alive && pendingEvents.length === 0;
  const currentEvent = pendingEvents.length > 0 ? pendingEvents[currentEventIndex] : null;
  const heirs = dead ? eligibleHeirs(character, familyTree) : [];

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      {message && (
        <p className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text" data-testid="message">
          {message}
        </p>
      )}
      {error && (
        <p
          className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          data-testid="error"
        >
          {error}
        </p>
      )}

      {noCharacter && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
          className="rounded-lg border border-border bg-surface p-6 text-center shadow-sm"
        >
          <h1 className="text-2xl font-bold tracking-tight text-text">A new life awaits</h1>
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

      {character && character.alive && (
        <>
          <CharacterSummary character={character} />

          <Button
            variant="secondary"
            onClick={() => setFamilyTreeOpen(true)}
            data-testid="open-family-tree"
            className="mt-3 w-full px-4 py-2 text-sm"
          >
            Family tree
          </Button>

          <Button
            variant="secondary"
            onClick={() => setActionsOpen(true)}
            data-testid="open-actions"
            className="mt-2 w-full px-4 py-2 text-sm"
          >
            Life actions (school · career · assets · crime · health)
          </Button>

          <AnimatePresence initial={false}>
            {currentEvent && (
              <div className="mt-4" key={currentEvent.id}>
                <EventCard event={currentEvent} onChoose={(choiceId) => onChoose(currentEvent, choiceId)} />
              </div>
            )}
          </AnimatePresence>

          {character.alive && pendingEvents.length === 0 && (
            <Button
              onClick={onAgeUp}
              data-testid="age-up"
              className="mt-4 w-full px-4 py-4 text-base"
            >
              Age up
            </Button>
          )}

          {character.history.length > 1 && (
            <section className="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-text-muted">
                Recent life log
              </h2>
              <ul className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto text-sm">
                {character.history
                  .slice(-8)
                  .reverse()
                  .map((entry, index) => (
                    <li key={`${entry.age}-${index}`} className="text-text">
                      <span className="mr-2 font-medium text-text-muted">Age {entry.age}</span>
                      {entry.text}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}

      {dead && (
        <>
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
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={onExport} data-testid="export-save" disabled={noCharacter}>
          Export save
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          Import save
        </Button>
        <Button
          variant="secondary"
          onClick={() => setSettingsOpen(true)}
          data-testid="open-settings"
        >
          Settings
        </Button>
        <Button variant="danger" className="ml-auto" onClick={resetGame} disabled={noCharacter}>
          Reset
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          data-testid="import-save"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onImportFile(file);
            event.currentTarget.value = '';
          }}
        />
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ActiveMenu open={actionsOpen} onClose={() => setActionsOpen(false)} />

      {familyTreeOpen && (
        <FamilyTreeView open={familyTreeOpen} onClose={() => setFamilyTreeOpen(false)} />
      )}

      <MomentSting key={stingToken} kind={pendingSting} token={stingToken} />
    </div>
  );
}