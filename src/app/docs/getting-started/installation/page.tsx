import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installation — RoyCSS Docs",
  description: "Install RoyCSS via npm, pnpm, yarn, bun, or CDN. Tree-shakeable imports per category.",
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
      <p>
        The package is <strong>side-effect free</strong> from a
        bundler’s point of view, so any CSS file you do not import
        is dropped from your final bundle.
      </p>

      <h2 id="cdn">CDN</h2>
      <p>
        For prototyping, demos, or sites without a build step, use
        the global stylesheet from the RoyCSS CDN:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<link
  rel="stylesheet"
  href="https://cdn.roycss.org/2.0.0/effects.min.css"
  crossorigin
/>

<!-- Optional: per-category stylesheet (smaller payload) -->
<link
  rel="stylesheet"
  href="https://cdn.roycss.org/2.0.0/effects/hover.min.css"
  crossorigin
/>`}</code>
      </pre>

      <h2 id="import-styles">Importing the styles</h2>
      <p>
        Three import styles are supported. Pick the smallest one
        that covers your needs — see the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/importing">
          Importing
        </a>{" "}
        page for a deep dive.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* 1. Everything (≈80 KB gzipped) */
import "roycss/effects.css";

/* 2. Per category (tree-shaken automatically) */
import "roycss/effects/hover.css";
import "roycss/effects/text.css";

/* 3. Single effect (smallest possible payload) */
import "roycss/effects/hover/lift.css";`}</code>
      </pre>

      <h2 id="verify-install">Verify the install</h2>
      <p>
        After installing, drop a single class on an element to confirm
        everything wired up. You should see a 4px lift with an emerald
        glow on hover — pure CSS, zero JS in your devtools Network tab.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-hover-lift r-btn-glow-emerald">
  RoyCSS is installed ✓
</button>`}</code>
      </pre>

      <h2 id="version-pinning">Version pinning</h2>
      <p>
        Every major release is published on a versioned CDN path. Pin
        to a major to receive patch and minor fixes automatically, or
        pin to an exact version for full reproducibility:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Major pin — auto patch + minor
https://cdn.roycss.org/2/effects.min.css

# Exact pin — fully reproducible
https://cdn.roycss.org/2.0.0/effects.min.css`}</code>
      </pre>

      <h2 id="next">Next steps</h2>
      <p>
        With RoyCSS installed, head to the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/importing">
          Importing
        </a>{" "}
        page to learn the three import modes, or jump straight to the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/first-effect">
          first effect tutorial
        </a>
        .
      </p>
    </>
  );
}
