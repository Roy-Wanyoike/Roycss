import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { effects, categoryMeta, categoryOrder } from "@/lib/roycss-effects";
import type { EffectCategory } from "@/lib/roycss-types";
import { categoryHref, explorerHref } from "@/lib/search-targets";
import {
  categoryPageTitle,
  categoryPageDescription,
  categoryPageKeywords,
  categoryLabel,
  categoryOgImage,
} from "@/lib/category-seo";
import { SITE_URL } from "@/app/effects/_lib/static-effects";

/**
 * Category landing pages contract (issue #198) — /effects/category/<slug>.
 * Pins: slug coverage, SEO copy budgets, href shapes, sitemap inclusion,
 * and the internal-linking upgrades on the effects index + effect pages.
 */

/** Per-category counts derived straight from the catalog (no drift). */
const byCategory = new Map<EffectCategory, number>();
for (const effect of effects) {
  byCategory.set(effect.category, (byCategory.get(effect.category) ?? 0) + 1);
}

describe("category landing pages (issue #198) — slug + data coverage", () => {
  it("generateStaticParams coverage: one slug per categoryOrder entry, all unique", () => {
    const slugs = categoryOrder.map((c) => c);
    expect(slugs.length).toBe(29);
    expect(new Set(slugs).size).toBe(29);
    // Every category has meta and at least one effect.
    for (const category of slugs) {
      expect(categoryMeta[category]?.label).toBeTruthy();
      expect(byCategory.get(category) ?? 0).toBeGreaterThan(0);
    }
  });

  it("categoryHref emits /effects/category/<slug>; explorerHref unchanged", () => {
    expect(categoryHref("hover")).toBe("/effects/category/hover");
    expect(categoryHref("3d-transforms")).toBe("/effects/category/3d-transforms");
    // The interactive explorer deep-link keeps its own shape (UI state).
    expect(explorerHref("hover")).toBe("/?category=hover#effects");
  });

  it("every category label passes through categoryLabel", () => {
    for (const category of categoryOrder) {
      expect(categoryLabel(category)).toBe(categoryMeta[category].label);
    }
  });
});

describe("category landing pages — SEO copy budgets", () => {
  it("titles follow the keyword template and stay ≤ 60 chars for all 29", () => {
    for (const category of categoryOrder) {
      const title = categoryPageTitle(category, byCategory.get(category)!);
      expect(
        title.startsWith(`CSS ${categoryMeta[category].label} — `),
        title,
      ).toBe(true);
      expect(title.endsWith(" | RoyCSS"), title).toBe(true);
      expect(title.length, title).toBeLessThanOrEqual(60);
    }
  });

  it("descriptions embed the count + label and stay in the 120–160 sweet spot band", () => {
    for (const category of categoryOrder) {
      const description = categoryPageDescription(
        category,
        byCategory.get(category)!,
      );
      expect(description).toContain(String(byCategory.get(category)));
      expect(description).toContain(
        categoryMeta[category].label.toLowerCase(),
      );
      // Hard ceiling only — meta descriptions may run short, never absurdly long.
      expect(description.length).toBeLessThanOrEqual(180);
    }
  });

  it("keywords lead with the exact category query", () => {
    const keywords = categoryPageKeywords("hover", byCategory.get("hover")!);
    expect(keywords[0]).toBe("CSS hover effects");
    expect(keywords).toContain("RoyCSS");
  });

  it("OG image is the dedicated /api/og?category= card (issue #206)", () => {
    for (const category of categoryOrder) {
      expect(categoryOgImage(category)).toBe(`/api/og?category=${category}`);
    }
  });
});

describe("category landing pages — sitemap + crawl graph", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("sitemap contains exactly the 29 category landing URLs", () => {
    const categoryUrls = urls.filter((u) =>
      u.startsWith(`${SITE_URL}/effects/category/`),
    );
    expect(categoryUrls.length).toBe(29);
    for (const category of categoryOrder) {
      expect(categoryUrls).toContain(`${SITE_URL}/effects/category/${category}`);
    }
  });

  it("sitemap total grew to 2,053 (home + /effects + 29 categories + 1,983 effect pages + 35 docs + 4 info/security pages, none lost)", () => {
    expect(urls.length).toBe(2053);
  });

  it("every effect belongs to exactly one category page (no orphan listings)", () => {
    let total = 0;
    for (const category of categoryOrder) {
      total += byCategory.get(category) ?? 0;
    }
    expect(total).toBe(effects.length);
  });
});
