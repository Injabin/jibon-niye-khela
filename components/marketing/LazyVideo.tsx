'use client';

import { useEffect, useRef } from 'react';

/**
 * Delayed-play demo video for the landing page (Gate 6 performance).
 *
 * `preload="none"` keeps the ~480 KB gameplay.webm out of the initial
 * network payload; the poster renders immediately and playback starts only
 * once the element approaches the viewport — and never under
 * `prefers-reduced-motion`, where the poster + native controls remain.
 */
export function LazyVideo({
  src,
  type,
  poster,
  ariaLabel,
  testId,
}: {
  src: string;
  type: string;
  poster: string;
  ariaLabel: string;
  testId: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const promise = el.play();
          if (promise) promise.catch(() => {});
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      aria-label={ariaLabel}
      className="size-full object-cover"
      data-testid={testId}
    >
      <source src={src} type={type} />
    </video>
  );
}