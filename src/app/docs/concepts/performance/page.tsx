import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance — RoyCSS Docs",
  description: "How RoyCSS stays fast: GPU compositing, no layout thrash, lazy custom properties, and per-category tree-shaking.",
};

export default function PerformancePage() {
  return (
    <>
      <h1>Performance</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS effects are designed to run at 60 fps on a mid-range
        phone. The library achieves this by animating only
        GPU-composited properties and never triggering layout.
      </p>

      <h2 id="composited-props">Only composited properties</h2>
      <p>
        RoyCSS animates <code>transform</code> and{" "}
        <code>opacity</code> — the two properties the browser can
        move on the compositor thread without re-laying out the page.
        Anything else (<code>top</code>, <code>left</code>,{" "}
        <code>width</code>, <code>margin</code>) is forbidden in
        transitions.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Good — both composited */
.r-hover-lift {
  transition: transform 180ms, opacity 180ms;
}
.r-hover-lift:hover {
  transform: translateY(4px);
  opacity: 0.92;
}

/* Forbidden in RoyCSS — triggers layout */
.bad-hover:hover {
  top: 4px;        /* layout! */
  width: 110%;     /* layout! */
}`}</code>
      </pre>

      <h2 id="will-change">will-change, sparingly</h2>
      <p>
        RoyCSS uses <code>will-change: transform</code> only on
        elements that actually animate — never on the entire page.
        Over-using <code>will-change</code> forces the browser to
        allocate a GPU layer for every element, which exhausts
        memory on low-end devices.
      </p>

      <h2 id="no-layout-thrash">No layout thrash</h2>
      <p>
        Because nothing animates layout, RoyCSS never causes the
        browser to recalculate styles mid-frame. Hover effects on
        a long list — even 1,000 items — stay buttery because the
        only thing changing is the GPU layer’s transform.
      </p>

      <h2 id="lazy-cascade">Lazy custom properties</h2>
      <p>
        RoyCSS uses <code>var(--r-…, fallback)</code> with sensible
        fallbacks everywhere. Custom properties resolve lazily —
        they don’t trigger layout until they’re read by a property
        that does layout. RoyCSS exploits this so unused variables
        cost nothing.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* The default 4px is used unless you override --r-hover-lift */
.r-hover-lift:hover {
  transform: translateY(var(--r-hover-lift, 4px));
}`}</code>
      </pre>

      <h2 id="bundle-size">Bundle size</h2>
      <p>
        The full RoyCSS stylesheet is ~80 KB gzipped. Per-category
        imports drop that dramatically:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Category        Gzipped
─────────────────────────
hover           2.1 KB
text            3.4 KB
backgrounds     4.8 KB
loaders         1.9 KB
buttons         2.7 KB
cards           3.1 KB
borders         1.6 KB
─────────────────────────
All 1,869      ~80.0 KB`}</code>
      </pre>

      <h2 id="measure">Measure it yourself</h2>
      <p>
        RoyCSS ships a CLI bundle analyzer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle --analyze --include r-hover-lift --include r-btn-glow-emerald

Bundle:
  r-hover-lift         412 B  (112 B gz)
  r-btn-glow-emerald   298 B  (89 B gz)
  shared vars          612 B  (148 B gz)
─────────────────────────────────────────
  Total              1.32 KB  (349 B gz)`}</code>
      </pre>

      <h2 id="gpu-flags">GPU-friendly defaults</h2>
      <p>
        RoyCSS uses <code>transform: translateZ(0)</code> on the
        handful of effects that need a guaranteed compositor layer
        (loaders, full-screen mesh backgrounds). The flag is opt-in
        per effect, never blanket-applied.
      </p>

      <h2 id="reduced-motion">Reduced motion, for free</h2>
      <p>
        RoyCSS ships a single <code>@media (prefers-reduced-motion: reduce)</code>{" "}
        block that disables every animation. Performance for users
        who request it is, by definition, the cost of the underlying
        element — no transitions, no GPU work, no rAF.
      </p>
    </>
  );
}
