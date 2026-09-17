"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * useApiKeys — data access for the API-key account panel (issue #122 /
 * PRD-F21), on top of the EXISTING backend endpoints (issue #65):
 *
 *   GET    /api/v1/auth/api-keys      → { data: PublicApiKey[] }   (masked)
 *   POST   /api/v1/auth/api-keys      → 201 { data: { apiKey, key, warning } }
 *   DELETE /api/v1/auth/api-keys/:id  → 200 { data: PublicApiKey } (revokedAt set)
 *
 * Every call goes through the ONE api seam (`apiClient` → /api/v1 gateway),
 * which promotes the httpOnly session cookie to the Bearer credential the
 * backend requires (see src/lib/session-bearer.ts) — no direct fetches here.
 *
 * Contracts mirrored from backend-node (modules/api-keys/{schema,service}.ts
 * + modules/auth/routes.ts + integration/api-keys.test.ts):
 *   - The list is MASKED (`rk_live_…ab12`); the plaintext appears exactly
 *     once, in the 201 create response, and can never be recovered.
 *   - Revoked keys still list (audit history) with `revokedAt` set.
 *   - Duplicate names → 409; >50 active keys → 409; unknown scope → 400.
 */

/** Backend route (apiClient prefixes `/api/v1/`): /api/v1/auth/api-keys. */
export const API_KEYS_ENDPOINT = "auth/api-keys";

/**
 * Masked API-key record — the ONLY shape the list endpoints ever return.
 * Never contains the plaintext key or the stored hashes.
 */
export interface ApiKeyRecord {
  id: string;
  name: string;
  /** Masked display form, e.g. `rk_live_…ab12`. */
  masked: string;
  scopes: string[];
  orgId: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** 201 body of POST /auth/api-keys — the full key appears exactly ONCE. */
export interface CreateApiKeyResult {
  apiKey: ApiKeyRecord;
  /** The plaintext key — shown once at creation, never recoverable. */
  key: string;
  /** Backend's own one-time warning (rendered verbatim in the reveal UI). */
  warning: string;
}

/**
 * Every scope the backend accepts (mirrors API_KEY_SCOPES in
 * backend-node/src/lib/api-key.ts — unknown scopes are a 400). `*` is the
 * wildcard; everything else is `<resource>:read|write` style.
 */
export const API_KEY_SCOPES = [
  "*",
  "effects:read",
  "effects:write",
  "recipes:read",
  "recipes:write",
  "patterns:read",
  "patterns:write",
  "themes:read",
  "themes:write",
  "mcp:read",
  "mcp:execute",
  "search:read",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

/** Friendly labels for the scope picker. */
export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  "*": "All scopes (wildcard)",
  "effects:read": "Effects — read",
  "effects:write": "Effects — write",
  "recipes:read": "Recipes — read",
  "recipes:write": "Recipes — write",
  "patterns:read": "Patterns — read",
  "patterns:write": "Patterns — write",
  "themes:read": "Themes — read",
  "themes:write": "Themes — write",
  "mcp:read": "MCP — read",
  "mcp:execute": "MCP — execute",
  "search:read": "Search — read",
};

/** Least-privilege default (backend default when `scopes` is omitted). */
export const DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = ["effects:read"];

/** Mirrors backend constraints (CreateApiKeySchema + service limits). */
export const API_KEY_NAME_MAX_LENGTH = 120;
export const API_KEY_MAX_SCOPES = 16;
export const MAX_ACTIVE_KEYS_PER_OWNER = 50;

/** Success: the created record. Failure: a human-readable error message. */
export type CreateKeyOutcome = { ok: true; result: CreateApiKeyResult } | { ok: false; error: string };

/** Success: null. Failure: a human-readable error message. */
export type RevokeOutcome = { ok: true } | { ok: false; error: string };

/**
 * Load/refresh/create/revoke the caller's API keys. Loads once when
 * `enabled` turns true (the sheet opening for an authenticated session).
 *
 * setState is only called AFTER an `await` inside the load effect — never
 * synchronously in the effect body — following the repo's
 * react-hooks/set-state-in-effect convention (see _use-backend-data.ts).
 */
export function useApiKeys(enabled: boolean) {
  const [keys, setKeys] = useState<ApiKeyRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Core list fetch — returns keys or an error message; never touches state. */
  const fetchKeys = useCallback(
    async (): Promise<{ keys: ApiKeyRecord[] } | { error: string }> => {
      const res = await apiClient<ApiKeyRecord[]>(API_KEYS_ENDPOINT);
      const data = res.data;
      if (res.error !== null || data === null || !Array.isArray(data)) {
        return { error: res.error ?? "Couldn't load your API keys." };
      }
      return { keys: data };
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const outcome = await fetchKeys();
      if (cancelled) return;
      if ("error" in outcome) {
        setError(outcome.error);
      } else {
        setKeys(outcome.keys);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, fetchKeys]);

  /** Manual reload (retry button — event-handler context, sync setLoading is fine). */
  const refresh = useCallback(async () => {
    setLoading(true);
    const outcome = await fetchKeys();
    if ("error" in outcome) {
      setError(outcome.error);
    } else {
      setKeys(outcome.keys);
      setError(null);
    }
    setLoading(false);
  }, [fetchKeys]);

  /** Mint a key — on success the plaintext is returned exactly once. */
  const createKey = useCallback(
    async (name: string, scopes: string[]): Promise<CreateKeyOutcome> => {
      const res = await apiClient<CreateApiKeyResult>(API_KEYS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ name, scopes }),
      });
      const raw = res.data;
      if (
        res.error !== null ||
        raw === null ||
        typeof (raw as { key?: unknown }).key !== "string" ||
        raw.key.length === 0
      ) {
        return { ok: false, error: res.error ?? "Couldn't create the API key." };
      }
      const created: CreateApiKeyResult = raw;
      // The backend lists newest first — keep the local list consistent.
      setKeys((prev) => (prev === null ? [created.apiKey] : [created.apiKey, ...prev]));
      return { ok: true, result: created };
    },
    [],
  );

  /** Soft-delete (revoke) one key by id — the record keeps listing with revokedAt set. */
  const revokeKey = useCallback(async (id: string): Promise<RevokeOutcome> => {
    const res = await apiClient<ApiKeyRecord>(`${API_KEYS_ENDPOINT}/${id}`, {
      method: "DELETE",
    });
    const data = res.data;
    if (res.error !== null || data === null || data.id !== id) {
      return { ok: false, error: res.error ?? "Couldn't revoke the API key." };
    }
    const revoked = data;
    setKeys((prev) => (prev === null ? prev : prev.map((k) => (k.id === id ? revoked : k))));
    return { ok: true };
  }, []);

  return { keys, loading, error, refresh, createKey, revokeKey };
}
