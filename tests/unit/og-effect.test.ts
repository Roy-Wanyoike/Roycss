import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OG_WIDTH,
  OG_HEIGHT,
  EffectOgImage,
  buildEffectOgImage,
  effectDemoStyle,
  oklchToRgb,
  resolveEffectOg,
} from "@/app/api/og/_lib/og-effect";
import {
  CategoryOgImage,
  buildCategoryOgImage,
  resolveCategoryOg,
  categoryEffectCount,
} from "@/app/api/og/_lib/og-category";
import { getEffect } from "@/app/effects/_lib/static-effects";

const ROOT = join(__dirname, "..", "..");
const ROUTE_SRC = join(ROOT, "src/app/api/og/route.ts");
const PAGE_SRC = join(ROOT, "src/app/effects/[id]/page.tsx");

/**
 * Per-effect OG images (issue #116 / UIX-F19).
 *
 * One static og.png used to serve every page. Now /api/og?effect=<id>
 * renders a 1200×630 ImageResponse card (effect name + category badge
 * + RoyCSS wordmark + a demo element styled by a safe subset of the
 * effect's OWN CSS), while the no-param branch keeps serving the
 * static brand card for every other page.
 */
describe("oklch → sRGB conversion (Satori cannot parse oklch)", () => {
  it("converts the repo's primary token to emerald-500 (±2 per channel)", () => {
    // oklch(0.696 0.149 162.48) is Tailwind emerald-500 = #10b981.
    const { r, g, b, a } = oklchToRgb(0.696, 0.149, 162.48);
    expect(Math.abs(r - 16)).toBeLessThanOrEqual(2);
    expect(Math.abs(g - 185)).toBeLessThanOrEqual(2);
    expect(Math.abs(b - 129)).toBeLessThanOrEqual(2);
    expect(a).toBe(1);
  });

  it("keeps alpha (oklch L C H / A)", () => {
    const { a } = oklchToRgb(0.5, 0.1, 200, 0.4);
    expect(a).toBeCloseTo(0.4);
  });
});

describe("effectDemoStyle — effect's own CSS, Satori-safe", () => {
  it("btn-neon: literal oklch declarations survive as converted sRGB", () => {
    const effect = getEffect("btn-neon");
    expect(effect).toBeDefined();
    const style = effectDemoStyle(effect!.cssCode, "btn-neon");
    expect(style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(style.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(style.border).toContain("2px solid #");
    expect(style.borderRadius).toBe("8px");
    expect(style.textTransform).toBe("uppercase");
    expect(style.letterSpacing).toBe("2px");
  });

  it("text-gradient: gradient background converted, transparent text-color dropped", () => {
    const effect = getEffect("text-gradient");
    expect(effect).toBeDefined();
    const style = effectDemoStyle(effect!.cssCode, "text-gradient");
    expect(style.backgroundImage).toMatch(/^linear-gradient\(135deg, #/);
    // `color: transparent` without background-clip:text would render
    // invisible demo text — the extractor must drop it.
    expect(style.color).toBeUndefined();
  });

  it("card-glassmorphism: color-mix() values are skipped, safe ones kept", () => {
    const effect = getEffect("card-glassmorphism");
    expect(effect).toBeDefined();
    const style = effectDemoStyle(effect!.cssCode, "card-glassmorphism");
    expect(style.borderRadius).toBe("16px");
    expect(style.padding).toBe("24px");
    expect(style.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(style.backgroundColor).toBeUndefined();
  });

  it("pulse-glow: animation-only base rule degrades to the neutral chip", () => {
    const effect = getEffect("pulse-glow");
    expect(effect).toBeDefined();
    expect(effectDemoStyle(effect!.cssCode, "pulse-glow")).toEqual({});
  });

  it("var()/calc()/inset lookups never pass through", () => {
    const css = [
      ".roycss-x {",
      "  color: var(--roy-x);",
      "  padding: calc(1px + 2px);",
      "  box-shadow: inset 0 0 5px #fff;",
      "  border-radius: 4px;",
      "}",
    ].join("\n");
    const style = effectDemoStyle(css, "x");
    expect(style).toEqual({ borderRadius: "4px" });
  });
});

describe("EffectOgImage — the 1200×630 card", () => {
  it("carries the effect name, category badge, RoyCSS wordmark and effect URL", () => {
    const effect = resolveEffectOg("pulse-glow");
    expect(effect).toBeDefined();
    const serialized = JSON.stringify(EffectOgImage({ effect: effect! }));
    expect(serialized).toContain("Pulse Glow");
    expect(serialized).toContain("RoyCSS");
    expect(serialized).toContain("Animations"); // category badge label
    expect(serialized).toContain("roycss.com/effects/pulse-glow");
    expect(serialized).toContain("roycss.com");
  });

  it("render sizes are the canonical OG dimensions", () => {
    expect(OG_WIDTH).toBe(1200);
    expect(OG_HEIGHT).toBe(630);
  });

  it("buildEffectOgImage wraps the card for the route (JSX-free entry)", () => {
    const effect = resolveEffectOg("btn-neon");
    expect(effect).toBeDefined();
    const element = buildEffectOgImage(effect!);
    expect(element.type).toBe(EffectOgImage);
    expect((element.props as { effect: unknown }).effect).toBe(effect);
  });
});

describe("resolveEffectOg — catalog lookup contract", () => {
  it("resolves bundled effects (no fs — same Map the page uses)", () => {
    const effect = resolveEffectOg("btn-neon");
    expect(effect?.id).toBe("btn-neon");
    expect(effect?.name).toBe("Neon Button");
  });

  it("returns undefined for unknown ids", () => {
    expect(resolveEffectOg("definitely-not-an-effect")).toBeUndefined();
    expect(resolveEffectOg("")).toBeUndefined();
  });
});

describe("route wiring — /api/og", () => {
  const route = readFileSync(ROUTE_SRC, "utf8");

  it("renders per-effect cards with ImageResponse (next/og)", () => {
    expect(route).toContain('from "next/og"');
    expect(route).toContain("buildEffectOgImage");
    expect(route).toContain("resolveEffectOg");
  });

  it("keeps the no-param default: the static public/og.png brand card", () => {
    expect(route).toContain('"public", "og.png"');
    expect(route).toContain('searchParams.get("effect")');
  });

  it("404s unknown effect ids instead of rendering a generic card", () => {
    expect(route).toContain('"Unknown effect id"');
    expect(route).toContain("status: 404");
  });

  it("keeps the pre-existing cache policy on every branch", () => {
    expect(route).toContain(
      '"Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"',
    );
  });

  it("never 500s a crawler — Satori failures fall back to the brand card", () => {
    expect(route.match(/getOgPng\(\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

describe("category OG branch — /api/og?category= (#206)", () => {
  const route = readFileSync(ROUTE_SRC, "utf8");

  it("resolves catalog slugs (same membership check as the landing page)", () => {
    expect(resolveCategoryOg("glass-ui")).toBe("glass-ui");
    expect(resolveCategoryOg("animations")).toBe("animations");
    expect(resolveCategoryOg("not-a-category")).toBeUndefined();
    expect(resolveCategoryOg("")).toBeUndefined();
  });

  it("counts are derived from the bundled catalog (no drift)", () => {
    expect(categoryEffectCount("animations")).toBeGreaterThan(0);
  });

  it("carries the label, wordmark and category landing URL", () => {
    const category = resolveCategoryOg("glass-ui");
    expect(category).toBeDefined();
    const serialized = JSON.stringify(CategoryOgImage({ category: category! }));
    expect(serialized).toContain("RoyCSS");
    expect(serialized).toContain("roycss.com/effects/category/glass-ui");
    expect(serialized).toContain("copy-paste effects");
    expect(serialized).not.toContain("undefined");
  });

  it("buildCategoryOgImage wraps the card for the route (JSX-free entry)", () => {
    const category = resolveCategoryOg("hover");
    expect(category).toBeDefined();
    const element = buildCategoryOgImage(category!);
    expect(element.type).toBe(CategoryOgImage);
    expect((element.props as { category: unknown }).category).toBe(category);
  });

  it("route wires the category param with a 404 contract like the effect branch", () => {
    expect(route).toContain('searchParams.get("category")');
    expect(route).toContain("buildCategoryOgImage");
    expect(route).toContain('"Unknown category slug"');
  });
});

describe("brand card dims — declared og:image size is the served PNG (#206)", () => {
  it("public/og.png is exactly the declared 1200×630", () => {
    // PNG IHDR: bytes 16-24 are big-endian width/height.
    const png = readFileSync(join(ROOT, "public", "og.png"));
    expect(png.readUInt32BE(16)).toBe(OG_WIDTH);
    expect(png.readUInt32BE(20)).toBe(OG_HEIGHT);
  });

  it("layout.tsx declares the same dims for the /api/og image", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toMatch(/url: "\/api\/og"[\s\S]{0,200}?width: 1200,\s*height: 630/);
  });
});

describe("page wiring — effects/[id] generateMetadata", () => {
  const page = readFileSync(PAGE_SRC, "utf8");

  it("openGraph + twitter images point at the per-effect OG URL (absolute, SITE_URL)", () => {
    expect(page).toContain("${SITE_URL}/api/og?effect=${effect.id}");
    // Both consumers switched off the generic card.
    expect(page).not.toContain("`${SITE_URL}/api/og`");
  });
});
