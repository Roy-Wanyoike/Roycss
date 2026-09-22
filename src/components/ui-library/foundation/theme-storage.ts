/**
 * Theme persistence primitives (issue #160).
 *
 * Pure, DOM-free logic shared by:
 *   - the pre-hydration init script semantics (src/app/layout.tsx), and
 *   - `ThemeProvider` (./theme-provider.tsx).
 *
 * Extracted so the "read stored value → resolve → apply, write only on
 * explicit user toggle" contract is unit-testable in the node vitest
 * environment (tests/unit/theme-persistence.test.ts) with a mocked
 * `localStorage` — without needing a DOM.
 *
 * The layout init script must stay behaviorally equivalent to
 * `resolveInitialDark()`; the unit test evaluates the literal script string
 * from layout.tsx against this module to guard against drift.
 */

export type Theme = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

/** The single localStorage key used by the init script, provider and toggle. */
export const THEME_STORAGE_KEY = "roycss-theme";

/** Minimal storage surface (subset of DOM Storage) for testability. */
export interface ThemeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Read the stored theme, validating it against the allowed values.
 * Returns `null` for missing, corrupt, or inaccessible values — callers
 * fall back to the system preference in that case.
 */
export function readStoredTheme(
  storage: ThemeStorageLike | null | undefined,
): Theme | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a theme choice. Must ONLY be called from an explicit user action
 * (theme toggle) — never on mount/hydration. Writing on mount was the root
 * cause of issue #160: the toggle's mount effect clobbered the stored
 * "light" value with "dark" before the stored read ran.
 */
export function writeStoredTheme(
  storage: ThemeStorageLike | null | undefined,
  theme: Theme,
): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* noop — private browsing / quota errors must never break the UI */
  }
}

/** Resolve a theme to its concrete value, honoring the OS preference for "system". */
export function resolveTheme(
  theme: Theme,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (theme === "system") return systemPrefersDark ? "dark" : "light";
  return theme;
}

/**
 * Pre-paint resolution — the exact semantics of the init script in
 * src/app/layout.tsx: a stored "light"/"dark" wins; missing, corrupt, or
 * "system" values fall back to the OS preference.
 */
export function resolveInitialDark(
  storage: ThemeStorageLike | null | undefined,
  systemPrefersDark: boolean,
): boolean {
  const stored = readStoredTheme(storage);
  if (stored === "light") return false;
  if (stored === "dark") return true;
  return resolveTheme("system", systemPrefersDark) === "dark";
}
