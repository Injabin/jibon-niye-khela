/**
 * Shared lazy Lottie entry point.
 *
 * Every consumer (avatar expression overlay, moment srings) imports THIS
 * component rather than `lottie-react` directly, so there is exactly one
 * async chunk holding lottie-web and it is only requested after the first
 * sting/expression actually needs to play (Gate 4 lazy-load evidence).
 */

'use client';

import dynamic from 'next/dynamic';

export const LottieMotion = dynamic(() => import('./LottiePlayer').then((m) => m.LottiePlayer), {
  ssr: false,
  loading: () => null,
});