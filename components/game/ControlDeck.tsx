'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { RefObject } from 'react';
import type { Tab } from './ActiveMenu';

/**
 * Control Deck / Sticky Footer (UI-DESIGN.md §2.4, bottom ~15%): the oversize
 * Age Up button above a four-tab bar (Profile / Activities / Relationships /
 * Assets), with the always-visible save/settings utility row pinned beneath.
 * Activities keeps the `open-actions` testid and opens the existing actions
 * sheet; Relationships keeps `open-family-tree`; Assets opens the same sheet
 * preselected on its Assets tab (no new systems — presentation only).
 */

interface ControlDeckProps {
  hasCharacter: boolean;
  canAgeUp: boolean;
  onAgeUp: () => void;
  onExport: () => void;
  onImportClick: () => void;
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportFile: (file: File) => void;
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
  importInputRef,
  onImportFile,
  onOpenSettings,
  onReset,
  onOpenActions,
  onOpenFamilyTree,
  onOpenProfile,
}: ControlDeckProps) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto w-full max-w-xl px-2">
        <div className="flex items-center gap-1 border-b border-border px-1 py-1.5">
          <Button
            variant="secondary"
            onClick={onOpenSettings}
            data-testid="open-settings"
            className="min-h-9 flex-1 px-2 text-xs"
          >
            Settings
          </Button>
          <Button
            variant="secondary"
            onClick={onExport}
            disabled={!hasCharacter}
            data-testid="export-save"
            className="min-h-9 flex-1 px-2 text-xs"
          >
            Export
          </Button>
          <Button variant="secondary" onClick={onImportClick} className="min-h-9 flex-1 px-2 text-xs">
            Import
          </Button>
          <Button
            variant="danger"
            onClick={onReset}
            disabled={!hasCharacter}
            data-testid="reset"
            className="min-h-9 flex-1 px-2 text-xs"
          >
            Reset
          </Button>
        </div>

        {hasCharacter && (
          <div className="px-1 py-2">
            <Button
              onClick={onAgeUp}
              disabled={!canAgeUp}
              data-testid="age-up"
              className="min-h-12 w-full px-4 text-sm uppercase tracking-[0.04em]"
            >
              <Icon name="sword" size={16} />
              Age (+1 year)
            </Button>
          </div>
        )}

        <nav className="grid grid-cols-4 border-t border-border" aria-label="Controls">
          <button
            type="button"
            onClick={onOpenProfile}
            data-testid="deck-tab-profile"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasCharacter}
          >
            <Icon name="shield" size={20} />
            <span className="text-[11px] font-medium">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenActions()}
            data-testid="open-actions"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasCharacter}
          >
            <Icon name="sword" size={20} />
            <span className="text-[11px] font-medium">Activities</span>
          </button>
          <button
            type="button"
            onClick={onOpenFamilyTree}
            data-testid="open-family-tree"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasCharacter}
          >
            <Icon name="heart" size={20} />
            <span className="text-[11px] font-medium">Relations</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenActions('assets')}
            data-testid="deck-tab-assets"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasCharacter}
          >
            <Icon name="coin" size={20} />
            <span className="text-[11px] font-medium">Assets</span>
          </button>
        </nav>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          data-testid="import-save"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onImportFile(file);
            event.currentTarget.value = '';
          }}
        />
      </div>
    </footer>
  );
}