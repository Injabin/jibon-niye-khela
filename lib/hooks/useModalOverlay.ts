'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableIn(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Modal-overlay keyboard support (init.md M6 #1 a11y pass):
 *  - while `active`, focus moves into the panel and is trapped inside it,
 *  - Tab wraps between the first and last focusable in the panel,
 *  - Escape closes the overlay,
 *  - on close, focus returns to the element that opened it.
 *
 * Attach the returned `ref` and `onKeyDown` to the panel element. `active` is
 * the source of truth (the AnimatePresence branches in SettingsPanel /
 * ActiveMenu stay mounted, so presence is not enough to infer openness).
 */
export function useModalOverlay(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    returnFocus.current = document.activeElement as HTMLElement | null;

    const panel = ref.current;
    if (panel) {
      const first = focusableIn(panel)[0];
      (first ?? panel).focus();
    } else if (returnFocus.current) {
      returnFocus.current.focus();
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    const restoreFocus = () => returnFocus.current?.focus?.();

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      restoreFocus();
    };
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const panel = ref.current;
    if (!panel) return;
    const focusables = focusableIn(panel);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeEl = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (activeEl === first || !panel.contains(activeEl)) {
        event.preventDefault();
        last.focus();
      }
    } else if (activeEl === last || !panel.contains(activeEl)) {
      event.preventDefault();
      first.focus();
    }
  };

  return { ref, onKeyDown };
}