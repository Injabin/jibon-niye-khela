# 3D Model & Lottie Credits

| Asset | Kind | Source | License | Author / Link |
|---|---|---|---|---|
| _(none yet — procedural low-poly 3D built in code at M3+) ¹_ | code | — | — | — |

¹ Per DESIGN.md §7 (as amended), v1 uses **procedurally generated low-poly 3D**
built in React Three Fiber code — no external model files required, so no
attribution is needed for those scenes. Any external Lottie JSON / glb added
later must be CC0/CC-BY and logged here.

---

# Font Credits

All bundled fonts are self-hosted at build time by `next/font/google`
(`app/layout.tsx`), so no font files are fetched from a third-party CDN at
runtime. Both are **SIL Open Font License 1.1** — free to use, modify, and
redistribute; no attribution is required, but it is kept on record.

| Font | Weights loaded | Source | License | Upstream |
|---|---|---|---|---|
| `Baloo Da 2` (display / headings, `--font-baloo`) | 400–800 | Google Fonts via `next/font/google` | SIL OFL 1.1 | github.com/ekType/Baloo2 |
| `Hind Siliguri` (body / UI, `--font-hind`) | 300–700 | Google Fonts via `next/font/google` | SIL OFL 1.1 | github.com/itfoundry/hind-siliguri |

Rule (AGENT.md §9): only OFL / CC0 fonts, or fonts synthesized locally. Any new
bundled font asset must be logged here with its license before it ships.