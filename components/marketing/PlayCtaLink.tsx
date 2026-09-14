'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Landing "start the game" CTA (Gate 3 sound discipline + Gate 6 perf).
 *
 * The cue fires on the very first user interaction (the click), satisfying
 * "no audio before first interaction", and `soundManager` is lazy-loaded so
 * the audio module never enters the landing page's initial JS payload.
 */
export function PlayCtaLink({
  href,
  testId,
  className,
  children,
}: {
  href: string;
  testId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={className}
      onClick={() => {
        void import('@/lib/audio/SoundManager').then(({ soundManager }) =>
          soundManager.play('button_press'),
        );
      }}
    >
      {children}
    </Link>
  );
}