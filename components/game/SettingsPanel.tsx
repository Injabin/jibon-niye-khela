'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { settingsStore } from '@/lib/store/settingsStore';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { Button } from '@/components/ui/Button';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  testId,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  testId: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span>
        <span className="block text-sm font-medium text-text">{label}</span>
        <span className="block text-xs text-text-muted">{hint}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          data-testid={testId}
        />
        <span className="h-6 w-11 rounded-full border border-border bg-border transition-colors peer-checked:bg-primary" />
        <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  testId: string;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-xs tabular-nums text-text-muted">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="w-full accent-primary"
        data-testid={testId}
        aria-label={label}
      />
    </div>
  );
}

/**
 * Settings panel (init.md M3 #4): sound/music toggles + volumes and the
 * reduced-motion preference that follows the OS by default.
 */
export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const sfxEnabled = settingsStore((s) => s.sfxEnabled);
  const musicEnabled = settingsStore((s) => s.musicEnabled);
  const sfxVolume = settingsStore((s) => s.sfxVolume);
  const musicVolume = settingsStore((s) => s.musicVolume);
  const reducedMotion = settingsStore((s) => s.reducedMotion);
  const setSfxEnabled = settingsStore((s) => s.setSfxEnabled);
  const setMusicEnabled = settingsStore((s) => s.setMusicEnabled);
  const setSfxVolume = settingsStore((s) => s.setSfxVolume);
  const setMusicVolume = settingsStore((s) => s.setMusicVolume);
  const setReducedMotionMode = settingsStore((s) => s.setReducedMotionMode);

  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.micro }}
            onClick={onClose}
            data-testid="settings-backdrop"
          />
          <motion.aside
            ref={overlayRef as React.Ref<HTMLElement>}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto border-l border-border bg-surface p-5 shadow-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: motionTokens.quick, ease: 'easeOut' }}
            data-testid="settings-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onKeyDown={trapKeyDown}
            tabIndex={-1}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-text">Settings</h2>
              <Button variant="secondary" onClick={onClose} data-testid="close-settings">
                Close
              </Button>
            </div>

            <SwitchRow
              label="Sound effects"
              hint="Clicks, stat ticks and event cues"
              checked={sfxEnabled}
              onChange={setSfxEnabled}
              testId="settings-sfx-toggle"
            />
            <SwitchRow
              label="Music"
              hint="Ambient mood tracks per life stage"
              checked={musicEnabled}
              onChange={setMusicEnabled}
              testId="settings-music-toggle"
            />
            <SliderRow
              label="Effects volume"
              value={sfxVolume}
              onChange={setSfxVolume}
              testId="settings-sfx-volume"
            />
            <SliderRow
              label="Music volume"
              value={musicVolume}
              onChange={setMusicVolume}
              testId="settings-music-volume"
            />

            <div className="mt-4 border-t border-border pt-3">
              <span className="text-sm font-medium text-text">Reduce motion</span>
              <Fieldset label="Motion level">
                {(
                  [
                    ['system', 'Follow device'],
                    ['reduced', 'Reduced'],
                    ['full', 'Full'],
                  ] as const
                ).map(([mode, label]) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50"
                  >
                    <input
                      type="radio"
                      name="reduced-motion-mode"
                      value={mode}
                      checked={reducedMotion === mode}
                      onChange={() => setReducedMotionMode(mode)}
                      className="accent-primary"
                      data-testid={`settings-motion-${mode}`}
                    />
                    {label}
                  </label>
                ))}
              </Fieldset>
              <SystemMotionHint mode={reducedMotion} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Fieldset({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-1 flex flex-col gap-1.5">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

function SystemMotionHint({ mode }: { mode: string }) {
  if (mode !== 'system') return null;
  return (
    <p className="mt-2 text-xs text-text-muted" data-testid="settings-system-motion-hint">
      Currently following your device&apos;s reduced-motion setting.
    </p>
  );
}