# Additional_plus_improved_plan.md
# Jibon Niye Khela — Phase 7–11 Expansion Plan

This document extends `init.md` with five new phases (7 through 11). It
does not replace `AGENT.md`, `DESIGN.md`, `UI-DESIGN.md`, or `TESTING.md`
— it builds on top of them. Read all four before starting any phase here.
Each phase below has its own **Gate** (pass/fail test checklist) in the
same style as `TESTING.md` — a phase is not done until its Gate passes
with real evidence, not a summary claim. Do not start the next phase
until the current one's Gate is green.

**One legal/scope note that applies across all five phases:** several
requests below ask for the game to feel "totally like BitLife." Treat
that as **emotional/functional parity** (the same *kind* of moment —
a baby-crying beat at birth, a triumphant sting on a big win, dating and
marriage mechanics, huge event variety) — never as literally copying
BitLife's actual audio files, art, event text, or using real celebrity
names for dating NPCs. That would be copyright/trademark infringement
and, for real-person NPCs, a real-person-depiction risk. Every task below
is written to achieve the *feeling* the user wants using original or
properly-licensed assets and fictional characters, per `AGENT.md` §9 and
`DESIGN.md` §11. If the agent is ever unsure whether something crosses
that line, it must stop and ask rather than "just make it close enough."

---

## Phase 7 — Emotional Audio System (2 BGM tracks + reactive human SFX)

### Objective
Replace/extend the current sound system so the game has an emotionally
reactive audio identity: a small, curated set of **human-voice-like**
reaction sounds tied to event outcomes (birth, good news, bad news,
death), and exactly **two** background music tracks total — one for the
"early life" age span, one for the "late life" age span — instead of a
larger rotating music set.

### Tasks
1. **Reduce BGM to exactly 2 tracks**, per the user's explicit direction:
   - `bgm_early_life` — plays from character birth through roughly the
     end of the Teen life stage (`DESIGN.md` §4: ages 0–17). Should read
     as lighter/warmer in tone.
   - `bgm_late_life` — plays from Young Adult onward (ages 18+) through
     death. Should read as more mature/weightier in tone.
   - Crossfade between the two (not a hard cut) when the age boundary is
     crossed during an Age Up.
   - Remove any additional per-life-stage music tracks that may already
     exist from the earlier Milestone 3 pass — this is a deliberate
     simplification, not an oversight, so don't "add back" more tracks.
2. **Add a small set of reactive human-toned SFX**, functionally
   equivalent to (not copied from) BitLife's reaction stingers:
   - `sfx_birth` — plays once when a new life starts (e.g., a short,
     original baby-cry-style vocalization, either a licensed CC0 clip or
     a simple synthesized/foley substitute — do not source or rip
     BitLife's actual audio file).
   - `sfx_good_event` — a short, warm human-toned affirmation cue (an
     "oh nice!"-feeling sound — can be a vocalization, a chime with a
     human-vocal quality, or a licensed CC0 human reaction clip) that
     plays when an event resolves with a clearly positive outcome.
   - `sfx_bad_event` — a short, human-toned dismay cue ("oh no"-feeling)
     for clearly negative outcomes.
   - `sfx_death` — a distinct, weightier cue for the death/end-of-life
     moment — somber, not comedic, and not reused for any other event.
   - Map these to the existing event `tone` field (`good | bad | neutral
     | funny`, per `DESIGN.md` §10) so the correct cue fires automatically
     — `funny`-toned events can use either the good or a distinct
     "funny/quirky" variant cue; define one if useful, don't force funny
     events into the plain good/bad cues if it reads oddly.
   - All new SFX must go through the existing `SoundManager` (`/lib/audio`)
     and respect the existing mute/volume/reduced-audio settings from
     Milestone 3 — no new bypass path.
3. **Source/produce these assets legitimately**: CC0 sources (freesound.org
   CC0 filter, etc.), simple original recordings, or synthesized/foley
   substitutes. Log every asset and its license in
   `/public/audio/CREDITS.md` per `AGENT.md` §9 — this file must grow to
   include every new asset added in this phase.
4. Update the Settings panel copy if needed so "Music" now accurately
   describes "2 mood tracks that shift as your character ages" rather
   than implying many stage-specific tracks.

### Gate 7 — must pass before Phase 8
- [ ] Confirm via the audio manifest / bundle that exactly 2 BGM files are
      referenced project-wide — grep for any leftover references to
      removed stage-specific tracks.
- [ ] Age a character from the early-life span into the late-life span in
      a Playwright test (or manual walkthrough) and confirm the crossfade
      occurs at the correct age boundary, not abruptly and not early/late.
- [ ] Trigger one `good`, one `bad`, one `funny`, and the birth and death
      moments, and confirm the correct SFX fires for each — spy/mock the
      Howler play calls in a test rather than relying on listening.
- [ ] Confirm the mute toggle silences ALL new SFX and both BGM tracks
      (re-run the Gate 3 mute-toggle test from `TESTING.md` against these
      new assets specifically).
- [ ] `/public/audio/CREDITS.md` lists every new asset added this phase
      with a real source/license — spot-check 3 entries against actual
      files on disk.
- [ ] Confirm no BitLife-sourced or otherwise unlicensed audio file was
      added — state explicitly where each new asset came from.

---

## Phase 8 — Responsive Layout Overhaul (de-centered, full-bleed UI)

### Objective
Fix the core complaint from the current screenshots: every screen is a
single narrow column of cards stacked dead-center with large empty
margins on either side, and the whole page scrolls vertically rather
than only the year-by-year event log. The layout needs to actually use
the available width, feel "released"/spread rather than boxed into the
middle, and the player should never need to scroll horizontally — only
the event history should scroll vertically, ideally within its own
contained region rather than scrolling the whole page.

### Tasks
1. **Define responsive breakpoints and a real layout, not a single
   centered column at every width:**
   - **Mobile (< 768px):** current single-column stack is acceptable
     here — this is the one width where centered-stack genuinely is the
     right pattern — but tighten side margins so content uses more of
     the available width (per `UI-DESIGN.md` §1.3's 8px grid, not
     arbitrary large auto-margins).
   - **Tablet (768–1279px):** two-column layout — character card + stat
     bars + action buttons in a persistent left/side column, event
     history (Chronicle/Life Log) in the larger remaining column.
   - **Desktop (≥ 1280px):** three-region layout — e.g., character
     summary + primary actions on the left (fixed/sticky), the
     year-by-year event log filling the center as the dominant, widest
     element, and a right-hand rail reserved for secondary info (traits,
     lineage snippet, quick stats, or contextual tips) rather than
     leaving that space empty. If there isn't yet enough content to
     justify a right rail, widen the center log column instead of
     leaving dead space — never ship a wide viewport with large empty
     margins on both sides.
2. **Make the event log its own scroll container** (`overflow-y: auto`
   on that region specifically) rather than the whole page scrolling —
   the character card, stat bars, and primary action buttons (Age Up,
   Life Actions, Family Tree) should stay visible/reachable without
   having to scroll past the growing history first. This directly
   answers the "should be scrollable, not the whole page" note.
3. **No horizontal scrolling at any supported width**, including the
   Life Actions tab row and Family Tree zoom controls — verify tab rows
   wrap or condense (e.g., icon-only tabs at narrow widths with a text
   label on hover/focus) rather than overflowing.
4. **Audit every existing screen** (Landing, Character Hub, Life Actions
   panel, Family Tree panel, Settings) against this new layout system —
   this is a genuine restructure of `UI-DESIGN.md` §2's screens, so
   update `UI-DESIGN.md` itself as part of this phase to describe the
   new responsive regions (don't leave the design doc describing the old
   single-column-only layout after the code has moved on).
5. Keep every existing design token from `UI-DESIGN.md` §1 (colors,
   radius, typography) — this phase changes **layout/composition**, not
   the visual language established in the earlier reskin.

### Gate 8 — must pass before Phase 9
- [ ] Screenshot the Character Hub at 375px (mobile), 900px (tablet), and
      1440px (desktop) widths and confirm each uses a genuinely different,
      width-appropriate layout — not the same centered column scaled up
      with more empty margin.
- [ ] Confirm zero horizontal scrollbars appear at any of the three
      widths above, on every screen (Landing, Hub, Life Actions, Family
      Tree, Settings).
- [ ] Confirm the event/Chronicle log has its own internal scroll and
      that the character card + Age Up + navigation remain visible/
      reachable without scrolling past a long history — test with a
      character that has aged up at least 15 times so there's real
      history to scroll through.
- [ ] Confirm no dead/empty large-margin space exists at desktop width —
      describe what fills the space on the left/right of the log column.
- [ ] Re-run the Gate UI-1 accessibility/tap-height/contrast checks from
      `TESTING.md` against the new layout to confirm nothing regressed.
- [ ] `UI-DESIGN.md` §2 has been updated to reflect the new responsive
      layout — paste a diff or the updated section.

---

## Phase 9 — Content Depth, Randomness, Custom Life, and Romance Systems

### Objective
Address the "every life feels the same" complaint directly: expand event
variety and reduce repetition, add a BitLife-style custom-life creator,
and build out the relationship/romance systems (dating, girlfriend/
boyfriend, marriage, cheating, breakups) that currently don't exist —
all with content that's more varied and playful ("spicier," funnier) but
stays within the sensitive-content policy already defined in
`DESIGN.md` §11.

### Tasks

**9.1 — Anti-repetition & variety engine (engine-level, do first)**
- Add a **recent-event cooldown**: track the last N (e.g., 15–20) event
  IDs a character has seen and exclude them from selection until the
  cooldown expires, so the same flavor text doesn't repeat back-to-back
  or within a short span of ages.
- Add a **templated-text layer**: for event copy, support randomized
  filler slots (e.g., a bank of 4–6 alternate phrasings/synonyms per
  template, randomly chosen at fire-time) so a single authored event can
  read as several different lines across playthroughs without needing
  to hand-author dozens of near-duplicate events. This is the single
  highest-leverage fix for "feels repetitive" relative to authoring
  effort.
- Raise the content volume target from `DESIGN.md` §10's 150–250 events
  to **300–400 unique event templates**, leaning the increase toward
  Teen/Young Adult/Adult stages where replay frequency and the new
  romance systems (below) create the most demand for variety.

**9.2 — Custom Life creator (new feature, needs its own scoped design)**
- Add an optional "Custom Life" entry point alongside the existing
  random "Start life," letting the player set: name, gender, birth year/
  era flavor, a starting family wealth tier (poor/middle/wealthy — this
  should bias starting money and a few early stat rolls, not hard-lock
  outcomes), and optionally 1–2 starting traits from a curated list.
  This mirrors BitLife's custom-start concept but must stay entirely
  free (no paid "God Mode" tier — the whole game is free per `AGENT.md`
  §2).
- This touches the engine's character-creation function
  (`createCharacter`) — extend it to accept optional overrides rather
  than duplicating character-creation logic; keep the existing random
  path as the default and fully backward-compatible (existing saves and
  the Gate 1 stress test must still pass unmodified for the random path).

**9.3 — Romance & relationship systems (new systems, largest task here)**
- **Dating:** starting in the Teen stage (13+, strictly non-sexual —
  school-dance/crush-level content only, per `DESIGN.md` §11), add a
  dating-pool mechanic where the player can meet fictional NPCs (never
  real celebrities or real people) generated with the same name-
  generation system used for family members — confirm this reuses the
  fixed name-generation logic from `UI-DESIGN.md` §0.5 point 2 and does
  not reintroduce that bug for romantic NPCs.
- **"Celebrity-type" dating pool:** implement as a distinct, clearly
  fictional archetype tier (e.g., "Rising Pop Star," "Local Sports Hero,"
  "Indie Filmmaker") with procedurally generated fictional names — never
  a real public figure's name or likeness. This gives the "dating
  someone famous" fantasy the user wants without the legal risk of using
  real people.
- **Relationship progression (18+ for anything beyond dating):** ask out
  → date → make it official (girlfriend/boyfriend) → move in → propose →
  marry → optionally have kids (already scoped in `DESIGN.md` §5.3) →
  divorce (with asset-split/custody flavor events) as an available branch.
- **Cheating branch:** allow the player to choose to cheat as a narrative
  option with real consequences (relationship-meter damage, discovery
  risk, breakup/divorce events, reputation/karma impact) — this is a
  consequence-driven mechanic, not a rewarded/glorified one; keep this
  consistent with how `DESIGN.md` §11 wants crime handled (real
  consequences, not shock-for-shock's-sake).
- **Tone ("spicier," funnier):** widen the humor/absurdity range of
  event and outcome copy (per the `tone` field's existing `funny`
  category in `DESIGN.md` §10) and allow flirtatious/suggestive-but-not-
  explicit romantic flavor text for adult (18+) relationship events —
  innuendo and humor are fine; explicit sexual descriptions are not, and
  must never appear for under-18 characters under any circumstance, per
  the hard rule in `DESIGN.md` §11. This is a firm line the agent must
  not soften "to make it funnier."
- All new romance content must pass the same schema validation, age-
  gating, and sensitive-content review process defined in `TESTING.md`
  Gate 5.

### Gate 9 — must pass before Phase 10
- [ ] **Repetition test:** simulate 10 full lives (different seeds) and
      confirm no single event fires more than once within any 15-age
      window for the same character — write this as an automated check
      against the event log, not a spot-check.
- [ ] **Templated-text variety test:** trigger the same event template
      across 10 different seeded runs and confirm the rendered text
      varies (not identical every time) while still making sense
      grammatically — paste example outputs.
- [ ] **Custom Life creator:** create 3 custom characters with different
      wealth tiers and confirm starting money/stats differ appropriately;
      confirm the default random "Start life" path is unaffected (re-run
      the Gate 1 200-seed stress test to prove this).
- [ ] **Romance system walkthrough:** demonstrate (test or described
      manual playthrough with evidence) a full romance arc — date →
      relationship → marriage → an optional cheating branch → divorce —
      confirming relationship-meter and karma/reputation values change
      as expected at each step.
- [ ] **No real people:** grep all new romance/dating content for any
      real celebrity or public-figure name — must return zero matches.
      Confirm the "celebrity-type" pool is entirely fictional archetypes.
- [ ] **Age-gating audit:** review every new romance-related event and
      confirm nothing sexual/explicit appears for under-18 characters,
      and that adult content stays at suggestive/humorous, not explicit
      — list how many events were reviewed.
- [ ] Content volume check re-run per `TESTING.md` Gate 5 against the new
      300–400 target, confirming no life stage has zero eligible events.

---

## Phase 10 — Keyboard Shortcuts & Pause System

### Objective
Add a real pause system (build one if it doesn't exist) and conventional
keyboard shortcuts so the game is usable without a mouse and feels like a
considered desktop/browser app, not just a touch-first UI ported as-is.

### Tasks
1. **Pause system:** if no pause/paused-state currently exists, add one —
   a `Paused` UI state that dims/freezes the game (stat-tick animations,
   any ambient timers, BGM optionally ducked or paused per Settings)
   behind a simple pause menu (Resume / Settings / Export Save / Quit-to-
   Landing). This must not corrupt in-progress state — pausing mid-Age-Up
   or mid-event must resume exactly where it left off.
2. **Keyboard shortcut set** (document these in a discoverable in-app
   "? = shortcuts" overlay, not just silently supported):
   - `Esc` — open/close the pause menu (or close the topmost open
     modal/panel if one is open — Esc should close panels before it
     opens the pause menu, so it behaves predictably like other apps).
   - `Enter` / `Space` — confirm the focused button/primary action
     (e.g., advance an event, trigger Age Up when it's focused).
   - `1`–`4` — select the corresponding numbered choice on an active
     event card, when choices are present.
   - Arrow keys / `Tab` — navigate focus between interactive elements in
     the current panel, consistent with normal browser tab order (don't
     hijack Tab in a way that breaks standard accessibility navigation).
   - `?` — open a shortcuts-reference overlay.
3. Ensure shortcuts don't conflict with the browser's own bindings and
   don't fire while a text input (e.g., a name field in Custom Life
   creation) is focused.
4. Confirm this integrates cleanly with the existing focus-trap
   requirements from `TESTING.md` Gate UI-1 (modals still trap Tab
   focus; Esc closing a modal must return focus sensibly, e.g. to the
   element that opened it).

### Gate 10 — must pass before Phase 11
- [ ] Complete one full life (birth to death) using only the keyboard —
      no mouse — and document the exact key sequence used.
- [ ] Confirm `Esc` closes an open panel/modal first, and only opens the
      pause menu when nothing else is open.
- [ ] Confirm pausing mid-event and resuming does not lose or duplicate
      the in-progress event/choice state — test this explicitly.
- [ ] Confirm number-key choice selection matches the visually numbered/
      ordered choices exactly (no off-by-one mismatches).
- [ ] Confirm shortcuts do not fire while a text input is focused (test
      by focusing the Custom Life name field and pressing `1`–`4`/`Esc`,
      confirming normal typing behavior instead of a shortcut firing).
- [ ] `?` shortcuts overlay lists every shortcut above accurately.

---

## Phase 11 — Public Landing / Marketing Page

### Objective
Build a proper pre-game marketing/landing experience — this is distinct
from the in-game "New Life" screen from `UI-DESIGN.md` §2.1. This is the
page a stranger lands on before ever starting a life: it needs to sell
the game in seconds and load fast on any device.

### Tasks
1. **Hero section (above the fold):**
   - Headline: game name ("Jibon Niye Khela") + a short hook line stating
     the core theme/genre (life-simulation, medieval "Modern Martial"
     theme, choice-driven).
   - Primary CTA: a large, unmissable "Play Free in Browser" button that
     takes the visitor straight into the existing New Life flow — no
     signup, no paywall, consistent with the project's free-forever
     stance (`AGENT.md` §2).
   - Atmospheric visual: a stylized screenshot or short looping clip of
     the actual reskinned UI (per `UI-DESIGN.md`) — use real product
     screenshots once Phase 8's layout work is done, not a mockup that
     doesn't match the shipped app.
2. **Core features & gameplay section:**
   - A short looping GIF/video (a few seconds) showing an event card
     resolving and a stat bar reacting — real captured footage of the
     actual game, not staged/faked UI.
   - Exactly 3 short, punchy bullet points on what makes the game
     distinct (e.g., "Every life is different — huge event variety and a
     custom-life creator," "Reactive stats, sounds, and moments — not
     just text," "100% free, no ads, no accounts").
   - A short tag list (e.g., "Life Simulation," "Choice-Driven,"
     "Free-to-Play," "No Ads," "Browser-Based").
3. **Clean technical execution:**
   - Keep this page's own bundle lean and separate from the game's main
     bundle — the landing page should not eagerly load Lottie/Howler/
     the full game engine; those load only once the visitor clicks Play.
   - Fully responsive at mobile widths — this page gets the same
     no-horizontal-scroll, real-breakpoint treatment defined in Phase 8,
     not a leftover centered-column layout.
   - Target a fast Lighthouse Performance score for this specific page
     (this is the first-impression page — hold it to at least the same
     bar as `TESTING.md` Gate 6's in-game target, ideally higher since
     it's simpler and has less to load).

### Gate 11 — must pass before calling the whole expansion done
- [ ] Landing page Lighthouse scores (Performance/Accessibility/Best
      Practices) meet or exceed the Gate 6 in-game targets — paste actual
      scores.
- [ ] Confirm the landing page's initial JS payload does not include the
      game engine, Howler, or Lottie — those must only load after the
      Play CTA is clicked (network tab evidence).
- [ ] Screenshot the landing page at 375px, 900px, and 1440px widths —
      confirm no horizontal scroll and a sensible responsive layout at
      each, consistent with Phase 8's rules.
- [ ] Confirm the demo GIF/video is real captured footage of the shipped
      app (not a mockup) — describe how it was captured.
- [ ] Confirm the Play CTA correctly routes into the existing New Life
      flow with no broken link, no signup wall, and no payment prompt.

---

## Sequencing summary

```
Phase 7  (Audio)          → Gate 7  → 
Phase 8  (Layout)         → Gate 8  →
Phase 9  (Content/Romance)→ Gate 9  →
Phase 10 (Keyboard/Pause) → Gate 10 →
Phase 11 (Landing page)   → Gate 11 → Full expansion complete
```

Phases 7 and 8 can technically be reordered relative to each other (audio
vs. layout don't depend on one another), but Phase 9 should come after
Phase 8 so the new romance/content volume is being authored and tested
against the final layout, not the old centered one. Phase 10 depends on
Phase 8's panel/modal structure being final. Phase 11 depends on Phase 8
(for real screenshots/footage) and should be last.

At the end of Phase 11, re-run the **Final Gate** from `TESTING.md` in
full — the "did we actually build what we wanted" holistic pass — since
five phases of new scope have shipped since it was last run.
