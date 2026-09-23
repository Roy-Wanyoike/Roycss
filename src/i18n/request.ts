import { getRequestConfig } from "next-intl/server";

/**
 * next-intl request configuration — "without i18n routing" mode (issue #129 PR-A).
 *
 * ARCHITECTURE CONSTRAINT (worklog Task 7-c, i18n scoping for #129/#117):
 * `requestLocale` below is a STATIC constant, deliberately NOT read from
 * cookies() or headers(). The site's static-first architecture (force-static
 * effects pages, ISR 86400, and the headers()-tripwire comment in
 * src/app/layout.tsx — the #54 fix that keeps every page statically
 * prerendered) makes the standard [locale]-segment + header-negotiation
 * setup a footgun: any dynamic-API read here would force EVERY page into
 * dynamic rendering. v1 therefore serves the "en" catalog on the server;
 * the user-chosen locale lives client-side (localStorage `roycss-locale`
 * + the pre-paint init script in layout.tsx) and is applied to
 * documentElement lang/dir pre-hydration. PR-B ships "ar": it is in the
 * LOCALES list + messages/ar.json — still without middleware negotiation;
 * the client-side catalog switch lives in src/i18n/locale-provider.tsx.
 */

/** Locales with a shipped message catalog (mirrors locale-storage.ts). */
const LOCALES = ["en", "ar"] as const;

type AppLocale = (typeof LOCALES)[number];

const DEFAULT_LOCALE: AppLocale = "en";

export default getRequestConfig(async () => {
  // STATIC by design — see the constraint comment above. No cookies(),
  // no headers(), no dynamic APIs: this module must stay evaluable at
  // build time so every route keeps prerendering statically. The server
  // request locale stays the DEFAULT ("en") even though "ar" ships a
  // catalog — "ar" is adopted client-side by the LocaleProvider.
  const requestLocale = DEFAULT_LOCALE;

  return {
    locale: requestLocale,
    messages: (await import(`../../messages/${requestLocale}.json`)).default,
  };
});
