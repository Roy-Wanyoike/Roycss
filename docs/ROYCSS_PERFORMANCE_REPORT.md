# RoyCSS Performance Report

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`. Baselines measured where
> the sandbox allows; targets stated where the toolchain is required.

---

## 1. Measured baselines (this sandbox)

| Metric | Value | Source |
|---|---|---|
| Backend cold start | ~2.3 s | `backend.log` ts delta from boot to `listening` |
| Effects loaded at boot | 1,749 | `backend.log` |
| Search index populated | 1,749 rows | `backend.log` after `db:push` |
| `GET /api/v1/health` (warm) | 1.2–8 ms | `backend.log` `durationMs` |
| `GET /api/v1/effects?limit=2` (warm) | 12 ms | `backend.log` |
| `GET /api/v1/health` via Caddy | 2 ms | curl |
| `GET /` (Next.js, warm) | 400–1100 ms | `dev.log` render ms |
| Next.js server-side backend probe | 71 ms | `/api/health` `backendStatus.latencyMs` |
| Live `/` page body size | 769 KB | Agent Browser eval |
| Live `/` page Live badges | 34 | Agent Browser eval |
| Backend RSS memory | ~176 MB | `/api/v1/health` checks.memory |

These are sandbox/dev-mode numbers (Turbopack, tsx watch, single process).
Production numbers will differ — see targets below.

---

## 2. Performance principles

1. **Measure before optimizing.** No premature optimization; profile first.
2. **N+1 detection.** Every list endpoint must batch related loads.
   (Prisma `include` / Go batch queries.)
3. **Cache hot reads.** Registry reads, effect detail, search results,
   theme presets are LRU-cached with explicit TTL + invalidation.
4. **Paginate everything.** No unbounded `SELECT`. Cursor pagination on
   large collections.
5. **Keep work off the request path.** Expensive work (AI, accessibility,
   analytics aggregation) is enqueued, not awaited.
6. **Connection pooling.** Prisma pool (TS) / pgx pool (Go) sized to the
   DB's max connections.
7. **JSON serialization.** Avoid re-serializing the same payload; cache
   the serialized form where useful.

---

## 3. Target SLAs (Go + PostgreSQL + Redis)

| Endpoint class | p50 | p95 | p99 |
|---|---|---|---|
| Health (`/health/live`) | 2 ms | 5 ms | 10 ms |
| Registry read (cached) | 5 ms | 15 ms | 40 ms |
| Registry read (uncached) | 20 ms | 60 ms | 150 ms |
| List (paginated, indexed) | 15 ms | 50 ms | 120 ms |
| Auth (login) | 40 ms | 120 ms | 300 ms |
| Search (PostgreSQL FTS) | 30 ms | 100 ms | 250 ms |
| Async job enqueue | 5 ms | 15 ms | 40 ms |

These are targets, not claims. They must be verified by load tests in a
Go+PG+Redis environment (TODO B12).

---

## 4. Known hot paths

| Path | Optimization |
|---|---|
| `GET /api/v1/effects` (1749 rows) | Cursor-paginated; per-page limit 20–100 |
| `GET /api/v1/effects/:slug` | LRU-cached; invalidated on publish |
| `GET /api/v1/registry/packages` | LRU-cached; invalidated on publish |
| `GET /api/v1/search?q=` | SearchIndex populated at boot; query indexed |
| `GET /` (Next.js) | Turbopack dev; production build via `next build` |

---

## 5. What to avoid

- ❌ `SELECT *` returning unbounded rows.
- ❌ Synchronous AI generation in an HTTP handler.
- ❌ Per-request DB connection (always pooled).
- ❌ Unbounded JSONB payloads on hot endpoints.
- ❌ Client-side polling at high frequency (use SSE/WebSocket via the
  socket.io mini-service for live updates).

---

## 6. Profiling plan (target)

- `pprof` for CPU + heap profiles on the Go API.
- `EXPLAIN ANALYZE` for any query exceeding p95.
- OpenTelemetry traces for cross-service latency breakdown.
- Load test: 100 → 1,000 → 10,000 concurrent requests on hot endpoints.
- Report p50/p95/p99 + error rate + memory + CPU.
