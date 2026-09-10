# init.md — Jibon Niye Khela v2 "Dhakaiya Bangla Edition"
# MASTER BUILD DOCUMENT — the agent must follow this file strictly.

This is the single source of truth for this build. It replaces the
direction (not necessarily every reusable line of code) of all earlier
documents. Read §0 before touching anything.

---

## 0. Supersession notice — read this first

The following older documents describe a **previous direction** (English/
generic content, "Modern Martial" Claymore theme, purely static local
event pool, no backend at all): `AGENT.md`, `DESIGN.md`, `UI-DESIGN.md`,
`TESTING.md`, the original `init.md` (now saved as
`init_v1_archived.md`), `Additional_plus_improved_plan.md`.

**Status of each, under this v2 pivot:**
- `ui-ux-guide.md` — **PROMOTED.** This is now the actual, live UI theme
  (not optional/reference anymore). Adorable-Home-style cozy/kawaii
  design replaces the Claymore theme entirely.
- `AGENT.md`, `DESIGN.md`, `UI-DESIGN.md`, `TESTING.md`,
  `init_v1_archived.md`, `Additional_plus_improved_plan.md` —
  **ARCHIVED.** Do not follow their Claymore-theme instructions, their
  English-content assumptions, or their "Phase 7–12" plan going forward.
  Their *engineering discipline* (test-gate rigor, git conventions,
  definition-of-done habits) is still good practice and is carried
  forward into this document in condensed form (§8) — but their
  *content and theme direction* is superseded.
- Do not delete the archived files — move them into a `/docs/archive/`
  folder in the repo so history isn't lost, and reference them only if
  genuinely reusable engine code needs to be located.

**Because the previous agent run left the codebase in a mismatched,
partially-working state, Phase 0 below is a mandatory audit — do not
assume anything in the current repo works until Phase 0 confirms it.**

If this document is later split into separate `DESIGN.md`, `AGENT.md`,
`TESTING.md`, or `UI-DESIGN.md` files for maintainability (reasonable
once the project grows), those files must not diverge from what's
specified here — this document remains authoritative in case of conflict.

---

## 1. Project vision & pillars (v2)

**Jibon Niye Khela** is a free, browser-based life simulator, entirely in
**colloquial Dhakaiya Bangla** (not formal/standard Bangla, not English),
visually styled as a warm, cute, cozy "Adorable Home"-inspired experience,
with the full breadth of BitLife's feature set (education, career,
romance/marriage/cheating, crime, health, assets, family tree, custom
life, achievements) reframed for a Dhakaiya cultural/linguistic context.
The game's "brain" for generating life-event situations and choices is
the **Google Gemini API** (free tier), used live at runtime, with a local
fallback bank so the game never breaks if the API is unavailable.

Pillars:
1. **Feels like a real Dhakaiya conversation, not a translation.** Content
   must read as natural spoken Dhaka-dialect Bangla — playful, cheeky,
   locally flavored — never stiff textbook Bangla and never Bengali-
   script English.
2. **Endless, genuinely varied situations.** The Gemini-powered engine
   should make near-infinite unique event phrasing possible, solving the
   "every life feels the same" problem structurally, not just by
   authoring more static content.
3. **Warm and huggable, not epic.** The Adorable Home visual language
   (soft, rounded, pastel) is now the actual identity of the game.
4. **Reliable even when the AI isn't.** The game must remain fully
   playable, funny, and complete if the Gemini API is down, rate-limited,
   or the player is offline.
5. **Free forever**, including the AI layer — architecture must respect
   Gemini's free-tier limits by design (caching, batching, fallback), not
   assume unlimited calls.

---

## 2. Language & voice guide

### 2.1 Script decision (confirm, default assumed)

**Default: real Bangla script (বাংলা ইউনিকোড), not Romanized "Banglish."**
Rationale: the request for "a cool cartoonish Bangla font" only makes
sense with actual Bangla-script text — a Latin font can't render Bangla
script. If Romanized Banglish (e.g., "tumi poida hoiso") is actually
preferred for readability by an international/mixed-script-literate
audience, that's a valid alternative, but it's a different content
pipeline and font strategy — **confirm this explicitly before Phase 1
starts**, since it changes font selection, Gemini prompt design, and
possibly the whole text-rendering approach.

### 2.2 Voice / tone guide

- Register: informal, spoken **Dhakaiya dialect** — not "শুদ্ধ" (standard/
  formal) Bangla. Use Dhaka-regional vocabulary, contractions, and
  particles the way people actually talk in Dhaka, not textbook grammar.
- Tone: warm, teasing, funny, occasionally cheeky/spicy for adult
  content (per §5's content-safety rules) — matches the "premium fun"
  goal from earlier planning, just now natively Bangla instead of
  translated English.
- **Canonical reference lines** (as given, to anchor the voice — treat
  these as ground-truth tone examples for prompting Gemini and for
  writing the static fallback bank):
  - Birth moment: *"tumi poida hoiso, ehon tumi sobar jigar ka tukra"*
  - First-name-for-a-relative choice: *"tumi ehon tomar poyla dak dibar
    loiba, kare dakbar loiba? ma, bap, nani, na dadi?"*
  - (Transliterate these into actual Bangla script per §2.1's decision
    before shipping — they're given here in Latin transliteration as the
    voice reference, not necessarily the final on-screen encoding.)
- Build a **slang/phrase bank** (a living content file, not hardcoded
  once) of common Dhakaiya words/particles/interjections to seed both the
  Gemini prompt's few-shot examples and the static fallback content —
  e.g., colloquial words for "friend," "money," "trouble," "awesome,"
  "uh-oh," common sentence-ending particles, etc. This should be built
  collaboratively with a native speaker (you), not invented solely by the
  AI agent.

### 2.3 Mandatory human review checkpoint

**Neither Gemini's nor the build agent's Bangla is guaranteed to be
authentic Dhakaiya slang without native review.** Before any AI-generated
or static Bangla content ships to Phase 3+ testing, a native-speaker
review pass (you) must sample-check a batch of generated event text for:
- Actually sounding like spoken Dhakaiya Bangla, not formal Bangla or a
  stiff translation.
- No unintentionally offensive/wrong word usage from slang ambiguity.
- Grammatical correctness within the informal register.

This is a recurring checkpoint, not a one-time gate — re-sample
periodically as the Gemini prompt or fallback bank changes.

### 2.4 Typography

- Primary font: a **Bangla-script-supporting, rounded/playful font**,
  matching `ui-ux-guide.md` §7's "friendly, rounded, not sharp"
  direction. Candidates to evaluate (self-hosted via `next/font`, no
  paid font service): **Baloo Da 2** (rounded, playful, strong Bengali
  glyph support — good header/display candidate), **Hind Siliguri**
  (clean, highly readable, good body-text candidate), **Atma** or
  **Mina** as alternate display options. Pick a header font + a body
  font pairing, don't use one rounded/decorative font for dense body
  text (readability risk).
- Confirm actual glyph coverage and rendering quality for the *specific*
  conjuncts/vowel signs used in your event content before locking a
  font choice — Bangla script has many combining forms; not every
  "pretty" Bangla web font renders every conjunct cleanly. Spot-check
  with real generated sentences, not just the alphabet.

---

## 3. Software architecture (v2)

### 3.1 Tech stack (updated)

Carried forward from the archived `AGENT.md`, with one addition:
- **Framework:** Next.js 14+ (App Router), TypeScript strict.
- **Styling:** Tailwind CSS + CSS variables, tokens now sourced from
  `ui-ux-guide.md` (pastel palette, large radii) instead of the old
  Claymore tokens.
- **State:** Zustand, JSON-serializable.
- **Animation:** Framer Motion — bouncy/overshoot easing per
  `ui-ux-guide.md` §8, not the old restrained Claymore motion.
- **Audio:** Howler.js via the existing `SoundManager` pattern.
- **NEW — AI content layer:** a Next.js **API route** (e.g.
  `/app/api/generate-event/route.ts`) running server-side only, calling
  the Google Gemini API. This is a deliberate, approved exception to the
  old "no backend" rule — it's a thin serverless proxy, still $0 on
  Vercel's free tier, never a database or stateful server.
- **Persistence:** `localStorage`/`IndexedDB` as before — generated event
  text must be **stored in the save**, not re-fetched on reload (see §4.5).

### 3.2 Folder structure additions

```
/app
  /api
    /generate-event
      route.ts          # server-only Gemini proxy, validates + returns JSON
/lib
  /ai
    geminiClient.ts      # server-side only, never imported by client components
    promptBuilder.ts      # builds the structured prompt from game state
    responseValidator.ts   # validates/sanitizes Gemini's JSON output
    fallbackBank.ts        # local static Bangla event bank + selection logic
  /engine                  # unchanged in spirit from the archived AGENT.md —
                             # RNG, stat math, aging, save schema. Audit in
                             # Phase 0 for what's actually reusable as-is.
/content
  /bangla
    voice-guide.ts          # slang/phrase bank, canonical example lines
    fallback-events/*.ts     # curated static Bangla event content (by category)
/public/fonts                # self-hosted Bangla font files
```

### 3.3 Data flow (hybrid content engine)

```
Age Up triggered
   -> client requests a new event from a single content-orchestrator
     function (NOT calling Gemini directly from client components)
   -> orchestrator checks: is Gemini available/not rate-limited/not
     recently failed?
       -> YES: build a structured prompt (age, stage, stats, traits,
         recent event history to avoid repeats, tone target) -> call
         /api/generate-event -> server calls Gemini -> validate response
         against strict JSON schema -> return to client
       -> NO (API down, rate-limited, offline, or validation failed):
         fall back to fallbackBank.ts -- select a locally-authored Bangla
         event matching the same age/stage/flag filters used elsewhere
   -> resulting event (from either source) is applied to engine state
     AND its exact resolved text/choices are written into the save's
     history -- never re-generated differently on reload (see §4.5)
```

---

## 4. AI "brain" integration spec (Gemini)

### 4.1 Key handling (non-negotiable)

- The Gemini API key lives ONLY in a server-side environment variable
  (Vercel project settings), read only inside `/app/api/generate-event/
  route.ts` and `geminiClient.ts`. It must never appear in any file that
  ships to the client bundle, never be logged, never be committed to the
  repo (confirm `.gitignore` covers `.env*`).
- Confirm at build time there's no code path where `geminiClient.ts` gets
  imported by a client component — add a lint rule or explicit code
  comment guard if the framework doesn't already prevent this.

### 4.2 Model & quota (verify at build time, don't assume)

- Use whichever Gemini model is currently offered on the **free tier**
  via Google AI Studio at the time of implementation — model names and
  free-quota limits change over time and may not match what either of us
  currently expects. The agent must check Google AI Studio directly for
  the current free-tier model name and its rate/daily limits before
  hardcoding a model string, and document what it found in a comment at
  the top of `geminiClient.ts`.
- Design around the assumption that free-tier quota is finite and
  fairly low (requests-per-minute and/or per-day caps are typical for
  free tiers) — this is why caching and a fallback bank are mandatory,
  not optional polish.

### 4.3 Prompt design

- The prompt sent to Gemini must be **structured and constrained**, not
  open-ended creative writing. Include: current age, life stage, current
  stats, relevant traits/flags, a short list of recently-fired event
  IDs/summaries to avoid repeats, the target tone (`good | bad | neutral
  | funny`), and explicit Dhakaiya-voice few-shot examples from §2.2's
  canonical lines/slang bank.
- **Demand strict JSON output** matching a fixed schema: `{ situationText:
  string, choices: [{ label: string, statEffects: {...}, tone: string
  }], tag: string }` — with explicit instructions to return ONLY valid
  JSON, no prose wrapper, no markdown fencing.
- Include explicit safety instructions in the system/prompt context:
  no real public figures, nothing sexual involving a character under 18
  at any point, no graphic gore, stay within the tone guide — but treat
  these prompt instructions as a **first layer, not a guarantee** (see
  §4.4).

### 4.4 Response validation (mandatory second safety layer)

Prompt instructions alone are not a reliable safety guarantee for an
LLM. Every Gemini response must pass through `responseValidator.ts`
before it ever reaches game state:
- **Schema validation:** reject anything that doesn't parse as the exact
  expected JSON shape; on failure, fall back to the static bank rather
  than trying to "fix" malformed output.
- **Stat-delta bounds check:** clamp/reject any `statEffects` value
  outside a sane pre-defined range (e.g., plus/minus 25 per single
  choice) so a malformed or unexpected response can't corrupt game
  balance.
- **Content filter pass:** run returned text through a banned-term/
  pattern check (real public figures' names, explicit sexual content
  markers, slurs) — reject and fall back on any match, don't attempt to
  auto-edit flagged content into something "close enough."
- **Age-context filter:** if the character is under 18, apply a stricter
  content filter pass specifically for romance/relationship-tagged
  content, rejecting anything that isn't strictly non-sexual crush/
  dating-appropriate content per the age-gating rules carried forward
  from the archived `DESIGN.md` §11.
- Log validation failures (locally/in a simple counter, no need for a
  full analytics backend) so patterns of frequent rejection can be
  noticed and the prompt design improved over time.

### 4.5 Caching & save integration

- Once an event is resolved (AI-generated or fallback), its exact final
  text and choices are written into that character's save/history
  permanently — reloading the game or revisiting history must show the
  same text, never re-fetch or regenerate it differently.
- To conserve quota within a single session, consider pre-fetching a
  small batch (e.g., 3-5) of upcoming candidate events per age range
  during idle time rather than one blocking call per Age Up — but only
  if this doesn't compromise the "recent event history" anti-repeat
  context Gemini needs; if batching conflicts with that, prefer
  correctness (variety) over the optimization and call one-at-a-time.
- Implement a simple client-side or edge-cached rate-limit awareness: if
  recent calls have been failing/rate-limited, temporarily route to the
  fallback bank for a cooldown period rather than hammering a failing API.

### 4.6 Fallback bank

- A curated, human-reviewed static Bangla event bank (`fallbackBank.ts` +
  `/content/bangla/fallback-events/*`), organized by the same
  category/age-range/tag system used elsewhere in this project. Target
  at least 150-200 hand-authored events here — this is the game's
  reliability floor, not a token afterthought, since it's what plays
  whenever the AI layer isn't available.
- The fallback bank must independently satisfy the same content-safety
  rules as §4.4 — it's authored by humans, but still gets reviewed
  against the same checklist, not assumed safe by default.

---

## 5. Feature parity checklist (full BitLife-equivalent scope, in Bangla)

All of the following systems from the archived `DESIGN.md` §5 are
still in scope — only the language, voice, and content-generation
mechanism change, not the feature list itself:

- [ ] Character creation (random + custom-life creator, per the earlier
      Phase 9.2 concept — names, traits, family wealth tier, all in
      Dhakaiya Bangla content)
- [ ] Core stats (Health, Happiness, Smarts, Looks — relabeled in Bangla,
      not renamed to a different theme's stat set this time, since the
      medieval reskin is retired)
- [ ] Life stages / aging loop (infant to senior), all event/menu copy in
      Bangla
- [ ] Education (school to university), Career (jobs, business,
      military, crime, entertainment/fame, politics -- all fictional),
      Relationships & Romance (dating, girlfriend/boyfriend, marriage,
      cheating, divorce, kids, family tree), Activities (gym, therapy,
      hobbies, social media, pets, travel), Assets & finance, Crime &
      law, Health (illness/injury/addiction handled per the existing
      sensitive-content policy), Death & legacy, Achievements -- every
      one of these gets full Dhakaiya-Bangla content via the hybrid
      engine (§4), not just a handful of hero examples.
- [ ] Family tree UI (already built in a prior iteration -- audit in
      Phase 0 for reuse, restyle per `ui-ux-guide.md`, relabel content
      in Bangla, and re-verify the earlier name-generation bug is still
      fixed under the new Bangla name-generation logic).
- [ ] Sensitive-content policy (carried forward unchanged from the
      archived `DESIGN.md` §11): no glorified self-harm as a rewarded
      choice, no sexual content involving under-18 characters ever, no
      real public figures, crime/death depicted without graphic gore.
      This applies identically to both Gemini-generated and fallback-
      bank content.

---

## 6. UI & avatar theme (Adorable-Home-style, now the live theme)

- Adopt `ui-ux-guide.md` in full as the actual design system: pastel
  palette (§2 of that doc), 16-24px rounded corners, bottom icon toolbar
  navigation, bottom-sheet secondary menus, grid-based shop/item menus,
  bouncy motion.
- **Single consistent avatar**, chibi/blob-proportioned per
  `ui-ux-guide.md` §5 -- build ONE well-crafted avatar system (base body +
  swappable outfit/hair/accessory layers + expression overlays) rather
  than many inconsistent character arts. This avatar is the emotional
  center of every screen, exactly as described in that document's design
  philosophy.
- Apply the Bangla fonts chosen in §2.4 throughout -- confirm every
  screen (not just the character hub) uses the new typography, including
  menus, buttons, and system dialogs.
- This fully resolves the old "Phase 12" gated decision in the archived
  `Additional_plus_improved_plan.md` -- the answer is now (b), full
  replacement. Do not preserve or reference the Claymore token set going
  forward except to locate old code being replaced.

---

## 7. Audio plan

Carried forward from the archived plan's Phase 7 concept, adjusted:
- Reactive human-toned SFX: birth cry, a warm "good news" cue, a
  dismayed "bad news" cue, a distinct somber death cue -- original or
  CC0-sourced, never literal BitLife audio, exactly as previously
  scoped.
- Consider **short Bangla vocal interjections** as an optional enrichment
  layer once the core SFX system works (e.g., a spoken affirmative cue
  for good news, a dismayed cue for bad news) -- flag this as a
  nice-to-have that needs either a voice actor or a carefully chosen
  licensed clip; don't block the core audio system on sourcing this.
- Background music: keep it simple -- one or two mood tracks (matching
  the softer "cozy" tone now, not the earlier "early life / late life"
  martial framing necessarily, though that structural idea -- few tracks,
  crossfaded by life stage -- can still apply) is fine; prioritize a warm,
  gentle instrumental feel consistent with `ui-ux-guide.md`'s philosophy.
- All SFX/music licensing logged in `/public/audio/CREDITS.md` as before.

---

## 8. Engineering & agent operating rules (condensed from the archived AGENT.md)

- **Engine-first workflow, always:** pure logic changes in `/lib/engine`
  and `/lib/ai` before UI changes; unit tests before UI wiring.
- **Definition of Done** for any feature: typecheck/lint/test/build all
  pass; works at 360px-desktop; reduced-motion and sound-off fallbacks
  work; save/load round-trips; no new console errors; AI-layer features
  specifically must also demonstrate the fallback path works (simulate
  an API failure and confirm graceful degradation).
- **Git conventions:** feature branches per phase/step, Conventional
  Commits, PRs even if self-reviewed, tag a release at the end of each
  phase, never commit directly to `main` beyond initial scaffold.
- **Token/session efficiency:** don't re-read files already in context
  unnecessarily, don't over-narrate plans back before acting, batch
  related edits, flag genuine ambiguities in one clear question rather
  than guessing and burning a session on a wrong-direction build.
- **"It works" is not evidence.** Every phase gate below requires real
  pasted command output, real screenshots, or a described reproduction
  actually carried out -- not a summary claim. This rule is being
  repeated deliberately because the previous run's reported completions
  didn't match reality; do not repeat that failure mode.
- **When a claim can't be verified, say so explicitly** rather than
  asserting confidence -- this applies to the agent's own Bangla content
  quality claims too (see §2.3 -- the agent should never claim
  Dhakaiya-authenticity on its own authority).

---

## 9. Phased build plan (each phase gated -- do not proceed without a passing gate)

### Phase 0 -- Audit & reset (mandatory, do this first)

Tasks:
1. Run `npm run typecheck && npm run lint && npm run test && npm run
   build` on the current repo exactly as it stands. Paste the real
   output -- do not summarize.
2. Manually (or via a quick script) inventory every major feature
   claimed as "done" in the archived documents' history and mark each as:
   **working**, **partially working**, **broken**, or **not actually
   built despite being reported done**. Be specific -- name the file/
   component for each.
3. Identify what's genuinely reusable for v2 (likely candidates: RNG,
   stat-clamp math, aging tick logic, save schema versioning, the family
   tree pan/zoom mechanics, the event-choice UI interaction pattern) vs.
   what must be rebuilt (all content/copy -- moving to Bangla; all visual
   styling -- moving to Adorable Home theme).
4. Create an archive folder, move the superseded docs into it per §0,
   and tag the current commit (e.g. `pre-bangla-pivot`) before making
   destructive changes, so nothing is unrecoverably lost.

**Gate 0:**
- [ ] Real, pasted command output for the four commands above.
- [ ] A written inventory table (feature -> actual status -> evidence)
      covering every system listed in the archived `DESIGN.md` §5.
- [ ] Explicit reuse-vs-rebuild decision per major subsystem, with
      reasoning.
- [ ] Archive folder created, git tag created, confirmed via `git tag
      --list` and `git log`.

### Phase 1 -- Language & content foundation

Tasks: confirm the script decision (§2.1) explicitly with the user if
still ambiguous; select and integrate the Bangla font pairing (§2.4),
spot-checked against real sentences; build the initial slang/phrase bank
and canonical voice examples (§2.2) as a real content file, not just
prose in this doc; get the first native-review pass (§2.3) on a small
sample batch before proceeding.

**Gate 1:**
- [ ] Script decision confirmed and documented.
- [ ] Font(s) render every conjunct/vowel-sign used in a 20-sentence
      test sample cleanly -- screenshot the test sample rendered in-app.
- [ ] Voice-guide content file exists with the canonical lines + an
      initial slang bank (minimum ~30 entries).
- [ ] At least one native-review pass completed on a sample batch, with
      feedback incorporated -- describe what changed as a result.

### Phase 2 -- Hybrid content engine (Gemini + fallback)

Tasks: build `/api/generate-event`, `geminiClient.ts`,
`promptBuilder.ts`, `responseValidator.ts` per §4.1-§4.4; build the
initial fallback bank (§4.6) with enough events to be genuinely playable
standalone; implement caching/save-integration per §4.5.

**Gate 2:**
- [ ] Confirm (by inspecting the client bundle / network tab) the Gemini
      API key never appears client-side.
- [ ] Successfully generate at least 20 real events via the live API
      across varied ages/tones, all passing schema + content-filter
      validation -- paste real examples.
- [ ] Deliberately simulate an API failure/rate-limit (e.g., temporarily
      break the key or mock a 429) and confirm the game falls back to
      the static bank seamlessly with no crash or dead-end.
- [ ] Confirm a generated event's text is stable across a save/reload
      (doesn't regenerate differently).
- [ ] Confirm at least one deliberately malformed/unsafe mock response
      is correctly rejected by `responseValidator.ts` and falls back
      rather than reaching game state.

### Phase 3 -- Feature parity content build-out

Tasks: implement/restore the full system list from §5 with Bangla
content flowing through the hybrid engine; re-verify the family-tree
name-generation fix under the new content pipeline; build out romance/
marriage/cheating/divorce and custom-life creator content in Bangla.

**Gate 3:**
- [ ] Every system in §5's checklist is reachable and produces
      meaningfully different Bangla outcomes based on player choice --
      walk through each once with evidence.
- [ ] Repetition check: simulate multiple lives and confirm the
      anti-repeat/variety mechanisms (recent-event-history context to
      Gemini, fallback-bank rotation) actually produce varied content,
      not the same handful of lines every life.
- [ ] Age-gating/content-safety spot-check across a meaningful sample of
      both AI-generated and fallback romance content.

### Phase 4 -- Adorable-Home UI & avatar

Tasks: apply `ui-ux-guide.md` tokens/components fully; build the single
avatar system with layered customization + expressions; ensure Bangla
typography is applied everywhere, not just the hub screen.

**Gate 4:**
- [ ] Every screen uses the new pastel/rounded token set -- grep for any
      leftover Claymore hex values or 4px-radius remnants; must return
      zero.
- [ ] Avatar reads clearly at both toolbar-icon size and full-screen size
      (screenshot both).
- [ ] Contrast-check the new pastel palette per `ui-ux-guide.md` §9 --
      paste real computed ratios, don't assume pastel is automatically
      accessible.
- [ ] Bangla text renders correctly (no broken conjuncts, no tofu boxes)
      across every screen, not just previously-tested samples.

### Phase 5 -- Audio

Tasks: implement reaction SFX + BGM per §7; wire to existing mute/volume
settings.

**Gate 5:**
- [ ] Each reaction cue (birth/good/bad/death) fires correctly and is
      spy-tested, not just listened to.
- [ ] Mute toggle silences everything.
- [ ] `/public/audio/CREDITS.md` accurately lists every asset's source.

### Phase 6 -- Full regression, performance, and legal/content QA

Tasks: full accessibility pass, responsive layout check at 360px to
desktop, Lighthouse performance check (with special attention to the
added network latency of live Gemini calls -- must show a clear loading
state, never a frozen UI, and a sane timeout that falls back gracefully),
final legal/content sweep.

**Gate 6:**
- [ ] Lighthouse scores meet or exceed the targets from the archived
      `TESTING.md` Gate 6.
- [ ] Confirm a loading/thinking state is shown during live Gemini calls
      and that a slow/hung request times out into the fallback bank
      within a reasonable bound (e.g., a few seconds) rather than
      leaving the player stuck.
- [ ] Full keyboard-only playthrough, one full life.
- [ ] Final sweep: no trademarked names, no real people anywhere in
      generated or fallback content sampled, all audio/font licenses
      logged, no API keys committed anywhere in git history.

---

## 10. Known-risk register

| Risk | Mitigation (already designed in above) |
|---|---|
| Gemini free-tier quota exhausted under real traffic | Fallback bank + caching + rate-limit-aware cooldown routing (§4.5-4.6) |
| API key leaked client-side | Server-only proxy route, explicit audit step in Gate 2 |
| AI generates unsafe/off-tone content | Two-layer validation: prompt constraints + independent response validator (§4.3-4.4) |
| Bangla content isn't authentically Dhakaiya | Mandatory native-review checkpoints (§2.3), not a one-time pass |
| Repeat of "reported done but actually broken" | Phase 0 audit + repeated "evidence not claims" rule (§8) + hard gates every phase |
| Font doesn't render Bangla conjuncts cleanly | Explicit font spot-check step in Gate 1 |
| Live API calls make the game feel slow/broken | Explicit loading-state + timeout-to-fallback requirement in Gate 6 |

---

## 11. Instructions to the agent

1. Start with Phase 0. Do not skip it, and do not assume anything from
   the previous run is trustworthy until Phase 0's inventory says so.
2. Do not proceed to the next phase until the current phase's Gate is
   fully satisfied with real, pasted evidence.
3. If §2.1 (script decision) or any other explicitly-flagged
   confirmation point is still open, stop and ask before building
   further on top of an unconfirmed assumption.
4. If, during Phase 0's audit, you find that something can be salvaged
   faster than rebuilding from scratch, say so and propose it -- this
   document sets direction and gates, not a mandate to throw away
   everything reusable.
5. Report progress against this document's phase numbers specifically,
   so it's easy to track where we are relative to this plan.
