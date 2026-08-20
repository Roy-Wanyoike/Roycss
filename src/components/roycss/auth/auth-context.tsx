"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth-client";

/**
 * AuthProvider — client-side context that mirrors the httpOnly cookie
 * session. SSR-safe (renders `null` user on server) and Strict-Mode-safe
 * (dedupes concurrent /me fetches via `mePromiseRef`).
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

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe initial state: server renders `loading: true, user: null`.
  // After mount, the client fetches /api/auth/me to reconcile.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mePromiseRef = useRef<Promise<AuthUser | null> | null>(null);

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    if (mePromiseRef.current) return mePromiseRef.current;
    const p = (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return null;
        const json = (await res.json()) as { data?: AuthUser };
        return json.data ?? null;
      } catch {
        return null;
      } finally {
        mePromiseRef.current = null;
      }
    })();
    mePromiseRef.current = p;
    return p;
  }, []);

  // Reconcile session on mount (client-only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await fetchMe();
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json().catch(() => null)) as { data?: AuthUser; error?: string } | null;
    if (!res.ok || !json?.data) {
      throw new Error(json?.error ?? "Login failed");
    }
    setUser(json.data);
    return json.data;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = (await res.json().catch(() => null)) as { data?: AuthUser; error?: string } | null;
    if (!res.ok || !json?.data) {
      throw new Error(json?.error ?? "Registration failed");
    }
    setUser(json.data);
    return json.data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await fetchMe();
    setUser(u);
    return u;
  }, [fetchMe]);

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
