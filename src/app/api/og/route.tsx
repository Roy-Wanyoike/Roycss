import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "RoyCSS — 1569+ Beautiful CSS Effects Library";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/**
 * Visual constants — kept in sync with the brand palette in
 * src/app/globals.css. Hex + rgba are used (instead of oklch) because the
 * Satori engine that powers next/og has narrower CSS support than browsers.
 * The accent intentionally matches the emerald-500 / OKLCH brand color.
 */
const BG_DARK = "#0b1018"; // ~oklch(0.15 0.02 250)
const ACCENT = "#10b981"; // emerald-500 — ~oklch(0.7 0.18 165)
const ACCENT_BRIGHT = "#34d399"; // emerald-400 — ~oklch(0.85 0.18 165)
const FG_BRIGHT = "#f5f7fa"; // ~oklch(0.98 0.005 250)
const FG_MUTED = "#94a3b8"; // ~oklch(0.72 0.02 250)

// rgba helpers — Satori parses these reliably.
const rgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Dynamic Open Graph image for RoyCSS.
 *
 * Route: GET /api/og
 * Returns a 1200x630 PNG with:
 *   - Dark OKLCH-equivalent background
 *   - "RoyCSS" display headline
 *   - "1569+ Beautiful CSS Effects Library" subtitle
 *   - Emerald accent line
 *   - "Zero JavaScript • OKLCH • WCAG 2.1 AA" footer
 *
 * This is referenced from src/app/layout.tsx via metadata.openGraph.images
 * and metadata.twitter.images so social previews render on Twitter/X,
 * LinkedIn, Slack, Discord, Facebook, iMessage, etc.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: BG_DARK,
          backgroundImage: `radial-gradient(circle at 80% 20%, ${rgba(
            ACCENT,
            0.22
          )} 0%, transparent 45%), radial-gradient(circle at 10% 90%, ${rgba(
            ACCENT,
            0.14
          )} 0%, transparent 50%)`,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: FG_BRIGHT,
          position: "relative",
        }}
      >
        {/* Top row: brand mark + version pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Monogram badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_BRIGHT} 100%)`,
                color: BG_DARK,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -1.5,
              }}
            >
              R
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: FG_MUTED,
                letterSpacing: 0.5,
              }}
            >
              RoyCSS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 999,
              border: `1px solid ${rgba(ACCENT, 0.55)}`,
              backgroundColor: rgba(ACCENT, 0.12),
              fontSize: 18,
              fontWeight: 600,
              color: ACCENT_BRIGHT,
            }}
          >
            v1.0
          </div>
        </div>

        {/* Middle: headline + subtitle + accent line */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 24,
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -5,
              color: FG_BRIGHT,
            }}
          >
            RoyCSS
          </div>
          {/* Emerald accent line */}
          <div
            style={{
              display: "flex",
              width: 96,
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_BRIGHT} 100%)`,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 500,
              color: FG_BRIGHT,
              letterSpacing: -0.5,
              lineHeight: 1.15,
            }}
          >
            1569+ Beautiful CSS Effects Library
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 400,
              color: FG_MUTED,
              letterSpacing: 0.1,
            }}
          >
            Live demos · copy-paste code · React, Vue, Angular, Svelte, vanilla
            HTML
          </div>
        </div>

        {/* Footer: feature tags + author */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: `1px solid ${rgba(ACCENT, 0.33)}`,
            paddingTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 20,
              fontWeight: 600,
              color: ACCENT_BRIGHT,
            }}
          >
            <span>Zero JavaScript</span>
            <span style={{ color: rgba(ACCENT, 0.5) }}>•</span>
            <span>OKLCH</span>
            <span style={{ color: rgba(ACCENT, 0.5) }}>•</span>
            <span>WCAG 2.1 AA</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 500,
              color: FG_MUTED,
            }}
          >
            by Roy Wanyoike
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
