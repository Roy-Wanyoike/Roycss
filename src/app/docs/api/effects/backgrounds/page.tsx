import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Background Effects — RoyCSS Docs",
  description: "RoyCSS background effect classes: aurora, mesh, gradient-sweep, stars. Pure CSS, GPU-composited.",
};

export default function BackgroundsPage() {
  return (
    <>
      <h1>Backgrounds</h1>
      <p className="text-lg text-muted-foreground">
        Background effects paint the area behind an element — aurora
        gradients, mesh blobs, star fields, animated sweeps. RoyCSS
        ships 247 of them under the{" "}
        <code>r-bg-*</code> namespace.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-bg-aurora              moving emerald/teal aurora
r-bg-aurora-vertical     vertical aurora variant
r-bg-mesh                4-blob mesh gradient
r-bg-mesh-amber          amber+emerald mesh
r-bg-stars               starfield (CSS-only, no JS)
r-bg-stars-twinkle       twinkling variant
r-bg-gradient-sweep      animated 180deg sweep
r-bg-noise               subtle noise overlay
r-bg-grid                animated grid lines`}</code>
      </pre>

      <h2 id="aurora">r-bg-aurora</h2>
      <p>
        The signature RoyCSS hero background. Two emerald/teal blobs
        drift across the surface using GPU-composited transforms:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="r-bg-aurora">
  <h1>Build faster with RoyCSS</h1>
</section>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@keyframes r-aurora-1 {
  0%, 100% { transform: translate3d(-10%, -10%, 0); }
  50%      { transform: translate3d( 10%,  10%, 0); }
}
.r-bg-aurora {
  position: relative;
  background: var(--r-bg);
  isolation: isolate;
}
.r-bg-aurora::before,
.r-bg-aurora::after {
  content: "";
  position: absolute;
  inset: -20%;
  z-index: -1;
  background: radial-gradient(
    circle at 50% 50%,
    oklch(72% 0.18 165 / 0.35),
    transparent 60%
  );
  filter: blur(40px);
  animation: r-aurora-1 16s ease-in-out infinite;
}
.r-bg-aurora::after {
  background: radial-gradient(
    circle at 50% 50%,
    oklch(70% 0.11 195 / 0.30),
    transparent 60%
  );
  animation-direction: reverse;
  animation-duration: 22s;
}`}</code>
      </pre>

      <h2 id="mesh">r-bg-mesh</h2>
      <p>
        Four-blob mesh gradient. Each blob is a radial gradient at a
        different corner with a different hue — combined they look
        like a soft, blurry stain. Pairs with hero copy:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="r-bg-mesh">
  <h1 class="r-text-gradient">RoyCSS</h1>
</section>`}</code>
      </pre>

      <h2 id="stars">r-bg-stars</h2>
      <p>
        A pure-CSS starfield — no canvas, no JS. Uses a tiny radial
        gradient tiled 100× and a slow drift keyframe. The "twinkle"
        variant adds an opacity pulse on top:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-bg-stars {
  background-image:
    radial-gradient(1px 1px at 25px 5px,  oklch(100% 0 0 / 0.6), transparent),
    radial-gradient(1px 1px at 50px 25px, oklch(100% 0 0 / 0.4), transparent),
    radial-gradient(1px 1px at 125px 50px, oklch(100% 0 0 / 0.5), transparent);
  background-size: 200px 200px;
  animation: r-stars-drift 60s linear infinite;
}
@keyframes r-stars-drift {
  from { background-position: 0 0; }
  to   { background-position: 200px 200px; }
}`}</code>
      </pre>

      <h2 id="gradient-sweep">r-bg-gradient-sweep</h2>
      <p>
        Animated 180-degree sweep that moves the gradient angle
        continuously. Great for hero CTA sections:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="r-bg-gradient-sweep">
  <h1>Pricing</h1>
</section>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@property --r-sweep-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
.r-bg-gradient-sweep {
  background: linear-gradient(
    var(--r-sweep-angle),
    oklch(72% 0.18 165),
    oklch(70% 0.11 195),
    oklch(72% 0.18 165)
  );
  animation: r-sweep 8s linear infinite;
}
@keyframes r-sweep {
  to { --r-sweep-angle: 360deg; }
}`}</code>
      </pre>

      <h2 id="customizing">Customizing</h2>
      <p>
        Backgrounds read <code>--r-bg</code> (page bg),{" "}
        <code>--r-accent</code> (primary blob), and{" "}
        <code>--r-accent-strong</code> (secondary). Override per
        section:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`section.hero-teal {
  --r-accent: oklch(70% 0.11 195);
  --r-accent-strong: oklch(72% 0.18 165);
}`}</code>
      </pre>

      <h2 id="performance">Performance</h2>
      <p>
        Backgrounds are heavy if they repaint. RoyCSS uses only
        compositor-thread properties (transform, opacity, filter)
        for animation, so they never trigger layout. For long-running
        pages, prefer the static variants (no <code>-twinkle</code>,
        no <code>-sweep</code>).
      </p>
    </>
  );
}
