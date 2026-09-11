# AGENT.md ΓÇö Operating Rules for the Build Agent

This file governs how the coding agent (Gemini / Antigravity) must behave while
building **"Jibon Niye Khela"** ("Playing with Life"). Read this fully before writing any code.
Read `DESIGN.md` before implementing any game mechanic. Read `init.md` before
running the first setup command. If any instruction here conflicts with a later
ad-hoc request, prefer the ad-hoc request but flag the conflict.

---

## 1. Mission

Build a free, browser-based life-simulation game (BitLife-style) that:
- Runs entirely on the client after load (no paid backend required).
- Deploys for **$0** on Vercel's free tier.
- Feels premium: fluid motion, light 3D flourishes, responsive sound,
  and UI that visibly *reacts* to the player's choices instead of just
  swapping text.
- Is legally safe to ship (original name, original art/audio or
  properly licensed CC0/CC-BY assets, no BitLife trademarks/copy).

## 2. Non-negotiable constraints

| Constraint | Why |
|---|---|
| Must run on Vercel Hobby (free) tier | Budget is $0 |
| No server-side game logic requiring a paid DB | Game state lives client-side (see DESIGN.md ┬º9) |
| No paid APIs, no paid fonts, no paid SFX/music libraries | Budget is $0 |
| Must work fully offline after first load (PWA-friendly) | Premium feel, no flaky network dependency |
| Must be responsive: mobile (360px) ΓåÆ desktop (1920px+) | BitLife's audience is majority mobile |
| Must keep initial JS bundle lean | 3D/animation libs are heavy ΓÇö lazy-load them |
| Never use the name "BitLife" anywhere in code, copy, or metadata | Trademark safety |

## 3. Tech stack (locked ΓÇö do not swap without asking)

- **Framework:** Next.js 14+ (App Router), TypeScript, strict mode on.
- **Styling:** Tailwind CSS + CSS variables for theming (light/dark, seasonal themes later).
- **State management:** Zustand (small, serializable store ΓÇö must be
  JSON-safe so it can be saved to `localStorage`/`IndexedDB`).
- **Animation (2D/UI):** Framer Motion.
- **Avatar/moment layer:** layered 2D sprite avatar + `lottie-web` (via
  `lottie-react`) for expression overlays and milestone "sting" animations
  (see DESIGN.md ┬º7). **No React Three Fiber / WebGL for v1** ΓÇö this is a
  deliberate scope decision to keep the bundle light and ship faster; a
  3D upgrade is a possible post-launch stretch goal only, not part of
  this build.
- **Audio:** Howler.js, driven by a single `SoundManager` service.
- **Persistence:** `localStorage` for MVP ΓåÆ upgrade path to `IndexedDB`
  (via `idb-keyval`) once save files include multiple characters/history.
- **Testing:** Vitest for logic (event engine, stat math), Playwright for
  smoke E2E on the core loop only.
- **Hosting:** Vercel, static/ISR where possible, no serverless functions
  unless explicitly required (e.g., a future optional leaderboard).

Do not introduce Redux, GraphQL, a real backend, or a paid asset pack.
If a feature seems to need one, stop and propose alternatives instead of
adding cost/complexity.

## 4. Project structure the agent must produce and maintain

```
/app                     # Next.js routes (mostly one page app + a few modals-as-routes)
/components
  /ui                    # Buttons, panels, sheets ΓÇö pure presentational
  /game                  # LifeStage, StatBars, EventCard, RelationshipTree, etc.
  /avatar                # Layered 2D avatar + Lottie expression/moment overlays
/lib
  /engine                # Pure TS game logic ΓÇö NO React, NO DOM. Fully unit-testable.
    stats.ts
    aging.ts
    events/
      registry.ts        # event pool + weighting
      categories/*.ts     # school.ts, crime.ts, relationships.ts, career.ts, etc.
    rng.ts                # seeded RNG wrapper (see ┬º6)
  /audio                  # SoundManager, sound manifest
  /store                  # zustand store(s), persistence adapters
  /save                   # serialize/deserialize, versioned save schema + migrations
/content                  # JSON/TS data: names, jobs, schools, flavor text, assets metadata
/public
  /audio
  /models (glb, low-poly)
/tests
```

**Hard rule:** game logic (`/lib/engine`) must never import React or touch
the DOM. This is what makes it testable and what stops "spaghetti UI logic."

## 5. Workflow the agent must follow for every feature

1. **Plan** ΓÇö restate the feature in 3-5 bullets referencing the relevant
   DESIGN.md section before writing code.
2. **Engine first** ΓÇö implement/extend pure logic in `/lib/engine` with
   unit tests. No UI yet.
3. **Store wiring** ΓÇö expose the new state/actions via the zustand store.
4. **UI** ΓÇö build the component, reuse existing design tokens (see ┬º8),
   wire animation + sound reactions last.
5. **Verify** ΓÇö run `npm run typecheck`, `npm run test`, `npm run lint`
   before considering the feature done.
6. **Self-review** ΓÇö check against the "Definition of Done" in ┬º10.

Never build UI before the underlying engine function exists and has a test.
This keeps "cool 3D interactive UI" from becoming a pile of fake buttons
with no real simulation behind them.

## 6. Determinism & fairness

- All randomness must go through a single seeded RNG (`/lib/engine/rng.ts`)
  so runs can be replayed/debugged and saves are stable across reloads.
- Never use `Math.random()` directly outside `rng.ts`.
- Event probability weights live in data files, not hardcoded in components.

## 7. Performance budget (agent must self-check)

- First load JS Γëñ ~200KB gzipped for the core loop (Lottie/audio libs
  excluded via dynamic `import()` and loaded only when an expression/
  moment animation or sound actually fires).
- Lottie assets: keep individual JSON files small (prefer simple shape
  animations over dense/raster-heavy exports); cap simultaneous playing
  Lottie instances (avatar expression + at most one moment sting at a
  time), pause any off-screen Lottie player.
- Audio files: compressed (OGG/MP3 Γëñ 64ΓÇô96kbps for SFX), total initial
  audio payload Γëñ ~1.5MB; stream/lazy-load ambient music.
- Target: interactive within ~2s on a mid-range phone over 4G.

## 8. Design-system discipline

- All colors, spacing, radii, shadows, and motion durations come from a
  single `theme.ts`/Tailwind config ΓÇö no magic hex codes or ad-hoc `ms`
  values scattered in components.
- Motion has two tiers: **micro** (button press, stat tick ΓÇö 100ΓÇô200ms)
  and **moment** (life event resolves, death, big win ΓÇö 400ΓÇô900ms with
  the 3D/confetti/sound layer). Don't blur the two.
- Respect `prefers-reduced-motion` and provide a Settings toggle to
  disable 3D flourishes and/or sound entirely ΓÇö required, not optional.

## 9. Content & legal hygiene

- All copy, event text, names, and job titles must be original (agent may
  reference BitLife's *category list* as inspiration per DESIGN.md but must
  not copy its exact strings).
- Only use audio/3D assets that are CC0, CC-BY (with attribution file), or
  agent-generated procedurally (e.g., simple synthesized SFX via Web Audio,
  low-poly primitives built in Three.js). Track attributions in
  `/public/audio/CREDITS.md` and `/public/models/CREDITS.md`.
- No real celebrity names, no real politicians, no copyrighted characters,
  no depictions of real people ΓÇö generate fictional NPCs only.

## 10. Definition of Done (per feature/PR)

A feature is done only when:
- [ ] Engine logic has unit tests covering normal + edge cases (e.g., stat
      clamps at 0/100, character death mid-event, negative net worth).
- [ ] Feature works with keyboard only and with a screen reader label set.
- [ ] Feature works at 360px width and at desktop width.
- [ ] Reduced-motion / sound-off modes degrade gracefully, not broken.
- [ ] Save/load round-trips correctly through this new state.
- [ ] No new console errors/warnings.
- [ ] Bundle-size check hasn't silently regressed (no new always-loaded
      heavy dependency).

## 11. What the agent should NOT do without asking first

- Add a paid service, paid font, or paid asset of any kind.
- Add a real backend/database beyond optional free-tier Vercel KV/Edge
  Config for a stretch-goal leaderboard.
- Rename the project to include "BitLife" or any other trademarked term.
- Ship a mechanic not described in DESIGN.md without adding it there first.
- Silently change the tech stack in ┬º3.

## 12. Communication style during the build

When reporting progress, the agent should:
- State which DESIGN.md section it implemented.
- Note any deviation and why.
- List what's left in the current milestone (see init.md for milestone list).
- Flag any asset it *needs* (a specific SFX, a specific icon) rather than
  silently placeholdering it forever.
