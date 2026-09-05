/**
 * API_MODE resolution + backend reachability probe.
 *
 * The Next.js site can serve the public read-only API in two ways:
 *
 *   - "embedded" — Next.js route handlers answer directly from the embedded
 *     effect catalog (`src/lib/roycss-effects.ts`, 1,959 effects). No
 *     external process needed. This is the only mode that works on a
 *     standalone Vercel deployment.
 *   - "proxy"    — every `/api/v1/*` request is forwarded to the Express
 *     backend (`backend-node/`) at `BACKEND_URL` (self-hosted deployments
 *     keep the full backend: auth, themes, search index, …).
 *
 * `API_MODE` selects the strategy:
 *
 *   - "embedded" (explicit)  → always embedded.
 *   - "proxy"    (explicit)  → always proxy (BACKEND_URL or localhost:4000 —
 *                              the pre-embedded-mode default).
 *   - "auto"     (default)   → BACKEND_URL set AND reachable → proxy,
 *                              otherwise embedded.
 *
 * Auto mode probes `GET ${BACKEND_URL}/api/v1/health` with a short,
 * deterministic timeout (2 s) and caches the outcome for 60 s (module-level)
 * so the probe adds latency to at most one request per minute per instance.
 *
 * Loop safety: the probe request carries a sentinel header
 * (`X-RoyCSS-API-Probe`). If BACKEND_URL points back at this very site, the
 * gateway sees the header and answers immediately from the embedded health
 * handler — whose body carries `service: "roycss-embedded-api"`, which the
 * probe treats as "not a real backend". Two guards, no recursion.
 */

/** Service name reported by the embedded `/api/v1/health` handler. */
export const EMBEDDED_SERVICE_NAME = "roycss-embedded-api";

/** Sentinel header the reachability probe sends (loop guard #1). */
export const API_PROBE_HEADER = "x-roycss-api-probe";

/** Probe timeout — short and deterministic (issue #83: ≤ 2 s). */
export const PROBE_TIMEOUT_MS = 2_000;

/** How long a probe outcome is trusted (module-level cache). */
export const PROBE_CACHE_TTL_MS = 60_000;

/** Legacy default — only used when API_MODE=proxy without BACKEND_URL. */
export const DEFAULT_BACKEND_URL = "http://localhost:4000";

export type ApiMode = "embedded" | "proxy";
export type ApiModeSetting = ApiMode | "auto";

export interface BackendProbe {
  reachable: boolean;
  checkedAt: number;
  /** Human-readable failure reason when `reachable` is false. */
  error?: string;
}

export interface ApiModeInfo {
  /** The mode the gateway should route with. */
  mode: ApiMode;
  /** The configured API_MODE value (env). */
  setting: ApiModeSetting;
  /**
   * The backend URL the proxy path would use, or null when no backend is
   * configured (auto/embedded without BACKEND_URL).
   */
  backendUrl: string | null;
  /** Latest probe outcome, or null when no probe was performed. */
  probe: BackendProbe | null;
}

// ─── Module-level probe state (one per server instance) ────────────────────

let cachedProbe: BackendProbe | null = null;
let probeInFlight: Promise<BackendProbe> | null = null;
let warnedInvalidMode = false;

/** Test hook: drop the cached probe + in-flight dedupe. */
export function resetApiModeState(): void {
  cachedProbe = null;
  probeInFlight = null;
}

/** Read API_MODE at call time (never at module load) — default "auto". */
export function getApiModeSetting(): ApiModeSetting {
  const raw = (process.env.API_MODE ?? "").trim().toLowerCase();
  if (raw === "embedded" || raw === "proxy" || raw === "auto") return raw;
  if (raw && !warnedInvalidMode) {
    warnedInvalidMode = true;
    console.warn(
      `[api-mode] Invalid API_MODE "${raw}" — falling back to "auto" (valid: embedded | proxy | auto)`,
    );
  }
  return "auto";
}

/** Read BACKEND_URL at call time; undefined when unset/blank. */
export function getConfiguredBackendUrl(): string | undefined {
  const raw = (process.env.BACKEND_URL ?? "").trim();
  return raw || undefined;
}

/** URL the proxy path forwards to (explicit proxy mode keeps the old default). */
export function getProxyTargetUrl(): string | null {
  const configured = getConfiguredBackendUrl();
  if (configured) return stripTrailingSlash(configured);
  if (getApiModeSetting() === "proxy") return DEFAULT_BACKEND_URL;
  return null;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Probe the backend health endpoint once (no caching) — public so the
 * Next.js health route can report real backend status.
 */
export async function probeBackend(backendUrl: string): Promise<BackendProbe> {
  const checkedAt = Date.now();
  try {
    const res = await fetch(`${stripTrailingSlash(backendUrl)}/api/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { Accept: "application/json", [API_PROBE_HEADER]: "1" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { reachable: false, checkedAt, error: `HTTP ${res.status}` };
    }
    const body: unknown = await res.json().catch(() => null);
    // Loop guard #2: an embedded RoyCSS instance answers with its marker
    // service name — that is us, not a backend, so it is NOT reachable.
    if (
      body !== null &&
      typeof body === "object" &&
      (body as { service?: unknown }).service === EMBEDDED_SERVICE_NAME
    ) {
      return {
        reachable: false,
        checkedAt,
        error: "probe reached an embedded RoyCSS instance, not a backend",
      };
    }
    return { reachable: true, checkedAt };
  } catch (err) {
    return {
      reachable: false,
      checkedAt,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/** Cached, deduplicated probe — at most one in flight per instance. */
async function getProbe(backendUrl: string): Promise<BackendProbe> {
  if (cachedProbe && Date.now() - cachedProbe.checkedAt < PROBE_CACHE_TTL_MS) {
    return cachedProbe;
  }
  if (probeInFlight) return probeInFlight;
  const pending = probeBackend(backendUrl).then((result) => {
    cachedProbe = result;
    probeInFlight = null;
    return result;
  });
  probeInFlight = pending;
  return pending;
}

/**
 * Resolve the effective API mode + everything the health route needs.
 *
 * Deterministic order: explicit modes never probe to *choose* (proxy keeps
 * full backend behavior even when it is down — the 503 surfaces there);
 * auto probes only when BACKEND_URL is set.
 */
export async function resolveApiModeInfo(): Promise<ApiModeInfo> {
  const setting = getApiModeSetting();
  const configured = getConfiguredBackendUrl();

  if (setting === "embedded") {
    return {
      mode: "embedded",
      setting,
      backendUrl: configured ? stripTrailingSlash(configured) : null,
      probe: configured ? await getProbe(configured) : null,
    };
  }

  if (setting === "proxy") {
    const target = getProxyTargetUrl();
    return {
      mode: "proxy",
      setting,
      backendUrl: target,
      probe: target ? await getProbe(target) : null,
    };
  }

  // auto: no BACKEND_URL → the site is standalone → embedded, no probe.
  if (!configured) {
    return { mode: "embedded", setting, backendUrl: null, probe: null };
  }

  const probe = await getProbe(configured);
  return {
    mode: probe.reachable ? "proxy" : "embedded",
    setting,
    backendUrl: stripTrailingSlash(configured),
    probe,
  };
}

/** Convenience: just the effective mode (gateway hot path). */
export async function resolveApiMode(): Promise<ApiMode> {
  return (await resolveApiModeInfo()).mode;
}
