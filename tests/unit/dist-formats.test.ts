/**
 * Distribution formats — issue #217.
 *
 * Pins the package.json `exports` map to real files on disk for every
 * advertised subpath (per-category CSS splits, Tailwind v4 entry) and
 * verifies the SRI artifact fingerprints the actual dist/roycss.min.css
 * bytes. Catches: a category slug renamed in roycss-types but not in the
 * exports map, a split missing from dist (build:package not re-run), or
 * a stale roycss.min.css.sri.txt after a min.css change.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { categoryOrder, categoryMeta } from "@/lib/roycss-types";
import { effects } from "@/lib/roycss-effects";

const ROOT = join(__dirname, "..", "..");
const DIST = join(ROOT, "dist");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as {
  exports: Record<string, string>;
};

describe("per-category CSS splits (#217a)", () => {
  it("ships a full + min split for every category", () => {
    for (const cat of categoryOrder) {
      expect(existsSync(join(DIST, `roycss.${cat}.css`)), `dist/roycss.${cat}.css`).toBe(true);
      expect(
        existsSync(join(DIST, `roycss.${cat}.min.css`)),
        `dist/roycss.${cat}.min.css`
      ).toBe(true);
    }
  });

  it("exposes ./category/<slug> (+ /min) exports that resolve on disk — require/file check", () => {
    for (const cat of categoryOrder) {
      const full = pkg.exports[`./category/${cat}`];
      const min = pkg.exports[`./category/${cat}/min`];
      expect(full, `./category/${cat} export`).toBeDefined();
      expect(min, `./category/${cat}/min export`).toBeDefined();
      expect(existsSync(join(ROOT, full)), `${full} exists`).toBe(true);
      expect(existsSync(join(ROOT, min)), `${min} exists`).toBe(true);
    }
  });

  it("every effect's class is present in its own category split", () => {
    const byCategory = new Map<string, number>();
    for (const e of effects) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
    for (const cat of categoryOrder) {
      const css = readFileSync(join(DIST, `roycss.${cat}.css`), "utf-8");
      // The split header names the category label and effect count.
      expect(css).toContain(categoryMeta[cat].label);
      const count = byCategory.get(cat) ?? 0;
      expect(css).toContain(`(${count} effects)`);
    }
  });

  it("every category split carries the shared a11y base (reduced-motion safety net)", () => {
    for (const cat of categoryOrder) {
      const css = readFileSync(join(DIST, `roycss.${cat}.css`), "utf-8");
      expect(css, `${cat} split`).toContain("prefers-reduced-motion: reduce");
      expect(css, `${cat} split`).toContain(".roycss-sr-only");
    }
  });
});

describe("Tailwind v4 export (#217b)", () => {
  const tailwindCss = join(DIST, "roycss.tailwind.css");

  it("exists and is advertised as ./css/tailwind", () => {
    expect(existsSync(tailwindCss)).toBe(true);
    expect(pkg.exports["./css/tailwind"]).toBe("./dist/roycss.tailwind.css");
  });

  it("pulls in the full effect stylesheet relative to dist/", () => {
    const css = readFileSync(tailwindCss, "utf-8");
    expect(css).toContain('@import "./roycss.css"');
  });
});

describe("SRI artifact (#217c)", () => {
  it("dist/roycss.min.css.sri.txt is the sha384 of the real min.css bytes", () => {
    const sriPath = join(DIST, "roycss.min.css.sri.txt");
    expect(existsSync(sriPath)).toBe(true);
    const sri = readFileSync(sriPath, "utf-8").trim();
    expect(sri).toMatch(/^sha384-[A-Za-z0-9+/]+={0,2}$/);
    const actual =
      "sha384-" + createHash("sha384").update(readFileSync(join(DIST, "roycss.min.css"))).digest("base64");
    expect(sri).toBe(actual);
  });
});

describe("/api/health version (#217 item 6)", () => {
  it("the route no longer hardcodes 2.1.0 and reads the package version", () => {
    const route = readFileSync(join(ROOT, "src", "app", "api", "health", "route.ts"), "utf-8");
    expect(route).not.toContain('"2.1.0"');
    expect(route).toContain("version: VERSION");
  });
});
