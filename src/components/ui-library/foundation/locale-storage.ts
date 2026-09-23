/**
 * Locale persistence primitives (issue #129 PR-A, extended in PR-B).
 *
 * Mirror of `theme-storage.ts` (issue #160 precedent): pure, DOM-free
 * logic shared by
 *   - the pre-hydration locale init script (src/app/layout.tsx), and
 *   - the LanguageToggle component (src/components/roycss/language-toggle.tsx).
 *
 * Contract — identical to the theme one:
 *   "read stored value → validate → apply, write only on an explicit
 *    user toggle" — the init script NEVER writes the key.
 *
 * PR-B ships "ar" (RTL): it is in `LOCALES` + `DIRECTIONS` and has
 * messages/ar.json. Adding a locale means: a message catalog in
 * messages/, an entry here, and an entry in the T table of the
 * localeInitScript (layout.tsx) — all three kept in lockstep by
 * tests/unit/locale-persistence.test.ts.
 */

export type Locale = "en" | "ar";

/** Locales with a shipped message catalog (mirrors src/i18n/request.ts). */
export const LOCALES: readonly Locale[] = ["en", "ar"];

/** Fallback when nothing (or something invalid) is stored. */
export const DEFAULT_LOCALE: Locale = "en";

/** The single localStorage key used by the init script and the toggle. */
export const LOCALE_STORAGE_KEY = "roycss-locale";

/** Minimal storage surface (subset of DOM Storage) for testability. */
export interface LocaleStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Writing direction per locale. "ar" is the first RTL locale. */
const DIRECTIONS: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

/** The writing direction a locale resolves to (drives documentElement.dir). */
export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return DIRECTIONS[locale];
}

/**
 * The lang/dir pair applied to documentElement by BOTH the pre-paint
 * init script (layout.tsx) and the LanguageToggle change handler — the
 * unit test keeps the script and this module behaviorally equivalent.
 */
export function resolveDocumentLocale(locale: Locale): {
  lang: Locale;
  dir: "ltr" | "rtl";
} {
  return { lang: locale, dir: DIRECTIONS[locale] };
}

/**
 * Read the stored locale, validating it against the allowed values.
 * Returns `null` for missing, corrupt, or inaccessible values — callers
 * fall back to `DEFAULT_LOCALE`.
 */
export function readStoredLocale(
  storage: LocaleStorageLike | null | undefined,
): Locale | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOCALE_STORAGE_KEY);
    if (raw !== null && (LOCALES as readonly string[]).includes(raw)) {
      return raw as Locale;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a locale choice. Must ONLY be called from an explicit user
 * action (LanguageToggle) — never on mount/hydration, mirroring the
 * issue #160 rule for the theme key.
 */
export function writeStoredLocale(
  storage: LocaleStorageLike | null | undefined,
  locale: Locale,
): void {
  if (!storage) return;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* noop — private browsing / quota errors must never break the UI */
  }
}
