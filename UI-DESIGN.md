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

## 2. Screen layout

### 2.1 Sticky Header (top ~15% of viewport, `position: sticky/fixed`, pinned during scroll)

```
┌─────────────────────────────────────────┐
│  Character Name           Age  Wealth    │
│  Title/Rank (secondary)                  │
│  ▬▬▬▬▬▬▬▬  Health                        │
│  ▬▬▬▬▬▬▬▬  Happiness                     │
│  ▬▬▬▬▬▬▬▬  Martial Skill                 │
│  ▬▬▬▬▬▬▬▬  Honor                         │
└─────────────────────────────────────────┘
```
- Left: character name (bold, ~16pt) + title/rank beneath in
  `--text-secondary` (e.g. *Squire → Mercenary → Warlord*, derived from
  age/career state per `DESIGN.md` §5.2 career track — this is a display
  mapping onto existing career data, not a new system).
- Right: Age (large, ~20pt bold) + Wealth in `--accent-wealth` gold.
- Bottom of header: four flat horizontal stat bars per §0/§1.1 mapping.
- Component: `components/game/StickyHeader.tsx`, composes the existing
  `StatBars` component (reskinned via tokens, not rebuilt) plus a new
  `TitleRank` display derived from existing `CareerState`.

### 2.2 Chronicle Stream (middle ~70%, main scrollable body)

- Continuous vertical timeline replacing/restyling the current flat "Life
  Log" list.
- **Year Cards:** each new age starts with a thin horizontal divider +
  small "Year N" label — maps directly to existing `LifeEventLogEntry`
  data grouped by age; no new data model needed.
- **Event entries:** nested in borderless (hairline only, per §1.3) cards,
  16px internal padding, each starting with a flat icon anchor mapped to
  event `tag`/`tone` (per `DESIGN.md` §10) — e.g. ⚔️/combat icon for
  training-type events, 🩸/wound icon for injury, 🪙/coin icon for income.
  This icon-per-tag mapping must be defined once in a shared lookup table,
  not hardcoded per component instance.
- **Scroll behavior:** new years append to bottom; on Age Up, smooth-
  scroll the viewport to bring the newest card into view (respecting
  reduced-motion: instant jump instead of smooth scroll when that setting
  is on, per `AGENT.md` §8).
- Component: `components/game/ChronicleStream.tsx` — this replaces the
  current plain `Life Log` list component; the underlying data source
  (`history: LifeEventLogEntry[]`) is unchanged.

### 2.3 Interaction Overlay (event/dilemma pop-ups)

- Centered modal over a `--overlay-scrim` (60% black light / 72% dark)
  full-screen backdrop.
- Card: header icon, event description text (centered, ~14pt), vertical
  stack of full-width choice buttons — this is the **event card system**
  from `DESIGN.md` §8, now restyled to this theme, not a new system.
- Buttons: 48px minimum height (thumb-friendly), centered bold text,
  4px radius. The most consequential/aggressive choice uses
  `--accent-primary` crimson fill; neutral/lesser choices use outline
  style with `--text-primary` border+text on transparent fill.
- This overlay is the same `EventCard` component described in
  `DESIGN.md` §6/§8 and must still carry the mood-accent behavior already
  specified there (green/gold-ish good, red bad, purple-ish odd/funny) —
  reconcile that existing mood-accent token set with the new crimson/
  steel-blue/gold palette here rather than running two competing color
  systems; use `--accent-primary` for bad/aggressive, `--accent-secondary`
  for neutral, `--accent-wealth` gold for good/reward-flavored outcomes.

### 2.4 Control Deck / Sticky Footer (bottom ~15%, fixed)

- **Age Up button:** oversized, full-width or near-full-width, sits just
  above the tab bar. Flat claymore/gauntlet icon + "AGE (+1 YEAR)" label,
  bold, uppercase per §1.2. This is the existing `Age Up` action, restyled
  — no new logic.
- **Bottom tab bar:** 4 flat icon tabs, evenly spaced:
  - 👤 **Profile** → Stats/Traits/Lineage (existing character detail view)
  - ⚔️ **Activities** → Train/Raid/Arena/Serve King — this is a *label*
    reskin of the existing Activities/Career menu from `DESIGN.md` §5.2/
    §5.4; "Serve King" maps to the existing career-employment flow,
    "Raid"/"Arena" map to existing crime/combat-flavored activity events —
    confirm with the team whether any of these need genuinely new event
    content or are purely relabeled existing categories before building.
  - 👥 **Relationships** → existing Relationships/family-tree system
    (`DESIGN.md` §5.3), unchanged mechanically.
  - 🛡️ **Assets** → existing Assets/finance system (`DESIGN.md` §5.5),
    relabeled flavor: "Weapons, Armors, Castles, Mounts" instead of
    generic "cars, houses, jewelry" — same underlying `Asset[]` data
    shape with themed item names/icons in `/content`.
- Component: `components/game/ControlDeck.tsx`.

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
