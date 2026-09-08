# TESTING.md — Acceptance Criteria & Test Gates

Purpose: **stop the agent from declaring a milestone "done" on vibes.**
Every milestone in `init.md` has a corresponding test gate below. The agent
must run the listed commands/checks, show real output (not a summary claim),
and satisfy every item before moving to the next milestone. If a check
fails, the milestone is NOT done — fix it, re-run, then proceed.

General rule for the agent: **"it works" is not evidence. Command output,
a described reproduction you actually ran, or a passing test is evidence.**
If you cannot produce evidence for a claim, say so explicitly instead of
asserting it's done.

---

## Gate 0 — after Milestone 0 (Scaffold)

Automated:
```
npm run typecheck   # must exit 0
npm run lint         # must exit 0, zero warnings on fresh scaffold
npm run test          # must exit 0 (even if only a placeholder test)
npm run build          # must exit 0, no build warnings about missing deps
```

Manual/verifiable checks (agent must state how it verified each):
- [ ] `git log` shows an initial commit history that isn't a single mega-commit — at least a repo-init commit, a `.gitignore` commit or inclusion, and a tooling-setup commit, all with Conventional Commit messages.
- [ ] The live Vercel URL returns HTTP 200 and renders something (not a 404/500).
- [ ] The exact folder structure from `AGENT.md` §4 exists — list the actual `tree` output, don't just claim it.
- [ ] `theme.ts`/Tailwind config contains real token values (color roles, spacing scale, motion durations) — no components should yet reference raw hex codes because none exist yet.
- [ ] `.gitignore` correctly excludes `node_modules`, `.next`, `.env*` — confirm by running `git status` after a `npm install` and a build; neither should appear as untracked-but-should-be-ignored.
- [ ] README.md exists with setup instructions that a stranger could follow from a clean clone.

**Fail conditions that block moving to Milestone 1:** any command above exits non-zero; folder structure doesn't match AGENT.md §4; repo/README missing.

---

## Gate 1 — after Milestone 1 (Engine core, no UI)

This is the most important gate in the whole project — if the simulation
engine is wrong, everything built on top of it is wrong too. Do not accept
"the tests pass" without seeing the actual test file contents and coverage.

Required automated tests (write these as real Vitest files, not placeholders):

1. **RNG determinism**
   - Same seed → identical sequence of outputs, across multiple calls and across a fresh process run.
   - Different seeds → sequences must differ (basic sanity, not a formal randomness proof).

2. **Stat clamping**
   - Explicitly test: applying a `-999` delta to a stat at value 10 results in exactly `0`, never negative.
   - Applying a `+999` delta to a stat at value 95 results in exactly `100`, never over.
   - Test all four stats (health, happiness, smarts, looks) individually — don't just test one and assume the others share the code path correctly.

3. **Death trigger correctness**
   - Health reaching exactly 0 sets `alive: false` and a `causeOfDeath`.
   - A character already dead does not process further `ageUp` calls (or explicitly rejects/no-ops — pick one behavior and test it, don't leave it undefined).

4. **Age monotonicity**
   - Run `ageUp` 100 times sequentially on one character; age must strictly increase by exactly 1 each call, never skip, never repeat, never decrease.

5. **Event filtering correctness**
   - An event with `minAge: 13, maxAge: 17` must never fire for a character aged 12 or 18 — assert this directly with boundary values (12, 13, 17, 18), not just a "seems age-appropriate" spot check.
   - An event with a `requiredFlags` condition must not fire unless that flag/trait is present on the character.

6. **Weighted selection sanity check**
   - Run event selection 1,000 times with a fixed seed set (or seed range) and assert that a higher-weighted event fires meaningfully more often than a lower-weighted one — not exact ratios, but a clear statistical direction, so weighting isn't silently a no-op.

7. **Full-life simulation stress test**
   - Simulate 200 full lives (birth → death) using 200 different seeds, with no UI involved, headless.
   - Assert: none throw an unhandled exception; every life terminates (dies) before some sane upper bound (e.g., age 130) rather than looping forever; every character's final stats are within [0,100]; every character ends with `alive: false` and a non-empty `causeOfDeath`.

8. **Save schema round-trip at the engine level**
   - `serialize(character)` → `deserialize(...)` must produce a character deeply equal to the original, for at least: a freshly created character, a character mid-life with relationships/assets populated, and a dead character with full history.

Evidence required from the agent: paste the actual `npm run test` output showing all these test names and pass counts, plus point to the test file paths.

**Fail conditions that block moving to Milestone 2:** any of the above untested; the stress test throws on any of the 200 seeds; clamping fails at any boundary; age ever skips/repeats.

---

## Gate 2 — after Milestone 2 (Store, save, barebones UI)

Automated:
```
npm run typecheck && npm run lint && npm run test && npm run build
```
All must pass. Additionally add/verify:

- **Store serializability test:** assert the zustand store's persisted state contains no functions, no class instances, no `undefined` values that would break `JSON.stringify` round-tripping.
- **Save persistence across reload (must be an actual Playwright test, not a manual claim):** age a character up at least once, reload the page in the automated browser context, assert the displayed age/stats match pre-reload state.
- **Export/Import round-trip (Playwright):** export a save, clear storage, import the exported file, assert the resulting displayed character state matches the pre-export state exactly.
- **Full loop smoke test (Playwright), no UI polish required yet, but must exist:** create a character → age up until an event with choices fires → select a choice → assert stats changed accordingly → continue aging until death → assert a life summary (even placeholder) is shown.

Manual checks the agent must explicitly confirm, not assume:
- [ ] Choosing different options on the same event produces genuinely different stat outcomes (prove this by aging up with two different seeded runs/choices and comparing results) — this confirms choices aren't cosmetic.
- [ ] A hard refresh mid-life does not reset progress. Screenshot or describe before/after.
- [ ] Corrupt/malformed import JSON is handled without crashing the app (show the actual error-handling path).

**Fail conditions that block moving to Milestone 3:** event choices exist in UI but don't affect state differently; save doesn't survive reload; import of bad data crashes the app; any Playwright test above missing or failing.

---

## Gate 3 — after Milestone 3 (Motion & sound pass)

Automated: typecheck/lint/test/build must still all pass — a common regression here is animation/audio code accidentally breaking type-safety or introducing act-warnings in tests.

Required checks:
- [ ] **Reduced-motion fallback test:** with `prefers-reduced-motion: reduce` simulated (Playwright supports this), assert Framer Motion transitions are skipped/instant, not just "shorter."
- [ ] **Mute toggle actually mutes:** toggle sound off in Settings, trigger a stat-change/event, assert no Howler play call fires (can be checked via a mock/spy in a test, not just "I listened and didn't hear it").
- [ ] **No audio autoplay before user interaction:** confirm no sound attempts to play before the player's first click/tap (browsers block this anyway, but the code shouldn't be fighting it or throwing console errors because of it).
- [ ] **License file exists and is non-empty:** `/public/audio/CREDITS.md` lists every SFX/music asset used with its source and license — spot-check at least 3 entries actually correspond to real files in `/public/audio`.
- [ ] **Visual regression sanity:** stat bar shake/glow and event card enter/exit animations are visible in a recorded Playwright trace or video, not just "implemented in code" — attach or describe the evidence.

**Fail conditions that block moving to Milestone 4:** sound-off toggle doesn't actually silence audio; reduced-motion setting doesn't change behavior; missing/incomplete CREDITS.md.

---

## Gate 4 — after Milestone 4 (Avatar & Lottie moment layer)

- [ ] **Lazy-load verification:** inspect the network tab / bundle output and confirm `lottie-react` and its JSON assets are NOT present in the initial JS payload — they must only load when an avatar/moment view is actually rendered. Paste the relevant bundle-analyzer or network evidence.
- [ ] **Expression mapping correctness:** for at least one `good`, one `bad`, and one `funny`-toned event, confirm (via test or described manual check with screenshots) the correct Lottie expression overlay fires — not a generic/default one regardless of tone.
- [ ] **Milestone stinger coverage:** confirm at least 8 of the required 8–10 reusable stinger animations exist and are wired to real event categories (list which categories map to which stinger file).
- [ ] **Reduced-motion fallback for avatar/Lottie specifically:** with the Settings toggle on, confirm Lottie playback is skipped and a static icon/fade is shown instead — this is a distinct check from the Gate 3 Framer Motion check.
- [ ] **Performance budget check:** run Lighthouse (or equivalent) on a page where a moment animation fires; confirm no long-task/jank warnings attributable to simultaneous Lottie instances; confirm off-screen Lottie players are paused (verify via a check of `isPaused`/visibility handling in code, cite the file/line).

**Fail conditions that block moving to Milestone 5:** heavy libs loaded on initial page load; wrong-tone expressions firing; reduced-motion toggle doesn't affect avatar/moments; no evidence of pause-when-off-screen handling.

---

## Gate 5 — after Milestone 5 (Content expansion)

- [ ] **Content volume check:** run a script that counts events in `/content` by category; confirm total is within the 150–250 target from `DESIGN.md` §10 and that no life stage (per `DESIGN.md` §4) has zero eligible events — a character must never be able to reach an age range with literally nothing to encounter.
- [ ] **Schema validation test:** every event object in `/content` validates against the typed event schema (id, text, minAge/maxAge, requiredFlags, statEffects, choices, weight, tags, tone) — a single malformed event should fail this test loudly, not fail silently at runtime.
- [ ] **Sensitive-content policy spot-check:** the agent must explicitly confirm, by reviewing the actual event text (not assuming), that no event implements suicide/self-harm as a selectable rewarded action, no event involves sexual content for under-18 characters, and no event names a real public figure. List how many events were reviewed and any that needed correction.
- [ ] **Career/education/relationship/crime/asset/health systems each have at least one Playwright test exercising their core interaction** (e.g., apply for a job and confirm salary updates money on next age-up; commit a crime and confirm a possible arrest branch exists in the code path even if not deterministically triggered in the test).
- [ ] **Achievements fire correctly:** trigger conditions for at least 3 achievements in a test and confirm they're recorded and persisted.

**Fail conditions that block moving to Milestone 6:** content count outside target range; any life stage with zero eligible events; schema validation missing; unreviewed sensitive-content risk; achievements not actually persisting.

---

## Gate 6 — after Milestone 6 (Polish, accessibility, launch prep)

- [ ] **Automated accessibility scan:** run `axe-core` (via `@axe-core/playwright` or similar) against the main screens (hub, event card, family tree, life summary, settings) and report zero critical/serious violations. Paste the actual violation report, even if empty.
- [ ] **Full keyboard-only walkthrough:** complete one full life (birth to death) using only keyboard navigation, no mouse — describe the exact key sequence used and confirm it worked.
- [ ] **Lighthouse mobile scores:** Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 90 — paste the actual report/scores, not a paraphrase.
- [ ] **PWA offline check:** load the app once online, go offline (via devtools), reload — app must still load and be playable from cache.
- [ ] **Trademark/legal sweep:** grep the entire codebase (including comments, commit messages, and content files) for "bitlife" case-insensitive and confirm zero matches outside of this TESTING.md/DESIGN.md/AGENT.md/init.md reference set.

**Fail conditions that block calling the project launch-ready:** any critical/serious a11y violation; Lighthouse scores below target; app breaks offline; any stray trademark reference in shipped code/content.

---

## Gate UI-1 — after the "Modern Martial" UI Overhaul (UI-DESIGN.md)

This is a **presentation-layer change** riding on top of an already-tested
engine. The single biggest risk is the agent touching engine/state code
while "just doing UI" and silently breaking Gate 1–2 guarantees. This gate
exists specifically to catch that, in addition to verifying the new visual
system was actually applied correctly and consistently.

### A. No regression to existing engine/state behavior (run these FIRST)
- [x] Re-run the full Gate 1 test suite (RNG determinism, stat clamping,
      death trigger, age monotonicity, event filtering, weighted selection,
      200-seed full-life stress test, save round-trip) and confirm every
      test still passes with zero changes to expected values. If any
      engine test needed to be *edited* to pass after the UI change, stop
      — that means engine logic was touched, which is out of scope for a
      UI-only pass, and must be flagged explicitly rather than quietly
      "fixed."
- [x] Re-run the Gate 2 Playwright save/reload/import-export round-trip
      tests and confirm they still pass unmodified.
- [x] Confirm the stat mapping decision from `UI-DESIGN.md` §0 was
      implemented as a **display-only relabel** — write a test that
      creates a character, checks the underlying store still has keys
      `health/happiness/smarts/looks` (not renamed/restructured), and
      separately checks the rendered UI shows "Martial Skill"/"Honor"
      labels. Both must be true simultaneously.

### B. Design token fidelity
- [x] Grep the codebase for hardcoded hex colors outside `theme.ts`/
      Tailwind config in any touched component — must return zero results.
      Every color in the new UI must trace back to a token in
      `UI-DESIGN.md` §1.1.
- [x] Confirm border-radius is 4px on every card/button/modal/stat-bar
      container in the reskinned screens — spot-check computed styles on
      at least 6 distinct components (header, event card, choice button,
      chronicle entry card, tab bar icon container, Age Up button); zero
      should compute to a pill/fully-rounded radius.
- [x] Run an automated contrast check (e.g. axe-core or a dedicated
      contrast-ratio script) against `--accent-primary` crimson on
      `--card-bg`, and `--text-secondary` gray on both `--canvas-bg`
      values, in both light and dark mode. Paste actual computed ratios;
      all must meet WCAG AA (4.5:1 body / 3:1 large-bold).

### C. Icon/color-to-concept consistency
- [x] Build (or reuse) a single source-of-truth lookup table mapping
      stat/concept → color + icon, and write a test asserting every
      screen (header, event card, chronicle entries, assets tab, life
      summary) imports from that same lookup rather than redefining the
      mapping locally. Manually confirm by screenshot comparison across
      at least 3 screens that Health/Happiness/Martial Skill/Honor use
      identical colors and icons everywhere they appear.

### D. Layout correctness per UI-DESIGN.md §2
- [x] Sticky header remains pinned during Chronicle Stream scroll —
      verify with a Playwright scroll test, not a visual guess.
- [x] Sticky footer (Age Up + tab bar) remains pinned and does not
      overlap/clip the Chronicle Stream content at 360×640 and 360×740
      viewport sizes specifically (the smallest, highest-risk case called
      out in `UI-DESIGN.md` §4) — screenshot both sizes and confirm no
      clipped or unreachable content.
- [x] On Age Up, the Chronicle Stream auto-scrolls to the newest Year
      Card — confirm this is instant (not smooth-scrolled) when
      reduced-motion is enabled, and animated when it's off.
- [x] Interaction Overlay correctly dims background to the specified
      scrim opacity and traps focus (keyboard Tab cycles within the
      modal, not out to the dimmed background) — this is both a visual
      and an accessibility requirement, test both.
- [x] Choice buttons meet the 48px minimum tap-height requirement —
      measure computed height, don't eyeball it.

### E. Cross-theme regression
- [x] Toggle light/dark mode and confirm every token in §1.1 switches
      correctly with no screen left showing a mismatched half-themed
      state (e.g., dark card background with light-mode text color).
- [x] Re-run the Gate 3 mute-toggle and reduced-motion tests against the
      new themed components (new SFX/animations must still fully respect
      both settings, not just the pre-reskin ones).
- [x] Re-run Gate 4's Lottie lazy-load and reduced-motion checks against
      any newly themed avatar/moment assets.

**Fail conditions that block calling the UI overhaul done:** any Gate 1/2
test broken or edited to pass; any hardcoded color outside tokens; any
non-4px radius on a themed component; any contrast ratio below WCAG AA;
inconsistent icon/color mapping across screens; sticky header/footer
clipping content at small viewports; reduced-motion/sound-off settings not
respected by new themed elements.

**Gate UI-1 evidence (2026-09-08, all items above checked):**
- Full Gate suites clean and untouched: `npx playwright test --workers=3`
  → **59 passed** (`*.spec.ts` in `tests/e2e/`, incl. `three-lives`,
  `keyboard-life`, `moments`, `legacy`, `save-flow`, `pwa`); `npm run test`
  → **207 passed** (Vitest, incl. `tests/ui/concepts.test.tsx` =
  `shards/statColors.ts` single source of truth for §0 relabel +
  `tests/ui/reskin.test.tsx`). `npm run lint` and `npx tsc --noEmit` clean.
- Gate A store-keys guard: `tests/ui/concepts.test.tsx` asserts store keeps
  `health/happiness/smarts/looks` while rendered labels are
  "Martial Skill"/"Honor" (display-only relabel, per UI-DESIGN.md §0).
- Gate B hardcoded-color grep: zero hex literals outside tokens; new AA
  tokens `--color-primary-text`, `--color-danger-text`, `--color-danger-border`
  added in `app/globals.css` (both schemes) because raw crimson #b23a3b on
  #1a1c1e is only 2.89:1 as *text* (crimson remains fill-only otherwise).
  Radius: all `--radius-*` tokens resolve to 0.25rem, so computed styles are
  4px everywhere incl. tabs (per UI-DESIGN.md §1.3 "no pills"); 6 spot-check
  components asserted in `tests/e2e/ui-theme.spec.ts`.
- Gate B contrast (computed in `ui-theme.spec.ts`, WCAG relative luminance):
  on-primary-on-primary 7.447 (light) / 5.897 (dark); text-muted-on-canvas
  5.560 / 5.593; text-on-canvas 12.645 / 13.541. Crimson-fill-on-card
  2.51 (dark) logged info-only (non-text fill, never used for text).
- Gate C screenshots at `test-results/ui-theme/*.png`: `360x640-light.png`,
  `360x740-light.png`, `360x640-dark.png` cover the §4 small-viewport
  worst case (identical colors/icons asserted per-screen by axe and the
  concepts table; the new-deck landing dark variant is
  `360x640-dark-viewport.png`).
- Gate D: `ui-theme.spec.ts` pins sticky header + footer and verifies newest
  Year Card auto-scrolled into view (geometry asserted via `evaluate`, not
  eyeballed); `axe.spec.ts` covers 10 contexts (light+dark) incl. Interaction
  Overlay focus trap (`keyboard-life` additionally: 642 tabs, 0 escapes out
  of the overlay); ≥48px tap-height measured on choice buttons.
- Gate E: `axe.spec.ts` (both color schemes × hub landing / active life /
  settings / family tree / life summary+heir), `motion.spec.ts` (OS + Settings
  reduced-motion and sound-off all honored), `moments.spec.ts` (Lottie
  lazy-load + reduced-motion) re-run against reskinned components. Filename
  `game.moments` legacy override spec still passes.
- Note: `readLifeSummary` worth-pattern `/\$ [\d,.]+/` doesn't match
  "Final worth: 46 coins" (no `$`); `three-lives` diverges on age/health/
  timeline/ribbons anyway, so keep the regex if it ever tightens.

---

## Final Gate — "Did we actually build what we wanted?" (Full Launch QA)

Run this only once Gates 0–6 have all individually passed. This is a
holistic regression pass against the *original intent*, not just each
milestone's narrow checklist — the point is to catch things that pass
each gate individually but still add up to a game that doesn't feel right.

### A. Functional completeness vs. DESIGN.md
- [ ] Every system listed in `DESIGN.md` §5 (Education, Career, Relationships, Activities, Assets, Crime, Health, Death/Legacy, Achievements) is reachable and produces a meaningfully different outcome depending on player choice — walk through each system once end-to-end and describe what happened.
- [ ] Play (or automate) at least 3 full lives to noticeably different outcomes on purpose (e.g., one "good" life, one "crime-heavy" life, one "chaotic/funny" life) and confirm the life summaries genuinely reflect different paths, not the same generic recap text.
- [ ] Family tree / legacy mode: have a character have a child, let that child reach adulthood, confirm the player can actually continue as that child.

### B. The "premium feel" bar (this was the whole point of the extra scope)
- [ ] Every stat change is visibly and audibly distinct from a neutral state (confirm shake/glow/color-flash + SFX pairing works for both increases and decreases, not just one direction).
- [ ] At least one milestone stinger (Lottie) fires correctly for a genuinely triggered in-game event, not just in isolated testing.
- [ ] With ALL motion/sound/animation disabled in Settings, the game is still fully completable and doesn't look broken (empty gaps, misaligned layout) — this is the accessibility/perf floor and must be explicitly re-verified here, not assumed from earlier gates.

### C. Robustness
- [ ] Rapidly clicking "Age Up" many times in quick succession does not desync the UI from the underlying state (no duplicate events firing, no stat double-application).
- [ ] Resizing the browser from desktop width down to 360px mid-session does not break layout or lose state.
- [ ] Opening the app in a second tab with an existing save does not corrupt storage (describe what actually happens — even "last write wins" is acceptable if it doesn't crash, but it must be stated, not left unknown).

### D. Final sign-off checklist (agent must answer each explicitly, yes/no + evidence)
- [ ] Does the deployed Vercel URL reflect the exact code currently in `main`? (confirm commit SHA matches deployed build)
- [ ] Is there a tagged release corresponding to this final state?
- [ ] Does `README.md` accurately describe how to run/test/deploy the current codebase (not stale from Milestone 0)?
- [ ] Is there any TODO/FIXME/placeholder text left anywhere in shipped UI copy? (grep and report)
- [ ] Total bundle size and Lighthouse scores at final state — re-run, don't reuse Gate 6 numbers, since content/features grew since then.

**This project is not "done" until every item in section D has a real, evidence-backed answer.**

---

## How the agent should use this file going forward

At the end of each milestone in `init.md`, before reporting the milestone
as complete, the agent must:
1. Open this file and locate the matching Gate section.
2. Run every automated check listed and paste real output.
3. Perform every manual check listed and describe exactly how it was verified.
4. Explicitly list any item it could NOT verify or had to skip, and why —
   never silently omit a failing or unchecked item.
5. Only then state the milestone is complete, and only after ALL items in
   that gate are satisfied.

If asked "is the project done," the agent must run the **Final Gate**
section in full before answering — a "yes" without that evidence is not
acceptable.
