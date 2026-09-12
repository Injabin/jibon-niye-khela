'use client';

import { useEffect, type ReactNode } from 'react';
import { settingsStore, type ThemeMode } from '@/lib/store/settingsStore';

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

/** Resolve 'system' to a concrete theme using the OS preference. */
export function resolveEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return typeof window !== 'undefined' && window.matchMedia(SYSTEM_DARK_QUERY).matches
    ? 'dark'
    : 'light';
}

/**
 * Cozy dark-mode provider (ui-ux-guide.md §2.3).
 *
 * Mirrors MotionProvider: the store holds the preference ('system' by
 * default), this provider resolves it to light/dark, syncs it onto
 * <html data-theme="…">, and keeps the OS preference live while the user
 * stays on 'system'. `app/layout.tsx` runs a tiny inline bootstrap script
 * before first paint so the persisted preference never causes a flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = settingsStore((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveEffectiveTheme(theme);
    };
    apply();

    if (theme !== 'system') return;

    const media = window.matchMedia(SYSTEM_DARK_QUERY);
    const onChange = () => apply();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return <>{children}</>;
}