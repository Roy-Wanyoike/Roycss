<div align="center">

# RoyCSS

### AI-Native Frontend Engineering Platform

**1,959 CSS effects · 62 platform products · 68 developer tools · AI assistance**

[![Effects](https://img.shields.io/badge/effects-1,959-10b981?style=flat-square)](#)
[![Categories](https://img.shields.io/badge/categories-29-06b6d4?style=flat-square)](#)
[![Products](https://img.shields.io/badge/platform_products-62-8b5cf6?style=flat-square)](#)
[![DevTools](https://img.shields.io/badge/devtools-68-f59e0b?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-ec4899?style=flat-square)](#)
[![Node](https://img.shields.io/badge/node-%3E%3D18.18-339933?style=flat-square)](#)

</div>

---

<div align="center">

![RoyCSS Hero](docs/screenshots/hero.png)

*The RoyCSS platform — 1,959 effects, 62 platform products, live previews, AI assistance.*

</div>

---

## What is RoyCSS?

RoyCSS is a **complete frontend engineering platform** — not just a CSS effects library. It combines:

- **1,959 production-ready CSS effects** across 29 categories with live previews and copyable code
- **62 platform products** (RoyAI, Roy Studio, Roy Inspector, Roy Cloud, Marketplace, Academy, etc.)
- **68 developer tools** (CSS generators, visualizers, analyzers, converters)
- **AI-native development** (RoyAI assistant, LLM-backed modules for architect, designer, mentor, pair, review)
- **Design system** (OKLCH color tokens, theme presets, motion library)
- **Accessibility-first** (WCAG 2.2 AA, keyboard navigation, screen reader support, reduced-motion)
- **Framework-agnostic** (React, Vue, Angular, Svelte — copy as CSS, inline, Tailwind, SCSS, CSS-in-JS, Vue, HTML)
- **PWA-installable** (offline support, service worker, install prompt)

---

## Screenshots

<div align="center">

| | |
|---|---|
| ![Hero](docs/screenshots/hero.png) | ![Effects Grid](docs/screenshots/effects-grid.png) |
| **Homepage** | **Effects Gallery (1,959 effects)** |
| ![Featured Carousel](docs/screenshots/featured-carousel.png) | ![Effect Detail](docs/screenshots/effect-detail.png) |
| **Featured Effects Carousel** | **Effect Detail Dialog** |
| ![Platform Ecosystem](docs/screenshots/platform-ecosystem.png) | ![Platform Differentiators](docs/screenshots/platform-differentiators.png) |
| **Platform Ecosystem (62 products)** | **Platform Pillars** |
| ![Get Started](docs/screenshots/get-started.png) | ![FAQ](docs/screenshots/faq.png) |
| **Getting Started Guide** | **FAQ Section** |
| ![Mobile Hero](docs/screenshots/mobile-hero.png) | ![Mobile Menu](docs/screenshots/mobile-menu.png) |
| **Mobile Responsive** | **Mobile Navigation** |
| ![Color Customizer](docs/screenshots/color-customizer.png) | ![Contact Form](docs/screenshots/contact-form.png) |
| **Color Customizer** | **Contact Form** |

</div>

---

## Quick Start

```bash
# Clone
git clone https://github.com/Roy-Wanyoike/Roycss.git
cd Roycss

# Install dependencies
bun install                    # Frontend
cd backend-node && bun install  # Backend (Node)
cd ..

# Set up backend environment
cp backend-node/.env.example backend-node/.env

# Initialize database
cd backend-node
bunx prisma generate
bunx prisma db push --schema=./prisma/schema.prisma
cd ..

# Build the effects package
bun run build:package

# Start the backend (port 4000)
cd backend-node && bun run --env-file=.env dev &

# Start the frontend (port 3000)
bun run dev
```

Open `http://localhost:3000` — you should see 1,959 effects, 62 platform products, live previews, search (⌘K), and auth (Sign in / Create account).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend (Node)** | Express.js 4, TypeScript, Prisma ORM, Zod validation, JWT auth — the running source of truth |
| **Backend (Go)** | Go 1.23, `net/http` + `chi`, modular monolith — production target (Cloud Run + PostgreSQL + Redis) |
| **Database** | SQLite (dev) / Supabase Postgres (prod) — 45 Prisma models |
| **WebSocket** | Socket.io (Roy Live, port 3003) |
| **PWA** | Service Worker v2.1.0, manifest.json, 5 icons |
| **Testing** | Vitest (111 unit + 15 integration), Playwright E2E specs, k6 load tests |
| **CI/CD** | GitHub Actions, Dependabot |
| **AI** | LLM client (OpenAI/Anthropic, mock fallback) |
| **Browser Automation** | Playwright + axe-core + Lighthouse |

---

## Project Structure

```
Roycss/
├── src/                    # Frontend (Next.js 16)
│   ├── app/                # Routes + API routes
│   │   ├── api/v1/[...path]/  # Catch-all proxy to backend (Vercel-compatible)
│   │   ├── api/auth/       # Auth proxy routes (httpOnly cookies)
│   │   ├── api/health/     # Health check endpoint
│   │   └── api/og/         # OG image (PNG)
│   ├── components/roycss/  # 100+ platform components
│   │   ├── pro/            # 62 platform products
│   │   ├── tools/          # 68 developer tools
│   │   ├── effects/        # 7 WebGL effects
│   │   └── auth/           # Auth UI (LoginSheet, RegisterSheet, UserMenu)
│   └── lib/               # Effects (1,959), product registry, types, API client
│
├── backend-node/           # Express.js + Prisma — the running source of truth
├── backend-go/             # Go modular monolith — production target
│   ├── src/modules/        # 68 API modules
│   ├── prisma/schema.prisma # 45 Prisma models
│   ├── tests/integration/  # 15 integration tests
│   └── Dockerfile         # Docker deployment
│
├── mini-services/         # WebSocket service (Socket.io, port 3003)
├── mcp-server/            # MCP Server for AI assistants
├── cli/                   # RoyCLI
├── vscode-extension/      # VS Code extension
├── public/                # Logo, PWA icons, manifest, sw.js, og.png
├── dist/                  # Build artifacts (roycss.css, effects.json)
├── docs/                  # Architecture, ADRs, screenshots
├── scripts/               # Build + utility scripts
├── tests/                 # Unit tests, E2E specs, load tests
├── .github/               # CI/CD workflows + dependabot
├── vercel.json            # Frontend deployment (Vercel)
├── render.yaml            # Backend deployment (Render)
└── .nvmrc                 # Node version (20)
```

### Dual-backend architecture

RoyCSS runs **two backend folders** for scaling and failover:

- **`backend-node/`** — Express + Prisma + SQLite. The **running source of truth**; works in any Node environment and serves all 68 modules today.
- **`backend-go/`** — Go modular monolith. The **production target** (Cloud Run + PostgreSQL + Redis). Today it registers all 68 module route surfaces; modules not yet ported return `501` so clients fall back to `backend-node`.

Both backends expose the **same `/api/v1` contract** (68 modules). The frontend is backend-agnostic — it hits `/api/v1/<module>` and the catch-all proxy (or Caddy `XTransformPort` in dev) routes to the active backend. See `docs/PENDING-FEATURES.md` (PF-008) for the batched Go port plan.

---

## Deployment

### Frontend → Vercel

The frontend deploys as a standalone Next.js app on Vercel. A catch-all API proxy route (`src/app/api/v1/[...path]/route.ts`) forwards all `/api/v1/*` requests to the backend.

1. Go to [vercel.com](https://vercel.com) → Import Project → Select this repo
2. Set environment variables:
   - `BACKEND_URL` = your Render backend URL (e.g., `https://roycss-backend.onrender.com`)
   - `LIVE_URL` = your WebSocket service URL (or remove if not needed)
3. Deploy — Vercel auto-detects Next.js and uses `vercel.json`

### Backend → Render

The backend deploys as a Node.js web service on Render.

1. Go to [render.com](https://render.com) → New → Blueprint
2. Select this repository
3. Render reads `render.yaml` and creates the backend service automatically
4. Set these environment variables in the Render dashboard:
   - `DATABASE_URL` = your Supabase Postgres connection string
   - `JWT_SECRET` = a 64-char random string (`openssl rand -base64 64`)
   - `JWT_REFRESH_SECRET` = a different 64-char random string
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SECRET_KEY` = your Supabase service role key
   - `SUPABASE_PUBLISHABLE_KEY` = your Supabase anon key
   - `SUPABASE_JWKS_URL` = `https://<your-project>.supabase.co/auth/v1/.well-known/jwks.json`
5. Deploy — Render runs `bun install && bunx prisma generate` and starts the server

### Do I Need a Separate Repo?

**No.** This single repo works for both:
- **Frontend** deploys from the root directory → Vercel reads `vercel.json`
- **Backend** deploys from the `backend-node/` subdirectory → Render reads `render.yaml` (which specifies `rootDir: backend-node`)

Both services read from the same GitHub repo but deploy independently.

---

## Node Version Compatibility

RoyCSS supports **Node.js 18.18+** and **Bun 1.0+**:

- `.nvmrc` specifies Node 20 (LTS)
- `package.json` declares `"engines": {"node": ">=18.18.0", "bun": ">=1.0.0"}`
- `backend-node/package.json` declares `"engines": {"node": ">=18.18.0"}`

To switch Node versions locally:
```bash
nvm use 20    # Use Node 20 LTS
# or
nvm use 18    # Use Node 18 (minimum supported)
```

The project uses `bun` as the primary runtime, which is compatible with all Node 18+ APIs.

---

## Environment Variables

See [`backend-node/.env.example`](backend-node/.env.example) for all variables.

### Required for Development

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite path (dev) or Supabase Postgres URL (prod) |
| `JWT_SECRET` | JWT signing secret (64-char random string in prod) |
| `JWT_REFRESH_SECRET` | Refresh token secret (different from JWT_SECRET) |

### For Production Deployment

| Variable | Where | Purpose |
|---|---|---|
| `BACKEND_URL` | Vercel (frontend) | URL of the Render backend service |
| `LIVE_URL` | Vercel (frontend) | URL of the WebSocket service |
| `DATABASE_URL` | Render (backend) | Supabase Postgres connection string |
| `SUPABASE_URL` | Render (backend) | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Render (backend) | Supabase service role key |

### Optional (modules use mock fallback)

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`, `STORAGE_*`, `CDN_API_TOKEN`, `FIGMA_TOKEN`, `GITHUB_TOKEN`, `NPM_TOKEN`

---

## Scripts

```bash
# Frontend
bun run dev              # Dev server (port 3000)
bun run lint             # ESLint
bun run build            # Production build
bun run build:package    # Build dist/ artifacts

# Backend
cd backend
bun run dev              # Dev server (port 4000)
bun run typecheck        # TypeScript check
bun run test:integration # Integration tests (15 tests)
bun run db:push          # Push schema to database
```

---

## Testing

| Suite | Tests | Status |
|---|---|---|
| Unit (Vitest) | 111 | ✅ All pass |
| Integration (Vitest + supertest) | 15 | ✅ All pass |
| Lint (ESLint) | 0 errors | ✅ Clean |
| Typecheck (tsc) | 0 errors | ✅ Clean |

---

## Effect Categories

| Category | Count | Examples |
|---|---|---|
| Animations | 312 | Pulse glow, bounce in, fade up |
| Hover Effects | 110 | 3D tilt, glow border, shine sweep |
| Text Effects | 101 | Gradient text, neon glow, glitch |
| Backgrounds | 128 | Aurora, mesh gradient, starfield |
| Loaders | 66 | Spinner, ring, dots |
| 3D Transforms | 31 | Card flip, cube rotate, perspective |
| Buttons | 55 | Neon button, gradient glow, shine |
| Cards | 56 | Glassmorphism, hover lift, tilt |
| Visual Effects | 258 | Glitch, scanlines, CRT, holographic |
| Glass UI | 50 | Frosted glass, neon glass, holographic |
| + 19 more categories | ... | ... |

---

## Architecture

```
Frontend (Next.js 16, Vercel)
    ↕  REST API via catch-all proxy
Backend-node (Express + Prisma, Render)  ⇄  Backend-go (Go, Cloud Run — production target)
    ↕  Database (Supabase Postgres)
Live Service (Socket.io, separate)
```

**Dual-backend modular monolith** — `backend-node` is the running source of truth; `backend-go` is the production target with the same `/api/v1` surface for failover. No microservices needed.

See [`docs/PENDING-FEATURES.md`](docs/PENDING-FEATURES.md) for the full implementation backlog (47 items: 7 P0 / 8 P1 / 16 P2 / 16 P3) — the single source of truth for pending work, ready for per-item agent dispatch.

---

## License

MIT License — see [`LICENSE`](LICENSE).

---

<div align="center">

**Built by [Royford Wanyoike Wamaitha](https://github.com/Roy-Wanyoike)**

</div>
