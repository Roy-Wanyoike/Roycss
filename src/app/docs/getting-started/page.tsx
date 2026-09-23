import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT, FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";
import Link from "next/link";

export const metadata: Metadata = pageMeta({
  path: "/docs/getting-started",
  title: "Overview — RoyCSS Docs",
  description: `What is RoyCSS and how to get started — ${EFFECT_COUNT_FORMATTED} production-ready CSS effects with zero JS runtime and OKLCH colors.`,
});

export default function OverviewPage() {
  return (
    <>
      <h1>Overview</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is a CSS-first effects library: {EFFECT_COUNT_FORMATTED} production-ready
        effects, <strong>zero JavaScript runtime</strong>, perceptual
        OKLCH colors, and full keyboard/reduced-motion support baked in.
      </p>

      <h2 id="what-is-roycss">What is RoyCSS?</h2>
      <p>
        RoyCSS is a library of self-contained effect classes —
        hover, text, background, loader, button, card, and border
        effects — shipped as one plain stylesheet. You add a class
        to an element, you get the effect. There is no JavaScript
        bundle, no runtime observer, no React/Vue/Svelte
        dependency. The full stylesheet is ~{FULL_CSS_MIN_GZ_KB} KB
        gzipped minified, ~3.6 KB if you only need the curated
        critical subset, and far less when you export a hand-picked
        few with the CLI.
      </p>
      <p>
        Effects are authored in OKLCH — the perceptual color
        space — so lightness ramps actually <em>look</em> linear,
        and color schemes are accessible by construction. Each
        effect&apos;s CSS is self-contained and visible on its
        catalog page, so customization is always a copy-and-edit
        away.
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
  href="https://unpkg.com/roycss@2/dist/roycss.min.css"
  crossorigin
/>`}</code>
      </pre>
      <p>Then add a class to any element:</p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="roycss-btn-glow">Save</button>`}</code>
      </pre>
      <p>
        That single button now carries its own emerald styling and
        gains a two-layer glow halo on hover — GPU-accelerated
        box-shadow, no layout cost, no JS.
      </p>

      <h2 id="install-via-package-manager">Install via package manager</h2>
      <p>
        For production builds you want the npm package so you can
        import the stylesheet through your bundler, and export
        hand-picked subsets when bundle size matters:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npm install roycss
# or
pnpm add roycss
# or
bun add roycss`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* The whole library */
import "roycss/css/min";

/* Or a hand-picked subset, via the CLI */
$ npx roycss-cli export btn-glow hover-push-up --out src/styles/roycss.css`}</code>
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
        <li><Link className="text-primary hover:underline" href="/docs/getting-started/installation">Installation</Link> — npm/pnpm/yarn/bun/CDN</li>
        <li><Link className="text-primary hover:underline" href="/docs/getting-started/first-effect">Your first effect</Link> — end-to-end tutorial</li>
        <li><Link className="text-primary hover:underline" href="/docs/concepts/css-first">CSS-first architecture</Link> — why no JS</li>
        <li><Link className="text-primary hover:underline" href="/docs/api/effects">Effects API</Link> — class reference</li>
      </ul>
    </>
  );
}
