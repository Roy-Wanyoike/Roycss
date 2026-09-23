import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, FULL_CSS_MIN_GZ_KB, CATEGORY_COUNT } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/getting-started/installation",
  title: "Installation — RoyCSS Docs",
  description: "Install RoyCSS via npm, pnpm, yarn, bun, or CDN. One global stylesheet, a minified variant, per-category splits, a Tailwind v4 entry, and data subpath exports.",
});

export default function InstallationPage() {
  return (
    <>
      <h1>Installation</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS ships as a plain CSS package with optional TypeScript
        type definitions. Pick the package manager you already use —
        the same import paths work everywhere.
      </p>

      <h2 id="package-managers">Package managers</h2>
      <p>
        RoyCSS is published to the npm registry as
        <code>roycss</code>. It works equally well with npm, pnpm,
        yarn, and bun — pick one:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# npm
npm install roycss

# pnpm
pnpm add roycss

# yarn
yarn add roycss

# bun
bun add roycss`}</code>
      </pre>

      <h2 id="cdn">CDN</h2>
      <p>
        For prototyping, demos, or sites without a build step, load
        the minified stylesheet from a public CDN. Pin the integrity
        attribute to the published sha384 hash (shipped as
        <code>dist/roycss.min.css.sri.txt</code> in every release) so
        a tampered CDN response can never execute:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<link
  rel="stylesheet"
  href="https://unpkg.com/roycss@2/dist/roycss.min.css"
  integrity="sha384-…"
  crossorigin="anonymous"
/>`}</code>
      </pre>
      <p>
        The exact hash for each release lives in the repo at
        <code>dist/roycss.min.css.sri.txt</code> and is regenerated on
        every build so it can never drift from the artifact it
        fingerprints. You can also fetch it for the pinned version:
        <code>https://unpkg.com/roycss@2/dist/roycss.min.css.sri.txt</code>.
      </p>

      <h2 id="import-styles">Importing the styles</h2>
      <p>
        The package exposes two stylesheet entry points — the full
        stylesheet and its minified twin. Both contain the exact same{" "}
        {EFFECT_COUNT_FORMATTED} effect classes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* 1. Full stylesheet (readable, with comments) */
import "roycss/css";

/* 2. Minified — same rules, ~${FULL_CSS_MIN_GZ_KB} KB gzipped */
import "roycss/css/min";

/* Or in CSS via @import */
@import "roycss/css/min";`}</code>
      </pre>
      <p>
        Alongside the stylesheets, the package exports machine-readable
        data for tooling: <code>roycss/effects.json</code> (the full
        effect catalog), <code>roycss/class-index</code> (every class
        name), <code>roycss/motion-library</code> (the motion subset),
        <code>roycss/critical.css</code> (a curated critical-effects
        subset), and <code>roycss/fallbacks</code> (an optional
        progressive-enhancement layer for older browsers).
      </p>

      <h2 id="category-splits">Per-category imports</h2>
      <p>
        Shipping only part of the catalog? Every one of the{" "}
        {CATEGORY_COUNT} categories has its own stylesheet (+ a minified
        twin) exposed under <code>roycss/category/&lt;slug&gt;</code>.
        Each split carries the shared base (box-sizing, the sr-only
        helper and the corpus-wide reduced-motion safety net), so a
        single-category install keeps the same a11y guarantees as the
        monolith:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Buttons only */
import "roycss/category/buttons";

/* Glass + navigation, minified */
import "roycss/category/glass-ui/min";
import "roycss/category/navigation/min";`}</code>
      </pre>

      <h2 id="tailwind">Tailwind v4</h2>
      <p>
        Using Tailwind v4? <code>roycss/tailwind</code> is a single
        import that layers the full effect catalog into your Tailwind
        build — details on the{" "}
        <a className="text-primary hover:underline" href="/docs/getting-started/frameworks#tailwind">
          frameworks page
        </a>
        .
      </p>

      <h2 id="verify-install">Verify the install</h2>
      <p>
        After installing, drop a single class on an element to confirm
        everything wired up. You should see an emerald button with a
        glow halo on hover — pure CSS, zero JS in your devtools
        Network tab:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="roycss-btn-glow">
  RoyCSS is installed ✓
</button>`}</code>
      </pre>

      <h2 id="version-pinning">Version pinning</h2>
      <p>
        Pin to a major on the CDN to receive patch and minor fixes
        automatically, or pin to an exact version for full
        reproducibility:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Major pin — auto patch + minor
https://unpkg.com/roycss@2/dist/roycss.min.css

# Exact pin — fully reproducible
https://unpkg.com/roycss@2.0.0/dist/roycss.min.css`}</code>
      </pre>

      <h2 id="next">Next steps</h2>
      <p>
        With RoyCSS installed, head to the{" "}
        <a className="text-primary hover:underline" href="/docs/getting-started/importing">
          Importing
        </a>{" "}
        page to see everything the package exports, or jump straight to the{" "}
        <a className="text-primary hover:underline" href="/docs/getting-started/first-effect">
          first effect tutorial
        </a>
        .
      </p>
    </>
  );
}
