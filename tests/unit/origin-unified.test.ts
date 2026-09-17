import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL as EFFECTS_SITE_URL } from "@/app/effects/_lib/static-effects";
import { SITE_URL as CONSTANTS_SITE_URL } from "@/lib/constants";

const ROOT = join(__dirname, "..", "..");

/**
 * Canonical origin unification (issue #113 / UIX-F12) — the drift gate
 * that keeps every indexing signal on ONE origin: https://roycss.com.
 *
 * Before this fix, layout.tsx metadataBase + OG url said
 * https://roycss.space-z.ai while static-effects.ts SITE_URL, the JSON-LD
 * url, robots.ts and every effect canonical used https://roycss.com —
 * split signals at launch. These tests pin the unified state so the split
 * cannot silently return:
 *   - layout.tsx metadataBase + openGraph.url + JSON-LD url
 *   - the SITE_URL constants (static-effects.ts, constants.ts)
 *   - robots.ts sitemap pointer
 *   - no source file under src/ referencing the alternate domain at all
 *
 * 301-redirecting the alternate domain to this origin at the edge is an
 * owner-side Vercel-domains action tracked in issue #113 — the code-side
 * contract is what these tests enforce.
 */
const CANONICAL_ORIGIN = "https://roycss.com";

describe("canonical origin — every SEO signal agrees (#113)", () => {
  it("layout.tsx metadataBase, OG url and JSON-LD url are the canonical origin", () => {
    const src = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");

    expect(src).toContain(
      `metadataBase: new URL("${CANONICAL_ORIGIN}")`,
    );

    // Two absolute-URL literals must carry the canonical origin: the
    // JSON-LD SoftwareApplication url and the openGraph.url. (Metadata
    // above uses the same string form `url: "https://roycss.com",`.)
    const absoluteUrls = src.match(/url:\s*"https:\/\/roycss\.com",/g) ?? [];
    expect(absoluteUrls.length).toBeGreaterThanOrEqual(2);

    expect(src).not.toMatch(/space-z/i);
  });

  it("every exported SITE_URL constant is the canonical origin", () => {
    // Feeds sitemap.ts, /effects canonicals, effect-page OG/JSON-LD urls:
    expect(EFFECTS_SITE_URL).toBe(CANONICAL_ORIGIN);
    // The platform-wide constants module must not disagree either:
    expect(CONSTANTS_SITE_URL).toBe(CANONICAL_ORIGIN);
  });

  it("robots.ts points the sitemap at the canonical origin", () => {
    const src = readFileSync(join(ROOT, "src/app/robots.ts"), "utf8");
    expect(src).toContain(`sitemap: "${CANONICAL_ORIGIN}/sitemap.xml"`);
  });

  it("sitemap.ts derives all URLs from the static-effects SITE_URL", () => {
    const src = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
    // The sitemap must not hardcode its own origin — it inherits the
    // single SITE_URL constant that the test above pins.
    expect(src).toContain(
      'import { SITE_URL, getEffectPageIds } from "./effects/_lib/static-effects"',
    );
    expect(src).not.toMatch(/https:\/\/roycss\.(?!com)/);
    expect(src).not.toMatch(/space-z/i);
  });
});

describe("canonical origin — the alternate domain is gone from src/ (#113)", () => {
  /**
   * Files where the alternate-domain string may legitimately appear:
   * none today. If a future docs/changelog page must mention the
   * pre-unification domain, add a principled entry here with a comment —
   * the default answer is "write around it" (e.g. "the alternate domain").
   */
  const EXCLUDED = new Set<string>([]);

  const TEXT_FILE = /\.(tsx?|jsx?|mjs|cjs|css|json|md|txt)$/;

  function collectFiles(dir: string, relDir: string, out: string[]): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        collectFiles(abs, rel, out);
      } else if (TEXT_FILE.test(entry.name) && !EXCLUDED.has(rel)) {
        out.push(rel);
      }
    }
  }

  const files: string[] = [];
  collectFiles(join(ROOT, "src"), "src", files);
  files.push("public/manifest.json");

  it("no source file under src/ (and the PWA manifest) references the alternate domain", () => {
    const offenders: string[] = [];
    for (const rel of files) {
      if (EXCLUDED.has(rel)) continue;
      if (readFileSync(join(ROOT, rel), "utf8").match(/space-z/i)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
    // The walker must actually see the tree (guard against a silently
    // empty walk making this test vacuous).
    expect(files.length).toBeGreaterThan(100);
  });
});
