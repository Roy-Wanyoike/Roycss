import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/guides/performance-optimization",
  title: "Performance Optimization — RoyCSS Docs",
  description: "Advanced optimization: critical-CSS layering, content-visibility, GPU layer budget, and the benchmark harness.",
});

export default function PerformanceOptimizationPage() {
  return (
    <>
      <h1>Performance Optimization</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is fast by default — zero runtime, composited
        transforms. This guide covers the techniques that squeeze
        the last bit of performance out of large apps: critical
        CSS, content-visibility, GPU layer management, and
        measuring with the repo&apos;s benchmark harness.
      </p>

      <h2 id="lazy-load">Layer critical CSS below the fold</h2>
      <p>
        The package ships a curated critical subset —{" "}
        <code>roycss/critical.css</code>, ~3.6 KB gzipped, the top
        effects for above-the-fold use, extracted by the repo&apos;s{" "}
        <code>perf/optimize/extract-critical-css.ts</code>. Inline
        it, then load the full ~{FULL_CSS_MIN_GZ_KB} KB stylesheet
        normally:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<head>
  <style>
    /* Inline dist/roycss-critical.css here (~3.6 KB gz) */
  </style>
  <link rel="stylesheet" href="/roycss.min.css">
</head>`}</code>
      </pre>
      <p>
        For a page that uses a handful of known effects, a CLI
        export is even smaller:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss-cli export btn-glow hover-push-up text-shimmer --out critical-site.css
✓ Exported 3 effects to critical-site.css (1.6KB)  /* ~0.7 KB gz */`}</code>
      </pre>

      <h2 id="content-visibility">Use content-visibility yourself</h2>
      <p>
        Long lists of effect cards benefit from{" "}
        <code>content-visibility: auto</code> — the browser skips
        rendering off-screen items entirely. RoyCSS does not ship
        a utility for this (it is page-layout, not an effect), but
        two lines of your own CSS do it:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<ul class="long-list">
  <li class="roycss-card-glassmorphism">Card 1</li>
  <li class="roycss-card-glassmorphism">Card 2</li>
  ...
</ul>

.long-list > * {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}`}</code>
      </pre>

      <h2 id="gpu-layers">GPU layer budget</h2>
      <p>
        <code>will-change: transform</code> creates a GPU layer.
        Layers are cheap individually but expensive in aggregate —
        browsers cap at ~30 layers before they start evicting. The
        shipped stylesheet uses <code>will-change</code> on only
        ~33 rules and promotes layers with{" "}
        <code>translateZ(0)</code> on 37 effects — the rule: only
        what actually animates gets a layer. Follow it in your own
        effects:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Good — layer only on hover */
.my-hover-lift { transition: transform 180ms; }
.my-hover-lift:hover { will-change: transform; }

/* Bad — every card has a layer always */
.my-hover-lift { will-change: transform; }`}</code>
      </pre>

      <h2 id="avoid-layout">Avoid layout-triggering properties</h2>
      <p>
        The shipped effects avoid animating <code>top</code>,{" "}
        <code>left</code>, <code>width</code>, <code>height</code>,{" "}
        <code>margin</code>, or <code>padding</code>. Don&apos;t add
        your own overrides that do — they cause layout thrash on
        every frame:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Bad — animates layout */
.card:hover { margin-top: -4px; }

/* Good — animates a composited property */
.card:hover { transform: translateY(-4px); }`}</code>
      </pre>

      <h2 id="reduced-motion">Respect reduced motion</h2>
      <p>
        There is no &quot;no-motion build&quot; — the mechanism is
        the media query, and 432 shipped effect rules already carry
        their guard. Users who request reduced motion pay nothing
        for your effects, and the browser handles it with zero JS:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-reduced-motion: reduce) {
  .your-motion { animation: none; }
}`}</code>
      </pre>

      <h2 id="lighthouse">Lighthouse audits</h2>
      <p>
        Run Lighthouse and check the Performance tab. Sensible
        targets for a RoyCSS-powered page (the CSS adds no JS to
        the critical path):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Metric                        Target
──────────────────────────────────────
LCP (Largest Content Paint)    < 2.5s
INP (Interaction to Next Paint) < 200ms
CLS (Cumulative Layout Shift)   < 0.1
TBT (Total Blocking Time)       < 200ms`}</code>
      </pre>

      <h2 id="measure">Measure with the benchmark harness</h2>
      <p>
        The RoyCSS repo ships a performance harness that measures
        bundle sizes, catalog counts, CSS-injection timing,
        virtual-scroll cost, animation jank, and per-effect heap
        cost — with regression tests against budgets:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# from a clone of the repo
$ bun run perf/benchmark.ts          # full suite → results/benchmark-report.json
$ bun test perf/regression.test.ts  # fail if budgets regress
$ bun run scripts/perf-budget.ts    # bundle budgets from perf/budget.json`}</code>
      </pre>
      <p>
        For usage inside your own app,{" "}
        <code>npx roycss-cli stats</code> tells you which effects you
        actually use (and which to stop shipping).
      </p>
    </>
  );
}
