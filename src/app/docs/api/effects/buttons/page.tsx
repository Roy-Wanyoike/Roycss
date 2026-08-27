import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buttons — RoyCSS Docs",
  description: "RoyCSS button effect classes: glow, pulse, shine sweep, fill-from-bottom. Composes with hover effects.",
};

export default function ButtonsPage() {
  return (
    <>
      <h1>Buttons</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS button classes layer on top of any element you call a
        button — <code>&lt;a&gt;</code>, <code>&lt;button&gt;</code>,
        or any clickable div. They are designed to compose with
        <code>r-hover-*</code> classes.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-btn-base              base button reset + sizing
r-btn-glow-emerald      emerald glow background
r-btn-glow-teal         teal glow background
r-btn-pulse             periodic emerald pulse
r-btn-shine             diagonal shine sweep on hover
r-btn-fill              fills from bottom on hover
r-btn-3d                3D pop-out button
r-btn-outline-emerald   emerald outlined variant`}</code>
      </pre>

      <h2 id="base">r-btn-base</h2>
      <p>
        The reset layer: sensible padding, border-radius, font-weight,
        touch-target minimum (44×44 px), focus ring. Always apply it
        first, then layer a visual variant:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button type="button" class="r-btn-base r-btn-glow-emerald">
  Save
</button>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  min-height: 44px;
  min-width: 44px;
  border: 1px solid transparent;
  border-radius: var(--r-radius, 6px);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 180ms ease-out,
    background 180ms ease-out;
}
.r-btn-base:focus-visible {
  outline: 2px solid var(--r-accent);
  outline-offset: 2px;
}`}</code>
      </pre>

      <h2 id="glow-emerald">r-btn-glow-emerald</h2>
      <p>
        Emerald-tinted background with a soft halo that intensifies
        on hover. The signature RoyCSS button.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn-glow-emerald {
  background: oklch(58% 0.20 165);
  color: oklch(98% 0.01 165);
  box-shadow: 0 0 0 0 oklch(72% 0.18 165 / 0.0);
}
.r-btn-glow-emerald:hover {
  background: oklch(52% 0.20 165);
  box-shadow:
    0 8px 24px -8px oklch(72% 0.18 165 / 0.55),
    0 0 0 4px oklch(72% 0.18 165 / 0.15);
}`}</code>
      </pre>

      <h2 id="shine">r-btn-shine</h2>
      <p>
        A diagonal white highlight sweeps across the button on hover.
        Uses a pseudo-element + transform so it stays composited:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-btn-base r-btn-shine">Save</button>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn-shine { position: relative; overflow: hidden; }
.r-btn-shine::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 30%,
    oklch(100% 0 0 / 0.30) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 480ms ease-out;
}
.r-btn-shine:hover::after { transform: translateX(100%); }`}</code>
      </pre>

      <h2 id="fill">r-btn-fill</h2>
      <p>
        On hover, the background fills from the bottom up. Uses a{" "}
        <code>background-size</code> trick to avoid painting a second
        layer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn-fill {
  background:
    linear-gradient(
      to top,
      oklch(72% 0.18 165) 0%,
      oklch(72% 0.18 165) 100%
    ) no-repeat 0 100% / 100% 0%;
}
.r-btn-fill:hover {
  background-size: 100% 100%;
  color: oklch(98% 0.01 165);
}`}</code>
      </pre>

      <h2 id="pulse">r-btn-pulse</h2>
      <p>
        A periodic emerald pulse — good for primary CTAs. Pairs
        nicely with <code>r-btn-glow-emerald</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-btn-base r-btn-glow-emerald r-btn-pulse">
  Subscribe
</button>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@keyframes r-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(72% 0.18 165 / 0.45); }
  50%      { box-shadow: 0 0 0 8px oklch(72% 0.18 165 / 0); }
}
.r-btn-pulse { animation: r-btn-pulse 1.8s ease-out infinite; }`}</code>
      </pre>

      <h2 id="composing">Composing with hover effects</h2>
      <p>
        Button classes target background and box-shadow; hover effects
        target transform. They never collide:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<button class="r-btn-base r-btn-glow-emerald r-hover-lift r-hover-scale-soft">
  Save
</button>`}</code>
      </pre>
    </>
  );
}
