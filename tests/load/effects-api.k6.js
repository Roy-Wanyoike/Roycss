// ─────────────────────────────────────────────────────────────────────────
// k6 load test — RoyCSS backend GET /api/v1/effects?limit=20
//
// Profile:
//   • 50 virtual users (VUs)
//   • 30 seconds duration
//   • Fixed VU count (not ramping) — a flat profile surfaces steady-state
//     latency more clearly than a ramp and lets us pin a single p95 target.
//
// SLOs (asserted in the `handleSummary` block at the bottom):
//   • http_req_failed            < 1 %   (failure rate)
//   • http_req_duration p(95)    < 200 ms (95th percentile response time)
//
// Run locally:
//   k6 run tests/load/effects-api.k6.js
//
// Run against a non-default host:
//   BACKEND_URL=https://roycss-backend.up.railway.app k6 run tests/load/effects-api.k6.js
//
// Install k6:
//   • macOS:  brew install k6
//   • Linux:  sudo apt install k6   (or `gpg` keyring install — see grafana.com/docs/k6)
//   • Docker: docker run --rm -i grafana/k6 run - < tests/load/effects-api.k6.js
// ─────────────────────────────────────────────────────────────────────────
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// ─── Configuration ───────────────────────────────────────────────────────
const BACKEND_URL = __ENV.BACKEND_URL || "http://localhost:4000";
const ENDPOINT = "/api/v1/effects?limit=20";
const TARGET_URL = `${BACKEND_URL}${ENDPOINT}`;

// Custom metrics — exported in the JSON summary so CI can parse them.
const effectListDuration = new Trend("effects_api_duration", true); // ms
const effectListFailures = new Counter("effects_api_failures");

// ─── Load profile (50 VUs / 30s, fixed) ──────────────────────────────────
export const options = {
  vus: 50,
  duration: "30s",
  // Hard SLO thresholds — k6 will exit non-zero if either is breached.
  thresholds: {
    // Failure rate under 1 %.
    http_req_failed: ["rate<0.01"],
    // 95th-percentile response time under 200 ms.
    http_req_duration: ["p(95)<200"],
    // Mirror the same checks onto the custom Trend for a stable parse target.
    effects_api_duration: ["p(95)<200"],
  },
  // Don't sent full request/response bodies into the metrics stream —
  // keeps the run output small.
  noConnectionReuse: false,
};

// ─── Setup (runs once per VU before the test) ────────────────────────────
export function setup() {
  // Smoke-check the target before the load test kicks off — fail fast
  // with a clear error if the backend isn't up.
  const probe = http.get(TARGET_URL, { tags: { phase: "setup" } });
  if (probe.status !== 200) {
    throw new Error(
      `Pre-flight probe failed — ${TARGET_URL} returned HTTP ${probe.status}`,
    );
  }
  console.log(`[setup] probe OK — ${TARGET_URL} (HTTP ${probe.status})`);
  return { url: TARGET_URL };
}

// ─── Default (per-VU loop) ───────────────────────────────────────────────
export default function vuLoop(data) {
  const res = http.get(data.url, {
    tags: { endpoint: "effects_list" },
  });

  // Per-request checks — surfaced in the k6 console as pass/fail counts.
  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "body has data array": (r) => {
      try {
        const body = r.json();
        return Array.isArray(body?.data) && body.data.length > 0;
      } catch {
        return false;
      }
    },
    "body meta.total = 1779": (r) => {
      try {
        const body = r.json();
        return body?.meta?.total === 1779;
      } catch {
        return false;
      }
    },
    "body meta.limit = 20": (r) => {
      try {
        const body = r.json();
        return body?.meta?.limit === 20;
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    effectListFailures.add(1);
  }
  effectListDuration.add(res.timings.duration);

  // 0.05 s pacing between requests per VU — keeps the request rate
  // realistic (~1000 req/s with 50 VUs × 20 req/s/VU) without
  // overwhelming the test target.
  sleep(0.05);
}

// ─── Summary — written to stdout + a JSON file for CI parsing ────────────
export function handleSummary(data) {
  const summary = {
    backend_url: BACKEND_URL,
    endpoint: ENDPOINT,
    profile: { vus: options.vus, duration: options.duration },
    metrics: {
      http_req_failed: {
        rate: data.metrics.http_req_failed?.rate,
        passes: data.metrics.http_req_failed?.values.passes,
        fails: data.metrics.http_req_failed?.values.fails,
      },
      http_req_duration_p95: data.metrics.http_req_duration?.["p(95)"],
      http_req_duration_p99: data.metrics.http_req_duration?.["p(99)"],
      http_reqs: data.metrics.http_reqs?.values.count,
      iteration_duration_p95: data.metrics.iteration_duration?.["p(95)"],
      vus_max: data.metrics.vus_max?.values.max,
    },
    thresholds: data.metrics,
  };

  // Pretty-print to stdout.
  console.log("\n──────── Load test summary ────────");
  console.log(JSON.stringify(summary, null, 2));
  console.log("────────────────────────────────────\n");

  // Emit a machine-readable JSON summary next to the script.
  return {
    "tests/load/results.json": JSON.stringify(summary, null, 2),
    stdout: "",
  };
}
