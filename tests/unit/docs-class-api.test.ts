import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const DOCS_DIR = join(ROOT, "src", "app", "docs");

/**
 * Docs class-API truth gate (audit F-01/F-02).
 *
 * The /docs route pages must only teach import paths that exist in the
 * package `exports` map and class names that exist in the shipped
 * stylesheet (dist/roycss.css). Before this gate, 13 docs pages
 * documented a parallel `r-*` class API (`r-hover-*`, `r-btn-*`, …)
 * and import paths (`roycss/effects.css`, a `cdn.roycss.org` CDN)
 * that do not exist anywhere in the shipped package — everything a
 * reader copied silently did nothing.
 *
 * Rules enforced:
 *   1. No `r-*` class tokens in docs page code (the only permitted
 *      mentions are the explicit negative examples — "this prefix does
 *      not exist" — which we exempt by line allowlist).
 *   2. Every `roycss-*` class token used in a docs page must exist as
 *      a selector in dist/roycss.css (or be a known file/identifier
 *      name, not a class).
 *   3. No phantom import paths (`roycss/effects.css`) or phantom CDN
 *      hosts (`cdn.roycss.org`) — the CDN examples must use unpkg/jsDelivr.
 */

const distCss = readFileSync(join(ROOT, "dist", "roycss.css"), "utf8");
const distClasses = new Set(
  Array.from(distCss.matchAll(/\.((?:roycss-)[a-z0-9-]+)/g), (m) => m[1]),
);

function listPageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listPageFiles(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

const pages = listPageFiles(DOCS_DIR);

/** Lines where an `r-*` mention is an intentional negative example. */
const NEGATIVE_EXAMPLE_ALLOWLIST: Array<[string, RegExp]> = [
  // class-naming.tsx: "classes like `r-hover-lift` or `r-btn-glow` (short
  // `r-` prefix) do not exist" — teaching what NOT to type.
  ["class-naming", /Wrong prefix era/],
  // first-effect.tsx: "`roycss-btn-glow`, not `roycss-btn-Glow` or
  // `r-btn-glow`" — troubleshooting checklist.
  ["first-effect", /kebab-case, fully prefixed/],
];

function isNegativeExample(page: string, context: string): boolean {
  return NEGATIVE_EXAMPLE_ALLOWLIST.some(([marker, ctx]) =>
    page.includes(marker) && ctx.test(context),
  );
}

describe("docs class-API truth gate (F-01/F-02)", () => {
  it("found the docs pages", () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it("docs never teach the nonexistent r-* class API", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const rel = page.slice(DOCS_DIR.length + 1);
      const src = readFileSync(page, "utf8");
      const lines = src.split("\n");
      for (const [lineno, line] of lines.entries()) {
        if (/r-(hover|btn|text|bg|loader|card|hero|button)-[a-z0-9-]+/.test(line)) {
          const window = lines.slice(Math.max(0, lineno - 3), lineno + 1).join("\n");
          if (isNegativeExample(rel, window)) continue;
          offenders.push(`${rel}:${lineno + 1}: ${line.trim().slice(0, 90)}`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every roycss-* class taught in docs exists in dist/roycss.css", () => {
    const offenders: string[] = [];
    // Tokens that are file names / source identifiers, not classes.
    const identifierAllowlist = new Set([
      "roycss-critical",   // roycss-critical.css file
      "roycss-fallbacks",  // roycss-fallbacks.css file
      "roycss-custom",     // user's own custom stylesheet example
      "roycss-buttons",    // exported file name (roycss-buttons.css)
      "roycss-effects",    // src/lib/roycss-effects.ts module
      "roycss-types",      // roycss-types.ts module
      // Lint rule id shown verbatim in the `roycss lint` banner the CLI
      // docs quote (issue #128) — a rule name, not a CSS class:
      "roycss-prefix",
      // Example selector a contributor authors in the contributing guide:
      "roycss-animations-float-card",
      // Custom-effect guide's invented example (the page teaches authoring
      // your own effect — the class is the reader's own creation):
      "roycss-hover-wobble",
      // `roycss doctor` output in the CLI/class-naming docs — the flagged
      // typo is the entire point of the example:
      "roycss-hover-lifft",
      // VS Code extension identifiers (publisher.name) and user-chosen
      // snippet prefixes — not CSS classes:
      "roycss-vscode",
      "roycss-cta",
    ]);
    for (const page of pages) {
      const rel = page.slice(DOCS_DIR.length + 1);
      const src = readFileSync(page, "utf8");
      // Namespace tokens describe the family, not a concrete class:
      // "roycss-anim-*" wildcards and "the roycss-anim- prefix" prose
      // (token ends with a hyphen). Also drop HTML anchor ids.
      const srcNoWildcards = src
        .replace(/id="roycss-[a-z0-9-]+"/g, "")
        // Exported file names (roycss-hover.css, roycss-buttons.css):
        .replace(/roycss-[a-z0-9-]+\.(?:css|json)/g, "")
        // Namespace wildcards ("roycss-hover-*") and prose prefixes:
        .replace(/roycss-[a-z0-9-]+-\*/g, "")
        .replace(/roycss-[a-z0-9-]+-(?=\s)/g, "")
        // Case-mismatch teaching examples ("roycss-hover-PushUp won't
        // work") — real classes are lowercase kebab, so a token followed
        // by an uppercase letter only appears in negative examples:
        .replace(/roycss-[a-z0-9-]+(?=[A-Z])/g, "");
      const tokens = new Set(
        Array.from(srcNoWildcards.matchAll(/\b(roycss-[a-z0-9-]+)\b/g), (m) => m[1]),
      );
      for (const token of tokens) {
        if (identifierAllowlist.has(token)) continue;
        if (!distClasses.has(token)) {
          offenders.push(`${rel}: .${token} not found in dist/roycss.css`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("docs never reference the phantom CDN host or phantom export paths", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const rel = page.slice(DOCS_DIR.length + 1);
      const src = readFileSync(page, "utf8");
      if (/cdn\.roycss\.org/.test(src)) offenders.push(`${rel}: cdn.roycss.org`);
      if (/["']roycss\/effects\.css["']/.test(src)) {
        offenders.push(`${rel}: import "roycss/effects.css"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
