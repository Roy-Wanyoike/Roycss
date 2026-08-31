<div align="center">

# RoyCSS

### AI-Native Frontend Engineering Platform

**1,749 CSS effects · 62 platform products · 68 developer tools · AI assistance**

A modern, AI-native frontend engineering platform — design, build, customize, and ship modern interfaces in one cohesive ecosystem.

[![Effects](https://img.shields.io/badge/effects-1,749-10b981?style=flat-square)](#)
[![Categories](https://img.shields.io/badge/categories-29-06b6d4?style=flat-square)](#)
[![Products](https://img.shields.io/badge/platform_products-62-8b5cf6?style=flat-square)](#)
[![DevTools](https://img.shields.io/badge/devtools-68-f59e0b?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-ec4899?style=flat-square)](#)

</div>

---

<div align="center">

![RoyCSS Hero](docs/screenshots/hero.png)

*The RoyCSS landing page — 1,749 effects, 62 platform products, live previews, AI assistance.*

</div>

---

## Overview

RoyCSS is not just a CSS effects library — it's a **complete frontend engineering platform** combining:

- **1,749 CSS effects** across 29 categories with live previews, copyable code, zero JS runtime
- **62 platform products** (RoyAI, Roy Studio, Roy Inspector, Roy Cloud, Marketplace, Academy, etc.)
- **68 developer tools** (CSS generators, visualizers, analyzers, converters)
- **AI-native development** (RoyAI assistant, LLM-backed modules for architect, designer, mentor, pair, review)
- **Design system** (OKLCH color tokens, 10 theme presets, motion library)
- **Accessibility-first** (WCAG 2.2 AA, keyboard navigation, screen reader support)
- **Framework-agnostic** (React, Vue, Angular, Svelte — copy as CSS, inline, Tailwind, SCSS, CSS-in-JS, Vue, HTML)
- **PWA-installable** (offline support, service worker, install prompt)

---

## Screenshots

<div align="center">

| | |
|---|---|
| ![Hero](docs/screenshots/hero.png) | ![Effects Grid](docs/screenshots/effects-grid.png) |
| **Hero Section** | **Effects Gallery** |
| ![Featured Carousel](docs/screenshots/featured-carousel.png) | ![Effect Detail](docs/screenshots/effect-detail.png) |
| **Featured Effects Carousel** | **Effect Detail Dialog** |
| ![Platform Ecosystem](docs/screenshots/platform-ecosystem.png) | ![Platform Differentiators](docs/screenshots/platform-differentiators.png) |
| **Platform Ecosystem** | **Platform Differentiators** |
| ![Get Started](docs/screenshots/get-started.png) | ![FAQ](docs/screenshots/faq.png) |
| **Get Started Guide** | **FAQ Section** |
| ![Mobile Hero](docs/screenshots/mobile-hero.png) | ![Mobile Menu](docs/screenshots/mobile-menu.png) |
| **Mobile Hero** | **Mobile Navigation** |
| ![Color Customizer](docs/screenshots/color-customizer.png) | ![Contact Form](docs/screenshots/contact-form.png) |
| **Color Customizer** | **Contact Form** |

</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), TypeScript 5, Tailwind CSS 4, shadcn/ui (New York) |
| **Backend (Node)** | Express.js 4, TypeScript, Prisma ORM, Zod validation, JWT auth — the running source of truth |
| **Backend (Go)** | Go 1.23, `net/http` + `chi`, modular monolith — production target (Cloud Run + PostgreSQL + Redis) |
| **Database** | SQLite (dev) / Supabase Postgres (prod) — 45 Prisma models |
| **WebSocket** | Socket.io (Roy Live, port 3003) |
| **PWA** | Service Worker v2.1.0, manifest.json, 5 icons |
| **Testing** | Vitest (111 unit + 15 integration), Playwright (10 E2E specs), k6 (load tests) |
| **CI/CD** | GitHub Actions, Dependabot |
| **AI** | LLM client (OpenAI/Anthropic, mock fallback) |
| **Browser Automation** | Playwright + axe-core + Lighthouse |

---

## Project Structure

```
roycss/
├── src/                          # Next.js 16 frontend (App Router)
│   ├── app/                      # Routes + API routes
│   │   ├── page.tsx              # Homepage (the only user-visible route)
│   │   ├── layout.tsx            # Root layout (metadata, AuthProvider, PWA)
│   │   ├── proxy.ts               # CSP nonce middleware
│   │   └── api/                   # API routes (auth, effects, health, og)
│   ├── components/roycss/         # Platform components (100+ files)
│   │   ├── pro/                   # 62 platform product components
│   │   ├── tools/                 # 68 developer tool components
│   │   ├── effects/               # 7 WebGL/canvas effects
│   │   └── auth/                  # Auth UI (LoginSheet, RegisterSheet, UserMenu)
│   └── lib/                      # Shared libraries (effects, registry, types)
│
├── backend-node/                 # Express.js backend — the running source of truth
│   ├── src/modules/               # 68 API modules (routes + service + schema)
│   ├── src/lib/                   # Shared libs (db, cache, llm-client, supabase)
│   ├── prisma/schema.prisma       # 45 Prisma models
│   └── tests/integration/          # 15 integration tests
│
├── backend-go/                    # Go modular monolith — production target (dual-backend)
│   ├── cmd/api/main.go            # HTTP server — registers all 68 module routes
│   ├── cmd/migrate/main.go        # PostgreSQL migration runner
│   ├── internal/                  # 68 domain packages mirroring backend-node/src/modules
│   │   ├── effects/               # real handler (the only fully-implemented Go module)
│   │   ├── health/                # real handler
│   │   └── <66 more>/handler.go    # 501 stubs mirroring backend-node (failover-ready)
│   ├── pkg/                       # platform layer (database, redis, http, telemetry — to fill)
│   ├── database/sql/              # → ../database/sql (14 PostgreSQL migrations)
│   ├── Dockerfile                 # Cloud Run container build
│   └── go.mod
│
├── database/sql/                  # 14 PostgreSQL migration files (shared by backend-go)
├── mini-services/live-service/    # Socket.io WebSocket (port 3003)
├── mcp-server/                    # MCP Server for AI assistants
├── cli/                           # RoyCLI
├── vscode-extension/              # VS Code extension
├── public/                        # Static assets (PWA icons, manifest, sw.js, og.png)
├── dist/                          # Build artifacts (roycss.css, effects.json)
├── docs/                          # Documentation + audit reports + screenshots
├── scripts/                      # Build + utility scripts
├── tests/                        # Frontend tests (unit, e2e, load)
├── .github/                       # CI/CD workflows + dependabot
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS 4 config
├── next.config.ts                # Next.js 16 config
└── README.md                     # You are here
```

### Dual-backend architecture

RoyCSS runs **two backend folders** for scaling and failover:

- **`backend-node/`** — Express + Prisma + SQLite. The **running source of truth**; works in any Node environment and serves all 68 modules today.
- **`backend-go/`** — Go modular monolith. The **production target** (Cloud Run + PostgreSQL + Redis). Today it registers all 68 module route surfaces; modules not yet ported return `501` so clients fall back to `backend-node`.

Both backends expose the **same `/api/v1` contract**. The frontend (`src/components/roycss/_use-backend-data.ts`) is backend-agnostic — it just hits `/api/v1/<module>?XTransformPort=<port>`. When the Go backend is fully implemented, traffic can be switched or split between the two per module. See `docs/PENDING-FEATURES.md` for the implementation backlog.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (runtime + package manager)

### Installation

```bash
# Clone
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss

# Install frontend + backend-node
bun install
cd backend-node && bun install && cd ..

# Set up backend-node environment
cp backend-node/.env.example backend-node/.env

# Initialize database
cd backend-node
bunx prisma generate
bunx prisma db push --schema=./prisma/schema.prisma
cd ..

# Build effects package
bun run build:package

# Start backend-node (port 4000)
cd backend-node && bun run --env-file=.env dev &

# Start frontend (port 3000)
bun run dev
```

Open `http://localhost:3000` — you should see 1,749 effects, 62 platform products, live previews, search (⌘K), and auth (Sign in / Create account).

> **backend-go** (the Go production target) requires Go 1.23+, PostgreSQL, and Redis. The Go backend registers all 68 module routes today; unported modules return `501` and clients fall back to `backend-node`. See `docs/PENDING-FEATURES.md` (PF-008) for the batched Go port plan.

---

## Scripts

```bash
# Frontend
bun run dev              # Dev server (port 3000)
bun run lint             # ESLint
bun run build            # Production build
bun run build:package    # Build dist/ artifacts
bun run test             # Unit tests (111 tests)

# Backend (Node)
cd backend-node
bun run dev              # Dev server (port 4000)
bun run typecheck        # TypeScript check
bun run test:integration # Integration tests (15 tests)
bun run db:push          # Push schema to database

# Backend (Go) — requires Go 1.23+ + PostgreSQL + Redis
cd backend-go
go run ./cmd/api         # API server (port 4000 by default)
go run ./cmd/migrate     # Apply database/sql/*.sql migrations
```

---

## Environment Variables

See [`backend-node/.env.example`](backend-node/.env.example) for all variables.

**Required for dev**: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
**Optional** (modules use mock fallback): `OPENAI_API_KEY`, `CDN_API_TOKEN`, `STORAGE_*`, `FIGMA_TOKEN`, `GITHUB_TOKEN`, `RESEND_API_KEY`, `SENTRY_DSN`

---

## Testing

| Suite | Tests | Status |
|---|---|---|
| Unit (Vitest) | 111 | ✅ All pass |
| Integration (Vitest + supertest) | 15 | ✅ All pass |
| Lint (ESLint) | 0 errors | ✅ Clean |
| Typecheck (tsc) | 0 errors | ✅ Clean |

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │            Next.js 16 (port 3000)   │
                    │   Frontend — renders, SEO, PWA, UI │
                    └───────────────┬─────────────────────┘
                                    │  /api/v1/<module>?XTransformPort=<port>
                                    │  (Caddy gateway routes by port)
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐              ┌───────▼────────┐
            │  backend-node  │              │  backend-go   │
            │  Express+Prisma│              │  Go monolith  │
            │  SQLite        │  failover    │  PostgreSQL   │
            │  68 modules ✓  │◄────────────►│  68 routes     │
            │  SOURCE OF TRUTH│              │  (501 stubs → │
            │  (port 4000)   │              │   port 4000)  │
            └────────────────┘              └───────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                            ┌───────▼────────┐
                            │  Socket.io    │
                            │  Roy Live     │
                            │  (port 3003)  │
                            └──────────────┘
```

Both backends expose the **same `/api/v1` surface** (68 modules). `backend-node` is the running source of truth; `backend-go` mirrors all 68 module routes for failover and is the production target (Cloud Run + PostgreSQL + Redis). See `docs/PENDING-FEATURES.md` for the full implementation backlog.

---

## Documentation

The implementation backlog lives in [`docs/PENDING-FEATURES.md`](docs/PENDING-FEATURES.md) — 47 actionable items (7 P0 / 8 P1 / 16 P2 / 16 P3) with acceptance criteria, files-to-touch, and recommended agent type per item. Dispatch agents per PF-NNN.

| Reference | Location |
|---|---|
| Pending Features (single source of truth) | `docs/PENDING-FEATURES.md` |
| Contributing | `docs/CONTRIBUTING.md` |

---

## License

MIT License — see [`LICENSE`](LICENSE).

---

<div align="center">

**Built by [Royford Wanyoike Wamaitha](https://github.com/Roy-Wanyoike)**

</div>
