# Jibon Niye Khela

**Jibon Niye Khela** ("Playing with Life") is a free, browser-based life
simulation game (original IP). You are born, grow up one year at a time, make choices
across education, career, relationships, crime, health and money — then die,
get a life summary, and start again.

Built as a single-page, fully client-side app that costs $0 to host.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 + design tokens in `lib/theme.ts` / `app/globals.css`
- Zustand (JSON-safe state, persisted to localStorage)
- Framer Motion (UI animation)
- React Three Fiber + drei + three (procedural 3D character & moments)
- Howler.js (sound effects + music)
- Vitest (logic tests) + Playwright (core-loop smoke tests)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev          # dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run
npm run test:watch   # vitest (watch)
npm run test:e2e     # playwright (core loop smoke test)
npm run build        # production build
npm run start        # serve the production build
```

## Project structure

```
/app          Next.js routes
/components
  /ui         Pure presentational primitives (buttons, modals)
  /game       Life stage, stat bars, event card, panels
  /avatar     Layered 2D avatar + Lottie expression overlays
  /three      React Three Fiber scenes (character, world, stingers)
/lib
  /engine     Pure TS game logic — no React, no DOM. Fully unit-tested.
  /audio      SoundManager (Howler) + sound manifest
  /store      Zustand store(s), persistence adapters
  /save       Versioned save schema + migrations
/content      Original data: events, jobs, schools, names, achievements
/public/audio CC0 sound + music assets (see CREDITS.md)
/tests        Vitest unit tests
```

## Deploying to Vercel

This app deploys on the free (Hobby) tier with zero configuration.

1. Push this repository to GitHub.
2. In the Vercel dashboard, choose **Add New → Project** and import the repo.
3. Framework preset is automatically detected as **Next.js** — keep defaults.
4. Deploy. Production branch builds are generated on every push.

There are no environment variables and no serverless functions required; the
game runs entirely on the client after the first load.

## Notes on content & assets

- All game content (names, events, jobs, schools) is original and fictional.
  No trademarked terms, no real public figures, no copyrighted characters.
- All audio/3D assets are either procedurally generated or CC0/CC-BY and
  credited in `public/audio/CREDITS.md` (and corresponding credits files).