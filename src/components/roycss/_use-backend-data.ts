"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * useBackendData — fetch + render-as-you-fetch helper for the 38 product
 * cards that wire to backend endpoints. All requests flow through the
 * centralized `apiClient` (`@/lib/api-client`), which handles the
 * `?XTransformPort=4000` gateway convention, a 10s timeout, request
 * cancellation (AbortController), error normalization, and dev-only
 * request logging — so this hook stays focused on React state.
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
        // apiClient prepends `/api/v1/` and `?XTransformPort=4000` for us.
        const result = await apiClient<T>(path, { cache: "no-store" });
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
        } else {
          setData(result.data);
          setError(null);
        }
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
