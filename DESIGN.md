# DESIGN.md — Game Design Document

Project name: **Jibon Niye Khela** ("Playing with Life") — must not use
"BitLife" anywhere in code, copy, or metadata.
Genre: Text/UI-driven life simulator with reactive 2D animated avatar/
effects and reactive sound, browser-based, single-player, free.

---

## 1. Core fantasy & pillars

The player lives an entire fictional life, one year (or decision) at a time,
through random events and deliberate choices, watching stats and a family
tree evolve, chasing money, relationships, career highs, or chaotic/funny
outcomes — then dies, gets a life summary, and starts again.

Design pillars:
1. **Every tap has weight** — even small choices nudge stats or spawn
   follow-up events later in life.
2. **Read less, feel more** — modern UI shows change through motion/sound,
   not just number deltas in text.
3. **Replayability over completeness** — breadth of silly/serious event
   variety matters more than depth of any single system at launch.
4. **Free forever core loop** — no paywalls; cosmetic-only future extras.

## 2. Core loop

```
New Character → Age Up (yearly tick) → Random Events resolve/choices made
   → Age-gated Activities available (school, job, relationships, crime,
     health, assets) → repeat Age Up → Death (event, old age, or player
     choice like suicide-risk handling — see §11 sensitivity notes)
   → Life Summary screen → New Character (same family tree optionally) or
     Start Fresh
```

Two primary interaction modes:
- **Passive tick:** press "Age Up" → stat deltas animate, 0–3 random
  events may fire and require a choice.
- **Active menu:** at any age, open menus (School, Career, Relationships,
  Activities, Assets, Health) to take deliberate actions without aging.

## 3. Character model

```ts
Character {
  id, name, surname, gender, birthYear
  stats: { health, happiness, smarts, looks }   // 0–100, decay/grow yearly
  money: number
  age: number
  alive: boolean
  causeOfDeath?: string
  traits: string[]                // e.g. "Class Clown", "Prodigy" — unlock event variants
  education: EducationState
  career: CareerState | null
  assets: Asset[]                 // cars, houses, valuables
  relationships: Relationship[]   // parents, siblings, friends, partner, kids, pets
  history: LifeEventLogEntry[]    // for the life summary / "biography"
  criminalRecord: CrimeEntry[]
  reputation: { fame: number, karma: number }
}
```

Stats (0–100, visualized as animated radial/bars):
- **Health** — decays with age, drugs, accidents; restore via
  gym/hospital/therapy; 0 → death.
- **Happiness** — swings with events/relationships/activities; chronic
  low happiness unlocks negative-spiral events (see §11).
- **Smarts** — driven by school/reading/hobbies; gates education & jobs.
- **Looks** — driven by genetics (rolled at birth) + gym/plastic surgery;
  affects dating/some job/event odds.

Secondary hidden-ish meters: **Karma** (crime/kindness choices) and
**Fame** (career/social choices) that unlock flavor events and endings.

## 4. Age-up & life stages

| Stage | Ages | Unlocks |
|---|---|---|
| Infant | 0–2 | Parent-controlled mini events only |
| Toddler | 3–5 | First personality/trait rolls, preschool |
| Child | 6–12 | Elementary school, allowance, first friendships, pets |
| Teen | 13–17 | High school, part-time jobs, dating, first car, curfew/crime intro |
| Young Adult | 18–25 | University/vocational, first full job, moving out, marriage, military |
| Adult | 26–64 | Career growth, family, assets, business ownership |
| Senior | 65+ | Retirement, health decline events, legacy/inheritance planning |

Each "Age Up" runs the engine's yearly tick: apply stat decay curves,
roll 0–3 events from the weighted pool filtered by age/stage/traits/flags,
present sequentially as event cards.

## 5. Systems (parity target with BitLife-style games)

All of the following are **content categories**, not literal copied text.
Copy/events must be original per AGENT.md §9.

### 5.1 Education
Preschool → Elementary → Middle → High School (with GPA, popularity,
clubs, sports, bullying/being-bullied branches, expulsion risk) →
University/College (majors gated by Smarts, tuition vs. loans, Greek life,
dropout risk) → Grad school / vocational / trade school.

### 5.2 Career
Job board filtered by age, education, smarts, looks, and traits. Track:
salary, job satisfaction, promotion chance (tied to a simple "performance"
sub-stat + random events), getting fired, side hustles, and a full
**Business** track (start a company, hire, scale, bankrupt or sell).
Special career trees: Military, Crime/Gang (risk-heavy), Entertainment/
Fame (streamer, actor, musician — procedurally named, not real people),
Politics (fictional offices only), Sports.

### 5.3 Relationships
Family tree (parents, siblings, grandparents, spouse, children, pets)
rendered as an interactive node graph (see §7). Relationship meter per
person (0–100) affected by "Activities" menu actions (talk, compliment,
gift, insult, prank) and by life events. Romance: dating apps flavor,
marriage, divorce, cheating branches, custody events on divorce.
Reproduction: have kids (biological/adoption/surrogacy), each becomes a
playable character on their "coming of age" if the player wants a legacy
playthrough.

### 5.4 Activities menu
Gym (health/looks), Doctor/Therapist (health/happiness), Meditate,
Read a book (smarts), Hobbies (music, art, sports — can snowball into
careers/fame), Social media (fame/happiness with risk of controversy
events), Pets (adopt/train/lose), Travel (vacations — happiness burst +
random travel events).

### 5.5 Assets & finances
Bank account, simple interest, loans/debt, buy/sell: cars, houses,
jewelry, collectibles. Random market swings on valuable assets (mini
"stock/crypto" side feature, opt-in, clearly fictional).

### 5.6 Crime & law
Petty crime → grand theft → organized crime ladder with escalating
risk/reward, arrest chance tied to karma/luck, jail time (skips ages
with restricted event pool), lawsuits, prison break mini-event.

### 5.7 Health
Random illness/injury events scaled by age and lifestyle choices,
hospital visits, addiction mechanics (see §11 for sensitivity handling),
mental health arc tied to Happiness with supportive (not punitive) framing.

### 5.8 Death & legacy
Death by: old age (rising probability curve after ~70, with a visible
"risk" indicator, not a jump-scare), accident/illness event, or
crime/violence event. On death: **Life Summary** screen (biography-style
recap, stat graph over lifetime, achievements earned, epitaph the player
can pick/write) → offer to play as an heir/child (legacy mode) or start
new.

### 5.9 Achievements / "Ribbons"
Meta-progression across playthroughs (stored locally): e.g. "Lived past
90", "Started a business", "Married 3 times", "Went to prison and back",
"Straight-A student". Purely for replay incentive — no gameplay power.

## 6. What makes this feel "more interactive & premium" than the genre norm

This is the differentiator the user asked for — treat it as core scope,
not polish-later:

1. **Reactive event cards, not text dumps.** Each event card has a small
   contextual illustration/icon that animates in, a mood-colored accent
   (green/gold for good, red for bad, purple for weird/funny), and the
   character portrait's expression changes.
2. **A living character portrait/avatar.** A layered 2D avatar with Lottie
   expression overlays (see §7) that visibly ages, changes expression, and
   gets small visual tells (sweat drop on a risky choice, sparkle on a
   win) — this is how "every reaction feels alive," kept lightweight.
3. **Stat bars that fight back.** When a choice tanks Happiness, the bar
   doesn't just shrink — it shakes, flashes red, and the number ticks down
   audibly; a big win makes it glow and pulse.
4. **Full-screen "moment" beats.** For milestone events (graduation,
   wedding, arrest, death) a short Lottie sting + screen flash/shake +
   music cue briefly takes over full-screen, then returns to the menu —
   this is the "premium" beat the whole loop is paced around.
5. **Sound as feedback, not decoration.** Every button press, stat change,
   good/bad event, and life-stage transition has a distinct short SFX;
   an adaptive background music layer shifts mood (chill for childhood,
   tense for crime arcs, triumphant for career wins) rather than looping
   one track forever.
6. **Haptics on mobile** (`navigator.vibrate`) mirroring the SFX for key
   negative/positive beats, where supported.

## 7. The avatar & "moment" layer — scope discipline

**Decision: 2D layered sprite + Lottie, not real-time 3D.** This is
locked for v1 — it's faster to build, far lighter on bundle size/battery
than React Three Fiber, and still delivers "every decision visibly
reacts." A true 3D (React Three Fiber) upgrade is a possible *post-launch*
stretch goal, not part of the MVP scope — do not add the `three`/
`@react-three/fiber` dependencies for v1.

Concretely:

- **Avatar:** a layered 2D character built from swappable PNG/SVG parts
  (base body per life stage, hair, outfit, accessories) composited in a
  single `<Avatar>` component. Facial expression and small "tells"
  (sweat drop, sparkle, blush, tear) are short Lottie animations layered
  on top, chosen by event outcome `tone` (`good | bad | neutral | funny`
  per DESIGN.md §10). Body/outfit swaps at each life stage transition
  (DESIGN.md §4).
- **Family tree graph:** an interactive 2D node graph built with Framer
  Motion + SVG/CSS (pan/zoom, nodes gently float/pulse, tap a node to open
  its relationship panel). No WebGL required.
- **Milestone moments:** short, reusable Lottie "sting" animations
  (confetti burst, falling money, gavel/handcuffs, tombstone, diploma,
  wedding rings) that play full-screen or over the event card, triggered
  by event **category**, not hand-built per unique event — build 8–10
  reusable stingers, not hundreds. Combine with a screen-shake/flash
  Framer Motion effect and the matching SFX (DESIGN.md §6 point 5) for
  the "premium moment" beat.
- **Always provide a reduced-motion fallback** (Settings → "Reduce
  motion") that skips Lottie playback and swaps to a simple static
  icon + fade, both for accessibility and low-end devices.
- **Source/build Lottie assets** as CC0/original only (e.g., built in
  a free tool like LottieFiles' free tier assets under license, or
  simple after-effects-free JSON animations authored directly) — log
  licenses in `/public/animations/CREDITS.md` per AGENT.md §9.

## 8. UI/UX structure

- **Single-page app shell:** left/top = character summary (portrait, name,
  age, stat bars, money); center = current event card or active menu;
  bottom/side (mobile: bottom sheet) = Activities/Career/Relationships/
  Assets/Health navigation.
- **Event resolution pattern:** card slides/pops in → player picks an
  option (1–4 choices, sometimes just "Continue") → outcome text +
  stat deltas animate in → card dismisses → return to hub.
- **Family tree view:** full-screen modal/route, pinch-zoom/pan, tap a
  node to see relationship meter and available interactions.
- **Life Summary:** full-screen recap with a scrollable timeline of
  history entries, stat-over-lifetime chart, achievements earned, and
  share-as-image option (canvas-rendered, no backend needed).
- **Settings:** sound on/off + volume, music on/off, reduced motion/3D
  toggle, save management (export/import JSON save file), reset life.

## 9. Data & persistence model

- Single save = one "world" containing the active character plus any
  legacy family tree data, stored as versioned JSON in `localStorage`
  (MVP) → `IndexedDB` once saves grow (multiple past lives, big trees).
- Save includes a `schemaVersion`; `/lib/save` must ship a migration
  function for every schema bump — never silently break old saves.
- Export/Import JSON so players can back up or share a "life" file.
- No account system at launch (no backend = no login needed). A future
  optional "cloud save" could use a free-tier provider, but it's out of
  MVP scope.

## 10. Content pipeline

- Event pool lives in `/content` as typed data (`id`, `text`,
  `minAge`/`maxAge`, `requiredFlags`, `statEffects`, `choices[]`, `weight`,
  `tags`), so writers (or the agent) can add events without touching
  engine code.
- Target launch content volume: **150–250 unique events** spread across
  categories in §5, weighted so childhood/teen years (highest replay
  frequency) have the deepest pool.
- Tag events with a `tone` (`wholesome | dark-comedy | serious | absurd`)
  so the game can keep a consistent, controllable mix rather than tipping
  into shock content.

## 11. Sensitive-content policy (must follow)

BitLife-likes are known for dark/edgy content; keep the "modern vibe" fun
without being reckless:
- Crime, death, and health decline are depicted, but never with graphic
  gore descriptions — keep it stylized/cartoonish, not graphic.
- Suicide/self-harm are **not** implemented as a player-selectable
  "activity" or joke outcome. Mental-health-decline events route toward
  therapy/support options rather than glorified or trivialized self-harm
  choices. If a "cause of death" list includes anything self-harm-adjacent,
  keep it as a rare, non-graphic, non-interactive background narrative
  line only — never a chosen action with a mechanical reward.
- No sexual content involving minor-aged characters, ever, at any life
  stage — romance/relationship content for characters under 18 stays
  strictly non-sexual (school dances, first crushes, breakups).
- No real public figures, no real hate-group glorification, no
  instructions for real-world illegal acts (crime events are abstracted
  outcomes/flavor text, never how-to detail).
- Add a lightweight content note in Settings/About ("fictional satirical
  life sim, all characters and events are procedurally generated").

## 12. Success metrics for the design (how the agent should self-check scope)

- Can a player go from birth to death in under 5 minutes for a quick
  session, or spend 30+ minutes going deep on career/relationships? Both
  paths must feel good.
- Does every major life stage have at least one *visually distinct*
  moment (not just new text)?
- Does the game still feel complete with 3D/sound fully disabled? (It
  must — that's the accessibility bar.)

## 13. Out of scope for v1 (explicitly deferred)

- Multiplayer/social features, real-money purchases, cloud accounts,
  leaderboards (stretch goal only, free-tier only if added), localization
  beyond English, voice acting, mobile app store builds (PWA is enough).
