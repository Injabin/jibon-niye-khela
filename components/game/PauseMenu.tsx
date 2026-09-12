'use client';

import { Play, Sliders, Download, LogOut, Pause, Keyboard } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onExport: () => void;
  onQuitToLanding: () => void;
}

const row =
  'group flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-raised px-4 py-3 text-sm font-medium text-text transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function PauseMenu({
  open,
  onResume,
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onQuitToLanding,
}: PauseMenuProps) {
  return (
    <ModalOverlay
      open={open}
      onClose={onResume}
      id="pause"
      title="খেলা থামাইয়া রাখা হইছে"
      subtitle="হিসাব-নিকাশ আর বয়স বাড়া, সব কিছুই থেমে আছে।"
      icon={<Pause className="size-6" />}
      maxWidth="max-w-sm"
      scrollable={false}
      dataTestId="pause-menu"
    >
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onResume}
          data-testid="pause-resume"
          className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-3">
            <Play className="size-4 fill-current" />
            <span>চালাইয়া যাও</span>
          </div>
          <span className="rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] font-mono text-on-primary/80">
            Esc
          </span>
        </button>

        <button type="button" onClick={onOpenSettings} data-testid="pause-settings" className={row}>
          <div className="flex items-center gap-3">
            <Sliders className="size-4 text-text-muted" />
            <span>সেটিংস</span>
          </div>
        </button>

        <button type="button" onClick={onOpenShortcuts} data-testid="pause-shortcuts" className={row}>
          <div className="flex items-center gap-3">
            <Keyboard className="size-4 text-text-muted" />
            <span>কিবোর্ড শর্টকাট</span>
          </div>
          <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            ?
          </span>
        </button>

        <button type="button" onClick={onExport} data-testid="pause-export" className={row}>
          <div className="flex items-center gap-3">
            <Download className="size-4 text-text-muted" />
            <span>সেভ নামাইয়া নাও</span>
          </div>
        </button>

        <div className="my-1 border-t border-border" />

        <button
          type="button"
          onClick={onQuitToLanding}
          data-testid="pause-quit"
          className="flex w-full items-center justify-between rounded-xl border border-danger-border bg-danger/10 hover:bg-danger/20 px-4 py-3 text-sm font-medium text-danger-text transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-text"
        >
          <div className="flex items-center gap-3">
            <LogOut className="size-4 text-danger-text" />
            <span>প্রথম পর্দায় ফিরে যাও</span>
          </div>
        </button>
      </div>
    </ModalOverlay>
  );
}