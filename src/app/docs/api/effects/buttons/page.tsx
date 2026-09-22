import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/api/effects/buttons",
  title: "Buttons — RoyCSS Docs",
  description: "RoyCSS button effect classes: glow, pulse, shine sweep, fill slide, 3D push, neon. Each one self-contained.",
});

export default function ButtonsPage() {
  return (
    <>
      <h1>Buttons</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS button classes layer on top of any element you call a
        button — <code>&lt;a&gt;</code>, <code>&lt;button&gt;</code>,
        or any clickable div. Every class is self-contained: it ships
        its own padding, radius, typography, and hover state, so
        there is no base class to remember — pick one and go. RoyCSS
        ships 55 button-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-btn-glow           emerald background + glow halo on hover
roycss-btn-shine-sweep     diagonal shine sweeps across on hover
roycss-btn-fill-slide      background fills from the bottom
roycss-btn-pulse           warm pulsing scale
roycss-btn-3d-push         3D pop-out with :active press
roycss-btn-outline-fill    radial fill from center
roycss-btn-lift            lifts with teal shadow
roycss-btn-neon            cyberpunk neon outline
roycss-btn-ripple          ripple from click point
roycss-btn-morph           morphing border-radius`}</code>
      </pre>

      <h2 id="glow">roycss-btn-glow</h2>
      <p>
        The signature RoyCSS button. Emerald background that gains a
        two-layer glow halo on hover:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button type="button" class="roycss-btn-glow">
  Save
</button>

/* The CSS that ships in dist/roycss.css */
.roycss-btn-glow {
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.roycss-btn-glow:hover {
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent), 0 0 40px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
}`}</code>
      </pre>

      <h2 id="shine">roycss-btn-shine-sweep</h2>
      <p>
        A diagonal highlight sweeps across the button on hover. It is
        a skewed pseudo-element that slides from edge to edge — stays
        fully composited:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="roycss-btn-shine-sweep">Save</button>

.roycss-btn-shine-sweep {
  position: relative;
  overflow: hidden;
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.roycss-btn-shine-sweep::after {
  content: '';
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -60%;
  inline-size: 40%;
  block-size: 200%;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, oklch(1 0 89.88) 45%, transparent), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  pointer-events: none;
}

.roycss-btn-shine-sweep:hover::after {
  inset-inline-start: 120%;
}`}</code>
      </pre>

      <h2 id="fill">roycss-btn-fill-slide</h2>
      <p>
        On hover, the background fills from the bottom up via a{" "}
        <code>::before</code> layer whose height animates:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-btn-fill-slide {
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: transparent;
  color: oklch(0.696 0.149 162.48);
  border: 2px solid oklch(0.696 0.149 162.48);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.4s ease;
}

.roycss-btn-fill-slide::before {
  content: '';
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 0%;
  background: oklch(0.696 0.149 162.48);
  z-index: -1;
  transition: height 0.4s ease;
}

.roycss-btn-fill-slide:hover {
  color: oklch(1 0 89.88);
  /* …and the ::before grows to 100% height */`}</code>
      </pre>

      <h2 id="pulse">roycss-btn-pulse</h2>
      <p>
        A periodic warm pulse — good for primary CTAs:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="roycss-btn-pulse">
  Subscribe
</button>

.roycss-btn-pulse:hover {
  background: oklch(0.577 0.215 27.33);
  animation: roy-btn-pulse 0.8s ease-in-out infinite;
}

@keyframes roy-btn-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}`}</code>
      </pre>

      <h2 id="composing">Composing with hover effects</h2>
      <p>
        Button classes own <code>background</code>,{" "}
        <code>box-shadow</code>, and sometimes <code>transform</code>{" "}
        (pulse, 3D push). Pick one button class per element, and pair
        it with a hover effect from a different family when you want
        an extra layer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-hover-lift">
  <h3>Pricing — Starter</h3>
  <button class="roycss-btn-glow">Start trial</button>
</article>`}</code>
      </pre>
    </>
  );
}
