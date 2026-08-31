# RoyCSS Deployment

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`.

---

## 1. Two deployment shapes

### Running today (sandbox)
```
Caddy :81  ──▶  Next.js :3000 (bun run dev, Turbopack)
          ──▶  Express backend :4000 (tsx watch)   [when XTransformPort=4000]
          ──▶  socket.io mini-service :3003        [when XTransformPort=3003]

SQLite: db/custom.db
```

### Production target
```
Internet → Cloudflare → Vercel (Next.js)
                     → Cloud Run (Go API)
                     → Cloud Run Jobs (Go workers)
                     → Cloud SQL (PostgreSQL)
                     → Memorystore (Redis)
                     → Cloud Storage (S3-compatible)
```

No Kubernetes. Cloud Run scales the Go container to zero when idle and up
to `--max-instances` under load. Workers run as a separate Cloud Run
service / job.

---

## 2. Sandbox: how to start everything

```bash
# Next.js (port 3000)
cd /home/z/my-project && setsid bash -c 'bun run dev > dev.log 2>&1' < /dev/null & disown

# Express backend (port 4000)
cd /home/z/my-project/backend && setsid bash -c \
  'DATABASE_URL="file:/home/z/my-project/db/custom.db" \
   JWT_SECRET="dev-jwt-secret-32-chars-long-0001" \
   JWT_REFRESH_SECRET="dev-refresh-secret-32-chars-long-0001" \
   bun run dev > /home/z/my-project/backend.log 2>&1' < /dev/null & disown

# Verify
curl -s http://127.0.0.1:3000/api/health
curl -s http://127.0.0.1:4000/api/v1/health
```

`setsid` detaches the processes into a new session so they survive the
shell that started them.

---

## 3. Target: Go API on Cloud Run

### Dockerfile (`backend/go/Dockerfile`)
```dockerfile
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

FROM gcr.io/distroless/static
COPY --from=build /out/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
```

### Build & deploy
```bash
docker build -t gcr.io/$PROJECT/roycss-api backend/go/
docker push gcr.io/$PROJECT/roycss-api

gcloud run deploy roycss-api \
  --image gcr.io/$PROJECT/roycss-api \
  --region us-central1 --port 8080 \
  --set-env-vars "DATABASE_URL=…" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,REDIS_URL=redis-url:latest" \
  --min-instances 1 --max-instances 10 \
  --memory 512Mi --cpu 1 \
  --health="/health/ready"
```

### Workers
```bash
gcloud run deploy roycss-worker \
  --image gcr.io/$PROJECT/roycss-worker \
  --region us-central1 \
  --set-secrets "…" \
  --min-instances 1 --max-instances 5
```

---

## 4. Environment variables

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `REDIS_URL` | yes (target) | Redis connection string |
| `JWT_SECRET` | yes | Access token signing secret (≥16 chars) |
| `JWT_REFRESH_SECRET` | yes | Refresh token signing secret (≥16 chars) |
| `JWT_EXPIRES_IN` | no | Access TTL (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | no | Refresh TTL (default `7d`) |
| `CORS_ORIGINS` | no | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | no | Rate-limit window (default 60000) |
| `RATE_LIMIT_MAX_GENERAL` | no | General tier (default 100) |
| `RATE_LIMIT_MAX_AUTH` | no | Auth tier (default 10) |
| `RATE_LIMIT_MAX_CONTACT` | no | Contact tier (default 5) |
| `LOG_LEVEL` | no | `debug`/`info`/`warn`/`error` (default `info`) |
| `NODE_ENV` | no | `development`/`test`/`production` |
| `EFFECTS_DATA_PATH` | no | Path to `effects.json` (default `../dist/effects.json`) |
| `NPM_TOKEN` | no | npm publish token (registry module) |
| `SUPABASE_URL` | no | Supabase (production auth option) |
| `SUPABASE_PUBLISHABLE_KEY` | no | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | no | Supabase secret key |

Secrets in production are mounted via Cloud Run secrets, not env vars.

---

## 5. CI/CD (GitHub Actions, target)

### On pull request
- `gofmt` + `go vet` + `go test`
- `eslint` + `tsc` (frontend)
- `npm audit` + `govulncheck`
- migration validation (apply to a throwaway PG, run, drop)
- build (Docker) — no push

### On deploy (main → production)
- build (Docker)
- security scan (Trivy)
- deploy to Cloud Run (API + workers)
- health check (`/health/ready` returns 200)
- if health check fails → auto-rollback to previous revision

Never deploy code that fails required checks. Never deploy on red.

---

## 6. Health checks & scaling

| Knob | Value |
|---|---|
| Liveness probe | `GET /health/live` |
| Readiness probe | `GET /health/ready` |
| Min instances | 1 (avoid cold starts on the hot path) |
| Max instances | 10 (scale out under load) |
| Memory | 512 Mi |
| CPU | 1 |
| Concurrency | 80 (Cloud Run default) |
| Timeout | 300 s (for slow async-startup work) |

---

## 7. Rollback

- **Code:** Cloud Run keeps prior revisions; `gcloud run services update-traffic roycss-api --to-revisions=…` rolls back in seconds.
- **Data:** never destructive migrations. Forward-fix only. Backups verified before migration.
- **Frontend:** Vercel instant rollback to the previous deployment.

---

## 8. Disaster recovery (target)

- PostgreSQL: automated daily backups + point-in-time recovery (Cloud SQL).
- Object storage: versioning + cross-region replication.
- Redis: ephemeral; rebuildable from PostgreSQL. Not backed up.
- RPO: ≤ 5 min (PG PITR). RTO: ≤ 15 min (Cloud Run revision rollback).
