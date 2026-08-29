# RoyCSS Architecture

## Overview

RoyCSS is an AI-native frontend engineering platform built on Next.js 16 (App Router), TypeScript, Tailwind CSS 4, and shadcn/ui. The platform ships **1,809 pure-CSS effects** across **31 categories**, a **62-product platform** spanning six tiers, **64 developer tools**, **35 documentation pages**, and a modular **68-module Express backend**. All visual effects are framework-agnostic and require zero JavaScript at runtime.

---

## Current Architecture

### Frontend

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with OKLCH color tokens
- **UI Components**: shadcn/ui (New York style) with Lucide icons
- **State**: React hooks (`useState`, `useEffect`, `useMemo`) — no global state library
- **Animations**: Framer Motion + pure CSS animations
- **Routing**: Single root route (`src/app/page.tsx`) — all sections live on the home page

### Backend

- **Framework**: Express 4 + TypeScript (modular architecture)
- **Database**: Prisma ORM + SQLite (dev) / PostgreSQL (production)
- **Auth**: JWT with refresh tokens
- **Validation**: Zod on all API routes
- **Caching**: In-memory LRU cache
- **Modules**: 68 domain modules with `routes.ts` + `service.ts` + `schema.ts` each
- **Port**: 4000 (dev)

### Real-Time

- **WebSocket**: Socket.io mini-service on port 3003 (Roy Live)
- **Gateway**: Caddy with `XTransformPort` query parameter routing
- **Frontend connection**: `io("/?XTransformPort=3003")` — relative path only, never absolute

### Data Architecture

- **Effects**: 1,809 CSS effects across 31 categories in 46 batch files (`src/lib/effects-batch-*.ts`)
- **Products**: 62 platform products in 6 categories (Build / Design / AI / DevTools / Enterprise / Learning)
- **Tools**: 64 developer tools (`src/components/roycss/tools/`)
- **Docs**: 35 documentation pages (`src/app/docs/`)
- **Recipes**: 12 implementation recipes (`src/lib/roycss-recipes.ts`, `roycss-new-recipes.ts`)
- **Patterns**: 10 UI patterns (`src/lib/roycss-patterns.ts`)
- **Collections**: 22 curated collections (`src/lib/roycss-collections.ts`)
- **WebGL/Canvas effects**: 7 GPU-accelerated scenes (`src/components/roycss/effects/`)

---

## Key Design Decisions

### CSS-First Philosophy

All 1,809 effects are pure CSS — zero JavaScript runtime. This ensures:

- Smallest possible bundle (~1 KB per effect)
- Framework-agnostic (works with React, Vue, Svelte, Angular, vanilla HTML)
- GPU-accelerated animations using `transform` / `opacity`
- `prefers-reduced-motion` support built-in via `@media` queries
- No hydration cost on the server-rendered HTML

### OKLCH Color System

All color tokens use the OKLCH perceptual color space for:

- Perceptually uniform color adjustments (a +0.1 lightness step "feels" the same across hues)
- Better dark-mode mapping (the same lightness value maps correctly between themes)
- WCAG-compliant contrast ratios (predictable for AA/AAA text)

### Lazy Loading Strategy

- 62 pro components loaded via `React.lazy()` + `<Suspense>`
- Below-the-fold sections loaded via `next/dynamic` with `ssr: true`
- `PlatformTools` (64 tool imports) loaded via `next/dynamic` with `ssr: false`
- Effects gallery uses virtual scrolling (`VirtualScrollGrid`) — only visible cards render

### Zero-Indigo / Zero-Blue Primary Palette

RoyCSS intentionally avoids indigo and blue as primary colors. The accent palette is emerald / teal / amber / rose / green / lime, all mapped through OKLCH tokens in `src/lib/design-tokens.ts` and `src/app/globals.css`.

---

## Directory Structure

```
roycss/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout, theme provider, JSON-LD
│   │   ├── page.tsx              # Single home route — all sections
│   │   ├── error.tsx             # Error boundary
│   │   ├── loading.tsx           # Route-level skeleton
│   │   ├── not-found.tsx         # 404 page
│   │   ├── globals.css           # Tailwind + OKLCH tokens
│   │   ├── roycss.css            # Effect stylesheet
│   │   ├── docs/                 # 35 documentation pages
│   │   ├── api/                  # API routes (ai-playground, css-doctor, ai-migration, contact, og)
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   │
│   ├── components/
│   │   ├── roycss/               # Main RoyCSS components
│   │   │   ├── roycss-page.tsx  # Single-page orchestrator (~2,600 lines)
│   │   │   ├── pro/             # 62 platform product components
│   │   │   ├── tools/           # 64 developer tools
│   │   │   ├── effects/         # 7 WebGL / Canvas scenes
│   │   │   └── *.tsx            # Section components (hero, effects, platform, docs, etc.)
│   │   ├── ui/                  # shadcn/ui primitives (New York style)
│   │   ├── ui-library/          # Token + showcase primitives
│   │   └── docs/                # Docs layout / sidebar / TOC / search
│   │
│   ├── lib/                     # Data + utilities
│   │   ├── roycss-effects.ts    # Master effects registry (combines 46 batches)
│   │   ├── effects-batch-1..46.ts  # 1,809 CSS effects split across 46 files
│   │   ├── roycss-types.ts      # CSSEffect, EffectCategory, PreviewType, categoryMeta
│   │   ├── effect-taxonomy.ts   # Category definitions + boundaries
│   │   ├── constants.ts         # Single source of truth (counts, version, license)
│   │   ├── design-tokens.ts      # OKLCH color tokens
│   │   ├── products-catalog.ts   # 62 platform products
│   │   ├── docs-sitemap.ts      # 35 docs pages
│   │   ├── roycss-recipes.ts     # 12 implementation recipes
│   │   ├── roycss-patterns.ts    # 10 UI patterns
│   │   ├── roycss-collections.ts # 22 curated collections
│   │   ├── framework-adapters.ts # React / Vue / Svelte / Angular / Astro
│   │   ├── copy-formats.ts       # Copy-to-clipboard output formats
│   │   ├── docs-data.ts          # Inline docs fallback data
│   │   ├── db.ts                 # Prisma client
│   │   └── utils.ts              # cn() helper
│   │
│   ├── hooks/                   # use-favorites, use-mobile, use-toast
│   └── cli/                     # RoyCSS CLI entry
│
├── backend/                     # Express API (separate package.json)
│   ├── src/
│   │   ├── modules/             # 68 domain modules (routes.ts + service.ts + schema.ts)
│   │   ├── server/              # app.ts + middleware (auth, cors, rateLimit, validate, error, logging)
│   │   ├── lib/                 # jwt, logger, cache, db
│   │   ├── config/              # env, constants
│   │   └── types/
│   └── prisma/schema.prisma
│
├── mini-services/
│   └── live-service/           # Socket.io WebSocket (port 3003)
│
├── prisma/                      # Frontend Prisma schema
├── docs/                        # Architecture documentation + ADRs
│   └── adr/                     # Architecture Decision Records
├── inspector/                   # Chrome DevTools / side panel extension
├── vscode-extension/           # Published VS Code extension (.vsix)
├── vscode-support/              # Class data + snippets JSON
├── scripts/                     # Build / release / migration scripts
├── tests/                       # Unit + e2e + a11y + i18n
├── performance/                 # Benchmarks + budgets
├── compat/                      # Browser support matrix + polyfills
├── a11y/                         # ARIA coverage / contrast / keyboard audits
├── perf/                        # Bundle / virtual-scroll / memory benchmarks
├── public/                      # Static assets + PWA manifest + service worker
├── Caddyfile                    # Gateway config (XTransformPort routing)
├── next.config.ts              # Next.js config (CSP headers, etc.)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Build & Deploy

- **Frontend dev**: `bun run dev` (port 3000, auto-restarted by the sandbox)
- **Backend dev**: `cd backend && bun run dev` (port 4000)
- **WebSocket dev**: `cd mini-services/live-service && bun run dev` (port 3003)
- **Lint**: `bun run lint`
- **Type check**: `npx tsc --noEmit`
- **DB push**: `bun run db:push`
- **Build**: `bun run build` (avoid in dev sandbox — only for production)

> **Note**: Never use `bun run build` in the dev sandbox; the auto dev server is the only running process on port 3000.

---

## Performance Budgets

- **Initial JS**: Code-split via `next/dynamic` + `React.lazy` — no monolithic bundle
- **CSS**: Effects injected on-demand via `MutationObserver` (`DynamicEffectCss`)
- **CLS**: 0 (no layout shifts; all effect previews reserve fixed dimensions)
- **prefers-reduced-motion**: Globally respected via CSS `@media (prefers-reduced-motion: reduce)` + Framer Motion `<MotionConfig>`
- **Virtual scrolling**: Effects gallery only renders visible cards (1,809 effects, ~30 in DOM at any time)
- **Bundle**: shadcn/ui primitives are tree-shaken; only used components ship

---

## Security

- **CSP headers** configured in `next.config.ts`
- **Rate limiting** on AI endpoints (`ai-playground`, `ai-migration`, `css-doctor`)
- **CSRF protection** via origin verification on mutation routes
- **All inputs validated** with Zod schemas (frontend + backend)
- **JWT auth** with short-lived access tokens + refresh tokens
- **Prisma ORM** prevents SQL injection (parameterized queries)
- **No `eval()` or `new Function()`** in production code
- **`dangerouslySetInnerHTML`** used only for trusted in-app CSS strings
- **`bun audit`** run regularly; no unmaintained dependencies; MIT license for all packages

See [SECURITY.md](./SECURITY.md) for the full policy and vulnerability reporting process.

---

## Architectural Decision Records

See [`docs/adr/`](./docs/adr/) for the full set. The three foundational ADRs:

- [ADR-001: Single Repository (Non-Monorepo)](./docs/adr/ADR-001-repository-architecture.md)
- [ADR-002: CSS-First Effects (Zero JavaScript Runtime)](./docs/adr/ADR-002-css-first-architecture.md)
- [ADR-003: React Hooks (No Global State Library)](./docs/adr/ADR-003-state-management.md)
