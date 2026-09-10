# Jibon Niye Khela (জীবন নিয়ে খেলা) — Dhakaiya Bangla Edition

A free, browser-based life simulation game played entirely in colloquial Dhakaiya Bangla, featuring a warm, cozy "Adorable Home"-inspired visual style and full BitLife feature depth. Situations and choices are dynamically powered by a hybrid engine utilizing the Google Gemini API with a robust local fallback bank.

## Documentation & Architecture

This project has **exactly one governing document**:

👉 **[`init.md`](./init.md)** — The master build document and single source of truth for all architecture, language and tone guidelines, AI engine specifications, Adorable Home design system tokens, feature parity checklists, and phased quality gates.

All earlier documentation from the prototype phase has been archived under [`docs/archive/`](./docs/archive/).

## Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript strict
- **Styling:** Tailwind CSS + CSS variables (Adorable Home pastel palette)
- **State Management:** Zustand
- **Motion:** Framer Motion (bounce / overshoot easing)
- **Audio:** Howler.js via reactive SoundManager
- **AI Content:** Next.js serverless API route proxying Google Gemini API with local fallback bank
