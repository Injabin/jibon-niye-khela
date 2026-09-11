# Jibon Niye Khela

**Jibon Niye Khela** (জীবন নিয়ে খেলা) is a free, browser-based life simulator written in colloquial Dhakaiya Bangla. Players guide a fictional character from birth through childhood, education, work, relationships, family life, money problems, health events, and old age. Every year brings new choices, consequences, and opportunities for a different story.

The game is designed to remain playable without an account, paid backend, or permanent internet connection. A Gemini-powered narrative layer can generate fresh events, while a curated local event bank keeps the core game working when the API is unavailable, rate-limited, or not configured.

## Highlights

- Life simulation with yearly aging and age-specific events.
- Dhakaiya Bangla dialogue, slang, humor, and cultural context.
- Education, career, relationships, marriage, family, crime, health, assets, savings, loans, and legacy systems.
- Choice-driven events that alter stats, money, relationships, reputation, and future eligibility.
- Gemini event generation through a server-only API route.
- Curated fallback events for offline play and API failures.
- Local save persistence with JSON export and import.
- Responsive interface for mobile and desktop screens.
- Motion, sound, haptic feedback, keyboard controls, and reduced-motion support.
- Progressive Web App support with a service worker and installable assets.

## How the game works

1. Start a new life or configure a custom character.
2. Use the active menus to study, work, exercise, manage money, meet people, build relationships, and make other decisions.
3. Choose **Age Up** to advance one year.
4. Resolve the events and choices generated for that stage of life.
5. Watch the character's health, happiness, smarts, looks, money, relationships, and history change.
6. When the character dies, review the life summary and continue as an eligible heir or begin a new life.

The main life stages are:

| Stage | Ages | Examples |
| --- | ---: | --- |
| Infant | 0-2 | Family events and early development |
| Child | 3-12 | School, friendships, hobbies, and family life |
| Teen | 13-17 | High school, part-time work, dating, and first risks |
| Young adult | 18-25 | Higher education, careers, marriage, and independence |
| Adult | 26-64 | Career growth, family, business, assets, and major choices |
| Senior | 65+ | Retirement, health, legacy, and later-life events |

## Technology

- [Next.js](https://nextjs.org/) 16 with the App Router
- React 19 and TypeScript in strict mode
- Tailwind CSS 4 with CSS design tokens
- Zustand for serializable client-side game state
- Framer Motion for UI animation
- Howler.js for audio
- Three.js and React Three Fiber for selected visual experiences
- Vitest and Testing Library for unit and component tests
- Playwright and axe-core for end-to-end and accessibility checks
- Vercel-compatible serverless API routes

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A modern browser with JavaScript enabled

Gemini access is optional. Without it, the local fallback event bank remains available.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Injabin/jibon-niye-khela.git
cd jibon-niye-khela
npm install
```

Start the development server:

```bash
npm run dev
```

Open [https://jibon-niye-khela-6oze.vercel.app/](https://jibon-niye-khela-6oze.vercel.app/).

## Environment variables

Create a local `.env.local` file only when you want live Gemini-generated events:

```env
GEMINI_API_KEY=your_gemini_api_key
```

`GEMINI_API_KEY` is read only by the server-side Gemini client. Never expose it through a `NEXT_PUBLIC_` variable, commit it to Git, or place it in client-side code.

When the key is absent, invalid, throttled, exhausted, or the request times out, the game uses its local fallback content. This is intentional: the fallback path is part of the product, not just a development stub.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Run ESLint with the Next.js ruleset |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright suite against a production server |
| `npm run icons` | Generate PWA icons |
| `npm run sweep:legal` | Scan project content for legal/compliance issues |
| `npm run lighthouse` | Run the Lighthouse check script |

Before opening a pull request, run the focused checks below:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

The end-to-end suite starts its own production server through `playwright.config.ts`. If port `3000` is already in use, stop the existing process or adjust the local Playwright configuration.

## Architecture

The application keeps the simulation state in the browser and separates game rules from presentation:

```text
app/                    Next.js routes and the Gemini API route
components/             Game screens, menus, avatar, motion, and shared UI
content/                Names, traits, Bangla voice guidance, and fallback events
lib/engine/             Pure TypeScript rules: RNG, aging, stats, events, and types
lib/ai/                 Gemini client, prompt builder, validation, orchestration, and fallback selection
lib/store/              Zustand game store and player actions
lib/save/               Save serialization, import/export, and migrations
lib/audio/              Sound manager and audio state
lib/theme/              Theme concepts, semantic colors, and UI metadata
public/                 Images, audio, animation assets, and the service worker
tests/                  Unit, component, accessibility, and end-to-end tests
```

### Event generation

The hybrid event engine follows this flow:

1. The client decides whether the current age is eligible for a Gemini event.
2. The server route validates the request and builds a constrained Dhakaiya prompt.
3. Gemini returns one structured event with choices.
4. The server validates the event schema, age range, safety rules, and category.
5. The client stores the accepted event in the current life history.
6. Any failure falls back to a context-aware local event selected by age, religion, traits, flags, tone, and recently used event IDs.

AI calls are deliberately limited per life and prioritized for milestone ages. Generated text is saved with the life so reloading a saved game does not require regenerating previous events.

### State and saves

The Zustand store is the main application boundary for game actions. Engine data is kept JSON-serializable so it can be persisted and exported. Save operations support:

- Local browser persistence.
- Versioned serialization and migration hooks.
- Formatted JSON export.
- Import validation and restoration.
- Resetting local game state.

Do not put API keys, class instances, DOM objects, functions, or transient UI state into a saved character.

## Content and language

The player-facing language is intended to be natural, informal Dhakaiya Bangla rather than a literal translation of English. The voice guide and fallback event files are the canonical content sources for the local experience.

When adding content:

- Keep dialogue age-appropriate and culturally grounded.
- Preserve the character's religion, age, relationships, career, and existing flags.
- Use original characters, locations, situations, and wording.
- Avoid real-world public figures and living celebrities.
- Do not add graphic violence, explicit sexual content, or sexual content involving minors.
- Do not glorify self-harm or suicide.
- Have a native Dhakaiya speaker review new Bangla before shipping it.

The content pipeline is designed for humor and consequence without requiring an online service for basic play.

## Accessibility and interaction

The interface includes keyboard-accessible actions, focus handling for event overlays, semantic labels, reduced-motion support, and automated accessibility coverage. The main event choices can be selected with number keys `1` through `4` when focus is not inside a form field. `Escape` handles the active modal or pause state, and `?` opens the shortcuts view.

Audio does not autoplay. Sound and motion settings are user-controlled, and the game should remain usable when either is disabled.

## Deployment

The project is suitable for a Vercel deployment:

1. Import the repository into Vercel.
2. Use the default Next.js build settings.
3. Add `GEMINI_API_KEY` as a server-side environment variable if live AI events are desired.
4. Deploy and verify the production URL.
5. Run the production smoke and accessibility checks against the deployed build when making release changes.

The Gemini API route is intentionally stateless. Game state and saves remain on the player's device; the API route only validates a request and returns a generated event.

## Project conventions

- Keep game rules in `lib/engine` and free of React or browser APIs.
- Keep client-only behavior out of server-only Gemini modules.
- Prefer existing design tokens, UI components, and store actions over one-off implementations.
- Keep public APIs and save schemas backward-compatible when possible.
- Add or update focused tests for engine behavior, save migrations, content filtering, and user-visible flows.
- Do not commit `.env.local`, API keys, build output, or browser test artifacts.

## License and credits

This repository contains original project code and project-specific content. Review [public/CREDITS.md](public/CREDITS.md) for third-party asset and attribution information. Check the repository's legal sweep before shipping new assets, fonts, audio, or generated content.

## Status

Jibon Niye Khela is under active development. Game systems and content continue to evolve, so save schema changes and language/content revisions should be reviewed carefully before release.# Jibon Niye Khela

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
- Vitest (logic tests) + Playwright (e2e across every milestone gate)

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
npm run test:e2e     # full Playwright suite (build + start + test)
npm run build        # production build
npm run start        # serve the production build
npm run icons        # regenerate PWA icons (PNG encoder, zero deps)
npm run sweep:legal  # trademark/brand sweep over tracked sources
npm run lighthouse   # Lighthouse mobile gate (build + serve + scan)
```

## Testing

`npm run test` runs the engine/store/content unit suite (`tests/`). `npm run
test:e2e` runs the full Playwright suite (`tests/e2e/`) against a production
`next start` build — it self-builds first, so there is no dev-server flake.
The suite covers the core loop, every gameplay system, save/export, family
tree, life summary, legacy/heir mode, accessibility, axe scans, PWA/offline,
a keyboard-only full life, three divergent livethroughs, and robustness
(rapid age-up, 360px resize, multi-tab).

## Project structure

```
/app          Next.js routes (+ PWA manifest, icon, service worker)
/components
  /ui         Pure presentational primitives (buttons, modals)
  /game       Life stage, stat bars, event card, panels
  /family     Interactive family-tree graph
  /pwa        Service-worker registration
  /avatar     Layered 2D avatar + Lottie expression overlays
  /three      React Three Fiber scenes (character, world, stingers)
/lib
  /engine     Pure TS game logic — no React, no DOM. Fully unit-tested.
  /audio      SoundManager (Howler) + sound manifest
  /store      Zustand store(s), persistence adapters
  /save       Versioned save schema + migrations
  /hooks      Shared client hooks (modal overlay focus trap, reduced motion)
/content      Original data: events, jobs, schools, names, achievements
/scripts      Repro tooling (PWA icons, legal sweep, Lighthouse gate)
/public/audio CC0 sound + music assets (see CREDITS.md)
/tests        Vitest unit tests
/tests/e2e    Playwright suite (gates, M6, final gate, PWA, axe, a11y)
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
