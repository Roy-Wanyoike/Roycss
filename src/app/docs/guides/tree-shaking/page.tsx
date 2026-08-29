import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tree Shaking — RoyCSS Docs",
  description: "Bundle optimization: per-category and per-effect imports, custom bundles, measured gzip savings.",
};

export default function TreeShakingPage() {
  return (
    <>
      <h1>Tree Shaking</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is structured so bundlers can tree-shake down to
        individual effects. This guide shows the three import
        modes, when to use each, and how to verify the savings.
      </p>

      <h2 id="three-modes">Three import modes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* 1. Everything — ~80 KB gzipped */
import "roycss/effects.css";

/* 2. Per category — only the categories you use */
import "roycss/effects/hover.css";
import "roycss/effects/buttons.css";

/* 3. Per effect — individual effects */
import "roycss/effects/hover/lift.css";
import "roycss/effects/buttons/glow-emerald.css";`}</code>
      </pre>

      <h2 id="per-category">Per-category is usually enough</h2>
      <p>
        Most production sites need two or three categories. At ~2 KB
        per category, that’s 6 KB gzipped — a 13× savings over the
        full stylesheet:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/effects/hover.css";   // 2.1 KB gz
import "roycss/effects/buttons.css"; // 2.7 KB gz
import "roycss/effects/cards.css";   // 3.1 KB gz
───────────────────────────────────────────
Total:                                7.9 KB gz`}</code>
      </pre>

      <h2 id="per-effect">Per-effect for marketing pages</h2>
      <p>
        Landing pages and one-off microsites often use exactly one
        or two effects. Per-effect imports drop the payload to
        hundreds of bytes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/effects/hover/lift.css";          // 112 B gz
import "roycss/effects/buttons/glow-emerald.css"; // 89 B gz
import "roycss/effects/shared.css";              // 148 B gz
─────────────────────────────────────────────────────────────
Total:                                            349 B gz`}</code>
      </pre>

      <h2 id="custom-bundle">Custom bundle via CLI</h2>
      <p>
        For static sites without a bundler, the RoyCSS CLI compiles
        a single stylesheet with exactly the effects you specify:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle \\
  --include r-hover-lift \\
  --include r-btn-glow-emerald \\
  --include r-card-base \\
  --out dist/landing.css \\
  --minify

Wrote dist/landing.css  (1.32 KB → 349 B gz)`}</code>
      </pre>
      <p>
        Use this with a CDN or a static file server.
      </p>

      <h2 id="bundler-config">Bundler-specific notes</h2>
      <h3 id="vite">Vite</h3>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// Vite handles CSS imports natively — no config needed
import "roycss/effects/hover.css";`}</code>
      </pre>
      <h3 id="webpack">Webpack</h3>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// webpack 5 — needs css-loader + style-loader/MiniCssExtract
import "roycss/effects/hover.css";`}</code>
      </pre>
      <h3 id="turbopack">Turbopack (Next.js 16)</h3>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`// app/globals.css
@import "roycss/effects/hover.css";
@import "roycss/effects/buttons.css";`}</code>
      </pre>

      <h2 id="verify">Verify with the bundle analyzer</h2>
      <p>
        Always measure. The CLI prints exact sizes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle --analyze \\
  --include r-hover-lift \\
  --include r-btn-glow-emerald

Effect                Raw       Gz
─────────────────────────────────────────
r-hover-lift         412 B     112 B
r-btn-glow-emerald   298 B      89 B
shared vars           612 B     148 B
─────────────────────────────────────────
Total                1.32 KB    349 B`}</code>
      </pre>

      <h2 id="dont-over-optimize">Don’t over-optimize</h2>
      <p>
        Per-effect imports are for marketing pages. For apps, the
        per-category level is the right balance — small enough to
        beat the full stylesheet, big enough that you don’t have
        to micro-manage every new component.
      </p>
    </>
  );
}
