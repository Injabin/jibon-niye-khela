/**
 * Lottie player (M4). Dynamically imported via `next/dynamic` (see
 * `dynamicLottie.ts`) so `lottie-web` never enters the initial JS payload
 * (Gate 4). Animation JSON is fetched at runtime from `/public/animations`
 * and cached per path, so the assets also stay out of the bundle.
 *
 * NOTE: this repo pins `lottie-react@3`, whose API differs from v2: pass the
 * parsed animation as `src`, and listen for "complete" via `subscriptions`.
 *
 * Performance budget (init.md M4 #5, AGENT.md §7): at most one expression and
 * one sting play at a time by construction — `ExpressionOverlay` and
 * `MomentSting` each render a single instance and auto-hide, and the asset
 * JSONs are lean. Any on-screen animation is paused when the tab goes hidden
 * (below) so it never keeps burning CPU/battery off-screen.
 */

'use client';

import { Lottie, type LottieHandle } from 'lottie-react';
import { useEffect, useRef, useState } from 'react';

const animationCache = new Map<string, object>();

interface LottiePlayerProps {
  src: string;
  className?: string;
  ariaLabel: string;
  loop?: boolean;
  onComplete?: () => void;
}

export function LottiePlayer({ src, className, ariaLabel, loop = false, onComplete }: LottiePlayerProps) {
  // Lazy initializer serves both first mount and remounts (parents remount
  // us per trigger via a token key, so `src` never changes on a live
  // instance); only a cache miss needs the fetch effect.
  const [data, setData] = useState<object | null>(() => animationCache.get(src) ?? null);
  const [failed, setFailed] = useState(false);
  const lottieRef = useRef<LottieHandle>(null);

  // Pause-when-off-screen (init.md M4 #5): animations only ever play inside
  // fixed/absolute overlays, so the only real off-screen case is a hidden tab.
  // `document.hidden` is read-only, so we drive the handle imperatively.
  useEffect(() => {
    const onVisibilityChange = () => {
      const player = lottieRef.current;
      if (!player) return;
      if (document.hidden) player.pause();
      else player.play();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    let active = true;
    // On a live instance `src` is constant (parents key by trigger token),
    // so the cache is already reflected by the lazy initializer above.
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Lottie asset missing: ${src}`);
        return res.json();
      })
      .then((json) => {
        animationCache.set(src, json);
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [src]);

  if (failed) return null;

  if (!data) {
    // Asset still loading — reserve the box so layout never jumps.
    return <div className={className} aria-hidden />;
  }

  // `data` is guaranteed non-null here; useMemo keeps the prop set stable.
  const animation = data as object;
  return (
    <Lottie
      src={animation}
      autoplay
      loop={loop}
      lottieRef={lottieRef}
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      subscriptions={onComplete ? { complete: onComplete } : undefined}
      className={className}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={false}
    />
  );
}