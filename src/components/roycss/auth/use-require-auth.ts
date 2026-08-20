"use client";

import { useAuth } from "./auth-context";
import { useAuthSheetStore } from "./auth-sheet-store";

/**
 * useRequireAuth — gate any callback behind authentication.
 *
 * If the user is signed in, `requireAuth(cb)()` runs `cb` immediately.
 * Otherwise it opens the LoginSheet (so the caller can call it
 * directly without conditionals).
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const { openLogin } = useAuthSheetStore();

  const requireAuth = <TArgs extends unknown[], TResult>(
    cb: (...args: TArgs) => TResult,
  ): ((...args: TArgs) => TResult | void) => {
    return (...args: TArgs) => {
      if (loading) return;
      if (!user) {
        openLogin();
        return;
      }
      return cb(...args);
    };
  };

  return { isAuthed: !!user, requireAuth };
}
