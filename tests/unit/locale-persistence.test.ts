import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import enMessages from "../../messages/en.json";
import {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  writeStoredLocale,
  localeDirection,
  resolveDocumentLocale,
  type Locale,
  type LocaleStorageLike,
} from "@/components/ui-library/foundation/locale-storage";

const ROOT = join(__dirname, "..", "..");

/**
 * Locale persistence (issue #129 PR-A — i18n scaffolding).
 *
 * Mirrors tests/unit/theme-persistence.test.ts (issue #160 precedent).
 * Contract under test:
 *   1. The pre-hydration locale init script (src/app/layout.tsx) READS
 *      `roycss-locale`, validates it against the locale→[lang,dir] table
 *      and applies documentElement.lang/dir pre-paint; corrupt/missing
 *      values fall back to en/ltr. It NEVER WRITES the key.
 *   2. The shared module (`locale-storage.ts`) stays behaviorally
 *      equivalent to the script (lockstep guard against drift).
 *   3. Only the LanguageToggle handler persists a value (source-level
 *      gate) and applies lang/dir in the same order.
 *   4. The static-first architecture constraint holds: src/i18n/request.ts
 *      reads NO dynamic APIs (no cookies()/headers()) and the layout
 *      keeps <html lang="en" suppressHydrationWarning> with the
 *      NextIntlClientProvider mounted.
 *
 * The vitest environment is `node` (no DOM, per vitest.config.ts), so the
 * init script is evaluated against mocked `localStorage`/`document` —
 * the same convention as theme-persistence.test.ts.
 */

/* ─── mocks ─────────────────────────────────────────────────── */

/** In-memory localStorage stand-in with a write spy. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      writes.push([key, value]);
      map.set(key, value);
    },
  };
  const writes: Array<[string, string]> = [];
  return { storage: storage as LocaleStorageLike, writes };
}

/** Minimal document mock tracking documentElement lang/dir. */
function makeDocument(lang = "en") {
  return {
    documentElement: {
      lang,
      dir: "ltr" as string,
    },
  };
}

/** Evaluate the literal pre-hydration init script extracted from layout.tsx. */
function runInitScript(opts: { stored: string | null; storage: LocaleStorageLike; lang?: string }) {
  const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  const match = layoutSrc.match(/const localeInitScript = `([^`]+)`;/);
  if (!match) throw new Error("localeInitScript not found in src/app/layout.tsx");
  const doc = makeDocument(opts.lang);
  const fn = new Function(
    "localStorage",
    "window",
    "document",
    match[1],
  ) as (ls: LocaleStorageLike, win: unknown, doc: unknown) => void;
  fn(opts.storage, {}, doc);
  return doc;
}

/* ─── 1. pre-hydration locale init script (layout.tsx) ─────────── */

describe("pre-hydration locale init script (layout.tsx)", () => {
  it("uses the shared LOCALE_STORAGE_KEY", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toContain(`'${LOCALE_STORAGE_KEY}'`);
  });

  it("stored 'en' → lang=en, dir=ltr before paint", () => {
    const { storage } = makeStorage({ [LOCALE_STORAGE_KEY]: "en" });
    const doc = runInitScript({ stored: "en", storage });
    expect(doc.documentElement.lang).toBe("en");
    expect(doc.documentElement.dir).toBe("ltr");
  });

  it.each([
    ["missing", null],
    ["corrupt value", "banana"],
    ["prototype-polluting key", "__proto__"],
    ["constructor key", "constructor"],
  ])("%s falls back to en/ltr", (_label, stored) => {
    const { storage } = makeStorage(
      stored === null ? {} : { [LOCALE_STORAGE_KEY]: stored as string },
    );
    const doc = runInitScript({ stored, storage });
    expect(doc.documentElement.lang).toBe("en");
    expect(doc.documentElement.dir).toBe("ltr");
  });

  it("NEVER writes the storage key on init (issue #160 contract, mirrored)", () => {
    const { storage, writes } = makeStorage({ [LOCALE_STORAGE_KEY]: "en" });
    runInitScript({ stored: "en", storage });
    expect(writes).toEqual([]);
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    const script = layoutSrc.match(/const localeInitScript = `([^`]+)`;/)![1];
    expect(script).not.toContain("setItem");
  });
});

/* ─── 2. shared locale-storage module ──────────────────────────── */

describe("locale-storage — read/validate/apply (mock localStorage)", () => {
  it("LOCALES is exactly the set of shipped catalogs (v1: en only)", () => {
    expect(LOCALES).toEqual(["en"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("readStoredLocale returns valid stored values", () => {
    for (const value of LOCALES) {
      const { storage } = makeStorage({ [LOCALE_STORAGE_KEY]: value });
      expect(readStoredLocale(storage)).toBe(value);
    }
  });

  it("readStoredLocale returns null for missing or corrupt values", () => {
    expect(readStoredLocale(makeStorage().storage)).toBeNull();
    expect(readStoredLocale(makeStorage({ [LOCALE_STORAGE_KEY]: "fr" }).storage)).toBeNull();
    expect(readStoredLocale(makeStorage({ [LOCALE_STORAGE_KEY]: "__proto__" }).storage)).toBeNull();
    expect(readStoredLocale(null)).toBeNull();
  });

  it("readStoredLocale survives a throwing storage (private mode)", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readStoredLocale(throwing)).toBeNull();
  });

  it("writeStoredLocale persists, readStoredLocale reads it back", () => {
    const { storage } = makeStorage();
    writeStoredLocale(storage, "en");
    expect(readStoredLocale(storage)).toBe("en");
  });

  it("writeStoredLocale tolerates a throwing storage", () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeStoredLocale(throwing, "en")).not.toThrow();
  });

  it("localeDirection + resolveDocumentLocale map every shipped locale", () => {
    for (const locale of LOCALES) {
      const resolved = resolveDocumentLocale(locale);
      expect(resolved.lang).toBe(locale);
      expect(resolved.dir).toBe(localeDirection(locale));
      expect(["ltr", "rtl"]).toContain(resolved.dir);
    }
    expect(resolveDocumentLocale("en")).toEqual({ lang: "en", dir: "ltr" });
  });
});

/* ─── 3. script ⇄ module equivalence ───────────────────────────── */

describe("init script ⇄ locale-storage equivalence", () => {
  /** Extract the locale→[lang,dir] table literal from the init script. */
  function scriptTable(): Record<string, [string, string]> {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    const script = layoutSrc.match(/const localeInitScript = `([^`]+)`;/)![1];
    const table = script.match(/var T=({[^;]+});/)![1];
    return JSON.parse(table.replaceAll("'", '"'));
  }

  it("the script's T table matches LOCALES + resolveDocumentLocale exactly", () => {
    const table = scriptTable();
    expect(Object.keys(table).sort()).toEqual([...LOCALES].sort());
    for (const locale of LOCALES) {
      const [lang, dir] = table[locale];
      expect(lang).toBe(locale);
      expect(dir).toBe(localeDirection(locale));
    }
  });

  const CASES: Array<{
    name: string;
    stored: Record<string, string>;
    expectLang: string;
    expectDir: string;
  }> = [
    { name: "stored en", stored: { "roycss-locale": "en" }, expectLang: "en", expectDir: "ltr" },
    { name: "nothing stored", stored: {}, expectLang: "en", expectDir: "ltr" },
    { name: "corrupt stored", stored: { "roycss-locale": "xx" }, expectLang: "en", expectDir: "ltr" },
    { name: "proto key stored", stored: { "roycss-locale": "__proto__" }, expectLang: "en", expectDir: "ltr" },
  ];

  for (const c of CASES) {
    it(`${c.name} → script lang/dir === resolveDocumentLocale(readStoredLocale)`, () => {
      const { storage } = makeStorage(c.stored);
      const doc = runInitScript({ stored: c.stored[LOCALE_STORAGE_KEY] ?? null, storage });
      const moduleResolved = resolveDocumentLocale(
        readStoredLocale(makeStorage(c.stored).storage) ?? DEFAULT_LOCALE,
      );
      expect(doc.documentElement.lang).toBe(moduleResolved.lang);
      expect(doc.documentElement.dir).toBe(moduleResolved.dir);
      expect(doc.documentElement.lang).toBe(c.expectLang);
      expect(doc.documentElement.dir).toBe(c.expectDir);
    });
  }
});

/* ─── 4. only the LanguageToggle writes (source-level gates) ───── */

describe("locale writers — only the LanguageToggle persists (source gates)", () => {
  const toggleSrc = readFileSync(
    join(ROOT, "src/components/roycss/language-toggle.tsx"),
    "utf8",
  );

  it("LanguageToggle writes via the shared locale-storage module — never raw localStorage", () => {
    expect(toggleSrc).toContain("writeStoredLocale(window.localStorage");
    expect(toggleSrc).not.toContain("localStorage.setItem");
  });

  it("LanguageToggle mount effect only reads documentElement.lang (no writes, rAF-deferred)", () => {
    const effectStart = toggleSrc.indexOf("useEffect(");
    const effectEnd = toggleSrc.indexOf("}, []);", effectStart);
    const mountEffect = toggleSrc.slice(effectStart, toggleSrc.indexOf("}, []);", effectStart));
    expect(mountEffect).toContain("documentElement.lang");
    expect(mountEffect).toContain("requestAnimationFrame");
    expect(mountEffect).not.toContain("writeStoredLocale");
    expect(effectEnd).toBeGreaterThan(effectStart);
  });

  it("LanguageToggle applies lang AND dir before persisting, in the select handler", () => {
    const handlerStart = toggleSrc.indexOf("const selectLocale");
    const handlerEnd = toggleSrc.indexOf("};", handlerStart);
    const handler = toggleSrc.slice(handlerStart, handlerEnd);
    expect(handler).toContain("root.lang = next");
    expect(handler).toContain("root.dir = localeDirection(next)");
    expect(handler.indexOf("writeStoredLocale")).toBeGreaterThan(handler.indexOf("root.dir"));
  });

  it("init script and layout never call setItem for the locale key", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    const script = layoutSrc.match(/const localeInitScript = `([^`]+)`;/)![1];
    expect(script).not.toContain("setItem");
  });
});

/* ─── 5. static-preservation + catalog wiring gates ────────────── */

describe("i18n scaffolding — static architecture + provider wiring", () => {
  it("src/i18n/request.ts reads NO dynamic APIs (static-first constraint, worklog 7-c)", () => {
    const requestSrc = readFileSync(join(ROOT, "src/i18n/request.ts"), "utf8");
    expect(requestSrc).not.toMatch(/cookies\(|headers\(|draftMode\(/);
    expect(requestSrc).toContain("getRequestConfig");
  });

  it("layout keeps suppressHydrationWarning + lang=en and mounts NextIntlClientProvider", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toContain('<html lang="en" suppressHydrationWarning');
    expect(layoutSrc).toContain("<NextIntlClientProvider>{children}</NextIntlClientProvider>");
    expect(layoutSrc).toContain("localeInitScript");
  });

  it("messages/en.json covers every namespace the chrome consumes", () => {
    for (const ns of [
      "SiteHeader",
      "LanguageToggle",
      "SkipLink",
      "HomeFooter",
      "NotFound",
      "MobileBottomNav",
      "ScrollToTop",
      "KeyboardShortcutsOverlay",
      "SearchOverlay",
    ]) {
      expect(enMessages, `missing namespace ${ns}`).toHaveProperty(ns);
    }
  });

  it("the en catalog still serves the exact strings the components resolved before (spot checks)", () => {
    const siteHeader = enMessages.SiteHeader as Record<string, string>;
    expect(siteHeader.menuOpen).toBe("Open menu");
    expect(siteHeader.menuClose).toBe("Close menu");
    expect(siteHeader.themeToggleAria).toBe("Toggle theme");
    expect(siteHeader.pauseAnimations).toBe("Pause animations");
    const homeFooter = enMessages.HomeFooter as Record<string, string>;
    expect(homeFooter.subscribe).toBe("Subscribe");
    const skipLink = enMessages.SkipLink as Record<string, string>;
    expect(skipLink.skipToEffects).toBe("Skip to effects");
    const notFound = enMessages.NotFound as Record<string, string>;
    expect(notFound.metaTitle).toBe("Page not found — RoyCSS");
  });

  it("v1 defines only 'en' as a writable Locale type", () => {
    const mod = readFileSync(
      join(ROOT, "src/components/ui-library/foundation/locale-storage.ts"),
      "utf8",
    );
    expect(mod).toContain('export type Locale = "en"');
  });
});
