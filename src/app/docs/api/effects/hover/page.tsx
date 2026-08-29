import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hover Effects — RoyCSS Docs",
  description: "RoyCSS hover effect classes: lift, scale, glow, tilt, underline, and more. All pure CSS.",
};

export default function HoverEffectsPage() {
  return (
    <>
      <h1>Hover Effects</h1>
      <p className="text-lg text-muted-foreground">
        Hover effects fire when the pointer enters an element.
        RoyCSS ships 312 hover effects across the{" "}
        <code>r-hover-*</code> namespace — all GPU-composited, all
        respect <code>prefers-reduced-motion</code>.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-hover-lift           translateY(4px) on hover
r-hover-lift-strong   translateY(8px)
r-hover-scale        scale(1.04)
r-hover-scale-soft   scale(1.02)
r-hover-glow         emerald halo
r-hover-glow-teal    teal halo
r-hover-tilt         subtle 3D tilt (CSS only — no JS)
r-hover-underline     animated underline (L→R sweep)
r-hover-underline-center  underline grows from center`}</code>
      </pre>

      <h2 id="lift">r-hover-lift</h2>
      <p>
        The canonical RoyCSS hover. Lifts the element 4px and adds an
        emerald drop-shadow. One class, one line of HTML:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-hover-lift">Hover me</article>

/* The CSS that ships with r-hover-lift */
.r-hover-lift {
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 180ms ease-out;
  will-change: transform;
}
.r-hover-lift:hover {
  transform: translateY(var(--r-hover-lift, 4px));
  box-shadow:
    0 12px 28px -10px oklch(72% 0.18 165 / 0.45),
    0 0 0 1px oklch(72% 0.18 165 / 0.15);
}`}</code>
      </pre>

      <h2 id="scale">r-hover-scale</h2>
      <p>
        Scales the element up by 4% on hover. Pairs well with cards
        and buttons:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-btn-glow-emerald r-hover-scale">
  Subscribe
</button>`}</code>
      </pre>

      <h2 id="glow">r-hover-glow</h2>
      <p>
        Adds an emerald halo around the element on hover. The halo
        uses <code>box-shadow</code>, so it costs nothing on the
        GPU:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-hover-glow {
  transition: box-shadow 220ms ease-out;
}
.r-hover-glow:hover {
  box-shadow:
    0 0 0 4px oklch(72% 0.18 165 / 0.20),
    0 0 32px oklch(72% 0.18 165 / 0.40);
}`}</code>
      </pre>

      <h2 id="tilt">r-hover-tilt (CSS only)</h2>
      <p>
        RoyCSS ships a 3D tilt that doesn’t need JavaScript — it
        uses a CSS-only hack with <code>perspective</code> and{" "}
        <code>rotate</code>. For real pointer-tracked tilt, see{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/roymotion">
          RoyMotion
        </a>
        .
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-hover-tilt {
  perspective: 600px;
  transition: transform 240ms ease-out;
}
.r-hover-tilt:hover {
  transform: rotateX(4deg) rotateY(-4deg);
}`}</code>
      </pre>

      <h2 id="underline">r-hover-underline</h2>
      <p>
        Animated underline that grows from left to right. Two
        variants — full-width sweep, or center-grow:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<a class="r-hover-underline">Docs</a>
<a class="r-hover-underline-center">About</a>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Sweep variant */
.r-hover-underline {
  background-image: linear-gradient(var(--r-accent), var(--r-accent));
  background-size: 0 2px;
  background-repeat: no-repeat;
  background-position: 0 100%;
  transition: background-size 220ms ease-out;
}
.r-hover-underline:hover {
  background-size: 100% 2px;
}`}</code>
      </pre>

      <h2 id="customizing">Customizing</h2>
      <p>
        Every hover effect reads at most three custom properties:
        <code>--r-hover-lift</code>, <code>--r-easing</code>, and
        <code>--r-accent</code>. Override any of them per container:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.extra-lift {
  --r-hover-lift: 16px;
  --r-accent: oklch(80% 0.16 75);  /* amber */
}`}</code>
      </pre>
    </>
  );
}
