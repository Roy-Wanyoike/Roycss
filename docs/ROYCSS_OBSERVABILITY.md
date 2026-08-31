# RoyCSS Observability

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`.

---

## 1. Three pillars

| Pillar | Running (TS) | Target (Go) |
|---|---|---|
| Logs | Structured JSON (`backend/src/lib/logger.ts`) | slog / zerolog JSON |
| Metrics | per-route latency (TODO A9) | OpenTelemetry metrics → Prometheus |
| Traces | requestId in logs (TODO A9) | OpenTelemetry traces → collector |

---

## 2. Logs

### Shape (running today)
```json
{
  "ts": "2026-08-31T12:45:48.807Z",
  "level": "info",
  "msg": "GET /api/v1/health → 200",
  "module": "http",
  "requestId": "mth8erls57faaa0b",
  "method": "GET",
  "path": "/api/v1/health",
  "status": 200,
  "durationMs": 8,
  "ip": "::1",
  "userAgent": "node"
}
```

### Rules
- Structured JSON, parseable by any log aggregator.
- `requestId` on every HTTP log line; echoed in `X-Request-Id` response
  header for client correlation.
- `level`: `debug` / `info` / `warn` / `error`.
- `module`: the domain module that emitted the log.
- **Never log:** passwords, JWTs, API keys, payment secrets, PII beyond
  what is operationally necessary.
- `LOG_LEVEL` from env (default `info`).

### Target additions
- `traceId` / `spanId` for OpenTelemetry correlation.
- Sampling at high volume (keep 100% of errors, sample 10% of healthy).
- Log retention per compliance policy.

---

## 3. Metrics (target)

| Metric | Type | Labels |
|---|---|---|
| `http_requests_total` | counter | route, method, status |
| `http_request_duration_seconds` | histogram | route, method |
| `db_query_duration_seconds` | histogram | query |
| `redis_command_duration_seconds` | histogram | command |
| `queue_depth` | gauge | queue |
| `worker_jobs_processed_total` | counter | queue, status |
| `process_resident_memory_bytes` | gauge | — |
| `process_cpu_seconds_total` | counter | — |

Scraped by Prometheus; dashboards in Grafana.

---

## 4. Traces (target)

OpenTelemetry instrumentation on:
- Every HTTP handler (server span).
- Every DB query (client span, with query shape — not full SQL with params).
- Every Redis command.
- Every cross-service call (Next.js → backend, backend → AI provider).

Sampling: 100% of errors, 10% of healthy, 100% of slow (> p95) requests.

---

## 5. Health endpoints

```
GET /api/v1/health         → { status, service, version, uptime, checks:{database, memory} }
GET /api/v1/health/live    → { status: "ok" }                       (liveness, target)
GET /api/v1/health/ready   → { status, checks:{db, redis, registry, search} }   (readiness, target)
GET /api/health            → { status, effectsCount, dbStatus, backendStatus, liveServiceStatus, timestamp }   (Next.js BFF)
```

- `/health/live` = is the process up? (always 200 if the process responds).
- `/health/ready` = can the process serve traffic? (checks DB, Redis,
  registry, search). Returns 503 if any critical dependency is down.
- Cloud Run uses `/health/live` for liveness and `/health/ready` for
  readiness (configurable).

---

## 6. What to monitor (target)

| Signal | Alert |
|---|---|
| API p95 latency | > 100 ms for 5 min |
| API error rate | > 1% for 2 min |
| DB latency p95 | > 50 ms for 5 min |
| Redis latency p95 | > 20 ms for 5 min |
| Queue depth | > 1000 for 10 min |
| Worker health | any worker down for 2 min |
| Memory | > 80% of limit for 5 min |
| CPU | > 80% for 10 min |
| Health check | `/health/ready` 503 for 1 min |

---

## 7. Current gaps (TODO)

- [ ] A9: per-route latency histograms in the TS backend.
- [ ] A9: propagate `requestId` end-to-end (frontend → backend).
- [ ] B10: OpenTelemetry setup in the Go backend.
- [ ] B10: Prometheus + Grafana dashboards.
- [ ] B10: alerting rules + on-call routing.
