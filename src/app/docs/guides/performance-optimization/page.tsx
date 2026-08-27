import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Optimization — RoyCSS Docs",
  description: "Advanced optimization: lazy-loading, content-visibility, GPU hints, and Lighthouse audits.",
};

export default function PerformanceOptimizationPage() {
  return (
    <>
      <h1>Performance Optimization</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is fast by default. This guide covers the advanced
        techniques that squeeze the last bit of performance out of
        large apps — lazy-loading, content-visibility, GPU layer
        management, and Lighthouse audits.
      </p>

      <h2 id="lazy-load">Lazy-load below-the-fold effects</h2>
      <p>
        Split your CSS so above-the-fold effects load inline and the
        rest loads lazily. The CLI can split for you:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle --split --out dist/
Wrote dist/critical.css   (4 KB gz, ship inline)
Wrote dist/lazy.css       (8 KB gz, prefetch)`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<head>
  <style>
    /* Inline dist/critical.css here */
  </style>
</head>
<body>
  …
  <link rel="prefetch" as="style" href="/lazy.css">
</body>`}</code>
      </pre>

      <h2 id="content-visibility">Use content-visibility</h2>
      <p>
        Long lists of effect cards benefit from{" "}
        <code>content-visibility: auto</code> — the browser skips
        rendering for off-screen items entirely. RoyCSS exposes a
        utility:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<ul class="r-list-cv-auto">
  <li class="r-card-base r-hover-lift">Card 1</li>
  <li class="r-card-base r-hover-lift">Card 2</li>
  ...
</ul>

.r-list-cv-auto > * {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}`}</code>
      </pre>
      <p>
        On a 1,000-card list this drops paint time from 80 ms to
        under 5 ms.
      </p>

      <h2 id="gpu-layers">GPU layer budget</h2>
      <p>
        <code>will-change: transform</code> creates a GPU layer.
        Layers are cheap individually but expensive in aggregate —
        browsers cap at ~30 layers before they start evicting. The
        RoyCSS rule: only the effects that are <em>currently
        animating</em> get a layer.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Good — layer only on hover */
.r-hover-lift { transition: transform 180ms; }
.r-hover-lift:hover { will-change: transform; }

/* Bad — every card has a layer always */
.r-hover-lift { will-change: transform; }`}</code>
      </pre>

      <h2 id="avoid-layout">Avoid layout-triggering properties</h2>
      <p>
        RoyCSS never animates <code>top</code>, <code>left</code>,
        <code>width</code>, <code>height</code>, <code>margin</code>,
        or <code>padding</code>. Don’t add your own overrides that
        do — they cause layout thrash on every frame:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Bad — animates layout */
.card:hover { margin-top: -4px; }

/* Good — animates a composited property */
.card:hover { transform: translateY(-4px); }`}</code>
      </pre>

      <h2 id="reduced-motion-bundle">Bundle a no-motion variant</h2>
      <p>
        If most of your users request reduced motion, ship a
        statically-reduced bundle. The CLI flags the{" "}
        <code>--no-motion</code> variant:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle --no-motion --out dist/effects-static.css
# Disables all animation/transition, keeps visual styling.`}</code>
      </pre>

      <h2 id="lighthouse">Lighthouse audits</h2>
      <p>
        Run Lighthouse and check the Performance tab. RoyCSS sites
        typically score 95-100 on Performance with these targets:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Metric                       Target   Typical RoyCSS site
───────────────────────────────────────────────────────────
LCP (Largest Content Paint)  < 2.5s    1.1–1.8s
FID (First Input Delay)       < 100ms    4–12ms
CLS (Cumulative Layout Shift) < 0.1     0.00–0.02
TBT (Total Blocking Time)     < 200ms   0–40ms`}</code>
      </pre>

      <h2 id="measure">Measure with the CLI</h2>
      <p>
        The RoyCSS CLI has a built-in Performance timeline recorder
        that surfaces the heaviest effects in your page:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss perf --url https://localhost:3000

Top GPU layer consumers:
  1. r-bg-aurora              3 layers  280 KB
  2. r-card-spotlight         1 layer    64 KB
  3. r-hover-lift (×24 items) 1 layer    48 KB

Suggestions:
  • Replace r-bg-aurora with static variant for below-the-fold
  • Use r-list-cv-auto on the 24-item grid`}</code>
      </pre>
    </>
  );
}
