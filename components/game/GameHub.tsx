'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/Button';
import { CharacterSummary } from './CharacterSummary';
import { EventCard } from './EventCard';
import { LifeSummary } from './LifeSummary';

export function GameHub() {
  const character = useGameStore((s) => s.character);
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const currentEventIndex = useGameStore((s) => s.currentEventIndex);
  const isHydrated = useGameStore((s) => s.isHydrated);
  const message = useGameStore((s) => s.message);
  const error = useGameStore((s) => s.error);

  const hydrate = useGameStore((s) => s.hydrate);
  const newGame = useGameStore((s) => s.newGame);
  const ageUp = useGameStore((s) => s.ageUp);
  const resolveCurrentChoice = useGameStore((s) => s.resolveCurrentChoice);
  const exportToJson = useGameStore((s) => s.exportToJson);
  const importFromRaw = useGameStore((s) => s.importFromRaw);
  const resetGame = useGameStore((s) => s.resetGame);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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

  const noCharacter = !character;
  const dead = character && !character.alive && pendingEvents.length === 0;

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
        <section className="rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
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
        </section>
      )}

      {character && character.alive && (
        <>
          <CharacterSummary character={character} />

          {pendingEvents.length > 0 && (
            <div className="mt-4">
              <EventCard
                event={pendingEvents[currentEventIndex]}
                onChoose={(choiceId) => resolveCurrentChoice(choiceId)}
              />
            </div>
          )}

          {character.alive && pendingEvents.length === 0 && (
            <button
              type="button"
              onClick={ageUp}
              data-testid="age-up"
              className="mt-4 w-full rounded-md bg-primary px-4 py-4 text-base font-semibold text-white transition-colors hover:opacity-90"
            >
              Age up
            </button>
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
    </div>
  );
}