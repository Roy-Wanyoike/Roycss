import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Borders — RoyCSS Docs",
  description: "RoyCSS border effect classes: marching ants, animated gradients, dashed draw, neon pulse, corner brackets.",
};

export default function BordersPage() {
  return (
    <>
      <h1>Borders</h1>
      <p className="text-lg text-muted-foreground">
        Border effects decorate an element&apos;s edge — marching
        dashes, rotating gradients, drawn-in outlines, and glowing
        rings. RoyCSS ships 38 border-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog, under the{" "}
        <code>roycss-border-*</code> prefix (plus{" "}
        <code>roycss-ferrum-*</code> and <code>roycss-vfx-*</code>{" "}
        variants).
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-border-marching-ants      dashed border that marches around the perimeter
roycss-border-gradient-animated rotating multi-hue gradient border
roycss-border-dashed-draw       dashed border draws in on hover
roycss-border-neon-pulse        pulsing neon outline
roycss-border-corner-brackets   decorative HUD corner brackets
roycss-border-double-glow       solid border + outer glow ring
roycss-border-inset-glow        glow ring on the inside edge
roycss-border-animated-dash     animated dash offset
roycss-border-clip-path         angled clip-path frame
roycss-border-frame             double-line frame`}</code>
      </pre>

      <h2 id="marching-ants">roycss-border-marching-ants</h2>
      <p>
        The classic selection &quot;ants&quot; — a dashed border whose
        four edges slide around the perimeter forever, built from
        four <code>repeating-linear-gradient</code> stripes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-border-marching-ants">Drop zone</div>

/* The CSS that ships in dist/roycss.css */
.roycss-border-marching-ants {
  inline-size: 140px;
  block-size: 80px;
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    repeating-linear-gradient(90deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(90deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px);
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
  border-radius: 4px;
  animation: roy-border-march 0.7s linear infinite;
}

@keyframes roy-border-march {
  to {
    background-position: 12px 0, -12px 100%, 0 -12px, 100% 12px;
  }
}`}</code>
      </pre>

      <h2 id="gradient">roycss-border-gradient-animated</h2>
      <p>
        A multi-hue gradient border that rotates forever. The trick:
        a <code>::before</code> padded one pixel wider than the
        element, masked with{" "}
        <code>mask-composite: exclude</code> so only the rim shows,
        animated by keyframing a registered custom property from{" "}
        <code>0deg</code> to <code>360deg</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-border-gradient-animated">Animated rim</div>

/* The CSS that ships in dist/roycss.css */
.roycss-border-gradient-animated {
  position: relative;
  background: oklch(0.208 0.04 265.75);
  border-radius: 8px;
}

.roycss-border-gradient-animated::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 3px;
  background: linear-gradient(var(--roy-bg-angle), oklch(0.696 0.149 162.48), oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08), oklch(0.715 0.126 215.22), oklch(0.696 0.149 162.48));
  -webkit-mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-border-gradient 4s linear infinite;
  pointer-events: none;
}

@keyframes roy-border-gradient {
  to { --roy-bg-angle: 360deg; }
}`}</code>
      </pre>
      <p>
        <code>--roy-bg-angle</code> is registered with{" "}
        <code>@property</code> so the browser can interpolate it as
        an angle — the same technique the card-category{" "}
        <code>.roycss-card-gradient-border</code> uses.
      </p>

      <h2 id="draw">roycss-border-dashed-draw</h2>
      <p>
        A dashed border that draws itself in on hover — the rim
        starts fully clipped and expands via a{" "}
        <code>clip-path</code> polygon transition:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-border-dashed-draw">Hover me</div>

/* The CSS that ships in dist/roycss.css */
.roycss-border-dashed-draw::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed oklch(0.606 0.219 292.72);
  border-radius: inherit;
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
  transition: clip-path 0.6s ease;
  pointer-events: none;
}

.roycss-border-dashed-draw:hover::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}`}</code>
      </pre>

      <h2 id="neon-pulse">roycss-border-neon-pulse</h2>
      <p>
        A cyberpunk neon outline that pulses — border color and glow
        intensity breathe together on a 1.5s loop:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-border-neon-pulse">NEON</div>

/* The CSS that ships in dist/roycss.css */
.roycss-border-neon-pulse {
  background: oklch(0.145 0 89.88);
  border: 2px solid oklch(0.656 0.212 354.31);
  border-radius: 8px;
  animation: roy-border-neon 1.5s ease-in-out infinite;
}`}</code>
      </pre>

      <h2 id="corners">roycss-border-corner-brackets</h2>
      <p>
        Decorative L-shaped corner brackets — a &quot;HUD&quot; feel
        with zero images. Eight tiny gradient stripes are positioned
        at the four corners via a multi-value{" "}
        <code>background-image</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-border-corner-brackets">Camera Feed</div>`}</code>
      </pre>

      <h2 id="sizing-note">A note on shipped sizes</h2>
      <p>
        The border classes above ship with fixed demo sizing
        (<code>inline-size: 140px; block-size: 80px;</code>) and
        centered flex layout — that is what keeps every effect
        self-contained and previewable in the catalog. When you use
        one in a real layout, override the size (or wrap it) the
        same way you would any other component:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<style>
  .my-panel.roycss-border-gradient-animated {
    inline-size: auto;
    block-size: auto;
    padding: 24px;
  }
</style>

<article class="my-panel roycss-border-gradient-animated">
  <h3>Featured</h3>
</article>`}</code>
      </pre>

      <h2 id="composition">Composition</h2>
      <p>
        Because each border class owns its own rim technique
        (background stripes, masked pseudo-element, or plain{" "}
        <code>border</code>), pick <strong>one</strong> border effect
        per element — stacking two border classes makes the last one
        win. Pair freely with hover, card, or text effects on
        neighbouring nodes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-glassmorphism">
  <h3 class="roycss-text-shimmer">Featured</h3>
  <button class="roycss-btn-glow">Save</button>
</article>`}</code>
      </pre>
      <p>
        See the full list on the{" "}
        <a className="text-primary hover:underline" href="/effects">
          border effects in the catalog
        </a>
        .
      </p>
    </>
  );
}
