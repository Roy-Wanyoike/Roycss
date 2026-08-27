"use client";

/**
 * useBackendData — progressive enhancement hook used by every RoyCSS Pro
 * product card to optionally fetch real data from its backend module
 * (port 4000, routed via the Caddy gateway's `?XTransformPort=4000`
 * query param).
 *
 * Contract:
 *   • When the fetch succeeds, returns `{ data, loading:false, error:null }`.
 *   • When the fetch fails OR the backend is down, returns
 *     `{ data:null, loading:false, error: msg }` — the caller keeps
 *     rendering its existing demo content (no UI breakage).
 *   • Uses `cache: "no-store"` + `Accept: application/json` to bypass
 *     the SW service worker + the Next.js fetch cache (always fresh).
 *   • Cancellation-safe: a stale fetch landing after unmount is dropped.
 *
 * Usage:
 *   const { data, loading, error } = useBackendData("/os/dashboard");
 *   // data is null while loading or on error → demo content keeps rendering.
 *   // When data arrives, overlay/replace the relevant pieces + show a Live badge.
 */
import { useEffect, useState } from "react";

export interface BackendDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** ISO timestamp of the last successful fetch — handy for "Synced" pills. */
  syncedAt: string | null;
}

export function useBackendData<T = unknown>(
  modulePath: string,
): BackendDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!modulePath) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/v1/${modulePath}?XTransformPort=4000`,
          {
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();
        if (cancelled) return;
        // Backend wraps payloads as `{ data: ... }`. Fall back to the
        // whole object for the (rare) routes that return bare arrays.
        const payload = (
          json && typeof json === "object" && "data" in (json as Record<string, unknown>)
            ? (json as { data: T }).data
            : (json as T)
        ) ?? null;
        setData(payload);
        setError(null);
        setSyncedAt(new Date().toISOString());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modulePath]);

  return { data, loading, error, syncedAt };
}
