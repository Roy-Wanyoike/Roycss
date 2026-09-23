import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/concepts/performance",
  title: "Performance — RoyCSS Docs",
  description: "How RoyCSS stays fast: GPU-composited transforms, no layout thrash, registered properties that animate, and subset exports.",
});

export default function PerformancePage() {
  return (
    <>
      <h1>Performance</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS effects are designed to run at 60 fps on a mid-range
        phone. The library achieves this by animating mostly
        GPU-composited properties and by keeping the runtime at
        exactly zero — there is no JavaScript to profile.
      </p>

      <h2 id="composited-props">Composited properties first</h2>
      <p>
        Most RoyCSS effects animate <code>transform</code> and{" "}
        <code>opacity</code> — the two properties the browser can
        move on the compositor thread without re-laying out the
        page. A few effects deliberately animate other properties
        where the visual demands it (a dashed border marching, a
        background-position slide, a registered custom property) —
        those are the trade-offs the effect&apos;s own page is
        honest about:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real code from dist/roycss.css — pure compositor work */
.roycss-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-push-up:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px -10px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}`}</code>
      </pre>

      <h2 id="will-change">will-change, sparingly</h2>
      <p>
        The stylesheet uses <code>will-change</code> on only ~33
        rules — the elements that genuinely animate — never
        blanket-applied. Over-using <code>will-change</code> forces
        the browser to allocate a GPU layer for every element,
        which exhausts memory on low-end devices. 37 effects also
        promote a layer with <code>translateZ(0)</code> (loaders,
        full-screen mesh backgrounds) where a guaranteed compositor
        layer matters.
      </p>

      <h2 id="no-layout-thrash">No layout thrash</h2>
      <p>
        Because the hot paths animate transform and opacity, hover
        effects on a long list — even 1,000 items — stay buttery:
        the only thing changing is the GPU layer&apos;s transform.
        And since there is no runtime at all, there is no JS on
        your main thread to cause style recalculation storms.
      </p>

      <h2 id="registered-props">Properties the browser can animate</h2>
      <p>
        Effects that need to animate something CSS has no keyframe
        syntax for (a gradient angle, a rating fill) register a
        typed custom property with <code>@property</code> — the
        browser interpolates it natively, still on the compositor
        where possible:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes roy-card-gb-rotate {
  to { --roy-gb-angle: 360deg; }
}`}</code>
      </pre>

      <h2 id="bundle-size">Bundle size, honestly</h2>
      <p>
        The full minified stylesheet — all{" "}
        {EFFECT_COUNT_FORMATTED} effects — is{" "}
        {FULL_CSS_MIN_GZ_KB}&nbsp;KB gzipped. There are no
        per-category files to import; when bundle size matters,
        export a hand-picked subset instead:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Full stylesheet (roycss/css/min)   ~${FULL_CSS_MIN_GZ_KB} KB gz   all ${EFFECT_COUNT_FORMATTED} effects
Critical subset (critical.css)    ~3.6 KB gz    curated above-the-fold effects
Hand-picked via roycss export      ~0.7 KB gz    3 effects (see below)`}</code>
      </pre>

      <h2 id="measure">Measure it yourself</h2>
      <p>
        The CLI reports the exact size of any subset you export:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss-cli export btn-glow hover-push-up text-shimmer --out src/styles/roycss.css

✓ Exported 3 effects to src/styles/roycss.css (1.6KB)

Effects:
  roycss-btn-glow        — Glow Button   (Button Effects)
  roycss-hover-push-up   — Push Up       (Hover Effects)
  roycss-text-shimmer    — Shimmer Text  (Text Effects)`}</code>
      </pre>

      <h2 id="reduced-motion">Reduced motion, for free</h2>
      <p>
        432 effect rules ship a{" "}
        <code>prefers-reduced-motion: reduce</code> block that
        disables or freezes their animation. Performance for users
        who request it is, by definition, the cost of the underlying
        element — no transitions, no GPU work, no rAF.
      </p>
    </>
  );
}
