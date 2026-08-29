# Contributing to RoyCSS

Thank you for your interest in contributing to RoyCSS!

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Roy-Wanyoike/roycss.git
   cd roycss
   ```
2. **Install dependencies**
   ```bash
   bun install
   ```
3. **Start the dev server**
   ```bash
   bun run dev
   ```
4. The app runs on port 3000. Open it in the **Preview Panel** on the right side of the sandbox interface (use **"Open in New Tab"** for a separate browser tab).

## Development

| Command | Description | Port |
| --- | --- | --- |
| `bun run dev` | Frontend (Next.js) | 3000 |
| `cd backend && bun run dev` | Backend (Express API) | 4000 |
| `cd mini-services/live-service && bun run dev` | WebSocket (Roy Live) | 3003 |
| `bun run lint` | ESLint + Next.js rules | — |
| `npx tsc --noEmit` | TypeScript type check | — |
| `bun run db:push` | Push Prisma schema to SQLite | — |

> **Note**: In the cloud sandbox, `bun run dev` is auto-restarted by the system — do not start it manually. Use `bun run lint` to check code quality.

## Adding a New CSS Effect

1. **Determine the category** — see `src/lib/effect-taxonomy.ts` for the 31 category definitions and their boundaries.
2. **Find the appropriate batch file** in `src/lib/effects-batch-XX.ts` (effects are split across 46 batch files; add to the lowest-numbered batch that still has room, or create a new batch file and register it in `src/lib/roycss-effects.ts`).
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

## License

By contributing, you agree that your contributions will be licensed under the MIT License — see [LICENSE](./LICENSE).
