# Load Tests — RoyCSS Backend

k6 load tests for the RoyCSS backend API.

## Scripts

| File | Target | Profile | SLOs |
|------|--------|---------|------|
| `effects-api.k6.js` | `GET /api/v1/effects?limit=20` | 50 VUs / 30s fixed | p95 < 200 ms, fail rate < 1 % |

## Prerequisites

Install k6 (Grafana):

- **macOS**: `brew install k6`
- **Linux (Debian/Ubuntu)**:
  ```bash
  sudo gpg --no-default-keyring --keyserver keys.openpgp.org --keyring /usr/share/keyrings/k6-archive-keyring.gpg --recv-keys 266570E6D8DAB0F414E9F8A3C84F6DD60E1B9255
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt update && sudo apt install k6
  ```
- **Docker**: `docker run --rm -i grafana/k6 run - < tests/load/effects-api.k6.js`
- **Direct binary**: <https://github.com/grafana/k6/releases>

## Run

### Local (against the dev backend on port 4000)

Start the backend first:

```bash
cd backend
bun run dev   # listens on http://localhost:4000
```

Then in a separate terminal:

```bash
k6 run tests/load/effects-api.k6.js
```

### Custom target (CI / staging / prod)

```bash
BACKEND_URL=https://roycss-backend.up.railway.app k6 run tests/load/effects-api.k6.js
```

### Docker

```bash
docker run --rm -i \
  -e BACKEND_URL=http://host.docker.internal:4000 \
  grafana/k6 run - < tests/load/effects-api.k6.js
```

## What it measures

For each virtual user (VU), `effects-api.k6.js`:

1. Issues `GET /api/v1/effects?limit=20` against the target URL.
2. Checks the response is HTTP 200, has a `data` array of > 0 items,
   reports `meta.total === 1749`, and `meta.limit === 20`.
3. Records `http_req_duration` (raw) and a custom
   `effects_api_duration` Trend (in ms) into the k6 metrics stream.
4. Sleeps 50 ms before the next iteration (≈ 20 req/s per VU).

## SLOs

The script asserts **both** SLOs at the end of the run. If either is
breached, k6 exits with a non-zero status — CI should treat that as
a load-test failure.

| SLO | Target | k6 threshold |
|-----|--------|--------------|
| Failure rate | < 1 % | `http_req_failed: rate<0.01` |
| p95 latency | < 200 ms | `http_req_duration: p(95)<200` |
| p95 latency (mirror) | < 200 ms | `effects_api_duration: p(95)<200` |

## Output

- **stdout**: live progress + a JSON summary at the end (URL, profile,
  metrics, p95/p99, request count, max VUs).
- **`tests/load/results.json`**: machine-readable summary, written next
  to the script for CI artifact archiving.

## CI integration

Drop this into a GitHub Actions job once k6 is installed:

```yaml
- name: Run k6 load test (smoke)
  run: |
    BACKEND_URL=${{ secrets.BACKEND_URL }} k6 run tests/load/effects-api.k6.js
  if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
```

This isn't part of the regular CI workflow today because:

- **k6 isn't bundled with GitHub-hosted runners** — you'd need a
  `setup-k6` action (e.g. `grafana/k6-action@v0.3.0`) or the Docker image.
- **A 30-second load test every push would slow PR feedback.** It's
  better gated to nightly schedules or post-deploy smoke checks.

When you do wire it in, the `handleSummary` block prints a JSON summary
to stdout — `gh run download` can pick up `tests/load/results.json` for
trend visualization.
