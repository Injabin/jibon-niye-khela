# ui-ux-guide.md
# Design Analysis: "Adorable Home" (2019)-Style Cozy/Kawaii UI System

## 0. How to read this document (important — read first)

This is a **genre-accurate design system**, written the way a UI designer
would document the conventions of cozy pet/home-decoration mobile games
(the category "Adorable Home" belongs to) — soft pastel palettes, rounded
"blob" avatars, bottom-toolbar navigation, grid-based shop menus. It is
**not** a pixel-traced extraction of the real app's exact assets, hex
codes, or copyrighted art — I don't have verified source access to the
actual game in this conversation. Treat every color/spacing value below
as a **well-reasoned, representative starting point** in the correct
style family, not a guaranteed exact match. If you want this refined
against real, current screenshots/hex-picks from the actual app, ask me
to verify with web search enabled and I'll tighten every value below.

**This document does not replace or override `UI-DESIGN.md`** (the
locked "Modern Martial" Claymore theme already governing Jibon Niye
Khela). It exists as a separate reference. See
`Additional_plus_improved_plan.md` Phase 12 for the explicit, gated
decision about whether/how any of this gets adopted.

**IP note:** do not source, trace, or reuse actual copyrighted art,
icons, fonts, or audio from the real Adorable Home app. Everything
implemented from this guide must be original or properly licensed —
same rule as everywhere else in this project (`AGENT.md` §9).

---

## 1. Design philosophy

Cozy/kawaii home-and-pet-sim UI exists to feel like a warm, low-stakes,
huggable space — the opposite of "premium/serious" game chrome. Every
design decision below optimizes for **comfort, softness, and delight**
over density or authority:
- Rounded over sharp. Pastel over saturated. Generous whitespace over
  packed information density.
- The avatar/pet is always the emotional center of the screen — UI chrome
  recedes so the character reads as "alive" first, interface second.
- Feedback is playful and bouncy (squash/stretch, gentle overshoot) rather
  than snappy/mechanical.

---

## 2. Color palette & placement guidelines

### 2.1 Core palette

| Role | Token | Example hex (representative) | Usage share |
|---|---|---|---|
| Canvas / background | `--cozy-bg` | `#FBF3EE` (warm cream) or `#F1F6FB` (soft sky) | ~60% of any screen |
| Primary surface (cards/panels) | `--cozy-surface` | `#FFFFFF` / `#FFF9F5` | ~25% |
| Primary accent (CTA, active states) | `--cozy-accent-pink` | `#FFB6C1`–`#FF9EB5` (soft rose) | ~10% |
| Secondary accent | `--cozy-accent-lavender` | `#C9B8FF` | supporting, ~5–8% |
| Tertiary accent | `--cozy-accent-mint` | `#B8F0D4` | supporting, sparing |
| Currency/reward gold | `--cozy-gold` | `#FFD166` | reserved exclusively for currency & rewards |
| Text primary | `--cozy-text` | `#5B4A46` (warm dark brown, never pure black) | body/labels |
| Text secondary | `--cozy-text-muted` | `#A99A94` | captions, timestamps, disabled |
| Success/positive | `--cozy-success` | `#8FD9A8` | |
| Alert/negative (used sparingly — this genre avoids harsh red) | `--cozy-alert` | `#FFA69E` (soft coral, not saturated red) | |

**Placement rule — the 60/25/10/5 layering:** roughly 60% of any screen
should be the soft background canvas, 25% card/panel surfaces, 10%
accent color used only on the single most important interactive element
per screen (primary CTA, active tab, selected item), and the remaining
~5% reserved for the gold currency accent and rare success/alert states.
**Never let more than one accent color compete for primary attention on
the same screen** — pick one accent as "the" call-to-action color per
screen and keep the rest as quiet supporting tints.

### 2.2 What this palette explicitly avoids
- Pure black (`#000000`) or pure white (`#FFFFFF`) as text — always a
  warm-tinted near-black and a warm-tinted near-white, so the whole UI
  reads as "soft," never clinical.
- Saturated primary red/blue/green — every hue is desaturated/pastel-
  shifted, including semantic colors (success/alert).
- More than 2 accent hues visible at once on a single screen.

### 2.3 Dark mode note
This genre is overwhelmingly light-mode-first by convention (cozy/warm
reads poorly in high-contrast dark UI). If a dark mode is offered, shift
toward deep warm plum/navy backgrounds (`#2E2438`-ish) rather than
neutral charcoal, and desaturate the pastels slightly rather than
brightening them, to preserve the "soft" feeling.

---

## 3. Menu design guideline

### 3.1 Structure
- **Rounded-rectangle panels** with a large radius (16–24px, notably
  larger than typical app UI) — this is the single most identity-
  defining shape rule of the genre, the direct opposite of the 4px
  Claymore rule in `UI-DESIGN.md`.
- Menus favor **card grids or vertically stacked "chunky" list rows**
  (large tap targets, generous 16–20px internal padding, soft drop
  shadow rather than hairline borders) over dense text lists.
- **Modal menus** (settings, confirmation dialogs) appear as a centered
  rounded card over a soft-blurred or lightly-tinted (not harsh black)
  scrim — e.g. `rgba(255,240,235,0.7)` rather than `rgba(0,0,0,0.6)`, to
  keep the "cozy" feeling even when dimming background content.
- **Section headers** inside menus use a friendly rounded display font
  treatment (see §7) rather than uppercase/tracked "authoritative" type.

### 3.2 Placement conventions
- Primary navigation (Home / Shop / Closet-or-Customize / Social) lives
  in a persistent **bottom toolbar** (see §4), not a hamburger/side-drawer
  — this genre strongly favors always-visible, thumb-reachable navigation.
- Secondary/contextual menus (item detail, settings) open as a **bottom
  sheet that slides up** from the toolbar area, covering roughly the
  bottom 60–75% of the screen, rather than a full-screen takeover —
  this keeps the avatar/pet partially visible even while a menu is open,
  reinforcing "the character is always the star."
- Close controls are a soft circular "X" button, top-right of the sheet,
  never a hard-edged button.

---

## 4. Toolbar design guideline

### 4.1 Bottom toolbar (primary navigation)
- Fixed at the bottom of the viewport, rounded top corners only (the
  toolbar itself is the one element allowed a partial rounded-rect
  shape distinct from the full-pill rule below), soft drop shadow
  separating it from content above.
- 4–5 icon tabs, evenly spaced, each icon inside a **circular or
  squircle** touch target (never a square), roughly 48–56px, with the
  active tab getting a filled pastel-accent circle behind the icon plus
  a small label beneath it; inactive tabs show icon-only or icon + muted
  label.
- Icon style: soft, rounded-line or filled "sticker" style icons (think
  friendly rounded glyphs, not sharp geometric vector icons) — matches
  the avatar's soft aesthetic.

### 4.2 Top HUD bar (status/currency)
- Persistent slim bar at the very top: player level/name on the left in
  a small rounded pill/badge, one or two currency counters on the right
  (each in its own small rounded pill with an icon + number, using the
  gold token for premium/soft currency and a distinct secondary token
  for a second currency if one exists).
- Currency pills use a subtle "pop" micro-animation (scale bounce) when
  the value changes, reinforcing reward feedback without needing a
  full-screen effect for routine gains.

### 4.3 Consistency rule
Exactly as in `UI-DESIGN.md`'s consistency rule for the Claymore theme:
once a color/icon is bound to a currency or concept, it's used
identically in the top HUD, the shop, and any reward popup — no
exceptions.

---

## 5. Avatar styling guideline

### 5.1 Proportions & silhouette
- **Chibi/blob proportions:** oversized head relative to body (roughly
  40–50% of total height is head), simplified rounded limbs, minimal
  facial detail (large simple eyes, small mouth) — optimized for warmth
  and legibility at small sizes, not anatomical accuracy.
- Silhouette should read instantly at toolbar-icon size (roughly 32–48px)
  as well as at full-screen "room" size — test avatar designs at both
  extremes.

### 5.2 Customization panel
- Customization (outfits/accessories/hair) presented as a **horizontal
  swipeable carousel or a scrollable grid of circular thumbnail swatches**
  beneath a large live preview of the avatar — changes apply instantly to
  the preview on tap, no "confirm" step required for browsing, only for
  committing a purchase if the item isn't already owned.
- Owned vs. locked items: owned items show full-color thumbnails; locked/
  purchasable items show a slightly desaturated thumbnail with a small
  price tag/lock badge in the corner — never hide locked items entirely,
  since browsing locked items is part of the aspirational shop loop.
- Category tabs above the carousel (Hair / Face / Top / Bottom / Accessory
  etc.) use the same rounded-pill active-state treatment as the bottom
  toolbar for visual consistency.

### 5.3 Expression system
- A small library of swappable facial-expression overlays (happy, sleepy,
  surprised, sad) triggered by in-game state/events — mirrors the
  emotional-reactivity goal already established for Jibon Niye Khela's
  own 2D avatar/Lottie system in `DESIGN.md` §7, just in a softer visual
  language if this theme were ever adopted.

---

## 6. Item & shop menu design guideline

### 6.1 Grid layout
- Items display in a **2–3 column grid** of rounded square/squircle
  cards (12–16px radius), generous gutter spacing (12–16px) — never a
  dense list; density is deliberately sacrificed for a "browsable,
  delightful" feel.
- Each item card: item icon/thumbnail centered on a soft tinted
  background (a very light pastel tied to the item's rarity tier, see
  below), item name in small text beneath, price pill (icon + number)
  at the bottom of the card.

### 6.2 Rarity/tier indication
- Use **background tint + a small corner ribbon/badge**, not heavy
  borders, to indicate rarity tiers (e.g., common = neutral cream tint,
  rare = lavender tint, premium/limited = gold tint) — keep the tier
  system to 3 tiers maximum to avoid visual clutter creeping away from
  the "calm" design philosophy in §1.
- Avoid harsh rarity-signaling conventions borrowed from hardcore-RPG UI
  (glowing borders, aggressive gradients) — even "premium" items should
  look inviting, not intimidating.

### 6.3 Purchase flow
- Tapping a locked item opens a small centered confirmation card (not a
  full sheet) showing the item, its price, and a rounded pill "Buy"
  button in the primary accent color — confirm-and-close in one tap,
  with a brief celebratory micro-animation (item "pops" into the
  avatar/closet) rather than a static success toast.

---

## 7. Typography guideline

- **Primary font:** a rounded, friendly sans-serif (e.g., a font in the
  style of Baloo, Quicksand, Nunito, or Fredoka — pick one, self-host it,
  do not depend on a paid font service) — this is the opposite
  typographic direction from the Claymore theme's sharp uppercase-tracked
  headers.
- **Headers:** medium-large weight, normal case (not uppercase), rounded
  letterforms doing the "friendly authority" work that uppercase+tracking
  does in the Claymore theme.
- **Body:** regular weight, generously sized (15–16px minimum) with
  relaxed line-height (1.5+) — this genre reads as unhurried, not dense.
- **Numeric readouts** (currency, levels): slightly bolder weight,
  tabular figures, same as the general project rule.

---

## 8. Motion & micro-interaction guideline

- Default easing: soft overshoot/bounce (e.g., a spring curve with mild
  overshoot) rather than linear or ease-in-out — buttons, cards, and the
  avatar itself should feel slightly "squishy" when tapped.
- Screen/panel transitions: gentle scale+fade or slide-up-with-bounce for
  bottom sheets, never a hard instant cut and never an aggressive 3D/
  perspective transition — motion stays soft and 2D-plane-consistent.
- Reward moments (purchase, level-up): a burst of soft particle
  confetti/hearts/sparkles in the pastel palette, paired with a gentle
  "pop" sound cue — smaller and cuter in scale than a "premium/epic"
  game's reward moment, consistent with the low-stakes cozy tone.
- Always respect a reduced-motion setting exactly as required elsewhere
  in this project (`AGENT.md` §8) — bounce/overshoot easing should
  collapse to a simple fade when reduced-motion is on.

---

## 9. Accessibility notes specific to this style

- Pastel palettes are the highest-risk area for failing WCAG contrast —
  every text-on-pastel-background pairing above must be explicitly
  contrast-checked; do not assume "it looks fine" because pastel colors
  read as gentle to the eye, they very often fail 4.5:1 body-text
  contrast in practice.
- Rounded/circular tap targets must still meet the same 44–48px minimum
  touch-target size regardless of how "cute" or small they look — cute
  should never mean small.
- Rarity-tier tinting (§6.2) must not be the *only* signal distinguishing
  tiers — pair with the corner badge/text label so colorblind users
  aren't relying on hue alone.

---

## 10. Summary comparison — this style vs. the current locked Claymore theme

| Attribute | Claymore (locked, `UI-DESIGN.md`) | Adorable-Home-style (this doc) |
|---|---|---|
| Corner radius | 4px, sharp | 16–24px, very rounded |
| Palette | Crimson / steel blue / gold, high contrast | Pastel pink / lavender / mint / gold, low contrast/soft |
| Typography | Uppercase, tracked, authoritative | Rounded, normal-case, friendly |
| Navigation | Two stacked panel-trigger buttons + Age Up (per Phase 8 layout) | Persistent bottom icon toolbar |
| Motion | Restrained, purposeful "moment" beats | Bouncy, playful, constant micro-delight |
| Overall tone | Serious, weighty, martial | Warm, low-stakes, huggable |

These are two coherent but fundamentally different design languages —
see `Additional_plus_improved_plan.md` Phase 12 for how (and whether) to
selectively borrow from this document without abandoning the Claymore
identity already built.
