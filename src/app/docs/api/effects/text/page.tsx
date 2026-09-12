import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Text Effects — RoyCSS Docs",
  description: "RoyCSS text effect classes: shimmer, gradient, neon glow, typewriter, blur reveal. Pure CSS keyframes.",
};

export default function TextEffectsPage() {
  return (
    <>
      <h1>Text Effects</h1>
      <p className="text-lg text-muted-foreground">
        Text effects apply visual treatments to inline or block text
        — gradients, shimmer sweeps, glow halos, and timed reveals.
        RoyCSS ships 111 text-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-text-shimmer            animated shimmer sweep
roycss-text-gradient          clipped multi-hue gradient
roycss-text-gradient-animated  continuously shifting gradient
roycss-text-neon-glow         emerald neon text glow
roycss-text-glow-pulse-b18    pulsing glow variant
roycss-text-typewriter-stream char-by-char typing + caret
roycss-text-blur-reveal       blur-to-focus reveal loop
roycss-text-underline-draw    underline draws itself
roycss-text-scramble          decode/scramble effect
roycss-text-wave              kinetic sine wave`}</code>
      </pre>

      <h2 id="shimmer">roycss-text-shimmer</h2>
      <p>
        A diagonal light sweep that animates across the text. Uses{" "}
        <code>background-clip: text</code> on a moving gradient:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="roycss-text-shimmer">RoyCSS</h1>

/* The CSS that ships in dist/roycss.css */
.roycss-text-shimmer {
  background: linear-gradient(
    110deg,
    oklch(0.446 0.037 257.28) 0%,
    oklch(0.446 0.037 257.28) 35%,
    oklch(0.968 0.007 247.9) 50%,
    oklch(0.446 0.037 257.28) 65%,
    oklch(0.446 0.037 257.28) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-shimmer-sweep 3s linear infinite;
}

@keyframes roy-shimmer-sweep {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}`}</code>
      </pre>

      <h2 id="gradient">roycss-text-gradient</h2>
      <p>
        A static four-hue gradient clipped to the text shape:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="roycss-text-gradient">
  Build faster with RoyCSS
</h1>

.roycss-text-gradient {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48) 0%, oklch(0.704 0.123 182.5) 40%, oklch(0.715 0.126 215.22) 70%, oklch(0.606 0.219 292.72) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
}`}</code>
      </pre>

      <h2 id="glow">roycss-text-neon-glow</h2>
      <p>
        A five-layer text-shadow halo in OKLCH, mixed with{" "}
        <code>color-mix()</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-text-neon-glow {
  color: oklch(0.696 0.149 162.48);
  text-shadow:
    0 0 7px color-mix(in oklch, oklch(0.696 0.149 162.48) 80%, transparent),
    0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    0 0 21px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    0 0 42px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    0 0 82px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
}`}</code>
      </pre>

      <h2 id="typewriter">roycss-text-typewriter-stream</h2>
      <p>
        Reveals text with a <code>steps()</code> keyframe and a
        blinking caret — the width animation targets{" "}
        <code>ch</code> units so it adapts to the font:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<h1 class="roycss-text-typewriter-stream">
  Hello, RoyCSS
</h1>

.roycss-text-typewriter-stream {
  display: inline-block;
  color: oklch(0.85 0.18 150);
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 32px;
  letter-spacing: 1px;
  overflow: hidden;
  white-space: nowrap;
  border-inline-end: 3px solid oklch(0.8 0.25 150);
  width: 0;
  animation:
    roy-type-stream 6s steps(11) infinite,
    roy-caret-stream 0.7s step-end infinite;
}
@keyframes roy-type-stream {
  0% { width: 0; }
  40% { width: 11ch; }
  60% { width: 11ch; }
  100% { width: 0; }
}`}</code>
      </pre>

      <h2 id="reveal">roycss-text-blur-reveal</h2>
      <p>
        A focus-in / blur-out loop driven by a filter keyframe:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<p class="roycss-text-blur-reveal">
  RoyCSS gives you ${EFFECT_COUNT_FORMATTED} production-ready effects, zero JS.
</p>

.roycss-text-blur-reveal {
  color: oklch(0.696 0.149 162.48);
  font-weight: 700;
  animation: roy-blur-reveal 4s ease-in-out infinite;
}

@keyframes roy-blur-reveal {
  0%, 100% { filter: blur(8px); opacity: 0.4; }
  50% { filter: blur(0); opacity: 1; }
}`}</code>
      </pre>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        All text effects preserve the underlying text color as a
        fallback for browsers that don’t support{" "}
        <code>background-clip: text</code> (the rules set both{" "}
        <code>color</code> and <code>-webkit-text-fill-color</code>).
        Animations are disabled under{" "}
        <code>prefers-reduced-motion: reduce</code> — the text still
        appears, just without the sweep.
      </p>
    </>
  );
}
