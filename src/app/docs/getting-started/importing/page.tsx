import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED, FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Importing — RoyCSS Docs",
  description: "What the roycss package exports: the global stylesheet, the minified variant, data files, and how to ship only the effects you use.",
};

export default function ImportingPage() {
  return (
    <>
      <h1>Importing</h1>
      <p className="text-lg text-muted-foreground">
        The <code>roycss</code> package exports one global stylesheet
        (plus a minified twin and a set of data files). This page maps
        every export, and shows how to ship a subset when you only
        need a handful of the {EFFECT_COUNT_FORMATTED} effects.
      </p>

      <h2 id="global-stylesheet">1. Global stylesheet</h2>
      <p>
        The simplest option — imports every one of the{" "}
        {EFFECT_COUNT_FORMATTED} effects in one file (~{FULL_CSS_MIN_GZ_KB} KB
        gzipped minified). Best for prototyping or for sites where
        bundle size is not a concern:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* app/globals.css (or wherever your global stylesheet lives) */
@import "roycss/css/min";`}</code>
      </pre>
      <p>
        Or, in a JS/TS entry point:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/css";        /* readable build */
import "roycss/css/min";    /* minified — same rules */`}</code>
      </pre>

      <h2 id="exports-map">2. The full export map</h2>
      <p>
        Everything the package exposes, straight from{" "}
        <code>package.json</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  ".":                "dist/effects.js",       /* typed catalog (JS)  */
  "./css":            "dist/roycss.css",       /* full stylesheet     */
  "./css/min":        "dist/roycss.min.css",   /* minified stylesheet */
  "./effects.json":   "dist/effects.json",      /* catalog data        */
  "./class-index":     "dist/class-index.json",  /* every class name    */
  "./motion-library":  "dist/motion-library.json",
  "./critical.css":    "dist/roycss-critical.css",
  "./fallbacks":       "dist/roycss-fallbacks.css"
}`}</code>
      </pre>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong><code>roycss/critical.css</code></strong> — a curated
          subset of core effects (~3.6 KB gzipped) for above-the-fold
          styles.
        </li>
        <li>
          <strong><code>roycss/fallbacks</code></strong> — an optional
          progressive-enhancement layer; include it <em>after</em> the
          main stylesheet in browsers that need broader support.
        </li>
        <li>
          <strong><code>roycss/effects.json</code></strong> — the same
          catalog data the CLI and MCP server read: id, name,
          category, tags, and the CSS for every effect.
        </li>
      </ul>

      <h2 id="subset">3. Shipping a subset</h2>
      <p>
        There is no per-category or per-effect import — the package is
        one stylesheet on purpose (single source of truth, no drift
        between files). When you only need a few effects, export them
        with the CLI into your own stylesheet:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Exact effects → one file
npx roycss export btn-glow hover-push-up text-gradient --out src/styles/roycss.css

# Or a whole category
npx roycss export --category buttons --out src/styles/roycss.css`}</code>
      </pre>
      <p>
        You can also copy a single effect&apos;s CSS straight from its
        page in the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/effects">
          effect catalog
        </a>{" "}
        (every effect page has a copy button), or with{" "}
        <code>npx roycss add &lt;effect-id&gt; --copy</code>. Each
        effect averages under 1 KB, so a hand-picked landing-page
        bundle is typically 2–5 KB.
      </p>

      <h2 id="css-import-vs-js-import">
        <code>@import</code> vs JS <code>import</code>
      </h2>
      <p>
        Both work. The difference is the build pipeline:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>CSS <code>@import</code></strong> is processed by
          your CSS tooling (postcss, lightningcss). Best when you
          already have a CSS pipeline.
        </li>
        <li>
          <strong>JS <code>import</code></strong> is processed by your
          bundler. Best when you’re in a JS/TS file or your framework
          auto-injects stylesheets (e.g. Next.js, Vite).
        </li>
      </ul>

      <h2 id="customizing">Customizing an effect</h2>
      <p>
        The shipped effects hardcode their OKLCH colors — that is what
        keeps each class self-contained and drop-in. To retheme,
        copy the effect&apos;s CSS and edit it (every effect page shows
        the full CSS), or set the per-effect custom properties where
        an effect defines them. For example,{" "}
        <code>.roycss-card-gradient-border</code> animates a registered{" "}
        <code>--roy-gb-angle</code> property you can control:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* The effect ships with the angle keyframed 0deg → 360deg.
   Override the @property initial value to start elsewhere. */
@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 90deg;   /* was 0deg */
  inherits: false;
}`}</code>
      </pre>

      <h2 id="next">Next steps</h2>
      <p>
        Now that your styles are imported, the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/first-effect">
          first effect tutorial
        </a>{" "}
        walks you through wiring up a button + hover effect end-to-end.
      </p>
    </>
  );
}
