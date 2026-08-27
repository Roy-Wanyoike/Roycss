import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview — RoyCSS Docs",
  description: "What is RoyCSS and how to get started — 1,869 production-ready CSS effects with zero JS runtime and OKLCH colors.",
};

export default function OverviewPage() {
  return (
    <>
      <h1>Overview</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is a CSS-first effects library: 1,869 production-ready
        effects, <strong>zero JavaScript runtime</strong>, perceptual
        OKLCH colors, and full keyboard/reduced-motion support baked in.
      </p>

      <h2 id="what-is-roycss">What is RoyCSS?</h2>
      <p>
        RoyCSS is a utility-style library of effect classes — hover,
        text, background, loader, button, card, and border effects —
        shipped as plain CSS files. You add a class to an element, you
        get the effect. There is no JavaScript bundle, no runtime
        observer, no React/Vue/Svelte dependency. The whole library
        weighs under 80 KB gzipped if you import everything, and far
        less if you only import the categories you need.
      </p>
      <p>
        Effects are authored in OKLCH — the perceptual color space —
        so lightness ramps actually <em>look</em> linear, and color
        schemes are accessible by construction. The library uses CSS
        custom properties for every themeable value, so you can
        override a single variable to repaint an entire category.
      </p>

      <h2 id="quick-start">Quick start</h2>
      <p>
        The fastest way to try RoyCSS is the global stylesheet from a
        CDN. Drop this in your <code>&lt;head&gt;</code> and you have
        access to every effect class:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<link
  rel="stylesheet"
  href="https://cdn.roycss.org/2.0.0/effects.min.css"
  crossorigin
/>`}</code>
      </pre>
      <p>Then add a class to any element:</p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-hover-lift r-btn-glow-emerald">Save</button>`}</code>
      </pre>
      <p>
        That single button now lifts on hover (GPU-accelerated
        transform, no layout cost) and glows with an emerald halo
        that respects your color-scheme.
      </p>

      <h2 id="install-via-package-manager">Install via package manager</h2>
      <p>
        For production builds you almost certainly want the npm
        package so your bundler can tree-shake unused categories:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npm install roycss
# or
pnpm add roycss
# or
bun add roycss`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Import only what you need — tree-shaken at build time */
import "roycss/effects/hover.css";
import "roycss/effects/buttons.css";`}</code>
      </pre>

      <h2 id="philosophy">Philosophy</h2>
      <p>
        Three rules guide every effect in the library:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>CSS first.</strong> If an effect can be expressed
          in pure CSS (transitions, transforms, keyframes,
          <code>@property</code>, scroll-driven animations), it is.
        </li>
        <li>
          <strong>Zero JS.</strong> No observer, no IntersectionObserver,
          no rAF loop. Ship the CSS and you are done.
        </li>
        <li>
          <strong>Accessible by default.</strong> Every effect respects
          <code>prefers-reduced-motion</code> and never relies on color
          alone to communicate state.
        </li>
      </ul>

      <h2 id="where-next">Where to go next</h2>
      <p>
        The Getting Started category walks you from installation to
        framework integration in order. If you prefer to skim, here
        are the canonical first stops:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><Link className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/installation">Installation</Link> — npm/pnpm/yarn/bun/CDN</li>
        <li><Link className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/first-effect">Your first effect</Link> — end-to-end tutorial</li>
        <li><Link className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/concepts/css-first">CSS-first architecture</Link> — why no JS</li>
        <li><Link className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects">Effects API</Link> — class reference</li>
      </ul>
    </>
  );
}
