'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { hapticForSfx } from '@/lib/haptics';
import { soundManager } from '@/lib/audio/SoundManager';

/**
 * A Next.js `<Link>` that plays the standard click cue on press before the
 * navigation proceeds. Keeps the surrounding page server-rendered (no client
 * boundary for the whole marketing page) while giving every primary CTA the
 * same instant feedback a `Button` already provides.
 */
export function SoundLink(props: ComponentProps<typeof Link>) {
  const { onClick, children, ...rest } = props;
  return (
    <Link
      {...rest}
      onClick={(event) => {
        soundManager.play('button_press');
        hapticForSfx('button_press');
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}