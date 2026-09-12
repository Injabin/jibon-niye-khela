'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion as motionTokens } from '@/lib/theme';
import { useModalOverlay } from '@/lib/hooks/useModalOverlay';
import { useEffectiveReducedMotion } from '@/lib/hooks/useEffectiveReducedMotion';

/**
 * Shared modal chrome (init.md M6 / UI-DESIGN §1.1): cozy token scrim,
 * unified rounded panel, header with branded icon tile, `×` close, Escape /
 * focus trap via useModalOverlay, reduced-motion aware. Every game overlay
 * (pauses, sheets, shortcuts, heir, family tree, custom life) renders through
 * this so the whole deck has one look.
 */
interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Stems test ids: `id`-backdrop, `id`-modal, `id`-close. */
  id: string;
  /** Override the dialog's `data-testid` (defaults to `${id}-modal`). */
  dataTestId?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  scrollable?: boolean;
}

export function ModalOverlay({
  open,
  onClose,
  id,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
  scrollable = true,
  dataTestId,
}: ModalOverlayProps) {
  const { ref: overlayRef, onKeyDown: trapKeyDown } = useModalOverlay(open, onClose);
  const reducedMotion = useEffectiveReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : motionTokens.micro, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0 bg-surface-overlay backdrop-blur-md pointer-events-auto"
            data-testid={`${id}-backdrop`}
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.section
            ref={overlayRef as React.Ref<HTMLElement>}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onKeyDown={trapKeyDown}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : motionTokens.quick, ease: 'easeOut' }}
            className={`relative w-full rounded-3xl border border-border bg-surface text-text shadow-2xl p-6 sm:p-8 pointer-events-auto flex flex-col gap-5 ${
              scrollable ? 'max-h-[85vh] overflow-y-auto' : ''
            } ${maxWidth}`}
            data-testid={dataTestId ?? `${id}-modal`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary-text">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-text">{title}</h2>
                  {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`${title} বন্ধ করো`}
                data-testid={`${id}-close`}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-raised hover:text-text transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-5" />
              </button>
            </div>

            {children}

            {footer && <div className="mt-1 pt-4 border-t border-border">{footer}</div>}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}