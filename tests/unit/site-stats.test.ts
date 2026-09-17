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
    expect(EFFECT_COUNT).toBe(1959);
  });

  it("formats the effect count for display copy", () => {
    expect(EFFECT_COUNT_FORMATTED).toBe("1,959");
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

  it("TOOL_COUNT matches the ToolType registry in platform-tools.tsx", () => {
    const src = readFileSync(
      join(ROOT, "src/components/roycss/platform-tools.tsx"),
      "utf8",
    );
    const union = src.match(/type ToolType = ([^;]+);/);
    expect(union).toBeTruthy();
    const members = union![1]
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.startsWith('"'));
    expect(members.length).toBeGreaterThan(0);
    // Every registry entry must render a real component (one === per entry).
    const rendered = src.match(/\{tool === "/g);
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
   * Files where these numbers are allowed to appear:
   *  - pricing-section.tsx — owned by the legal/pricing workstream;
   *    tracked there, out of scope here.
   *
   * The retired docs blobs (src/lib/docs-data.ts and
   * src/components/docs/docs-content.json) used to be excluded here
   * for historical narrative; they were deleted by issue #112 (the
   * /docs routes are the single docs source of truth now).
   */
  const EXCLUDED = new Set([
    "src/components/roycss/pricing-section.tsx",
  ]);

  const STALE_COUNT = /\b(?:1,629|1,749|1,869|1,569)\b|1749\+/;
  const STALE_BADGE = /\bv(?:1\.0|2\.1)\b(?![\d.])/;

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
