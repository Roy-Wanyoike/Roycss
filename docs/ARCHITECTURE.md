# RoyCSS — Architecture Document

## Architecture: Modular Monolith

RoyCSS uses a **modular monolith** architecture — the correct choice for this project because:

1. **Single team** — one developer maintains the entire platform
2. **68 backend modules** are not large enough to justify microservices
3. **Shared types and models** are easier to maintain in a monolith
4. **Deployment is simpler** — one frontend + one backend + one WebSocket service
5. **The uploaded engineering document explicitly recommends**: "Build a MODULAR MONOLITH first. Do NOT create unnecessary microservices."

---

## Structure

```
roycss/
├── src/                    # FRONTEND (Next.js 16 App Router)
│   ├── app/                # Routes + API routes
│   ├── components/roycss/  # 100+ platform components
│   └── lib/               # Shared libraries (effects, registry, types)
│
├── backend/               # BACKEND (Express.js + Prisma)
│   ├── src/modules/        # 68 API modules
│   ├── src/lib/            # Shared libs (db, cache, llm-client, supabase)
│   ├── prisma/             # 45 Prisma models
│   └── tests/              # Integration tests
│
├── mini-services/         # WEBSOCKET SERVICE (Socket.io)
│   └── live-service/       # Roy Live real-time sessions (port 3003)
│
├── mcp-server/            # MCP Server (AI assistant integration)
├── cli/                   # RoyCLI (command-line tool)
├── vscode-extension/      # VS Code extension
│
├── dist/                  # Build artifacts (roycss.css, effects.json)
├── public/                # Static assets (logo, PWA icons, manifest, sw.js)
├── docs/                  # Documentation + reports + screenshots
├── scripts/               # Build + utility scripts
├── tests/                 # Frontend tests (unit, e2e, load)
└── .github/               # CI/CD workflows + dependabot
```

### Why `src/` instead of `/frontend/`

The frontend lives in `src/` (not `/frontend/`) because:
- Next.js 16 expects the app directory at `src/app/` by convention
- All imports use `@/` alias which maps to `./src/`
- Moving to `/frontend/` would require updating `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, and every `@/` import across 200+ files
- The current structure IS already a clean separation — `src/` is frontend, `backend/` is backend

### Communication between frontend and backend

- **REST API**: Frontend calls `http://localhost:4000/api/v1/*` via the Caddy gateway (`?XTransformPort=4000`)
- **WebSocket**: Frontend connects to Socket.io via `io("/?XTransformPort=3003")`
- **Auth**: Frontend proxy routes (`/api/auth/*`) call the backend and set httpOnly cookies
- **Health**: Frontend `/api/health` pings backend `/api/v1/health` + live-service `/health`

---

## Performance

### Bottleneck #1: Turbopack compile memory (4GB sandbox)

**Problem**: The 1,749-effect catalog (43 batch files, ~22,000 lines of TypeScript) requires ~2GB for Turbopack to compile. In a 4GB sandbox with backend + live-service running, the dev server can get OOM-killed during first compile.

**Fix**: Use a production build (`bun run build`) or increase sandbox RAM to 8GB. This is NOT a code issue — the production build works fine.

### Bottleneck #2: Large CSS bundle

**Problem**: `dist/roycss.css` is 1.3MB (1.1MB minified) — all 1,749 effects' CSS combined.

**Fix already in place**: The `DynamicEffectCSS` engine lazy-injects CSS only for effects visible in the viewport (IntersectionObserver + MutationObserver). The full CSS file is NOT loaded by the browser.

### Performance optimizations in place

| Optimization | Impact |
|---|---|
| VirtualScrollGrid | Renders 24 cards at a time (97.7% DOM reduction) |
| DynamicEffectCSS | Lazy CSS injection (only visible effects get CSS) |
| LazyMount | Defers heavy children until near viewport |
| LazySection | Defers below-fold sections (one-shot mount) |
| AnimationPauser | Pauses offscreen animations (data-* attribute, hydration-safe) |
| content-visibility: auto | Browser-level rendering optimization on EffectCard |
| Code splitting | 10+ below-fold sections via `next/dynamic` |
| SW stale-while-revalidate | Instant static asset loading from cache |
| SW network-first | Fresh HTML + API data with offline fallback |
| LRU caching | All 68 backend modules cache responses |
| Rate limiting | Prevents abuse (100/min general, 10/min auth) |

---

## Logo

The new RoyCSS logo is a modern, geometric "R" monogram:
- Emerald gradient (#34d399 → #10b981) on dark background (#0a0a0a)
- Clean geometric shapes (rounded rect + curved path + diagonal stroke)
- Accent dot representing the "CSS" period
- SVG-first (1.4KB), optimized for fast loading
- Works at all sizes (favicon to hero)
- All PNG assets auto-generated from SVG via sharp

### Asset sizes (before → after)

| Asset | Before | After |
|---|---|---|
| logo.svg | 1,065 bytes | 1,484 bytes (cleaner code) |
| favicon.png | 47,990 bytes (JPEG!) | 24,200 bytes (real PNG) |
| icon-192.png | 508 bytes | 2,700 bytes (higher quality) |
| icon-512.png | 1,125 bytes | 7,500 bytes (higher quality) |
| og.png | 105,152 bytes | 119,702 bytes (new design) |
