# Audio Credits

All audio assets in this directory are either **CC0 licensed** or **procedurally
generated**. Every bundled file is logged below with its source and license, and
every synthesized cue is logged with its in-repo origin.

## Music (bundled files)

Exactly **two** mood tracks are referenced by the game (Phase 7, per
Additional_plus_improved_plan.md): one for the early-life arc (ages 0–17) and
one for late life (ages 18+). Both assets are **CC0 (Public Domain)**; no
attribution is required, but the authors are credited for courtesy.

| File | Used for | Title | Author | Source | License |
|---|---|---|---|---|---|
| `lofi.ogg` | early life (0–17), `MUSIC_MANIFEST.early` | Lofi Hip Hop Loop | omfgdude | [opengameart.org/content/lofi-hip-hop-loop](https://opengameart.org/content/lofi-hip-hop-loop) | CC0 |
| `ambient.ogg` | late life (18+), `MUSIC_MANIFEST.late` | Ambient Loop | isaiah658 | [opengameart.org/content/ambient-loop](https://opengameart.org/content/ambient-loop) | CC0 |

**Historical, no longer referenced (kept on disk, not in `MUSIC_MANIFEST`):**
`heavenly.ogg` (Heavenly Loop, isaiah658, opengameart.org/content/heavenly-loop,
CC0), `jump.ogg` (Jump, ThePixel, opengameart.org/content/jump, CC0),
`fastsong.ogg` (Fast Cheerful punk rock lo-fi, annandistance,
opengameart.org/content/fast-cheerful-punk-rock-lo-fi, CC0). These were removed
from the manifest in Phase 7 because the music layer was deliberately reduced to
two tracks; they are kept on disk only for easy restore.

## Sound effects

All SFX (`SFX_MANIFEST` in `lib/audio/manifest.ts`) are **procedurally
synthesized** at runtime with the Web Audio API (`lib/audio/synth.ts`). No
samples are bundled or fetched from a third party, so there is no third-party
license to carry. Each cue below is a Phase 7 addition or revision of the
emotional-audio layer and is logged with its exact in-repo source preset.

| Cue (`SfxEvent`) | Where defined | Origin / source | License |
|---|---|---|---|
| `birth` | `SFX_MANIFEST.birth` in `lib/audio/manifest.ts` | Procedural baby-cry vocalization (rising glissando voices), rendered by `lib/audio/synth.ts` | Original — generated in this repository; no third-party rights |
| `good_event` | `SFX_MANIFEST.good_event` | Procedural warm affirmation "oh nice" contour (major third rise), `lib/audio/synth.ts` | Original — generated in this repository; no third-party rights |
| `bad_event` | `SFX_MANIFEST.bad_event` | Procedural dismayed "oh no" contour (descending minor), `lib/audio/synth.ts` | Original — generated in this repository; no third-party rights |
| `funny_event` | `SFX_MANIFEST.funny_event` | Procedural quirky "boing" sting, `lib/audio/synth.ts` | Original — generated in this repository; no third-party rights |
| `death` | `SFX_MANIFEST.death` | Procedural somber low chord (D minor cluster, slow decay), `lib/audio/synth.ts` | Original — generated in this repository; no third-party rights |
| `button_press`, `stat_up`, `stat_down`, `money_up`, `money_down`, `neutral_event`, `age_up`, `life_stage_change` | `SFX_MANIFEST` in `lib/audio/manifest.ts` | Procedural tones, `lib/audio/synth.ts` (unchanged from the original Milestone 3 pass) | Original — generated in this repository; no third-party rights |

Rule (AGENT.md §9): only CC0/CC-BY audio, or audio synthesized locally. Any new
bundled asset must be logged here with its license and attribution before it is
shipped. A synthesized cue counts as a new asset when its preset is added or
reworked — log it in the table above (as done for the Phase 7 cues).