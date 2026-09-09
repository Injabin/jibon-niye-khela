# UI-DESIGN.md — Visual System & Layout Specification
# Theme: "Modern Martial" (Claymore) — Medieval Knight Reskin

This document governs **presentation only**: color, typography, spacing,
component geometry, and screen layout. It does NOT change game mechanics,
the engine, the save schema, or the tech stack — those remain governed by
`DESIGN.md`, `AGENT.md`, and `init.md`. If anything below appears to require
an engine change, it must be called out explicitly and confirmed before
implementation (see §0).

Read `AGENT.md` §8 (design-system discipline) before implementing anything
here — all values below become the actual contents of `theme.ts`/Tailwind
config, not one-off inline styles.

---

## 0. Scope decision — stat labels vs. stat mechanics (CONFIRM BEFORE BUILDING)

The reference spec lists four header stats: **Health, Honor, Martial Skill,
Happiness**. The existing engine (tested in Milestone 1, per `DESIGN.md` §3)
uses four stat keys: `health, happiness, smarts, looks`.

**Default decision for this pass (display-only reskin, no engine change):**

| Engine key (unchanged) | New display label | New display icon |
|---|---|---|
| `health` | Health | 🩸 / heart-with-edge glyph |
| `happiness` | Happiness | — (kept as-is, 4th position) |
| `smarts` | Martial Skill | ⚔️ |
| `looks` | Honor | 🛡️ |

This means: "Martial Skill" going up/down still runs through the exact same
`smarts` engine logic (book-smart events, school, etc.) — only the label,
icon, and flavor text presented to the player change. "Honor" is `looks`
under the hood. **This is a cosmetic mapping, not a redesign of what the
stat means mechanically.**

If the actual intent is that Martial Skill should behave differently from
how Smarts currently behaves (e.g., driven by combat/training events
instead of study events), or Honor should behave differently from Looks
(driven by karma/reputation instead of genetics), **stop and say so** —
that's a `DESIGN.md` change (new stat semantics, new event categories) and
an engine change, not a UI change, and needs its own scoped milestone.
Do not let the agent silently reinterpret stat meaning while "just doing UI."

---

## 1. Design tokens

### 1.1 Color palette

| Token | Light mode | Dark mode |
|---|---|---|
| `--canvas-bg` | `#F4F5F7` | `#1A1C1E` |
| `--card-bg` | `#FFFFFF` | `#25282C` |
| `--text-primary` | `#2B2D31` | `#E3E5E8` |
| `--text-secondary` | `#72767D` | `#72767D` |
| `--accent-primary` (Claymore Crimson) | `#9E2A2B` | `#B23A3B` *(lifted for dark-mode contrast)* |
| `--accent-secondary` (Steel Blue) | `#4A6984` | `#5A7A94` |
| `--accent-wealth` (Muted Gold) | `#D4AF37` | `#D4AF37` |
| `--stat-health` | `#9E2A2B` (crimson, blood/health) | same |
| `--stat-happiness` | `#4A6984` (steel blue) | same |
| `--stat-martial` (was smarts) | `#3B3F45` (iron gray) | `#8A8F96` |
| `--stat-honor` (was looks) | `#D4AF37` (gold) | same |
| `--overlay-scrim` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.72)` |

**Contrast requirement:** every text/background pairing above must meet
WCAG AA (4.5:1 for body text, 3:1 for large/bold text). Verify
`--accent-primary` crimson on `--card-bg` white and `--text-secondary`
gray on both canvas colors specifically — these are the most likely to
fail and must be checked with an actual contrast tool, not eyeballed.

**Consistency rule (non-negotiable):** once a color is bound to a stat or
concept (crimson = Health, gold = Wealth/Honor, steel blue = Happiness),
that binding is used everywhere that concept appears — header bars,
Chronicle Stream icons, event cards, Assets tab, Life Summary — with zero
exceptions. If a new screen needs a new semantic color, add it as a new
token here first; never introduce an ad-hoc hex value in a component.

### 1.2 Typography

- **Font family:** `Inter` (primary), system-ui fallback stack. Load via
  `next/font` (self-hosted, zero external font-service dependency — keeps
  with AGENT.md's no-paid/no-external-dependency stance and avoids a
  render-blocking Google Fonts request).
- **Titles/headers:** same family, `font-weight: 700`, `letter-spacing:
  0.04em`, `text-transform: uppercase` — this carries the "modern
  military/authoritative" feel without needing a second display font
  (a second font = extra bytes for no mechanical benefit).
- **Body/logs:** `font-weight: 400–500`, normal case, sized for
  readability at mobile widths (minimum 14px body, 16px preferred).
- **Numeric readouts** (age, wealth, stat numbers): `font-weight: 700`,
  tabular-nums so numbers don't jitter the layout as digits change.

### 1.3 Shape & geometry

- **Border radius: 4px, everywhere.** Cards, buttons, input fields, stat
  bar containers, avatar frame, modals. No pill buttons, no fully rounded
  corners anywhere in this theme — this is the single most identity-
  defining rule of the reskin; treat any rounded-full element as a bug.
- **Elevation:** flat design — use a 1px hairline border
  (`rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.06)` dark) instead of
  drop shadows for card separation, except the Interaction Overlay card
  (§2.3) which gets one deliberate soft shadow to read as "elevated above
  the scrim."
- **Grid:** strict 8px base unit; all padding/margin/gap values must be
  multiples of 8px (with 4px permitted only for icon-to-text micro-gaps).
  16px is the standard card internal padding.
- **Icons:** flat vector (prefer a small SVG icon set over emoji for
  production — emoji renders inconsistently across OS/browsers and
  breaks the "clean modern" read; emoji are fine as dev-time placeholders
  only). Every icon-to-concept binding follows the same consistency rule
  as color (§1.1).

---

## 2. Screen layout & Responsive Architecture

The game adopts a de-centered, full-bleed responsive layout across three distinct device tiers rather than a single centered column. Each tier is rendered mutually exclusively via reactive media-query matching (`useLayoutTier`) to guarantee clean HTML semantics, eliminate duplicate test IDs, and ensure optimal ergonomic reachability.

```
Desktop (≥ 1280px): 3-Region Layout (3 cols : 6 cols : 3 cols)
┌───────────────────────┬─────────────────────────────────┬───────────────────────┐
│ LeftSidebar (Sticky)  │ Chronicle Stream (Main Center)  │ RightRail (Sticky)    │
│ - Avatar & Identity   │ - Dedicated Internal Scroll     │ - Standing & Fame     │
│ - 4 Core Stat Bars    │   Container (overflow-y: auto)  │ - Active Relations    │
│ - AGE (+1 YEAR)       │ - Year Card Dividers            │ - Possessions/Assets  │
│ - Nav & Save Actions  │ - Tagged Event Dilemmas         │ - Quick Family Access │
└───────────────────────┴─────────────────────────────────┴───────────────────────┘

Tablet (768px–1279px): 2-Column Split (5 cols : 7 cols)
┌──────────────────────────────┬──────────────────────────────────────────────────┐
│ LeftSidebar (Sticky)         │ Chronicle Stream (Main Body)                     │
│ - Full Character Card        │ - Dedicated Internal Scroll (overflow-y: auto)   │
│ - 4 Core Stat Bars           │ - Pinned year dividers                           │
│ - AGE (+1 YEAR) & Nav        │ - Left sidebar remains fixed & fully reachable   │
└──────────────────────────────┴──────────────────────────────────────────────────┘

Mobile (< 768px): Single-Column Stack with Sticky Anchors
┌─────────────────────────────────────────────────────────────────────────────────┐
│ StickyHeader (Top ~15%, sticky top-0, compact summary + 4 stat bars)           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Chronicle Stream (Scrollable body, pb-36, tight 8px-grid margins)               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ControlDeck (Fixed bottom-0, tactile AGE (+1 YEAR) button + 4-tab icon bar)    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Responsive Tiers & Region Breakdown

#### A. Mobile (< 768px)
- **Top Sticky Header:** Compact summary (`components/game/StickyHeader.tsx`) pinned at `top-0`, displaying character name, title/rank, age, wealth, and 4 horizontal stat bars.
- **Center Chronicle:** Vertical timeline stream spanning full usable screen width with tight 8px-grid margins (`px-3 sm:px-4`, `pb-36`). Window scrolls naturally with auto-scroll anchoring newest cards into view.
- **Bottom Control Deck:** Fixed dock (`components/game/ControlDeck.tsx`) pinned at `bottom-0 inset-x-0`, housing the oversized tactile primary action button ("AGE (+1 YEAR)") and 4 quick-access tabs (Profile, Activities, Family, Assets/Settings).
- *Exclusivity:* Neither `LeftSidebar` nor `RightRail` is mounted on mobile.

#### B. Tablet (768px–1279px)
- **Two-Column Split Grid:** 12-column grid (`grid-cols-12 gap-5`).
- **Left Sidebar (5 cols):** Persistent, sticky container (`sticky top-6 h-[calc(100vh-3rem)]`, `components/game/dashboard/LeftSidebar.tsx`) housing character portrait avatar, identity readouts, 4 core stat bars, the tactile "AGE (+1 YEAR)" button, and navigation/utility actions.
- **Right Main Chronicle (7 cols):** Houses `main#chronicle-scroll` (`h-[calc(100vh-3rem)] overflow-y-auto pr-2`) as a dedicated internal scroll container. The event history scrolls independently inside this container; the left sidebar and Age Up button remain permanently visible and reachable without scrolling past history.
- *Exclusivity:* Neither `RightRail`, `StickyHeader`, nor `ControlDeck` is mounted on tablet.

#### C. Desktop (≥ 1280px)
- **Three-Region Full-Bleed Grid:** 12-column wide container (`max-w-[1700px] mx-auto px-4 lg:px-8`, `grid-cols-12 gap-6`).
- **Left Region (3 cols):** Persistent sticky `LeftSidebar` (`sticky top-6 h-[calc(100vh-3rem)]`) with avatar, identity, core stats, Age Up, and quick navigation.
- **Center Dominant Region (6 cols):** The widest element (`main#chronicle-scroll`, `h-[calc(100vh-3rem)] overflow-y-auto pr-2 scrollbar-none`), dedicated to the chronological narrative and interactive event choices.
- **Right Secondary Rail (3 cols):** Persistent sticky rail (`sticky top-6 h-[calc(100vh-3rem)]`, `components/game/dashboard/RightRail.tsx`) displaying contextual secondary data: Fame & Karma reputation standing, active living relationships with quick tree shortcut, and current property/holdings. Completely eliminates empty margin gutters.
- *Exclusivity:* Neither `StickyHeader` nor `ControlDeck` is mounted on desktop.

### 2.2 Internal Chronicle Scroll Mechanics
- On tablet and desktop, the event log region is its own independent scroll container (`#chronicle-scroll` with `overflow-y: auto`).
- Advancing age appends new year entries to the bottom and programmatically scrolls `#chronicle-scroll` to the bottom.
- When `prefers-reduced-motion: reduce` or the in-game reduced-motion setting is enabled, scroll jumps instantly without transition; otherwise, it glides smoothly.
- Crucially, the character card, stat readouts, and Age Up button never scroll out of view.

### 2.3 Interaction Overlay & Modals
- **Dilemmas & Event Cards:** Renders inline within the Chronicle Stream or over backdrop scrim during pivotal dilemmas, with full-width choice buttons (48px minimum height for touch ergonomics).
- **Secondary Modals:** Full Profile (`ProfileSheet`), Activities & Career (`ActiveMenu`), Family Tree (`FamilyTreeView`), and Settings (`SettingsPanel`) render as centered or slide-out modal dialogs with backdrop blur (`backdrop-blur-md`).
- **No Horizontal Scroll:** All tab rows (e.g. `ActiveMenu` tab bar) wrap responsively (`flex-wrap`) on narrow screens; modals strictly enforce `max-w-full` with internal vertical scrolling. Zero horizontal scrollbars occur at any supported width (375px to 1440px+).

---

## 3. What is explicitly NOT changing in this pass

- Tech stack (`AGENT.md` §3) — unchanged.
- Engine logic, stat math, event-selection algorithm, save schema —
  unchanged (see §0's confirm-first rule).
- The 2D avatar + Lottie decision (`DESIGN.md` §7) — unchanged; the
  avatar's art style should be updated to match this theme's visual
  language (knight silhouettes/gear per life stage) as a content/asset
  task, not a re-architecture.
- Sound design architecture (Howler/`SoundManager`) — unchanged; SFX
  *content* should thematically shift (clashing steel, coin clink, horn
  fanfare) but that's an asset-swap task under the existing system.

## 4. Accessibility & responsiveness carry-overs (still apply, unchanged from AGENT.md §7–8)

- Reduced-motion toggle still applies to Chronicle Stream auto-scroll,
  overlay transitions, and any stat-bar animation.
- Sound-off toggle still applies to any new themed SFX.
- All of §1–2 must work at 360px width through desktop, sticky
  header+footer included — verify header/footer don't collectively eat
  too much vertical space on short mobile viewports (test at 360×640 and
  360×740 specifically; the sticky header+footer combo is the highest
  risk for cramping the Chronicle Stream on small screens).
