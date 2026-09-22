import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { effects } from "@/lib/roycss-effects";
import { PRODUCTS } from "@/lib/product-registry";
import {
  EFFECT_COUNT,
  EFFECT_COUNT_FORMATTED,
  CATEGORY_COUNT,
  PRODUCT_COUNT,
  TOOL_COUNT,
  VERSION,
  VERSION_BADGE,
  FULL_CSS_MIN_BYTES,
  FULL_CSS_MIN_GZ_KB,
  CSS_LINES,
} from "@/lib/site-stats";

const ROOT = join(__dirname, "..", "..");

/**
 * Site truth constants (audit F-03) — every number and version the site
 * renders must derive from src/lib/site-stats.ts and match the real
 * catalog / registry / package.json. These tests are the CI guard that
 * keeps the manifest, the tool badge, and the marketing copy from
 * drifting away from the shipped reality again.
 */
describe("site-stats — single source of truth", () => {
  it("derives EFFECT_COUNT from the real catalog", () => {
    expect(EFFECT_COUNT).toBe(effects.length);
    expect(EFFECT_COUNT).toBe(1973);
  });

  it("formats the effect count for display copy", () => {
    expect(EFFECT_COUNT_FORMATTED).toBe("1,973");
  });

  it("derives CATEGORY_COUNT from the real catalog", () => {
    expect(CATEGORY_COUNT).toBe(
      new Set(effects.map((e) => e.category)).size,
    );
    expect(CATEGORY_COUNT).toBe(29);
  });

  it("derives PRODUCT_COUNT from the product registry", () => {
    expect(PRODUCT_COUNT).toBe(PRODUCTS.length);
    expect(PRODUCT_COUNT).toBe(62);
  });

  it("TOOL_COUNT matches the ToolType registry in tool-registry.ts", () => {
    // Issue #185: the ToolType union + TOOL_META moved to tool-registry.ts
    // (single source of truth for the sheet AND the browsable gallery).
    const registry = readFileSync(
      join(ROOT, "src/components/roycss/tool-registry.ts"),
      "utf8",
    );
    const union = registry.match(/export type ToolType =\n((?:  \| "[a-z0-9-]+";?\n)+)/);
    expect(union).toBeTruthy();
    const members = union![1]
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith('| "'))
      .map((s) => s.replace('| "', "").replace('",', "").replace('"', ""));
    expect(members.length).toBeGreaterThan(0);
    // Every registry entry must have TOOL_META metadata.
    const metaEntries = registry.match(/const TOOL_META: Record<ToolType, ToolMeta>/);
    expect(metaEntries).toBeTruthy();
    // The tool sheet still renders one branch per registry entry.
    const sheet = readFileSync(
      join(ROOT, "src/components/roycss/platform-tools.tsx"),
      "utf8",
    );
    const rendered = sheet.match(/\{tool === "/g);
    expect(rendered?.length).toBe(members.length);
    expect(TOOL_COUNT).toBe(members.length);
  });

  it("reads VERSION from package.json", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(VERSION).toBe(pkg.version);
    expect(VERSION).toBe("2.0.0");
    expect(VERSION_BADGE).toBe("v2.0");
  });

  it("pins the shipped stylesheet size constants to dist/", () => {
    const min = join(ROOT, "dist/roycss.min.css");
    if (!existsSync(min)) return; // dist not built in this checkout
    expect(statSync(min).size).toBe(FULL_CSS_MIN_BYTES);
    const gzKB = Math.round(gzipSync(readFileSync(min)).length / 1024);
    expect(Math.abs(gzKB - FULL_CSS_MIN_GZ_KB)).toBeLessThanOrEqual(2);
  });

  it("pins CSS_LINES to the real dist/roycss.css line count — issue #202", () => {
    // The hero claimed "~22,000+ lines" while the shipped file has ~60k.
    const css = join(ROOT, "dist/roycss.css");
    if (!existsSync(css)) return; // dist not built in this checkout
    // wc -l semantics: newline-terminated lines.
    const lines = (readFileSync(css, "utf8").match(/\n/g) ?? []).length;
    expect(CSS_LINES).toBe(lines);
  });
});

describe("site-stats — manifest.json stays pinned to the catalog", () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "public/manifest.json"), "utf8"),
  );

  it("description interpolates the real counts", () => {
    expect(manifest.description).toBe(
      `${EFFECT_COUNT_FORMATTED} CSS effects, ${PRODUCT_COUNT} platform products, ${TOOL_COUNT} developer tools, design systems, and AI assistance — design, build, customize, and ship modern interfaces.`,
    );
  });

  it("effects shortcut advertises the real count", () => {
    const effectsShortcut = manifest.shortcuts.find(
      (s: { name: string }) => s.name === "Browse Effects",
    );
    expect(effectsShortcut).toBeTruthy();
    expect(effectsShortcut.description).toBe(
      `Explore ${EFFECT_COUNT_FORMATTED} production-ready CSS effects with live demos`,
    );
  });
});

describe("site-stats — stale count literals are gone from user-visible copy", () => {
  /**
   * Issue #202: pricing-section.tsx was previously EXCLUDED here ("owned
   * by the legal/pricing workstream") — that exclusion is exactly how a
   * stale "All 1,749 CSS effects" survived three catalog expansions.
   * No files are excluded anymore: all user-visible copy must derive
   * counts from site-stats.ts.
   */
  const EXCLUDED = new Set<string>([]);

  const STALE_COUNT = /\b(?:1,629|1,749|1,869|1,569)\b|1749\+/;
  const STALE_BADGE = /\bv(?:1\.0|2\.1)\b(?![\d.])/;
  const STALE_ROUNDED = /\b1\.5k\+|\b1\.9k\+ effects\b/;

  function collectFiles(dir: string, relDir: string, out: string[]): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        collectFiles(abs, rel, out);
      } else if (/\.(tsx?|json)$/.test(entry.name) && !EXCLUDED.has(rel)) {
        out.push(rel);
      }
    }
  }

  const files: string[] = [];
  collectFiles(join(ROOT, "src"), "src", files);
  files.push("public/manifest.json");

  it("no stale effect counts (1,629 / 1,749 / 1,869 / 1,569 / 1749+)", () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const hits = readFileSync(join(ROOT, rel), "utf8").match(STALE_COUNT);
      if (hits) offenders.push(`${rel}: ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("no stale rounded counts (1.5k+ / 1.9k+ effects) in user-visible copy", () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const hits = readFileSync(join(ROOT, rel), "utf8").match(STALE_ROUNDED);
      if (hits) offenders.push(`${rel}: ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("no hardcoded tool counts (N developer tools / N tools literals)", () => {
    // TOOL_COUNT is registry-derived; the pillar copy must interpolate it.
    const whatIs = readFileSync(
      join(ROOT, "src/components/roycss/what-is-roycss.tsx"),
      "utf8",
    );
    expect(whatIs).toMatch(/\$\{TOOL_COUNT\} developer tools/);
    expect(whatIs).toMatch(/stat: `\$\{TOOL_COUNT\} tools`/);
    expect(whatIs).not.toMatch(/\b\d+ (developer )?tools["`,]/);
  });

  it("AnimatedCounter server-renders the final value (never 0) — issue #202", () => {
    // Source-level guard: the counter must initialize from `value` so
    // crawlers/no-JS users see the real numbers in the raw HTML.
    const src = readFileSync(
      join(ROOT, "src/components/roycss/motion-primitives.tsx"),
      "utf8",
    );
    expect(src).toMatch(/const \[display, setDisplay\] = useState\(value\)/);
    expect(src).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("pricing free tier interpolates the live effect count", () => {
    const pricing = readFileSync(
      join(ROOT, "src/components/roycss/pricing-section.tsx"),
      "utf8",
    );
    expect(pricing).toMatch(/`All \$\{EFFECT_COUNT_FORMATTED\} CSS effects`/);
    expect(pricing).not.toMatch(/\bAll 1[\d,]{3} CSS effects\b/);
  });

  it("no stale version badges (v1.0 / v2.1) outside changelog history", () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      const hits = src.match(STALE_BADGE);
      if (hits) offenders.push(`${rel}: ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});
