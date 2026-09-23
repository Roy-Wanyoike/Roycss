"use client";

/**
 * LanguageToggle — locale switcher (issue #129 PR-A, i18n scaffolding).
 *
 * v1: shows the current locale code ("EN") and opens a small menu that
 * lists English (checkmark, active). Locales that have no shipped
 * catalog yet (PR-B ships "ar" + RTL) render disabled with a
 * "coming soon" title/aria so the menu shape is stable.
 *
 * Contract — mirrors the theme toggle (issue #160):
 *   - the mount effect only READS documentElement.lang (the pre-hydration
 *     locale init script in src/app/layout.tsx already applied it) —
 *     deferred via rAF, NEVER writes;
 *   - selectLocale is the ONLY writer: it applies lang/dir to
 *     documentElement (immediately — text direction must not wait for a
 *     reload) and persists via writeStoredLocale() from the shared
 *     locale-storage module (localStorage key `roycss-locale`), so the
 *     next load applies the same locale pre-paint;
 *   - the request locale stays STATIC "en" server-side (see
 *     src/i18n/request.ts) — no cookies()/headers(), pages stay static.
 *
 * Two visual variants match the two headers:
 *   "sm" (default) → compact SiteHeader (site-header.tsx)
 *   "lg"           → home mega-header (roycss-page.tsx)
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Languages } from "lucide-react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeDirection,
  writeStoredLocale,
  type Locale,
} from "@/components/ui-library/foundation/locale-storage";

/** Catalog keys for per-locale display labels. */
const LABEL_KEYS: Record<string, string> = {
  en: "english",
  ar: "arabic",
};

/**
 * Locales listed in the menu but NOT yet selectable — PR-B ships "ar"
 * (RTL) by moving it into LOCALES in locale-storage + src/i18n/request.ts.
 */
const UPCOMING_LOCALES = ["ar"] as const;

export function LanguageToggle({
  variant = "sm",
}: {
  /** "sm" fits the compact SiteHeader; "lg" fits the home mega-header. */
  variant?: "sm" | "lg";
}) {
  const t = useTranslations("LanguageToggle");
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Read-only sync with the pre-hydration init script (layout.tsx).
    // The DOM lang attribute — not localStorage — is the source of truth
    // so the toggle agrees with what was actually applied pre-paint.
    // Deferred via rAF (set-state-in-effect rule). NEVER writes on mount.
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

  const selectLocale = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    // Apply + persist ONLY on explicit user intent (issue #160 contract).
    // Keep documentElement lang/dir in agreement — the init script sets
    // both, so the toggle must too.
    const root = document.documentElement;
    root.lang = next;
    root.dir = localeDirection(next);
    writeStoredLocale(window.localStorage, next);
    setLocale(next);
  };

  const triggerClassName =
    variant === "lg"
      ? "flex h-11 shrink-0 items-center gap-1.5 rounded-xl glass px-2.5 text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      : "inline-flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  const itemClassName =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ";

  return (
    <div
      className="relative shrink-0"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("changeLanguage")}
        title={t("changeLanguage")}
        className={triggerClassName}
      >
        <Languages className="size-4" />
        <span className="text-[11px] font-semibold leading-none">
          {locale.toUpperCase()}
        </span>
      </button>

      {open ? (
        <>
          {/* Click-away catcher: closes the menu without a focus trap —
              the menu is tiny and v1 has one selectable item. */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label={t("language")}
            className="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("language")}
            </p>
            {(LOCALES as readonly Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={code === locale}
                onClick={() => selectLocale(code)}
                className={
                  itemClassName +
                  (code === locale
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/60")
                }
              >
                <Check
                  className={`size-3.5 ${code === locale ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                />
                {t(LABEL_KEYS[code] ?? "english")}
              </button>
            ))}
            {UPCOMING_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={false}
                disabled
                aria-disabled="true"
                title={t("comingSoon")}
                aria-label={`${t(LABEL_KEYS[code] ?? code)} — ${t("comingSoon")}`}
                className={
                  itemClassName +
                  "text-muted-foreground/60 cursor-not-allowed"
                }
              >
                <Check className="size-3.5 opacity-0" aria-hidden="true" />
                {t(LABEL_KEYS[code] ?? code)}
                <span className="ml-auto text-[11px]">{t("comingSoon")}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default LanguageToggle;
