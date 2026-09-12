import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Hover Effects — RoyCSS Docs",
  description: "RoyCSS hover effect classes: push-up, scale, glow border, tilt, underline. All pure CSS.",
};

export default function HoverEffectsPage() {
  return (
    <>
      <h1>Hover Effects</h1>
      <p className="text-lg text-muted-foreground">
        Hover effects fire when the pointer enters an element. RoyCSS
        ships 120 hover-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog — all GPU-composited,
        all respect <code>prefers-reduced-motion</code>.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-hover-push-up        translateY(-10px) + emerald shadow
roycss-hover-depth          6px lift + layered emerald glow
roycss-hover-scale          scale(1.08)
roycss-hover-scale-down     scale down variant
roycss-hover-glow-border    blurred gradient halo
roycss-hover-glow-pulse     pulsing glow ring
roycss-hover-tilt-rotate    rotateY/rotateX 3D tilt (CSS only)
roycss-hover-tilt-3d        stronger 3D tilt
roycss-hover-underline-slide     underline sweep (L→R)
roycss-hover-underline-grow      underline grows from center
roycss-hover-bounce         springy bounce
roycss-hover-shadow-grow    soft shadow deepens on hover`}</code>
      </pre>

      <h2 id="lift">roycss-hover-push-up</h2>
      <p>
        The canonical RoyCSS hover. Lifts the element 10px with a
        springy cubic-bezier and paints an emerald glow shadow. One
        class, one line of HTML:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-hover-push-up">Hover me</article>

/* The CSS that ships in dist/roycss.css */
.roycss-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-push-up:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px -10px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}`}</code>
      </pre>

      <h2 id="scale">roycss-hover-scale</h2>
      <p>
        Scales the element up by 8% on hover. Pairs well with buttons:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="roycss-btn-glow roycss-hover-scale">
  Subscribe
</button>`}</code>
      </pre>

      <h2 id="glow">roycss-hover-glow-border</h2>
      <p>
        Draws a blurred multi-hue gradient halo behind the element on
        hover. The halo is a pseudo-element with{" "}
        <code>filter: blur(8px)</code>, so it stays off the layout
        path:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-hover-glow-border {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
}

.roycss-hover-glow-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.704 0.123 182.5), oklch(0.715 0.126 215.22));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.roycss-hover-glow-border:hover::before {
  opacity: 1;
}`}</code>
      </pre>

      <h2 id="tilt">roycss-hover-tilt-rotate (CSS only)</h2>
      <p>
        RoyCSS ships a 3D tilt that doesn’t need JavaScript —{" "}
        <code>perspective</code> on the element plus a{" "}
        <code>rotateY/rotateX</code> transform on hover:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-hover-tilt-rotate {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.roycss-hover-tilt-rotate:hover {
  transform: rotateY(8deg) rotateX(-5deg) scale(1.02);
}`}</code>
      </pre>

      <h2 id="underline">roycss-hover-underline-slide</h2>
      <p>
        Animated underline that grows from left to right, built with
        logical properties so it flips automatically in RTL. The{" "}
        <code>-grow</code> variant expands from the center instead:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<a class="roycss-hover-underline-slide">Docs</a>
<a class="roycss-hover-underline-grow">About</a>

/* The CSS that ships */
.roycss-hover-underline-slide {
  position: relative;
  display: inline-block;
  text-decoration: none;
}

.roycss-hover-underline-slide::after {
  content: '';
  position: absolute;
  inset-block-end: -2px;
  inset-inline-start: 0;
  inline-size: 0;
  block-size: 2px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.704 0.123 182.5));
  transition: width 0.3s ease;
}

.roycss-hover-underline-slide:hover::after {
  inline-size: 100%;
}`}</code>
      </pre>

      <h2 id="composability">Composability</h2>
      <p>
        Hover effects own the <code>transform</code> property — so
        stack at most one transform-based hover effect per element,
        and pair it with effects from other families (buttons, text,
        backgrounds) that don’t touch <code>transform</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-hover-lift">
  <button class="roycss-btn-glow">Save</button>
</article>`}</code>
      </pre>

      <h2 id="customizing">Customizing</h2>
      <p>
        The shipped effects are self-contained with hardcoded OKLCH
        colors — that is what makes a class drop-in. To customize one,
        copy its CSS from the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/effects">
          effect catalog
        </a>{" "}
        and edit the values:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Your fork of hover-push-up — amber, softer spring */
.my-hover-lift-amber {
  transition: transform 0.3s ease;
}
.my-hover-lift-amber:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px -10px oklch(70% 0.16 75 / 0.45);
}`}</code>
      </pre>
    </>
  );
}
