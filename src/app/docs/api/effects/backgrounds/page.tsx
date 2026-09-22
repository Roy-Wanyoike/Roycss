import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/api/effects/backgrounds",
  title: "Background Effects — RoyCSS Docs",
  description: "RoyCSS background effect classes: aurora, mesh gradient, starfield, gradient sweep, grid lines. Pure CSS.",
});

export default function BackgroundsPage() {
  return (
    <>
      <h1>Backgrounds</h1>
      <p className="text-lg text-muted-foreground">
        Background effects paint the area behind an element — aurora
        gradients, mesh blobs, star fields, animated sweeps. RoyCSS
        ships 160 background-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-bg-aurora               rotating conic aurora (emerald/blue/violet)
roycss-bg-aurora-borealis-2    multi-blob borealis with starfield
roycss-bg-mesh-gradient        4-blob blurred mesh gradient
roycss-bg-starfield            twinkling star tiles (CSS-only, no JS)
roycss-bg-gradient-sweep       animated 90deg gradient sweep
roycss-bg-noise                subtle SVG-noise overlay
roycss-bg-grid-lines           48px grid lines
roycss-bg-dot-pattern          dotted pattern
roycss-bg-cyber-grid           synthwave grid
roycss-bg-lava-lamp            morphing lava blobs`}</code>
      </pre>

      <h2 id="aurora">roycss-bg-aurora</h2>
      <p>
        The signature RoyCSS hero background. A giant conic gradient
        with three color stops rotates behind the content via a{" "}
        <code>::before</code> layer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="roycss-bg-aurora">
  <h1>Build faster with RoyCSS</h1>
</section>

/* The CSS that ships in dist/roycss.css */
.roycss-bg-aurora {
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75) 0%, oklch(0.228 0.039 247.3) 100%);
  position: relative;
  overflow: hidden;
}

.roycss-bg-aurora::before {
  content: '';
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -50%;
  inline-size: 200%;
  block-size: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent) 60deg,
    transparent 120deg,
    color-mix(in oklch, oklch(0.715 0.126 215.22) 10%, transparent) 180deg,
    transparent 240deg,
    color-mix(in oklch, oklch(0.606 0.219 292.72) 10%, transparent) 300deg,
    transparent 360deg
  );
  animation: roy-aurora 12s linear infinite;
}

@keyframes roy-aurora {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`}</code>
      </pre>

      <h2 id="mesh">roycss-bg-mesh-gradient</h2>
      <p>
        Four radial-gradient blobs blurred together into a soft
        stain. Pairs with hero copy:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="roycss-bg-mesh-gradient">
  <h1 class="roycss-text-gradient">RoyCSS</h1>
</section>

.roycss-bg-mesh-gradient {
  background-color: oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
}

.roycss-bg-mesh-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(at 20% 30%, color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent) 0, transparent 50%),
    radial-gradient(at 80% 20%, color-mix(in oklch, oklch(0.715 0.126 215.22) 25%, transparent) 0, transparent 50%),
    radial-gradient(at 50% 80%, color-mix(in oklch, oklch(0.606 0.219 292.72) 20%, transparent) 0, transparent 50%);
  filter: blur(60px);
}`}</code>
      </pre>

      <h2 id="stars">roycss-bg-starfield</h2>
      <p>
        A pure-CSS starfield — no canvas, no JS. Eight tiled radial
        gradients paint the stars, and the twinkle is baked in via an
        opacity keyframe:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-bg-starfield {
  background-color: oklch(0.135 0.019 264.32);
  background-image:
    radial-gradient(2px 2px at 20px 30px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 40px 70px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 90px 40px, oklch(1 0 89.88), transparent),
    radial-gradient(2px 2px at 130px 80px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 160px 30px, oklch(1 0 89.88), transparent);
  background-size: 250px 150px;
  animation: roy-starfield-twinkle 3s ease-in-out infinite alternate;`}</code>
      </pre>

      <h2 id="gradient-sweep">roycss-bg-gradient-sweep</h2>
      <p>
        An oversized gradient slides across the element by animating{" "}
        <code>background-position</code>. Great for hero CTA
        sections:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="roycss-bg-gradient-sweep">
  <h1>Pricing</h1>
</section>

.roycss-bg-gradient-sweep {
  background: linear-gradient(
    90deg,
    oklch(0.208 0.04 265.75) 0%,
    oklch(0.696 0.149 162.48) 25%,
    oklch(0.715 0.126 215.22) 50%,
    oklch(0.696 0.149 162.48) 75%,
    oklch(0.208 0.04 265.75) 100%
  );
  background-size: 200% 100%;
  animation: roy-gradient-sweep 4s linear infinite;
}

@keyframes roy-gradient-sweep {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}`}</code>
      </pre>

      <h2 id="performance">Performance</h2>
      <p>
        Animated backgrounds are heavy if they repaint. The shipped
        effects animate compositor-friendly properties where possible
        (transform, opacity, background-position) and keep overflow
        clipped. For long-running pages, prefer the static variants —{" "}
        <code>roycss-bg-grid-lines</code> and{" "}
        <code>roycss-bg-dot-pattern</code> paint once and never
        animate.
      </p>
    </>
  );
}
