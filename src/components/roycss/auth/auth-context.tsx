"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth-client";
import { authRequest } from "@/lib/auth-request";

/**
 * AuthProvider — client-side context that mirrors the httpOnly cookie
 * session. SSR-safe (renders `null` user on server) and Strict-Mode-safe
 * (mount reconciles /me through the module-level single-flight probe
 * below — issue #299).
 */

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Single-flight /me plumbing (issue #299 info item)
// ---------------------------------------------------------------------------

/**
 * /api/auth/me fired twice per home load. The previous guard was a
 * per-instance `mePromiseRef` that only deduped concurrent calls within one
 * AuthProvider lifetime and was nulled in `finally` on settle — so any
 * SERIAL second invocation (provider remount: hydration-recovery re-render,
 * Fast Refresh, route remounts) re-probed the network right after the first
 * probe had settled. Hoisting the guard to module scope closes both windows
 * for the page lifecycle (module state resets on a full reload):
 *
 * - `meInFlight` — concurrent single-flight probe, shared across provider
 *   instances (mount reconcile and refreshUser both join it);
 * - `meReconcilePromise` — memoized mount-reconcile probe: at most ONE
 *   network request per page lifecycle, concurrent or serial; remounted
 *   providers replay it so every consumer still resolves correct state;
 * - session mutations (login / register / logout) drop the memo so a later
 *   reconcile probes the fresh session instead of replaying a stale one.
 */
let meInFlight: Promise<AuthUser | null> | null = null;
let meReconcilePromise: Promise<AuthUser | null> | null = null;

/**
 * Probe the session once: join an in-flight probe or GET /api/auth/me.
 * 401 (signed-out), any non-ok status and network failure all resolve to
 * `null` — semantics unchanged. The in-flight slot is cleared on settle so
 * explicit refreshes always reach the network.
 */
function probeMe(): Promise<AuthUser | null> {
  if (!meInFlight) {
    meInFlight = (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return null;
        const json = (await res.json()) as { data?: AuthUser };
        return json.data ?? null;
      } catch {
        return null;
      } finally {
        meInFlight = null;
      }
    })();
  }
  return meInFlight;
}

/**
 * Mount reconcile — the body of AuthProvider's mount effect. Memoizes the
 * probe for the page lifecycle so concurrent AND serial double invocations
 * (double mount effect / provider remount) share ONE network request.
 * Exported for unit coverage (vitest unit env has no DOM).
 */
export function reconcileMe(): Promise<AuthUser | null> {
  if (!meReconcilePromise) meReconcilePromise = probeMe();
  return meReconcilePromise;
}

/** Session-mutation + test hook: drop memoized reconcile + in-flight probe. */
export function resetMeProbe(): void {
  meReconcilePromise = null;
  meInFlight = null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe initial state: server renders `loading: true, user: null`.
  // After mount, the client fetches /api/auth/me to reconcile.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Reconcile session on mount (client-only). `reconcileMe` is the
  // module-level single-flight probe (issue #299): a double effect
  // invocation — concurrent (double render) or serial (provider remount) —
  // issues ONE /api/auth/me request per page lifecycle, and every provider
  // instance still resolves its state from that single response.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await reconcileMe();
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Bounded request (issue #163): rejects with a safe, actionable
    // error on timeout / network failure instead of hanging forever.
    const res = await authRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json().catch(() => null)) as { data?: AuthUser; error?: string } | null;
    if (!res.ok || !json?.data) {
      throw new Error(json?.error ?? "Login failed");
    }
    setUser(json.data);
    resetMeProbe(); // session changed — later reconciles must probe fresh
    return json.data;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authRequest("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = (await res.json().catch(() => null)) as { data?: AuthUser; error?: string } | null;
    if (!res.ok || !json?.data) {
      throw new Error(json?.error ?? "Registration failed");
    }
    setUser(json.data);
    resetMeProbe(); // session changed — later reconciles must probe fresh
    return json.data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    resetMeProbe(); // session changed — later reconciles must probe fresh
    setUser(null);
  }, []);

  // Explicit refresh: joins an in-flight probe, else fetches fresh — it
  // never replays the reconcile memo, so callers always get live state.
  const refreshUser = useCallback(async () => {
    const u = await probeMe();
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
