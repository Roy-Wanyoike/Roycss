import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/api/effects/loaders",
  title: "Loaders — RoyCSS Docs",
  description: "RoyCSS loader classes: ring-spin, dots, bars, equalizer, orbit, pulse ring. Accessible by composition.",
});

export default function LoadersPage() {
  return (
    <>
      <h1>Loaders</h1>
      <p className="text-lg text-muted-foreground">
        Loaders communicate “something is happening” while the user
        waits. RoyCSS ships 66 loader-category effects out of the{" "}
        {EFFECT_COUNT_FORMATTED}-effect catalog — all pure CSS, all
        with <code>prefers-reduced-motion</code> guards baked into
        the shipped rules.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-loader-ring-spin       spinning emerald arc ring
roycss-loader-spinner         classic 360° ring spinner
roycss-loader-dots            three bouncing dots (child spans)
roycss-loader-dots-bounce     bouncing-dots variant
roycss-loader-bars            equalizer bars (child spans)
roycss-loader-bars-equalizer  five-bar equalizer
roycss-loader-orbit           satellite orbiting center
roycss-loader-pulse-ring      expanding concentric pulse rings
roycss-loader-grid            blinking grid cells
roycss-loader-whale           playful whale loader`}</code>
      </pre>

      <h2 id="ring">roycss-loader-ring-spin</h2>
      <p>
        The canonical RoyCSS loader — a 36px arc ring that spins with
        logical-property borders. Pair with{" "}
        <code>role="status"</code> + screen-reader text:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-loader-ring-spin" role="status" aria-live="polite">
  <span class="sr-only">Loading…</span>
</div>

/* The CSS that ships in dist/roycss.css */
.roycss-loader-ring-spin {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 50%;
  border: 3px solid color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
  border-block-start-color: oklch(0.6 0.2 162);
  animation: roy-ring-spin 0.8s linear infinite;
}

@keyframes roy-ring-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-ring-spin { animation: none; }
}`}</code>
      </pre>

      <h2 id="dots">roycss-loader-dots</h2>
      <p>
        Three child <code>&lt;span&gt;</code>s that bounce in
        sequence — the delays are built into the rules. Use for inline
        loaders next to text:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-loader-dots" role="status">
  <span></span><span></span><span></span>
  <span class="sr-only">Loading…</span>
</div>

.roycss-loader-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.roycss-loader-dots span {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  animation: roy-bounce-dots 1.4s ease-in-out infinite;
}

.roycss-loader-dots span:nth-child(2) { animation-delay: 0.16s; }
.roycss-loader-dots span:nth-child(3) { animation-delay: 0.32s; }`}</code>
      </pre>

      <h2 id="bars">roycss-loader-bars-equalizer</h2>
      <p>
        Five bars equalize up and down with{" "}
        <code>transform: scaleY()</code> — GPU-composited, no layout
        cost, with a reduced-motion fallback that parks the bars at
        half height:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-loader-bars-equalizer" role="status">
  <span></span><span></span><span></span><span></span><span></span>
  <span class="sr-only">Loading…</span>
</div>

.roycss-loader-bars-equalizer > span {
  inline-size: 4px;
  block-size: 100%;
  background: oklch(0.6 0.2 162);
  border-radius: 2px;
  animation: roy-bars-eq 1s ease-in-out infinite;
}

@keyframes roy-bars-eq {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-bars-equalizer > span { animation: none; transform: scaleY(0.5); }
}`}</code>
      </pre>

      <h2 id="orbit">roycss-loader-orbit</h2>
      <p>
        A satellite circles a center dot — a rotated parent with an
        offset <code>::after</code>, all in two pseudo-elements:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-loader-orbit" role="status">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>

      <h2 id="accessibility">Accessibility — always include a role</h2>
      <p>
        RoyCSS loaders <em>do not</em> ship their{" "}
        <code>role="status"</code> for you — the role must be on the
        element so screen readers can pick it up. What the shipped CSS
        does guarantee is the reduced-motion guard shown above.
      </p>

      <h2 id="reduced-motion">Reduced motion</h2>
      <p>
        The shipped loaders each embed their own{" "}
        <code>prefers-reduced-motion</code> rule — typically{" "}
        <code>animation: none</code> with a static fallback state, so
        a reduced-motion user still sees a (still) loading indicator
        rather than nothing.
      </p>
    </>
  );
}
