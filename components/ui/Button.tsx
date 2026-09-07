'use client';

import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { soundManager } from '@/lib/audio/SoundManager';
import { hapticForSfx } from '@/lib/haptics';
import { motion as motionTokens } from '@/lib/theme';

/**
 * Restrict the spread to props Framer Motion does not reinterpret; the
 * omitted handlers (drag/animation callbacks) have a different signature in
 * HTMLMotionProps.
 */
type SafeButtonAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onAnimationCancel'
  | 'onDrop'
  | 'onDragStart'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
>;

interface ButtonProps extends SafeButtonAttributes {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

/**
 * Shared button (AGENT.md §8 micro tier): a quick press-down scale + the
 * `button_press` SFX + haptic on every activation. Both are suppressed when
 * disabled; reduced-motion users get instant, static buttons via MotionConfig.
 */
export function Button({ variant = 'primary', children, className = '', onClick, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white hover:opacity-90'
      : variant === 'secondary'
        ? 'border border-border bg-surface text-text hover:bg-surface-raised'
        : 'border border-danger/40 bg-transparent text-danger hover:bg-danger/10';

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!rest.disabled) {
      soundManager.play('button_press');
      hapticForSfx('button_press');
    }
    onClick?.(event);
  };

  return (
    <motion.button
      type="button"
      className={`${base} ${styles} ${className}`}
      whileTap={rest.disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: motionTokens.micro, ease: 'easeOut' }}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </motion.button>
  );
}