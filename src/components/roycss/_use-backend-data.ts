"use client";

import { useEffect, useState } from "react";

/**
 * useBackendData — fetch + render-as-you-fetch helper for the 38 product
 * cards that wire to backend endpoints. All requests go through the
 * Caddy gateway via `?XTransformPort=4000`.
 *
 * State machine:
 *   loading=true initially → after first fetch settles: (data | error)
 *
 * On error, callers fall back to their existing demo data (progressive
 * enhancement — the card still renders, just without the LIVE badge).
 *
 * Note: setState is only called after an `await`, never synchronously
 * inside the effect body, to satisfy the `react-hooks/set-state-in-effect`
 * rule (cascading renders from synchronous setState in effects).
 */
export function useBackendData<T>(path: string): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/v1/${path}?XTransformPort=4000`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setData((json.data ?? json) as T);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, error };
}
