# Contributing to RoyCSS

Thank you for your interest in contributing to RoyCSS!

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Roy-Wanyoike/roycss.git
   cd roycss
   ```
2. **Install dependencies and generate the Prisma client**
   ```bash
   bun install
   bun run db:generate   # generates the Prisma client — kept as an
                         # explicit step so the npm package needs no
                         # install scripts
   ```
3. **Start the dev server**
   ```bash
   bun run dev
   ```
4. The app runs on port 3000 — open <http://localhost:3000> in your browser.

## Development

| Command | Description | Port |
| --- | --- | --- |
| `bun run dev` | Frontend (Next.js) | 3000 |
| `cd backend-node && bun run dev` | Backend (Express API) | 4000 |
| `cd mini-services/live-service && bun run dev` | WebSocket (Roy Live) | 3003 |
| `bun run lint` | ESLint + Next.js rules | — |
| `npx tsc --noEmit` | TypeScript type check | — |
| `bun run db:push` | Push Prisma schema to SQLite | — |

> **Note**: `prisma generate` is kept as the explicit `bun run db:generate` step above, so the published `roycss` package needs no install scripts.

## Adding a New CSS Effect

1. **Determine the category** — see `src/lib/effect-taxonomy.ts` for the 29 category definitions and their boundaries.
2. **Find the appropriate batch file** in `src/lib/effects-batch-XX.ts` (effects are split across 52 batch files; add to the lowest-numbered batch that still has room, or create a new batch file and register it in `src/lib/roycss-effects.ts`).
3. **Add the effect** following the `CSSEffect` interface (`src/lib/roycss-types.ts`):
   ```typescript
   {
     id: "animations-float-card",
     name: "Floating Card",
     category: "animations",
     description: "A card that gently floats up and down on hover.",
     cssCode: `
       .roycss-animations-float-card {
         transition: transform 0.3s ease;
       }
       .roycss-animations-float-card:hover {
         animation: roy-float 1.5s ease-in-out infinite;
       }
       @keyframes roy-float {
         0%, 100% { transform: translateY(0); }
         50% { transform: translateY(-6px); }
       }
       @media (prefers-reduced-motion: reduce) {
         .roycss-animations-float-card:hover { animation: none; }
       }
     `,
     previewType: "box",
     tags: ["hover", "float", "card", "subtle"],
   }
   ```
4. **Class prefix**: every effect class starts with `roycss-` (e.g., `.roycss-animations-float-card`).
5. **Keyframes prefix**: every `@keyframes` rule starts with `roy-` (e.g., `@keyframes roy-float`).
6. **Include `@media (prefers-reduced-motion: reduce)`** to disable the animation for users who prefer reduced motion.
7. **Use OKLCH colors** — no indigo or blue as primary. Reference `src/lib/design-tokens.ts`.
8. **GPU-accelerated** — animate `transform` and `opacity` only; never `top` / `left` / `width`.
9. **Run lint + type check**:
   ```bash
   bun run lint
   npx tsc --noEmit
   ```

## Code Style

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without a justification comment
- **`"use client"`** only when needed (interactivity, browser APIs, hooks). Most sections render server-side.
- **shadcn/ui components preferred** over custom implementations — see `src/components/ui/`
- **OKLCH colors** — no indigo or blue as primary; reference `src/lib/design-tokens.ts`
- **WCAG 2.2 AA compliance** — 44px minimum touch targets, proper ARIA, semantic HTML
- **Semantic HTML** — `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`
- **Every `<button>` must have `type="button"`** (or `type="submit"` for actual form submits)
- **ARIA labels** on icon-only buttons must match the visible text
- **No `eval()` or `new Function()`** in production code

## Pull Request Process

1. **Create a feature branch** off `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. **Make your changes** — keep commits focused; one logical change per commit.
3. **Ensure lint + tsc pass**:
   ```bash
   bun run lint
   npx tsc --noEmit
   ```
4. **Test at three viewports** — 375px (mobile), 768px (tablet), 1920px (desktop). The platform is mobile-first.
5. **Check `prefers-reduced-motion`** — toggle the OS setting and verify your effect renders a static fallback.
6. **Submit a PR** with:
   - A clear description of what changed and why
   - Screenshots/GIFs for visual changes
   - The effect category and batch file you added to (for effect PRs)

## Reporting Bugs

Open an issue with:

- RoyCSS version (`src/lib/constants.ts` → `VERSION`)
- Browser + OS
- Steps to reproduce
- Expected vs actual behavior
- A reduced test case (CodePen / StackBlitz) if possible

## Contributor Ladder

RoyCSS grows contributors through four rungs. The authoritative role
definitions (including the appointed helper roles and the steering
committee) live in [`docs/GOVERNANCE.md`](GOVERNANCE.md) §2; this section
restates them as concrete, checkable criteria so you always know where
you stand and what the next rung requires.

| Rung | How you get it | What you can do |
| --- | --- | --- |
| **Contributor** | Any one merged PR that passed the gates below. You are one from then on — no re-qualification. | Propose PRs, comment on RFCs and issues. |
| **Active contributor** | At least 5 merged PRs across at least 2 areas within a quarter, plus at least 2 substantive reviews of other people's PRs. A module owner or maintainer may additionally appoint you **Triager** (label and triage issues, close duplicates, set severities). | Everything above, plus issue triage (if appointed Triager) and review sign-offs that owners count toward the "real look" requirement of lazy consensus. |
| **Module owner** | Sustained contribution in one area (the `MAINTAINERS.md` area table) with demonstrated judgment — your PRs there have needed no rework beyond normal review, and you have reviewed others' work in that area. Appointed by a maintainer per the [`docs/GOVERNANCE.md`](GOVERNANCE.md) §3 decision tiers. | Merge PRs **within your area** (docs fast-lane included), own that area's SLA and onboarding, appoint collaborators, act as a **core approver** on RFCs touching your area. |
| **Maintainer** | Sustained contribution and demonstrated judgment across areas — typically an existing module owner who has also shipped cross-area work (e.g. a backend module + its frontend surface) and led at least one contract-level change through the RFC process. Appointed by consensus per [`docs/GOVERNANCE.md`](GOVERNANCE.md) §3.1. | Merge across the repo, appoint module owners, hold release authority, decide steering questions. The steering committee (3–5 seats) is elected from this rung once ≥3 voters exist. |

### What every rung is measured against

The bar is the same at every level — the ladder only changes *scope*, never
*standards*:

1. **Gates before review.** `bun run lint`, `npx tsc --noEmit`, and the
   test suite pass locally before you ask for review. CI re-runs them;
   a red gate is never a judgment call ([`docs/GOVERNANCE.md`](GOVERNANCE.md)
   §3.2 item 4: the pinned catalog invariants, `tsc` clean, and the API
   drift gate are *never* lazy).
2. **The PR checklist** above is part of the bar: focused commits, the
   three viewports (375 / 768 / 1920), the `prefers-reduced-motion`
   check, and screenshots for visual changes.
3. **Backend work follows the module conventions:** `requireAuth` on all
   routes, Zod validation, `AppError` envelopes, owner-scoped queries
   (foreign ids → flat 404), module loggers, and tests per module.
4. **Contract changes go through the RFC process**
   ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)): schema changes, removals of
   `stable` names, and policy changes need the 14-day window and
   2 core + 3 community approvals. Everything else is lazy consensus —
   but "lazy" means *no one objected after a real look*, never *nobody
   looked*.
5. **Honesty discipline:** claims in docs match the tree. If you ship
   half a feature, the backlog entry says half
   ([`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md) state fields) —
   overstated states are treated as bugs.

Progression is reviewed at the quarterly architecture review
([`docs/GOVERNANCE.md`](GOVERNANCE.md) §5); anyone can self-nominate by
posting an issue listing their merged PRs against the criteria above.
While the maintainer table is single-owner, appointments above
Contributor are made by the project maintainer and recorded in
[`MAINTAINERS.md`](../MAINTAINERS.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License — see [LICENSE](./LICENSE).
