# init.md — Bootstrap Instructions

Purpose: the exact first sequence of actions for the build agent (Gemini via
Antigravity). Follow in order. Do not skip ahead to fun 3D/audio work before
Milestone 0–2 are solid — the "premium feel" only works if the core loop and
save system are reliable first.

Read `AGENT.md` (rules) and `DESIGN.md` (what to build) fully before starting.

---

## Milestone 0 — Project scaffold

1. `npx create-next-app@latest lifesim --typescript --tailwind --eslint --app`
2. Set `strict: true` in `tsconfig.json`.
3. Install core deps:
   ```
   npm i zustand framer-motion howler idb-keyval
   npm i -D vitest @vitest/ui @testing-library/react @playwright/test
   ```
   (Hold off on `three` / `@react-three/fiber` / `@react-three/drei` until
   Milestone 4 — don't pay the bundle cost before there's anything to render.)
4. Create the folder structure from `AGENT.md` §4 (`/lib/engine`,
   `/lib/audio`, `/lib/store`, `/lib/save`, `/content`, `/components/ui`,
   `/components/game`, `/components/three`, `/tests`).
5. Add `theme.ts` + Tailwind config tokens (color roles, spacing scale,
   motion durations) per `AGENT.md` §8 — placeholder palette is fine, but
   the *tokens* must exist before any component uses raw hex/ms values.
6. Set up `vitest.config.ts` and confirm `npm run test` runs (even with a
   trivial passing test) before writing engine code.
7. Push to GitHub, connect the repo to Vercel, confirm a blank deploy
   succeeds on the free tier. Get this green before writing game logic —
   it de-risks hosting problems early.
8. Rename project internally (package.json `name`, page `<title>`) to the
   chosen non-infringing name — do not ship placeholder "bitlife-clone"
   naming anywhere, including commit messages or repo description.

**Exit criteria:** blank Next.js app live on a Vercel URL, tests runnable,
lint clean, folder structure in place.

## Milestone 1 — Engine core (no UI yet)

1. Implement `/lib/engine/rng.ts` — seeded RNG (e.g., mulberry32), with
   unit tests for determinism given the same seed.
2. Implement the `Character` type and `createCharacter(seed)` per
   DESIGN.md §3 (roll starting stats, genetics-based looks, family stub).
3. Implement `/lib/engine/stats.ts`: clamp helpers (0–100), yearly decay
   curves per DESIGN.md §3–4. Unit test boundary behavior (can't go
   below 0 / above 100; death triggers at health 0).
4. Implement `/lib/engine/aging.ts`: `ageUp(character) -> { character,
   firedEvents }` — the yearly tick described in DESIGN.md §4.
5. Build a **minimal event registry** (`/lib/engine/events/registry.ts`)
   with ~10–15 hand-written events spanning childhood/teen years, typed
   per DESIGN.md §10 schema, to prove the pipeline before mass content
   authoring.
6. Write unit tests for: event filtering by age/flags, weighted selection
   distribution (statistical sanity check, not exact), stat effects
   applying correctly, and a full simulated life (birth→death) not
   crashing across 100 seeded runs.

**Exit criteria:** `npm run test` covers engine core; a script/test can run
a full headless life from age 0 to death and print a log — no UI required
to prove this works.

## Milestone 2 — Store, save system, and barebones UI

1. Build the zustand store wrapping the engine (`/lib/store`), keeping
   state JSON-serializable only (no class instances, no functions in state).
2. Build `/lib/save`: `serialize`, `deserialize`, `schemaVersion`, and a
   migration stub. Persist to `localStorage` first (swap to `idb-keyval`
   later is fine, keep the interface stable).
3. Build the plainest possible UI: character summary panel, "Age Up"
   button, event card that shows text + choice buttons, stat bars as
   plain divs. No animation, no sound yet — this is to validate the loop
   end-to-end.
4. Wire an Export/Import JSON save button.
5. Deploy to Vercel again, confirm the full loop (birth → age up → event
   choices → death → life summary stub) works on a real deployed URL,
   including a hard refresh restoring the save.

**Exit criteria:** a genuinely playable, ugly version of the game is live
and save/load works across reloads.

## Milestone 3 — Motion & sound pass (the "premium feel" layer, 2D first)

1. Introduce Framer Motion for: event card enter/exit, stat bar
   fill/shake/glow transitions, button press micro-interactions — per
   DESIGN.md §6 points 1–3.
2. Build `SoundManager` (`/lib/audio`) wrapping Howler: a manifest of
   short SFX keyed by semantic event names (`stat_up`, `stat_down`,
   `bad_event`, `good_event`, `life_stage_change`, `death`), plus a
   background-music layer with mood tracks per life stage/arc.
3. Source only CC0/CC-BY SFX/music (e.g., freesound.org CC0 filter,
   OpenGameArt) or synthesize simple tones via Web Audio for MVP SFX;
   log every asset + license in `/public/audio/CREDITS.md`.
4. Add the Settings panel: sound/music toggles + volume, reduced-motion
   toggle (respect `prefers-reduced-motion` by default).
5. Add haptic feedback hook for mobile on key positive/negative beats.

**Exit criteria:** the 2D version of the game already feels reactive and
alive — sound + motion on every meaningful state change — with everything
gracefully disable-able.

## Milestone 4 — Avatar & moment layer (Lottie, added last)

1. Install `lottie-react` (wraps `lottie-web`), behind a `next/dynamic`
   boundary so it never loads until the avatar or a moment sting is
   actually needed.
2. Build the layered 2D `<Avatar>` component: base body/outfit per life
   stage (DESIGN.md §4) as swappable PNG/SVG layers, plus a small set of
   Lottie expression overlays keyed by event outcome tone (`good | bad |
   neutral | funny`, DESIGN.md §10).
3. Build the interactive family-tree graph as 2D SVG + Framer Motion
   (pan/zoom, node tap → relationship panel) per DESIGN.md §7 — this is
   the shipped version for v1, not a placeholder.
4. Build 8–10 reusable "milestone stinger" Lottie animations (confetti,
   falling money, handcuffs, tombstone, diploma, wedding rings, etc.)
   triggered by event **category**, not authored per unique event. Pair
   each with a screen-flash/shake Framer Motion effect and matching SFX.
5. Enforce the performance budget from `AGENT.md` §7: cap simultaneous
   Lottie players, pause any off-screen instance, keep JSON files lean.
6. Verify the reduced-motion Settings toggle fully swaps Lottie playback
   to a static icon + fade with no broken layout.

**Exit criteria:** milestone life events trigger a short, delightful
animated beat; game remains fully playable and fast with animations
disabled. (A future real-time 3D upgrade, if ever pursued, is a separate
post-launch project — not part of this milestone.)

## Milestone 5 — Content expansion

1. Scale the event pool from ~15 to the DESIGN.md §10 target (150–250),
   spread across all categories in DESIGN.md §5, following the sensitive-
   content policy in DESIGN.md §11.
2. Add remaining systems in priority order: Education → Career →
   Relationships/Activities → Assets/Finance → Crime → Health →
   Achievements ("Ribbons") — each following the Milestone-1-style
   engine-first workflow from `AGENT.md` §5.
3. Add Life Summary screen: timeline, stat-over-lifetime chart
   (lightweight chart lib or hand-rolled SVG, no heavy chart dependency),
   shareable canvas-rendered image export.
4. Add legacy/heir mode (play as your character's child) once family
   tree + relationships are stable.

**Exit criteria:** feature parity with DESIGN.md §5 systems, content
volume target met, achievements implemented.

## Milestone 6 — Polish, accessibility, and launch checks

1. Full keyboard-navigation pass and screen-reader labeling pass.
2. Lighthouse pass on mobile: aim for Performance ≥ 85, Accessibility ≥ 95.
3. Add a simple PWA manifest + service worker for offline play after
   first load.
4. Final legal/content sweep: confirm no trademarked names, no real
   people, all assets credited, sensitive-content policy respected
   end-to-end (DESIGN.md §11 and §9 in AGENT.md).
5. Final Vercel deploy on the project's real domain (or `*.vercel.app`),
   smoke test the full loop on both mobile and desktop viewports.

**Exit criteria:** ship it.

---

## Quick reference — command cheatsheet for the agent

```
npm run dev          # local dev
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run test          # vitest
npm run test:e2e      # playwright (core loop smoke test only)
npm run build         # verify production build before every deploy
```

## When starting each session, the agent should

1. State which Milestone/DESIGN.md section is being worked on.
2. Confirm the previous milestone's exit criteria still pass
   (`npm run build && npm run test`) before adding new scope.
3. Follow the AGENT.md §5 workflow (plan → engine → store → UI → verify)
   for every new feature, no exceptions.
