'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Play, Sliders, Download, LogOut, Pause, Keyboard } from 'lucide-react';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onExport: () => void;
  onQuitToLanding: () => void;
}

export function PauseMenu({
  open,
  onResume,
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onQuitToLanding,
}: PauseMenuProps) {
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onResume);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
        >
          {/* Darkened backdrop freezing underlying interactions */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            data-testid="pause-backdrop"
            aria-hidden="true"
            onClick={onResume}
          />

          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            role="dialog"
            aria-modal="true"
            aria-label="Game Paused"
            tabIndex={-1}
            onKeyDown={trapKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            data-testid="pause-menu"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Pause className="size-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Game Paused
              </h2>
              <p className="mt-1 text-xs text-zinc-400 font-normal">
                All timers and progression are on hold.
              </p>
            </div>

            {/* Actions Menu */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                data-testid="pause-resume"
                className="group flex w-full items-center justify-between rounded-xl bg-[#b23a3b] hover:bg-[#c44344] border-b-2 border-b-[#7a1c1d] active:border-b-0 active:translate-y-0.5 px-4 py-3.5 text-sm font-semibold text-white transition-all shadow-md shadow-rose-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <div className="flex items-center gap-3">
                  <Play className="size-4 fill-current" />
                  <span>Resume</span>
                </div>
                <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-rose-200">
                  Esc
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                data-testid="pause-settings"
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-200 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="size-4 text-zinc-400" />
                  <span>Settings</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenShortcuts}
                data-testid="pause-shortcuts"
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-200 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <div className="flex items-center gap-3">
                  <Keyboard className="size-4 text-zinc-400" />
                  <span>Keyboard Shortcuts</span>
                </div>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                  ?
                </span>
              </button>

              <button
                type="button"
                onClick={onExport}
                data-testid="pause-export"
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-200 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <div className="flex items-center gap-3">
                  <Download className="size-4 text-zinc-400" />
                  <span>Export Save</span>
                </div>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                type="button"
                onClick={onQuitToLanding}
                data-testid="pause-quit"
                className="flex w-full items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-3 text-sm font-medium text-rose-300 hover:text-rose-200 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="size-4 text-rose-400" />
                  <span>Quit to Landing</span>
                </div>
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
