import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Borders — RoyCSS Docs",
  description: "RoyCSS border effect classes: shine sweep, draw-on-load, gradient, glow, dashed-flow.",
};

export default function BordersPage() {
  return (
    <>
      <h1>Borders</h1>
      <p className="text-lg text-muted-foreground">
        Border effects decorate an element’s edge — animated shines,
        drawn-in lines, gradient borders, and glowing outlines.
        RoyCSS ships 188 border classes under the{" "}
        <code>r-border-*</code> namespace.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-border-shine             emerald shine sweeps around the border
r-border-draw              border draws in on mount
r-border-draw-on-hover      border draws in on hover
r-border-gradient           emerald→teal gradient border
r-border-glow               emerald outer glow ring
r-border-dashed-flow        dashed border that flows
r-border-pulse              periodic border pulse
r-border-corners            decorative corner brackets`}</code>
      </pre>

      <h2 id="shine">r-border-shine</h2>
      <p>
        A bright emerald line sweeps around the element’s border on
        hover. Achieved with a clipped pseudo-element that rotates:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-btn-base r-border-shine">Save</button>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-border-shine { position: relative; }
.r-border-shine::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    oklch(72% 0.18 165) 60deg,
    transparent 120deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 2px;
  opacity: 0;
  transition: opacity 200ms;
  animation: r-border-spin 2.5s linear infinite;
}
.r-border-shine:hover::before { opacity: 1; }
@keyframes r-border-spin { to { transform: rotate(360deg); } }`}</code>
      </pre>

      <h2 id="draw">r-border-draw</h2>
      <p>
        Border draws itself in on mount, one edge at a time. Great
        for first-load reveals:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-border-draw">
  <h3>Featured</h3>
</article>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Four-pseudo trick: each side is its own line that grows */
.r-border-draw::before,
.r-border-draw::after,
.r-border-draw > .r-border-draw-top,
.r-border-draw > .r-border-draw-bottom {
  /* …4 individual <span>s with width:0 → width:100% keyframes… */
}

/* Simpler trick: single border drawn via clip-path + scale */
@keyframes r-border-draw {
  0%   { clip-path: inset(0 100% 100% 0); }
  25%  { clip-path: inset(0 0 100% 0); }
  50%  { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}
.r-border-draw {
  border: 2px solid var(--r-accent);
  animation: r-border-draw 800ms ease-out forwards;
}`}</code>
      </pre>

      <h2 id="gradient">r-border-gradient</h2>
      <p>
        An emerald→teal gradient border, achieved with a two-layer
        background trick (border-box + padding-box):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-border-gradient {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--r-card-bg), var(--r-card-bg)) padding-box,
    linear-gradient(135deg,
      oklch(72% 0.18 165),
      oklch(70% 0.11 195)
    ) border-box;
}`}</code>
      </pre>

      <h2 id="glow">r-border-glow</h2>
      <p>
        A static emerald outer glow ring. Use to highlight the
        current/active element:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-border-glow {
  box-shadow:
    0 0 0 1px oklch(72% 0.18 165 / 0.35),
    0 0 24px oklch(72% 0.18 165 / 0.30);
}`}</code>
      </pre>

      <h2 id="dashed-flow">r-border-dashed-flow</h2>
      <p>
        Dashed border that animates around the perimeter — useful
        for “drop zone” affordances:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-border-dashed-flow {
  border: 2px dashed oklch(72% 0.18 165 / 0.50);
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 8px,
      oklch(72% 0.18 165 / 0.40) 8px 16px
    );
  background-clip: padding-box;
  animation: r-dashed-flow 1.2s linear infinite;
}
@keyframes r-dashed-flow {
  to { background-position: 16px 0; }
}`}</code>
      </pre>

      <h2 id="corners">r-border-corners</h2>
      <p>
        Decorative L-shaped corner brackets — gives a “HUD” feel
        without the cost of an image. Pure CSS using two pseudo
        elements and <code>border-clip</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-border-corners">
  <h3>Camera Feed</h3>
</article>`}</code>
      </pre>

      <h2 id="composition">Composition</h2>
      <p>
        Border effects combine with hover and card classes without
        conflict — they target <code>border</code> and{" "}
        <code>box-shadow</code>, leaving transform and background
        alone:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-hover-lift r-border-shine r-border-glow">
  <h3>Featured</h3>
</article>`}</code>
      </pre>
    </>
  );
}
