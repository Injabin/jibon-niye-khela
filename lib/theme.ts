/**
 * Single source of truth for all design tokens.
 *
 * Per AGENT.md §8: colors, spacing, radii, shadows, and motion durations all
 * come from here — no magic hex codes or ad-hoc `ms` values scattered in
 * components. Components reference these as Tailwind utilities backed by the
 * CSS custom properties in `app/globals.css`, or import these constants
 * directly for imperative logic (e.g. framer-motion durations).
 *
 * Motion has two tiers per AGENT.md §8:
 *  - micro:  button press, stat tick (100–200ms)
 *  - moment: life event resolves, death, big win (400–900ms with the
 *    confetti/sound layer).
 */

export const colors = {
  // Base surfaces
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  surfaceRaised: "var(--color-surface-raised)",
  surfaceOverlay: "var(--color-surface-overlay)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  border: "var(--color-border)",

  // Core role colors
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",

  // Status / semantic colors
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",

  // Event tone colors — fills (DESIGN.md §6 point 1, UI-DESIGN.md §2.3)
  tone: {
    good: "var(--color-tone-good)",
    bad: "var(--color-tone-bad)",
    neutral: "var(--color-tone-neutral)",
    funny: "var(--color-tone-funny)",
  },

  // Event tone TEXT variants — always the 4.5:1-compliant pairing
  // (gold/crimson are fill-only tokens; see globals.css header comment).
  toneText: {
    good: "var(--color-tone-text-good)",
    bad: "var(--color-tone-text-bad)",
    neutral: "var(--color-tone-text-neutral)",
    funny: "var(--color-tone-text-funny)",
  },

  // Stat concept colors — bound once, used everywhere (UI-DESIGN.md §1.1)
  stat: {
    health: "var(--color-stat-health)",
    happiness: "var(--color-stat-happiness)",
    martial: "var(--color-stat-martial)",
    honor: "var(--color-stat-honor)",
  },

  wealth: "var(--color-wealth)",
  wealthText: "var(--color-wealth-text)",

  // Family-tree node colors (role-bound fills, UI-DESIGN.md §1.1 carry-over)
  tree: {
    self: "var(--color-tree-self)",
    mother: "var(--color-tree-mother)",
    father: "var(--color-tree-father)",
    grandparent: "var(--color-tree-grandparent)",
    sibling: "var(--color-tree-sibling)",
    spouse: "var(--color-tree-spouse)",
    child: "var(--color-tree-child)",
    deceased: "var(--color-tree-deceased)",
    textOnFill: "var(--color-tree-text-on-fill)",
    stroke: "var(--color-tree-stroke)",
    selected: "var(--color-tree-selected)",
    edge: "var(--color-tree-edge)",
  },
} as const;

export const spacing = {
  xs: "var(--space-xs)",
  sm: "var(--space-sm)",
  md: "var(--space-md)",
  lg: "var(--space-lg)",
  xl: "var(--space-xl)",
  "2xl": "var(--space-2xl)",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  full: "var(--radius-full)",
} as const;

export const shadow = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

/**
 * Motion durations (seconds) — referenced by Framer Motion transitions and
 * any imperative animation code.
 */
export const motion = {
  micro: 0.15, // 150ms  — button press, stat tick
  quick: 0.25, // 250ms  — small in-between transitions
  moment: 0.6, // 600ms  — event resolve, life-stage change
  big: 0.9, // 900ms  — death, big win, milestone sting
} as const;

/** Theme variant tracking so components can honour reduced-motion. */
export const isReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;