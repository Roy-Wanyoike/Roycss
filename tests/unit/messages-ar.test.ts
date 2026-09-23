import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import { LOCALES, localeDirection } from "@/components/ui-library/foundation/locale-storage";

const ROOT = join(__dirname, "..", "..");

/**
 * Arabic catalog integrity (issue #129 PR-B).
 *
 * next-intl throws (dev) or renders raw keys (prod) when a translation
 * is missing, and silently keeps the source language when a placeholder
 * is accidentally dropped — neither can be caught by type-checking two
 * JSON imports. These gates pin the ar catalog to the en catalog:
 *   1. EXACT key parity — every namespace/key in en.json exists in
 *      ar.json and vice versa (recursive).
 *   2. Placeholder parity — every {token} in an en string appears in its
 *      ar counterpart (and vice versa), so interpolation can't break.
 *   3. Rich-text tag parity — <tag> markup (e.g. the <key>? key hints)
 *      survives translation.
 *   4. The catalogs on disk are exactly LOCALES (adding a locale means
 *      catalog + locale-storage + the layout T table, in lockstep).
 *   5. Spot checks pin actual Arabic strings (an empty/machine-stub
 *      catalog would fail).
 */

type Messages = Record<string, unknown>;

/** Keys that are legitimately identical in both locales (brand/protocol). */
const ALLOWED_IDENTICAL = new Set([
  "HomeFooter.emailPlaceholder", // you@example.com
  "NotFound.footerGithub", // GitHub
]);

/** Collect every leaf path ("Namespace.key") of a message catalog. */
function leafPaths(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      return leafPaths(value as Messages, path);
    }
    return [path];
  });
}

function leaf(obj: Messages, path: string): string {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") {
      throw new Error(`missing path ${path}`);
    }
    cur = (cur as Messages)[part];
  }
  return String(cur);
}

const PLACEHOLDER_RE = /\{(\w+)\}/g;
const RICH_TAG_RE = /<\/?([a-zA-Z]+)>/g;

function placeholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER_RE)].map((m) => m[1]).sort();
}

function richTags(text: string): string[] {
  return [...text.matchAll(RICH_TAG_RE)].map((m) => m[0]).sort();
}

describe("messages/ar.json — catalog parity with en.json (PR-B)", () => {
  const enLeaves = leafPaths(enMessages).sort();
  const arLeaves = leafPaths(arMessages).sort();

  it("ar.json has EXACTLY the same leaf keys as en.json", () => {
    const missingInAr = enLeaves.filter((k) => !arLeaves.includes(k));
    const extraInAr = arLeaves.filter((k) => !enLeaves.includes(k));
    expect(missingInAr, "keys missing from the ar catalog").toEqual([]);
    expect(extraInAr, "keys unknown to the en catalog").toEqual([]);
  });

  it("every ar leaf is a non-empty translated string", () => {
    for (const path of arLeaves) {
      const value = leaf(arMessages, path);
      expect(value.trim(), `${path} must be a non-empty string`).not.toBe("");
    }
  });

  it("placeholders match the en catalog 1:1 (interpolation can't break)", () => {
    for (const path of enLeaves) {
      expect(
        placeholders(leaf(arMessages, path)),
        `placeholder drift at ${path}`,
      ).toEqual(placeholders(leaf(enMessages, path)));
    }
  });

  it("rich-text tags (<key>…) match the en catalog 1:1", () => {
    for (const path of enLeaves) {
      const enTags = richTags(leaf(enMessages, path));
      if (enTags.length > 0) {
        expect(
          richTags(leaf(arMessages, path)),
          `rich-text tag drift at ${path}`,
        ).toEqual(enTags);
      }
    }
  });

  it("no en string is shipped untranslated (brand/protocol keys excepted)", () => {
    for (const path of enLeaves) {
      if (ALLOWED_IDENTICAL.has(path)) continue;
      const en = leaf(enMessages, path);
      const ar = leaf(arMessages, path);
      expect(ar, `${path} is identical to the en catalog — not translated`).not.toBe(en);
    }
  });

  it("spot checks — the chrome strings the RTL e2e asserts are real Arabic", () => {
    const skipLink = arMessages.SkipLink as Record<string, string>;
    expect(skipLink.skipToEffects).toBe("تخطَّ إلى التأثيرات");
    const siteHeader = arMessages.SiteHeader as Record<string, string>;
    expect(siteHeader.themeToggleAria).toBe("تبديل السمة");
    expect(siteHeader.menuOpen).toBe("فتح القائمة");
    const lang = arMessages.LanguageToggle as Record<string, string>;
    expect(lang.arabic).toBe("العربية");
    const shortcuts = arMessages.KeyboardShortcutsOverlay as Record<string, string>;
    // Rich-text hint keeps the <key> markup around the literal "?" key.
    expect(shortcuts.hint).toContain("<key>?</key>");
  });
});

describe("message catalogs ⇄ LOCALES lockstep", () => {
  it("messages/ on disk is exactly the LOCALES set (no orphan catalogs)", () => {
    const files = readdirSync(join(ROOT, "messages"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
    expect(files).toEqual([...LOCALES].sort());
  });

  it("LOCALES covers both shipped directions via localeDirection", () => {
    // ar must resolve to RTL so the [dir="rtl"] CSS rules activate when
    // the Arabic catalog is selected; the full script⇄module table lives
    // in locale-persistence.test.ts.
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
  });
});
