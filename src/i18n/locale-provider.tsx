"use client";

/**
 * LocaleProvider — client-side locale switching for next-intl "without
 * i18n routing" (issue #129 PR-B).
 *
 * PR-A mounted NextIntlClientProvider directly in the server layout,
 * inheriting the STATIC "en" request config from src/i18n/request.ts.
 * Every render — server AND the first client render — therefore resolves
 * chrome strings from the "en" catalog, which is exactly what keeps every
 * page statically prerendered (no cookies(), no headers(), no
 * Accept-Language negotiation, no [locale] segment — worklog Task 7-c).
 *
 * PR-B ships "ar" (RTL). Switching the message catalog on the client
 * (without a reload and without any dynamic server API) requires the
 * provider's `locale` + `messages` to become CLIENT state. The pattern
 * for this mode: mount NextIntlClientProvider inside a small client
 * wrapper that owns that state, seeded post-hydration from the same
 * source of truth the pre-paint script used.
 *
 * Hydration contract (mirrors LanguageToggle, PR-A):
 *   - server render + first client render use the static "en" catalog
 *     (byte-identical trees, so a stored "ar" locale can never cause a
 *     hydration mismatch);
 *   - a deferred rAF read of documentElement.lang — already applied
 *     pre-paint by localeInitScript in layout.tsx — adopts the stored
 *     locale right after hydration and re-renders the chrome with the
 *     matching catalog (suppressHydrationWarning on <html> covers the
 *     pre-paint lang/dir attribute flip, same as the theme class);
 *   - LanguageToggle notifies this provider via useLocaleSwitch()
 *     (React context) on an explicit user action. The DOM lang/dir
 *     writes + localStorage persistence stay in the toggle — the
 *     single-writer contract from issue #160 is unchanged.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from "@/components/ui-library/foundation/locale-storage";

/**
 * Both shipped catalogs, imported statically — resolved at build time,
 * no dynamic import, no request-time I/O. Combined they are ~2 kB of
 * JSON, and they must BOTH reach the client so the toggle can switch
 * without a network round-trip.
 */
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";

const MESSAGES: Record<Locale, AbstractIntlMessages> = {
  en: enMessages,
  ar: arMessages,
};

/** Callback the LanguageToggle invokes after persisting a locale choice. */
export type LocaleSwitcher = (locale: Locale) => void;

const LocaleSwitchContext = createContext<LocaleSwitcher>(() => {
  /* no-op default — consumers rendered outside the provider never crash */
});

/**
 * Notify the LocaleProvider that the active catalog changed. Call ONLY
 * from an explicit user action (LanguageToggle select handler) — never
 * on mount (issue #160 contract).
 */
export function useLocaleSwitch(): LocaleSwitcher {
  return useContext(LocaleSwitchContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Static "en" on the server AND the first client render — see the
  // hydration contract above.
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Read-only hydration sync: documentElement.lang was applied
    // pre-paint by the locale init script (layout.tsx). Same deferred
    // rAF + read-only-on-mount contract as LanguageToggle (PR-A).
    const id = requestAnimationFrame(() => {
      const lang = document.documentElement.lang;
      setLocale(
        (LOCALES as readonly string[]).includes(lang)
          ? (lang as Locale)
          : DEFAULT_LOCALE,
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const switchLocale = useCallback<LocaleSwitcher>((next) => {
    setLocale(next);
  }, []);

  return (
    <LocaleSwitchContext.Provider value={switchLocale}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}

export default LocaleProvider;
