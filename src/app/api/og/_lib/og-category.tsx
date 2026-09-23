import type { ReactElement } from "react";
import { createElement } from "react";
import { categoryMeta, categoryOrder } from "@/lib/roycss-types";
import type { EffectCategory } from "@/lib/roycss-types";
import { effects } from "@/lib/roycss-effects";
import { EFFECT_COUNT } from "@/app/effects/_lib/static-effects";
import { OG_WIDTH, OG_HEIGHT } from "./og-effect";

/**
 * Per-category OG image builder (issue #206 / #199 TODO).
 *
 * Category landing pages (/effects/category/<slug>) used to ship the
 * static brand card because /api/og only modeled per-effect cards
 * (#116). This module mirrors _lib/og-effect.tsx for categories: it
 * turns a category into a 1200×630 ImageResponse element carrying
 *
 *   • the category LABEL (large, content column),
 *   • the per-category effect COUNT + one-line positioning,
 *   • the "RoyCSS" wordmark + logo mark (top-left) and roycss.com
 *     branding (footer),
 *   • the category's short description from categoryMeta.
 *
 * Cost model is the same as the effect builder: no network fetches —
 * the render is pure CPU over the already-bundled catalog (counts are
 * derived once at module load), then cached by the route's
 * Cache-Control for 24 h + SWR. The same Satori constraints apply
 * (display:flex boxes, no oklch — but this card only uses hex/rgba
 * literals from the shared brand palette).
 */

/* ── Brand palette (shared with _lib/og-effect.tsx) ─────────────── */
const BG_GRADIENT = "linear-gradient(135deg, #0F1729 0%, #064e3b 100%)";
const ACCENT = "#00A8FF";
const PURPLE = "#8B5CF6";
const TEXT = "#fafafa";
const MUTED = "#9ca3af";
const FONT = "geist";

/** Re-exported so route.ts reads one module for sizes (OG contract). */
export { OG_WIDTH, OG_HEIGHT };

/** Per-category effect counts, derived once from the bundled catalog. */
const CATEGORY_COUNTS: ReadonlyMap<EffectCategory, number> = (() => {
  const counts = new Map<EffectCategory, number>();
  for (const effect of effects) {
    counts.set(effect.category, (counts.get(effect.category) ?? 0) + 1);
  }
  return counts;
})();

/** Count for a resolved category (every category has ≥1 effect). */
export function categoryEffectCount(category: EffectCategory): number {
  return CATEGORY_COUNTS.get(category) ?? 0;
}

/**
 * The per-category OG card (1200×630). Pure presentational — the route
 * wraps this in ImageResponse; tests walk the returned element tree.
 */
export function CategoryOgImage({
  category,
}: {
  category: EffectCategory;
}): ReactElement {
  const meta = categoryMeta[category];
  const count = categoryEffectCount(category);
  const countLine = `${count.toLocaleString("en-US")} copy-paste effects · pure CSS, zero JavaScript`;
  const catalogLine = `${EFFECT_COUNT.toLocaleString("en-US")} pure-CSS effects — copy-paste ready`;

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 64px",
        backgroundImage: BG_GRADIENT,
        fontFamily: FONT,
        color: TEXT,
      }}
    >
      {/* Wordmark row — same brand header as the effect card */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: "#0F1729",
              border: `2px solid ${PURPLE}`,
              color: ACCENT,
              fontSize: 44,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 36, color: TEXT, letterSpacing: 2 }}>RoyCSS</span>
            <span style={{ fontSize: 20, color: MUTED }}>Pure CSS effects library</span>
          </div>
        </div>
        <span style={{ fontSize: 24, color: MUTED }}>roycss.com</span>
      </div>

      {/* Content column: category identity */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(139, 92, 246, 0.16)",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            color: PURPLE,
            fontSize: 22,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Effect category
        </div>
        <span style={{ fontSize: 64, color: TEXT, lineHeight: 1.1 }}>{meta.label}</span>
        <span style={{ fontSize: 28, color: MUTED, maxWidth: 900 }}>{meta.description}</span>
        <span style={{ fontSize: 24, color: ACCENT }}>{countLine}</span>
      </div>

      {/* Footer row — deep link to the landing page this card previews */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, color: MUTED }}>{catalogLine}</span>
        <span style={{ fontSize: 22, color: ACCENT }}>
          {`roycss.com/effects/category/${category}`}
        </span>
      </div>
    </div>
  );
}

/**
 * Build the ImageResponse element for a category (JSX-free entry point
 * so route.ts — a .ts file — doesn't need JSX). Mirrors buildEffectOgImage.
 */
export function buildCategoryOgImage(category: EffectCategory): ReactElement {
  return createElement(CategoryOgImage, { category });
}

/**
 * Resolve a `?category=` query value against the catalog's category
 * order — the SAME membership check /effects/category/[slug] uses in
 * resolveCategory(), so the OG route and the landing page can never
 * disagree about what a valid slug is.
 */
export function resolveCategoryOg(
  slug: string,
): EffectCategory | undefined {
  return (categoryOrder as string[]).includes(slug)
    ? (slug as EffectCategory)
    : undefined;
}
