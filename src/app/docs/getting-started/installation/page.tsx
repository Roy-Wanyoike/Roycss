import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED, FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Installation — RoyCSS Docs",
  description: "Install RoyCSS via npm, pnpm, yarn, bun, or CDN. One global stylesheet, a minified variant, and data subpath exports.",
};

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
        the minified stylesheet from a public CDN:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<link
  rel="stylesheet"
  href="https://unpkg.com/roycss@2/dist/roycss.min.css"
  crossorigin
/>`}</code>
      </pre>

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
