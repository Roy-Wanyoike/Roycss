import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importing — RoyCSS Docs",
  description: "Three ways to import RoyCSS: global stylesheet, per-category tree-shaken imports, and single-effect imports.",
};

export default function ImportingPage() {
  return (
    <>
      <h1>Importing</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS supports three import modes. All three resolve to the
        same CSS at runtime — they differ only in how much of the
        library ends up in your final bundle.
      </p>

      <h2 id="global-stylesheet">1. Global stylesheet</h2>
      <p>
        The simplest option. Imports every one of the 1,869 effects
        in a single file. Best for prototyping or for sites where
        bundle size is not a concern.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* app/globals.css (or wherever your global stylesheet lives) */
@import "roycss/effects.css";`}</code>
      </pre>
      <p>
        Or, in a JS/TS entry point:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/effects.css";`}</code>
      </pre>

      <h2 id="per-category">2. Per-category (tree-shaken)</h2>
      <p>
        The recommended mode for production. Each RoyCSS category lives
        in its own file under <code>roycss/effects/&lt;category&gt;.css</code>.
        Modern bundlers (Vite, webpack, esbuild, Turbopack) skip
        files you never import — your users only download what you
        actually use.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Only the categories you actually use */
import "roycss/effects/hover.css";
import "roycss/effects/text.css";
import "roycss/effects/buttons.css";
import "roycss/effects/cards.css";`}</code>
      </pre>
      <p>
        Typical category sizes (gzipped):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`hover.css       2.1 KB
text.css       3.4 KB
backgrounds.css 4.8 KB
loaders.css    1.9 KB
buttons.css    2.7 KB
cards.css      3.1 KB
borders.css    1.6 KB`}</code>
      </pre>

      <h2 id="single-effect">3. Single effect</h2>
      <p>
        For surgical control — e.g. you want exactly one hover
        effect on a marketing page — import an individual effect
        file. Each effect is its own file under
        <code>roycss/effects/&lt;category&gt;/&lt;name&gt;.css</code>.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/effects/hover/lift.css";
import "roycss/effects/buttons/glow-emerald.css";`}</code>
      </pre>
      <p>
        Most effect files are under 400 bytes gzipped, so you can
        safely pull in exactly the effects you reference.
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

      <h2 id="oklch-variables">Theming is just CSS variables</h2>
      <p>
        Every color in RoyCSS is an OKLCH custom property. Override
        them on <code>:root</code> to retheme the entire library
        without touching a single effect file:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  --r-accent: oklch(72% 0.18 165);     /* emerald default */
  --r-accent-strong: oklch(58% 0.20 165);
  --r-bg: oklch(15% 0.02 200);
  --r-fg: oklch(96% 0.01 200);
}`}</code>
      </pre>

      <h2 id="next">Next steps</h2>
      <p>
        Now that your styles are imported, the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/first-effect">
          first effect tutorial
        </a>{" "}
        walks you through wiring up a hover + button effect end-to-end.
      </p>
    </>
  );
}
