import type { IconName } from '@/lib/theme/concepts';

/**
 * Flat vector icon set for the "Modern Martial" theme (UI-DESIGN.md §1.3:
 * flat SVG icons over emoji; every binding lives in `lib/theme/concepts.ts`).
 * All icons are 24x24 stroke icons that inherit `currentColor`, sized via the
 * `size` prop (defaults to 1em so they scale with surrounding text).
 */

const PATHS: Record<IconName, React.ReactNode> = {
  heart: (
    <path d="M12 20.5s-7.5-4.6-9.4-9C1.2 8.8 3 5.5 6 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.8 3.3 3.4 6-1.9 4.4-9.4 9-9.4 9Z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
    </>
  ),
  sword: (
    <>
      <path d="M14.5 3.5 20.5 9.5 12 18l-4.5-4.5M14.5 3.5 12 6M17 7l-2 2M12 18l-1.5 4-3.5-3.5M6 11.5 3.5 11 8 6.5 8.5 9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.6 20 6v5.5c0 4.9-3.2 8.3-8 9.9-4.8-1.6-8-5-8-9.9V6l8-3.4Z" />
      <path d="m8.6 12.2 2.3 2.3 4.5-4.5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 8h5l-2.6 3.4h2.6L9.4 16l1-4.6H8.2l1.4-3.4Z" transform="translate(0 0)" />
    </>
  ),
  skull: (
    <>
      <path d="M12 3.5a8 8 0 0 1 4.2 14.9c-.6.3-1 .9-1 1.6l-.3 1.5a1.2 1.2 0 0 1-1.2 1H10.3a1.2 1.2 0 0 1-1.2-1l-.3-1.5c0-.7-.4-1.3-1-1.6A8 8 0 0 1 12 3.5Z" />
      <circle cx="9.2" cy="11.4" r="1.3" />
      <circle cx="14.8" cy="11.4" r="1.3" />
      <path d="M10.6 19v1.2M13.4 19v1.2" />
    </>
  ),
  laugh: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5c.9 2.2 2.1 3.4 3.5 3.4s2.6-1.2 3.5-3.4" />
      <path d="M9.2 9.2v.3M14.8 9.2v.3" />
    </>
  ),
  dot: (
    <>
      <circle cx="12" cy="12" r="4.5" />
    </>
  ),
};

export function Icon({
  name,
  size = '1em',
  className,
  styleColor,
}: {
  name: IconName;
  size?: string | number;
  className?: string;
  /** Inline color override (e.g. a param-branded icon); default currentColor. */
  styleColor?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={styleColor ? { color: styleColor } : undefined}
    >
      {PATHS[name]}
    </svg>
  );
}