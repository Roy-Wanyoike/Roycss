import type { CSSProperties, ReactElement } from "react";
import { createElement } from "react";
import { categoryMeta } from "@/lib/roycss-types";
import type { CSSEffect } from "@/lib/roycss-types";
import { getEffect, EFFECT_COUNT } from "@/app/effects/_lib/static-effects";

/**
 * Per-effect OG image builder (issue #116 / UIX-F19).
 *
 * One static og.png used to serve every page — effect pages got a
 * generic social card. This module turns an effect into a 1200×630
 * ImageResponse element (next/og / Satori) carrying:
 *
 *   • the effect NAME (large, in the content column),
 *   • a CATEGORY badge (pill with the category label),
 *   • the "RoyCSS" wordmark + logo mark (top-left) and roycss.com
 *     branding (footer),
 *   • a demo element styled by a SAFE SUBSET of the effect's OWN CSS
 *     (see effectDemoStyle) — the cheap win that makes each card feel
 *     like the effect itself.
 *
 * Cost model: no network fetches at all. next/og embeds the Geist
 * Regular font (the site's UI font) as its default, and every color the
 * catalog uses is bundled in src/lib/effects-batch-*.ts — the render is
 * pure CPU over already-in-memory data, then cached by the route's
 * Cache-Control for 24 h + SWR.
 *
 * Satori constraints this module respects (they differ subtly from a
 * browser): every multi-child box must be `display: flex`; only a
 * subset of CSS is supported (no animations/pseudo-elements/filters);
 * modern CSS color functions (oklch, color-mix) are NOT understood by
 * Satori's parser — see rewriteOklchColors, which converts the
 * catalog's oklch() colors to sRGB hex before they reach Satori.
 */

/** OG card size — the canonical Open Graph image dimensions. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/* ── Brand palette (mirrors scripts/generate-og-image.ts / og.png) ── */
const BG_GRADIENT = "linear-gradient(135deg, #0F1729 0%, #064e3b 100%)";
const ACCENT = "#00A8FF";
const PURPLE = "#8B5CF6";
const TEXT = "#fafafa";
const MUTED = "#9ca3af";

/** Font family — the one bundled default of next/og (Geist, 400). */
const FONT = "geist";

/* ═══════════════════════════════════════════════════════════════
   oklch → sRGB conversion
   ═══════════════════════════════════════════════════════════════ */

/**
 * Oklch → sRGB (Björn Ottosson's Oklab matrices). Exported for tests.
 *
 * Matches the conversion the browser does when rendering the site's
 * OKLCH design tokens, e.g. oklch(0.696 0.149 162.48) ≈ #10b981
 * (Tailwind emerald-500, the repo's primary).
 */
export function oklchToRgb(
  l: number,
  c: number,
  h: number,
  alpha = 1
): { r: number; g: number; b: number; a: number } {
  const rad = (h * Math.PI) / 180;
  const aLab = c * Math.cos(rad);
  const bLab = c * Math.sin(rad);

  const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
  const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
  const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;

  const lCubed = l_ ** 3;
  const mCubed = m_ ** 3;
  const sCubed = s_ ** 3;

  const gamma = (v: number): number =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

  return {
    r: Math.round(clamp01(gamma(4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed)) * 255),
    g: Math.round(clamp01(gamma(-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed)) * 255),
    b: Math.round(clamp01(gamma(-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed)) * 255),
    a: alpha,
  };
}

function toColorString({ r, g, b, a }: { r: number; g: number; b: number; a: number }): string {
  return a >= 1
    ? `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
    : `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Parse one `oklch(L C H [/ A])` argument string. Returns null on failure. */
function parseOklchArgs(args: string): { l: number; c: number; h: number; a: number } | null {
  const parts = args.trim().split(/[\s/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const number = (token: string): number | null => {
    if (token === "none") return 0;
    const pct = token.endsWith("%");
    const value = Number(pct ? token.slice(0, -1) : token);
    if (Number.isNaN(value)) return null;
    return pct ? value / 100 : value;
  };
  const l = number(parts[0]);
  const c = number(parts[1]);
  const h = number(parts[2]);
  const alpha = parts.length === 4 ? number(parts[3]) : 1;
  if (l === null || c === null || h === null || alpha === null) return null;
  return { l, c, h, a: alpha };
}

/**
 * Rewrite every oklch() in a CSS value to sRGB hex/rgba so Satori can
 * parse it. Returns null when a color can't be converted (caller drops
 * the whole declaration — a neutral demo chip beats a 500 on the OG
 * route).
 */
function rewriteOklchColors(value: string): string | null {
  if (!value.includes("oklch(")) return value;
  let failed = false;
  const rewritten = value.replace(/oklch\(([^)]*)\)/g, (match, args: string) => {
    const parsed = parseOklchArgs(args);
    if (!parsed) {
      failed = true;
      return match;
    }
    return toColorString(oklchToRgb(parsed.l, parsed.c, parsed.h, parsed.a));
  });
  return failed ? null : rewritten;
}

/* ═══════════════════════════════════════════════════════════════
   Effect CSS → Satori-safe demo style
   ═══════════════════════════════════════════════════════════════ */

/**
 * CSS properties Satori renders well AND that can carry an effect's
 * static visual essence (its animation/pseudo-element machinery can't
 * run in a static image by definition).
 */
const SAFE_PROPS: ReadonlySet<string> = new Set([
  "background-color",
  "color",
  "border",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "padding",
  "font-size",
  "letter-spacing",
  "text-transform",
  "text-align",
  "opacity",
  "text-shadow",
]);

/** Value fragments Satori cannot parse or that imply motion/lookup. */
const UNSAFE_VALUE =
  /var\(|calc\(|clamp\(|min\(|max\(|env\(|attr\(|url\(|color-mix\(|inset|!important/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract the first `.roycss-<id> { … }` rule from an effect's cssCode
 * and translate its Satori-safe declarations into a React style object.
 *
 * This is deliberately BEST-EFFORT: animated effects (e.g. pulse-glow,
 * whose base rule is a lone `animation:` declaration) yield {} and the
 * demo element falls back to a neutral chip — correct over clever. Only
 * literal values survive (no var()/calc()/color-mix() lookups), and
 * oklch() colors are converted to sRGB because Satori doesn't
 * understand them.
 */
export function effectDemoStyle(cssCode: string, id: string): CSSProperties {
  const match = new RegExp(`\\.roycss-${escapeRegExp(id)}\\s*\\{([^}]*)\\}`).exec(cssCode);
  if (!match) return {};

  const style: Record<string, string> = {};
  for (const declaration of match[1].split(";")) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const prop = declaration.slice(0, colon).trim().toLowerCase();
    let value = declaration.slice(colon + 1).trim();
    if (!prop || !value) continue;
    if (UNSAFE_VALUE.test(value)) continue;

    const converted = rewriteOklchColors(value);
    if (converted === null) continue;
    value = converted;

    // `background` is ambiguous for Satori — route gradients to
    // backgroundImage and plain colors to backgroundColor.
    if (prop === "background") {
      if (/^(linear|radial|conic)-gradient\(/.test(value)) style.backgroundImage = value;
      else style.backgroundColor = value;
      continue;
    }
    if (prop === "background-color") {
      style.backgroundColor = value;
      continue;
    }
    // `color: transparent` is the text-gradient trick — without
    // background-clip:text it would render invisible demo text.
    if (prop === "color") {
      if (value !== "transparent") style.color = value;
      continue;
    }

    if (SAFE_PROPS.has(prop)) {
      style[prop.replace(/-([a-z])/g, (_m, ch: string) => ch.toUpperCase())] = value;
    }
  }
  return style as CSSProperties;
}

/* ═══════════════════════════════════════════════════════════════
   The OG card element
   ═══════════════════════════════════════════════════════════════ */

/** Hairline color for the card's boxes. */
const HAIRLINE = "rgba(148, 163, 184, 0.25)";

/**
 * The per-effect OG card (1200×630). Pure presentational — the route
 * wraps this in ImageResponse; tests walk the returned element tree.
 */
export function EffectOgImage({ effect }: { effect: CSSEffect }): ReactElement {
  const category = categoryMeta[effect.category];
  const demoText = effect.previewText ?? "RoyCSS";
  const nameSize = effect.name.length > 26 ? 48 : 64;
  const catalogLine = `${EFFECT_COUNT.toLocaleString("en-US")} pure-CSS effects — copy-paste ready`;

  const demoStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT,
    fontSize: 34,
    color: TEXT,
    padding: "18px 30px",
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    ...effectDemoStyle(effect.cssCode, effect.id),
  };

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
      {/* Wordmark row */}
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

      {/* Content row: demo stage + effect identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        <div
          style={{
            width: 480,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24,
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={demoStyle}>{demoText}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(0, 168, 255, 0.14)",
              border: "1px solid rgba(0, 168, 255, 0.45)",
              color: ACCENT,
              fontSize: 22,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {category.label}
          </div>
          <span style={{ fontSize: nameSize, color: TEXT, lineHeight: 1.1 }}>{effect.name}</span>
          <span style={{ fontSize: 24, color: MUTED }}>Pure CSS · zero JavaScript</span>
        </div>
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, color: MUTED }}>{catalogLine}</span>
        <span style={{ fontSize: 22, color: ACCENT }}>{`roycss.com/effects/${effect.id}`}</span>
      </div>
    </div>
  );
}

/**
 * Build the ImageResponse element for an effect (JSX-free entry point
 * so route.ts — a .ts file — doesn't need JSX).
 */
export function buildEffectOgImage(effect: CSSEffect): ReactElement {
  return createElement(EffectOgImage, { effect });
}

/**
 * Resolve an `?effect=` query value against the bundled catalog (same
 * lookup the /effects/[id] page uses — one Map, no fs at request time).
 */
export function resolveEffectOg(effectId: string): CSSEffect | undefined {
  return getEffect(effectId);
}
