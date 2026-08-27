import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text Effects — RoyCSS Docs",
  description: "RoyCSS text effect classes: shimmer, gradient, glow, typewriter, reveal. Pure CSS keyframes.",
};

export default function TextEffectsPage() {
  return (
    <>
      <h1>Text Effects</h1>
      <p className="text-lg text-muted-foreground">
        Text effects apply visual treatments to inline or block text
        — gradients, shimmer sweeps, glow halos, and timed reveals.
        RoyCSS ships 218 of them under the{" "}
        <code>r-text-*</code> namespace.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-text-shimmer        animated shimmer sweep
r-text-gradient      clipped emerald gradient
r-text-gradient-amber  amber gradient variant
r-text-glow          emerald text glow
r-text-glow-soft     softer halo
r-text-typewriter    char-by-char reveal
r-text-reveal        word-by-word fade in
r-text-strike        strike-through on hover`}</code>
      </pre>

      <h2 id="shimmer">r-text-shimmer</h2>
      <p>
        A diagonal light sweep that animates across the text. Uses{" "}
        <code>background-clip: text</code> on a moving gradient:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="r-text-shimmer">RoyCSS</h1>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@keyframes r-text-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.r-text-shimmer {
  background: linear-gradient(
    100deg,
    var(--r-fg) 30%,
    oklch(85% 0.10 165) 50%,
    var(--r-fg) 70%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: r-text-shimmer 4s linear infinite;
}`}</code>
      </pre>

      <h2 id="gradient">r-text-gradient</h2>
      <p>
        A static emerald gradient clipped to the text shape. Pairs
        with <code>r-text-glow</code> for hero copy:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="r-text-gradient r-text-glow">
  Build faster with RoyCSS
</h1>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-text-gradient {
  background: linear-gradient(
    120deg,
    oklch(72% 0.18 165),
    oklch(80% 0.14 195)
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}`}</code>
      </pre>

      <h2 id="glow">r-text-glow</h2>
      <p>
        A subtle text-shadow halo. The halo color tracks{" "}
        <code>--r-accent</code>, so re-theming the library recolors
        every glow automatically:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-text-glow {
  text-shadow:
    0 0 16px oklch(72% 0.18 165 / 0.45),
    0 0 32px oklch(72% 0.18 165 / 0.20);
}`}</code>
      </pre>

      <h2 id="typewriter">r-text-typewriter</h2>
      <p>
        Reveals text one character at a time using a{" "}
        <code>steps()</code> keyframe. Pair with{" "}
        <code>--r-text-chars</code> on the element to set the
        character count:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="r-text-typewriter" style="--r-text-chars: 12;">
  Hello, RoyCSS
</h1>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@keyframes r-typewriter {
  from { width: 0; }
  to   { width: calc(1ch * var(--r-text-chars, 12)); }
}
.r-text-typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid var(--r-accent);
  animation: r-typewriter 1.6s steps(var(--r-text-chars, 12)) forwards;
}`}</code>
      </pre>

      <h2 id="reveal">r-text-reveal</h2>
      <p>
        Word-by-word fade-in driven by{" "}
        <code>animation-timeline: view()</code> — no JS scroll
        observer. Older browsers see the text immediately:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<p class="r-text-reveal">
  RoyCSS gives you 1,869 production-ready effects, zero JS.
</p>`}</code>
      </pre>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        All text effects preserve the underlying text color as a
        fallback for browsers that don’t support{" "}
        <code>background-clip: text</code>. Animations are disabled
        under <code>prefers-reduced-motion: reduce</code> — the text
        still appears, just without the sweep.
      </p>
    </>
  );
}
