import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { effects } from "@/lib/roycss-effects";
import { categoryMeta, categoryOrder } from "@/lib/roycss-types";
import {
  effectDetailHref,
  explorerHref,
  parseExplorerCategory,
} from "@/lib/search-targets";

/**
 * Navigation target mapping (issue #161).
 *
 * Pins the two navigation fixes:
 *
 *   1. Explorer deep-links — every "Open explorer" / "Browse all N in the
 *      explorer" / 404-recovery link routes through explorerHref(), and the
 *      home page reads the same URL back via parseExplorerCategory() so the
 *      category pill is pre-selected on arrival (no dead-end).
 *
 *   2. ⌘K result targets — effect results map to their real /effects/<id>
 *      detail page (title matches the clicked result) via effectDetailHref(),
 *      the same URL shape as src/app/effects/[id]/page.tsx.
 */

const ROOT = resolve(__dirname, "../..");

/* ─── 1. effectDetailHref ─────────────────────────────────────── */

describe("effectDetailHref", () => {
  it("builds the /effects/<id> detail route for a real catalog effect", () => {
    // "Glow Border" (the ⌘K repro from the QA finding) exists in the catalog
    // with this id — the route must resolve to its detail page.
    const glowBorder = effects.find((e) => e.name === "Glow Border");
    expect(glowBorder).toBeDefined();
    expect(effectDetailHref(glowBorder!.id)).toBe(
      `/effects/${glowBorder!.id}`,
    );
  });

  it("produces a route-shaped href for every effect in the catalog", () => {
    const idShape = /^\/effects\/[a-z0-9-]+$/;
    for (const effect of effects) {
      expect(effectDetailHref(effect.id)).toMatch(idShape);
    }
  });

  it("URL-encodes the id segment", () => {
    expect(effectDetailHref("has space")).toBe("/effects/has%20space");
  });
});

/* ─── 2. explorerHref ─────────────────────────────────────────── */

describe("explorerHref", () => {
  it("keeps the bare home anchor for category-less explorer links", () => {
    expect(explorerHref()).toBe("/#effects");
    expect(explorerHref(null)).toBe("/#effects");
  });

  it("appends the category as a query param alongside the #effects anchor", () => {
    for (const cat of categoryOrder) {
      expect(explorerHref(cat)).toBe(`/?category=${cat}#effects`);
    }
  });

  it("round-trips through parseExplorerCategory for every category", () => {
    for (const cat of categoryOrder) {
      const href = explorerHref(cat);
      const search = href.slice(href.indexOf("?"), href.indexOf("#")); // "?category=<slug>"
      const hash = href.slice(href.indexOf("#")); // "#effects"
      expect(parseExplorerCategory(search, hash)).toBe(cat);
    }
  });
});

/* ─── 3. parseExplorerCategory ────────────────────────────────── */

describe("parseExplorerCategory", () => {
  it("reads the canonical ?category= query param", () => {
    expect(parseExplorerCategory("?category=hover", "#effects")).toBe("hover");
  });

  it("reads the #effects?category= hash form", () => {
    expect(parseExplorerCategory("", "#effects?category=hover")).toBe("hover");
    expect(parseExplorerCategory("", "#effects?category=3d-transforms")).toBe(
      "3d-transforms",
    );
  });

  it("prefers the search param when both forms are present", () => {
    expect(
      parseExplorerCategory("?category=text", "#effects?category=hover"),
    ).toBe("text");
  });

  it("matches slugs case-insensitively", () => {
    expect(parseExplorerCategory("?category=Hover", "")).toBe("hover");
    expect(parseExplorerCategory("?category=GLASS-UI", "")).toBe("glass-ui");
  });

  it("accepts the exact category label as a fallback", () => {
    for (const cat of ["hover", "glass-ui", "data-viz"] as const) {
      const label = categoryMeta[cat].label;
      expect(parseExplorerCategory(`?category=${encodeURIComponent(label)}`, "")).toBe(cat);
    }
  });

  it("ignores unknown and missing categories", () => {
    expect(parseExplorerCategory("?category=nope", "#effects")).toBeNull();
    expect(parseExplorerCategory("?category=", "#effects")).toBeNull();
    expect(parseExplorerCategory("", "#effects")).toBeNull();
    expect(parseExplorerCategory("", "")).toBeNull();
  });

  it("does not confuse the #effect=<id> deep link with the explorer anchor", () => {
    expect(parseExplorerCategory("", "#effect=pulse-glow")).toBeNull();
  });
});

/* ─── 4. Wiring (source-level, mirrors docs-index.test.ts) ────── */

describe("search-targets: call-site wiring", () => {
  const read = (rel: string): string =>
    readFileSync(resolve(ROOT, rel), "utf8");

  it("no call site hardcodes the bare '/#effects' href any more", () => {
    // All five dead-end links from issue #161 now route through explorerHref().
    const callSites = [
      "src/app/effects/page.tsx",
      "src/app/effects/[id]/page.tsx",
      "src/app/not-found.tsx",
    ];
    for (const rel of callSites) {
      expect(read(rel), rel).not.toContain('href="/#effects"');
      expect(read(rel), rel).toContain('from "@/lib/search-targets"');
    }
  });

  it("the ⌘K overlay maps effect results to effectDetailHref (no modal callback)", () => {
    const overlay = read("src/components/roycss/search-overlay.tsx");
    expect(overlay).toContain('from "@/lib/search-targets"');
    expect(overlay).toContain("effectDetailHref(effect.id)");
    expect(overlay).toContain("effectDetailHref(effectResults[idx].id)");
    // The home-state modal trigger (the mis-targeting vector) is gone.
    expect(overlay).not.toContain("onSelectEffect");
  });

  it("the home page consumes parseExplorerCategory to pre-select the category", () => {
    const page = read("src/components/roycss/roycss-page.tsx");
    expect(page).toContain("parseExplorerCategory");
    expect(page).toContain("setActiveCategory(category)");
  });
});
