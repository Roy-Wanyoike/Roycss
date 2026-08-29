# RoyCSS Development Guide

## Prerequisites

- **Node.js 20+** or **Bun 1.0+** (Bun is the recommended runtime — `bun install`, `bun run dev`)
- **TypeScript 5+**
- **Git**
- A modern browser (Chrome 110+, Firefox 110+, Safari 16.4+) — RoyCSS uses OKLCH colors, `prefers-reduced-motion`, and modern CSS features

## Setup

```bash
# 1. Clone
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss

# 2. Install dependencies (frontend)
bun install

# 3. (Optional) Install backend + WebSocket dependencies
cd backend && bun install && cd ..
cd mini-services/live-service && bun install && cd ../..

# 4. Push the Prisma schema to SQLite
bun run db:push

# 5. Start the dev server (frontend — auto-restarted by sandbox)
bun run dev
```

The frontend runs on **port 3000**. Open it via the **Preview Panel** on the right side of the sandbox interface.

## Project Structure

```
src/
  app/                     — Next.js App Router pages
    docs/                  — Documentation pages (35 pages: 8 getting-started, 7 concepts, 10 api, 10 guides)
    api/                   — API routes (ai-playground, css-doctor, ai-migration, contact, og)
    layout.tsx             — Root layout (theme provider, JSON-LD, fonts)
    page.tsx               — Single home route — all sections live here
    globals.css            — Tailwind + OKLCH tokens
    roycss.css             — Effect stylesheet (dynamic injection)
  components/
    roycss/                — Main RoyCSS components
      roycss-page.tsx      — Single-page orchestrator (~2,600 lines)
      tools/               — 64 developer tools (each a self-contained component)
      pro/                 — 62 platform product components (lazy-loaded)
      effects/             — 7 WebGL/Canvas GPU scenes
      *.tsx                — Section components (hero, effects, platform, docs, recipes, patterns, collections, footer)
    ui/                    — shadcn/ui primitives (New York style)
    ui-library/            — Token + showcase primitives
    docs/                  — Docs layout / sidebar / TOC / search
  lib/                     — Data files, utilities, constants
    effects-batch-1..46.ts — 1,809 CSS effects split across 46 files
    roycss-effects.ts      — Master effects registry (combines all batches)
    roycss-types.ts        — CSSEffect, EffectCategory, categoryMeta
    effect-taxonomy.ts     — 31 category definitions + boundaries
    constants.ts            — Single source of truth (counts, version, license)
    design-tokens.ts        — OKLCH color tokens
    products-catalog.ts     — 62 platform products
    docs-sitemap.ts         — 35 docs pages + prev/next helpers
    roycss-recipes.ts       — 12 implementation recipes
    roycss-patterns.ts      — 10 UI patterns
    roycss-collections.ts   — 22 curated collections
    framework-adapters.ts   — React / Vue / Svelte / Angular / Astro
    copy-formats.ts         — Copy-to-clipboard output formats
    db.ts                   — Prisma client
    utils.ts                — cn() helper
  hooks/
    use-favorites.ts       — useSyncExternalStore favorites store
    use-mobile.ts          — Media query hook
    use-toast.ts           — Toast hook
  cli/                     — RoyCSS CLI entry

backend/                   — Express API (68 modules)
  src/
    modules/               — 68 domain modules (routes.ts + service.ts + schema.ts each)
    server/                — app.ts + middleware (auth, cors, rateLimit, validate, error, logging)
    lib/                   — jwt, logger, cache, db
    config/                — env, constants
  prisma/schema.prisma

mini-services/
  live-service/            — Socket.io WebSocket (port 3003)

prisma/                    — Frontend Prisma schema
docs/                      — Architecture documentation + ADRs
  adr/                     — Architecture Decision Records
inspector/                 — Chrome DevTools / side panel extension
vscode-extension/          — Published VS Code extension (.vsix)
vscode-support/            — Class data + snippets JSON
scripts/                   — Build, release, migration scripts
tests/                     — Unit + e2e + a11y + i18n
performance/               — Benchmarks + budgets
compat/                    — Browser support matrix + polyfills
a11y/                       — ARIA coverage / contrast / keyboard audits
perf/                       — Bundle / virtual-scroll / memory benchmarks
public/                     — Static assets + PWA manifest + service worker
```

## Key Patterns

### Adding Effects

See [CONTRIBUTING.md](./CONTRIBUTING.md#adding-a-new-css-effect) for the full guide. Summary:

1. Pick the right category in `src/lib/effect-taxonomy.ts`
2. Add to the lowest-numbered batch file with room, or create `effects-batch-XX.ts`
3. Register new batch files in `src/lib/roycss-effects.ts`
4. Use `roycss-` class prefix + `roy-` keyframes prefix
5. Include `@media (prefers-reduced-motion: reduce)` fallback
6. Run `bun run lint` + `npx tsc --noEmit`

### Adding Platform Products

1. Create the component in `src/components/roycss/pro/<name>.tsx` (default export, `"use client"` if interactive)
2. Add a lazy import to `src/components/roycss/platform-section-unified.tsx`
3. Add the product entry to the `PRODUCTS` array with `id`, `name`, `category` (Build / Design / AI / DevTools / Enterprise / Learning), `tier`, and the lazy component reference
4. The platform tabs + counts derive from `src/lib/products-catalog.ts` — update counts via `src/lib/constants.ts`

### Adding Developer Tools

1. Create the component in `src/components/roycss/tools/<name>.tsx` (default export, `"use client"`)
2. Add a lazy import to `src/components/roycss/platform-tools.tsx` (uses `next/dynamic` with `ssr: false`)
3. Add the tool entry to the tools array with `id`, `name`, `category`, `description`, and the lazy component reference

### Adding Backend Modules

1. Create `backend/src/modules/<name>/` with:
   - `routes.ts` — Express router with Zod-validated handlers
   - `service.ts` — business logic + Prisma calls
   - `schema.ts` — Zod schemas for request/response
2. Mount the router in `backend/src/server/app.ts`
3. (If the module needs DB tables) edit `backend/prisma/schema.prisma` and run `bun run db:push` from the `backend/` directory

### Adding Documentation Pages

1. Add the page entry to `src/lib/docs-sitemap.ts` (4 categories: Getting Started, Concepts, API, Guides)
2. Create the route file in `src/app/docs/<category>/<slug>/page.tsx` as a React Server Component with `export const metadata`
3. Use `<h1>` / `<h2>` semantic headings and `<pre><code>` for code blocks
4. The prev/next pager auto-derives from the sitemap order

## Performance Guidelines

- **Use `next/dynamic`** for below-the-fold sections — keep the initial JS bundle small
- **Use `React.lazy`** for the 62 pro components and 64 tools — never import them eagerly
- **Use `useMemo`** for expensive derivations (filtering 1,809 effects, sorting collections)
- **Use `useCallback`** for handlers passed to memoized children
- **Prefer CSS animations** over JS animations — `transform` / `opacity` only
- **Respect `prefers-reduced-motion`** — every animated UI must have a static fallback (Framer Motion `<MotionConfig reducedMotion="user">`)
- **Virtual scroll long lists** — the effects gallery uses `VirtualScrollGrid` (only ~30 cards in DOM at a time)
- **No layout shifts** — reserve dimensions for async content (skeletons with the same height/width)
- **No indigo/blue primaries** — use OKLCH emerald / teal / amber / rose tokens from `src/lib/design-tokens.ts`

## Accessibility Checklist

- [ ] Semantic HTML (`<main>`, `<header>`, `<nav>`, `<section>`, `<article>`)
- [ ] Every `<button>` has `type="button"` (or `type="submit"` for actual form submits)
- [ ] Icon-only buttons have `aria-label` matching the visible text
- [ ] All images have descriptive `alt` text (or `alt=""` for decorative)
- [ ] 44px minimum touch target on mobile
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 for body text, 3:1 for large text)
- [ ] Keyboard navigation works (Tab order, visible focus ring, Esc to close overlays)
- [ ] `prefers-reduced-motion` respected — animations disable gracefully
- [ ] `sr-only` class for screen-reader-only content

## Useful Commands

```bash
bun run dev                    # Frontend dev server (port 3000)
bun run lint                   # ESLint + Next.js rules
npx tsc --noEmit               # TypeScript type check (whole project)
bun run db:push                # Push Prisma schema to SQLite
cd backend && bun run dev      # Backend (port 4000)
cd mini-services/live-service && bun run dev  # WebSocket (port 3003)
```

## Debugging Tips

- **Dev server log**: read `/home/z/my-project/dev.log` (most recent lines only) to see compile errors
- **Effect not rendering**: check the `roycss-` class prefix is applied to the preview element and that `DynamicEffectCss` is mounting the `<style>` for that effect
- **Bundle bloat**: `npx @next/bundle-analyzer` — look for pro components or tools imported eagerly
- **Type errors in `roycss-page.tsx`**: the orchestrator is ~2,600 lines; isolate the change and run `npx tsc --noEmit` after each edit
- **WebSocket connection refused**: confirm `XTransformPort=3003` is in the URL query (never `http://localhost:3003`)
