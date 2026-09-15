<div align="center">

# জীবন নিয়ে খেলা

### Jibon Niye Khela — *Playing with Life*

**A free, browser-based life simulator written in Dhakaiya Bangla.**

Born into a family in Dhaka. Grew up. Made choices. Lived a life.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-jibon--niye--khela-0a0a0a?style=for-the-badge&labelColor=0a0a0a&color=ffffff)](https://jibon-niye-khela-6oze.vercel.app/)
[![CI](https://img.shields.io/badge/TESTS-500%2F500-059669?style=for-the-badge&labelColor=0a0a0a&color=059669)](#testing)
[![License](https://img.shields.io/badge/LICENSE-ORIGINAL_IP-0a0a0a?style=for-the-badge&labelColor=0a0a0a)](#license)

</div>

---

## What is this?

**Jibon Niye Khela** is a text-driven life simulation game. You are born with random traits, stats, and a family. Every year, you make choices — study, work, fall in love, commit crime, buy property, start a business — and watch the consequences unfold. Eventually, you die, get a life summary, and decide whether to continue as your heir or begin a brand new life.

Everything runs in the browser. No account. No server-side game state. No paywall. A Gemini-powered narrative engine generates fresh Dhakaiya Bangla events when available; a curated local fallback keeps the game fully playable offline.

---

## Features

**Life Simulation**
Year-by-year progression from infancy through old age, with age-gated events, career paths, relationships, crime, health crises, asset management, and generational legacy.

**Authentic Dhakaiya Bangla**
All player-facing dialogue, slang, humor, and cultural context are written in natural, informal Dhakaiya Bangla — not translated English.

**Hybrid Event Engine**
A Gemini-powered server route generates fresh narrative events; a local bank of curated fallback events covers every age, religion, career, and life situation. The game works without an API key.

**Player-Chosen Assets**
Buy exactly what you want — a Honda Dio scooter, a Toyota Corolla, a flat in Dhanmondi, gold jewelry, shares on the stock market, or digital assets — each with Bangla names and tiered prices.

**Full Financial Model**
Money, savings, loans, debt, interest, salary, business revenue, asset depreciation, and inflation-aware pricing across 6 asset categories.

**Relationships & Family**
Marriage, divorce, affairs, family trees, baby-naming ceremonies, sibling bonds, parent-child dynamics, and NPC life progression.

**Immersive Experience**
Motion design, sound effects, haptic feedback, keyboard controls, and reduced-motion support. Progressive Web App with offline install.

**500 Tests**
Comprehensive unit, integration, accessibility, and end-to-end coverage — including eligibility audits, state-mutation proofs, and full-life Playwright simulations.

---

## How it works

```
┌─────────────────────────────────────────────────────────────────┐
│  BIRTH  →  CHILDHOOD  →  TEEN  →  ADULT  →  OLD AGE  →  DEATH │
│                                                                 │
│  Each year:                                                     │
│    1. See events generated for your current life stage          │
│    2. Make choices that alter stats, money, relationships       │
│    3. Use active menus to study, work, manage money, socialize  │
│    4. Hit "Age Up" to advance one year                          │
│    5. Repeat until the character passes away                    │
└─────────────────────────────────────────────────────────────────┘
```

| Stage | Ages | What happens |
|---|---:|---|
| **শিশু** (Infant) | 0–2 | Family events, early development |
| **ছোট বাচ্চা** (Child) | 3–12 | School, friendships, hobbies, family life |
| **কিশোর** (Teen) | 13–17 | High school, part-time work, dating, first risks |
| **তরুণ** (Young Adult) | 18–25 | University, careers, marriage, independence |
| **প্রাপ্তবয়স্ক** (Adult) | 26–64 | Career growth, family, business, assets, major choices |
| **বয়স্ক** (Senior) | 65+ | Retirement, health, legacy, later-life events |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 with design tokens |
| State | [Zustand](https://github.com/pmndrs/zustand) — JSON-serializable, persisted to localStorage |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| 3D | [React Three Fiber](https://docs.pmndrs.com/react-three-fiber/) + drei |
| Audio | [Howler.js](https://howlerjs.com/) |
| AI | Google Gemini 3.6 Flash (optional, server-only) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) + axe-core |
| Hosting | Vercel (Hobby tier, zero config) |

---

## Quick start

```bash
git clone https://github.com/Injabin/jibon-niye-khela.git
cd jibon-niye-khela
npm install
npm run dev
```

Open **http://localhost:3000** and start a new life.

### Optional: AI-generated events

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The key is read server-only. Without it, the game uses the local fallback bank — fully playable, zero degradation for core gameplay.

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint with Next.js rules |
| `npm run test` | Run Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright suite against production build |
| `npm run icons` | Regenerate PWA icons |
| `npm run sweep:legal` | Legal/compliance scan |
| `npm run lighthouse` | Lighthouse mobile audit |

---

## Architecture

```
app/                    Next.js routes and Gemini API route
components/
  ui/                   Pure presentational primitives
  game/                 Life stage, stat bars, event cards, menus
  family/               Interactive family tree graph
  avatar/               Layered 2D avatar + expression overlays
  three/                React Three Fiber scenes
  pwa/                  Service-worker registration
lib/
  engine/               Pure TypeScript game rules — no React, no DOM
  ai/                   Gemini client, prompt builder, validation, fallback
  store/                Zustand game store and player actions
  save/                 Versioned save schema and migrations
  audio/                Sound manager and audio state
  theme/                Design tokens and semantic colors
content/                Names, traits, fallback events, Bangla voice guidance
public/                 Images, audio, animation assets, service worker
tests/                  Unit, integration, audit, and end-to-end tests
scripts/                Repro tooling (PWA icons, legal sweep, Lighthouse)
```

### Event generation flow

```
Client decides age is eligible for AI event
  → Server validates request, builds constrained Dhakaiya prompt
    → Gemini returns structured event with choices
      → Server validates schema, age range, safety rules, category
        → Client stores event in life history

  Any failure → context-aware local event selected by:
    age · religion · traits · flags · tone · recently used IDs
```

AI calls are rate-limited per life and prioritized for milestone ages. Generated text is saved with the life so reloading never requires regenerating past events.

### Audit suite

28 dedicated audit tests (`tests/audit/`) prove engine correctness:

- **Part A — Eligibility**: static tag hygiene + 56-life simulation sweep proving no life ever draws a gender/religion/age-ineligible event from either pool.
- **Part A — Flags**: every required/anti flag is vocabulary-registered or engine-granted; no orphan removes; oncePerLife checks.
- **Part B — State mutation**: career salary → money; asset buy/sell → money+flags+assets; marriage/divorce → flags+relationship; criminal record → persistence + job gating.

---

## Testing

```bash
npm run test        # 500 tests across 52 files — unit, integration, audit
npm run test:e2e    # Playwright: full-life simulations, save/load, a11y, PWA
```

The Playwright suite builds its own production server, runs every gameplay milestone gate, validates axe-core accessibility, tests keyboard-only play, rapid age-ups, 360px resize, and multi-tab robustness.

---

## Deployment

Deploys on Vercel's free Hobby tier with zero configuration:

1. Push to GitHub.
2. Import in Vercel → **Add New → Project**.
3. Framework auto-detected as Next.js — keep defaults.
4. (Optional) Add `GEMINI_API_KEY` as a server-side env var.
5. Deploy. Every push to `main` triggers a production build.

Game state stays in the player's browser. The API route is stateless — it only validates a request and returns a generated event.

---

## Content guidelines

- Keep dialogue age-appropriate and culturally grounded in Dhaka/Bangladesh.
- Preserve character religion, age, relationships, career, and existing flags.
- Use original characters, locations, situations, and wording.
- No real-world public figures or living celebrities.
- No graphic violence, explicit sexual content, or content involving minors.
- No glorification of self-harm or suicide.
- Have a native Dhakaiya speaker review new Bangla before shipping.

---

## Contributing

1. Keep game rules in `lib/engine` — pure TypeScript, no React, no DOM.
2. Keep client-only behavior out of server-only Gemini modules.
3. Prefer existing design tokens, UI components, and store actions.
4. Maintain backward-compatible public APIs and save schemas.
5. Add focused tests for any new engine behavior, migration, or user flow.
6. Run `npm run typecheck && npm run lint && npm run test && npm run build` before opening a PR.

---

## License & credits

Original project code and content. See [`public/CREDITS.md`](public/CREDITS.md) for third-party asset attributions. Audio assets are CC0/CC-BY. All game content — names, events, jobs, schools — is original and fictional.

---

<div align="center">

**Made with care in Dhaka.**

*Every life tells a different story.*

</div>
