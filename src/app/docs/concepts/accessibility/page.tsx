import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility — RoyCSS Docs",
  description: "RoyCSS accessibility: reduced motion, focus-visible, ARIA-friendly effects, never color alone.",
};

export default function AccessibilityPage() {
  return (
    <>
      <h1>Accessibility</h1>
      <p className="text-lg text-muted-foreground">
        Every RoyCSS effect is audited against three accessibility
        rules: respect reduced motion, never communicate state by
        color alone, and never break keyboard focus.
      </p>

      <h2 id="reduced-motion">Reduced motion</h2>
      <p>
        RoyCSS ships a global guard that disables non-essential
        motion when the user’s OS asks for it. You don’t need to do
        anything — it’s in the base stylesheet:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`}</code>
      </pre>
      <p>
        Effects that carry meaning (focus rings, error borders)
        <em>are not</em> disabled — only decorative motion. The
        rule targets <code>animation</code> and{" "}
        <code>transition</code>, not borders or box-shadows used for
        affordances.
      </p>

      <h2 id="not-color-alone">Never color alone</h2>
      <p>
        RoyCSS never communicates state with color alone. A danger
        button is red <em>and</em> has a thicker border. A focus
        state is an emerald outline <em>and</em> a 2px ring.
        WCAG 1.4.1 (Use of Color) compliance is built in.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn-danger {
  /* Color + shape + icon — not color alone */
  background: oklch(58% 0.20 25);
  border: 2px solid oklch(38% 0.18 25);
}`}</code>
      </pre>

      <h2 id="focus-visible">Keyboard focus</h2>
      <p>
        RoyCSS targets <code>:focus-visible</code> rather than{" "}
        <code>:focus</code>, so the focus ring appears only for
        keyboard and AT users — never on mouse click. Every
        interactive effect class (buttons, cards, links) ships a
        default 2px emerald ring:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-btn:focus-visible {
  outline: 2px solid var(--r-accent);
  outline-offset: 2px;
}`}</code>
      </pre>

      <h2 id="contrast">Contrast</h2>
      <p>
        The RoyCSS palette is designed so primary text and effect
        foregrounds hit WCAG AA (4.5:1) on the default background,
        and AAA (7:1) on the dark theme. The accent emerald{" "}
        <code>oklch(58% 0.20 165)</code> on near-black{" "}
        <code>oklch(15% 0.02 200)</code> scores 7.6:1.
      </p>

      <h2 id="aria">ARIA-friendly effects</h2>
      <p>
        Loaders use <code>role="status"</code> so screen readers
        announce the loading state. Live regions update without
        stealing focus:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="r-loader-ring" role="status" aria-live="polite">
  <span class="sr-only">Loading…</span>
</div>`}</code>
      </pre>

      <h2 id="sr-only">Screen-reader text</h2>
      <p>
        RoyCSS provides a <code>.sr-only</code> utility for visually
        hidden text that screen readers still announce. Use it for
        icon-only buttons and loaders:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}`}</code>
      </pre>

      <h2 id="touch-targets">Touch targets</h2>
      <p>
        Every interactive RoyCSS class has a minimum 44×44 px hit
        area (WCAG 2.5.5). Buttons and links enforce it via a{" "}
        <code>min-height</code> + <code>min-width</code> floor that
        survives font scaling.
      </p>

      <h2 id="audit">Audit your own usage</h2>
      <p>
        RoyCSS ships an a11y linter that flags common misuses:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss lint --a11y src/**/*.tsx
src/Loader.tsx:8   warning  Loader missing role="status"
src/Button.tsx:14  error    Icon-only button missing .sr-only text`}</code>
      </pre>
    </>
  );
}
