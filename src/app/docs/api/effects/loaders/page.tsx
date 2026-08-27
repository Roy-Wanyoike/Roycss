import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loaders — RoyCSS Docs",
  description: "RoyCSS loader classes: ring, dots, bars, spinner, pulse. All with role=status baked in.",
};

export default function LoadersPage() {
  return (
    <>
      <h1>Loaders</h1>
      <p className="text-lg text-muted-foreground">
        Loaders communicate “something is happening” while the user
        waits. RoyCSS ships 89 loader classes under the{" "}
        <code>r-loader-*</code> namespace — all pure CSS, all
        accessible by default.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-loader-ring          spinning emerald ring
r-loader-ring-teal     teal variant
r-loader-dots          three pulsing dots
r-loader-dots-bounce   bouncing dots variant
r-loader-bars          three pulsing bars
r-loader-bars-equalize four bars equalizing
r-loader-spinner       classic 360° spinner
r-loader-pulse         single-pulse heartbeat
r-loader-orbit         satellite orbiting center`}</code>
      </pre>

      <h2 id="ring">r-loader-ring</h2>
      <p>
        The canonical RoyCSS loader. A 24px emerald ring with a
        rotating arc. Pair with{" "}
        <code>role="status"</code> + screen-reader text:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="r-loader-ring" role="status" aria-live="polite">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-loader-ring {
  width: 24px;
  height: 24px;
  border: 2.5px solid oklch(72% 0.18 165 / 0.20);
  border-top-color: oklch(58% 0.20 165);
  border-radius: 50%;
  animation: r-loader-spin 720ms linear infinite;
}
@keyframes r-loader-spin {
  to { transform: rotate(360deg); }
}`}</code>
      </pre>

      <h2 id="dots">r-loader-dots</h2>
      <p>
        Three dots that pulse in sequence. Use for inline loaders
        next to text:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="r-loader-dots" role="status">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-loader-dots::before,
.r-loader-dots::after,
.r-loader-dots {
  content: "";
  display: inline-block;
  width: 6px; height: 6px;
  margin: 0 2px;
  border-radius: 50%;
  background: oklch(72% 0.18 165);
  animation: r-loader-pulse 1.4s ease-in-out infinite;
}
.r-loader-dots::before  { animation-delay: 0.20s; }
.r-loader-dots::after   { animation-delay: 0.40s; }
@keyframes r-loader-pulse {
  0%, 60%, 100% { opacity: 0.30; transform: scale(0.8); }
  30%           { opacity: 1;    transform: scale(1.0); }
}`}</code>
      </pre>

      <h2 id="bars">r-loader-bars</h2>
      <p>
        Three vertical bars that pulse up and down. RoyCSS uses{" "}
        <code>transform: scaleY()</code> so the bars stay
        GPU-composited — no layout cost:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="r-loader-bars" role="status">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-loader-bars {
  width: 24px; height: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.r-loader-bars::before,
.r-loader-bars::after,
.r-loader-bars > * {
  background: oklch(72% 0.18 165);
  transform-origin: center;
  animation: r-bars 1s ease-in-out infinite;
}`}</code>
      </pre>

      <h2 id="orbit">r-loader-orbit</h2>
      <p>
        A satellite circles a center dot. Looks complex but is just
        a rotated parent with an offset child:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="r-loader-orbit" role="status">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>

      <h2 id="accessibility">Accessibility — always include role</h2>
      <p>
        RoyCSS loaders <em>do not</em> ship their{" "}
        <code>role="status"</code> for you — the role must be on the
        element so screen readers can pick it up. The lint command
        will warn you if you forget:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss lint --a11y src/**/*.tsx
src/Loader.tsx:8   warning  r-loader-ring missing role="status"`}</code>
      </pre>

      <h2 id="customizing">Customizing</h2>
      <p>
        Loaders read <code>--r-accent</code> and{" "}
        <code>--r-accent-strong</code>. For a one-off loader variant:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.loader-amber { --r-accent: oklch(80% 0.16 75); }`}</code>
      </pre>

      <h2 id="reduced-motion">Reduced motion</h2>
      <p>
        Loaders are functional — they communicate progress. RoyCSS
        keeps them spinning even under{" "}
        <code>prefers-reduced-motion: reduce</code>, but slows them
        to 0.4× speed. If your loader is purely decorative, add{" "}
        <code>r-static</code> alongside it to disable motion entirely.
      </p>
    </>
  );
}
