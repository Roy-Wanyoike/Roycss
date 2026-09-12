import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Accessibility — RoyCSS Docs",
  description: "RoyCSS accessibility: per-effect reduced-motion guards, focus-visible utilities, sr-only helpers, and how not to encode meaning in motion.",
};

export default function AccessibilityPage() {
  return (
    <>
      <h1>Accessibility</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS effects are decorative layers on top of your real
        UI. The library&apos;s job is to stay out of the way: 432
        effect rules ship their own reduced-motion guard, utilities
        exist for focus rings and screen-reader text, and nothing
        in the {EFFECT_COUNT_FORMATTED}-effect catalog assumes it
        is the only affordance on the page.
      </p>

      <h2 id="reduced-motion">Reduced motion</h2>
      <p>
        Effects that animate ship a{" "}
        <code>prefers-reduced-motion: reduce</code> block next to
        the effect itself — not a single global kill-switch, so the
        guards match what each effect actually does:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real code from dist/roycss.css */
@media (prefers-reduced-motion: reduce) {
  .roycss-loader-ring-spin { animation: none; }
}

/* The pattern to copy for your own effects */
@media (prefers-reduced-motion: reduce) {
  .your-effect {
    animation: none;
    transition-duration: 0.01ms;
  }
}`}</code>
      </pre>
      <p>
        Effects that carry meaning (focus rings, form state) are
        not disabled by their guards — only decorative motion.
        Every effect&apos;s full CSS (including its guard, or its
        deliberate lack of one) is shown on the effect&apos;s
        page in the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/effects">
          catalog
        </a>
        , so you can check before you commit.
      </p>

      <h2 id="not-color-alone">Never meaning in motion alone</h2>
      <p>
        A RoyCSS class is a visual layer — it does not know whether
        the element it decorates is an error, a success, or a
        navigation item. The rule the library follows (and asks you
        to keep): never encode meaning in the effect alone. Pair a
        pulsing border with an icon or text, keep errors red{" "}
        <em>and</em> labeled, and let the effect be the garnish:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<!-- Meaning carried by text + icon; effect is decorative -->
<button type="button" class="roycss-btn-neon">
  <span aria-hidden="true">⚠</span> Delete project
</button>`}</code>
      </pre>

      <h2 id="focus-visible">Keyboard focus</h2>
      <p>
        The library ships a dedicated focus-ring utility that
        targets <code>:focus-visible</code> — the ring appears for
        keyboard and AT users, never on mouse click — and form
        effects (checkboxes, radios, toggles) carry their own{" "}
        <code>:focus-visible</code> styles. Button and card classes
        deliberately do <em>not</em> impose a focus ring: your app
        or framework should own focus styling:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real code from dist/roycss.css */
.roycss-ferrum-focus-visible-ring:focus-visible {
  outline: 3px solid oklch(0.546 0.215 262.88);
  outline-offset: 2px;
  border-radius: 4px;
  transition: outline-color 0.15s ease;
}

.roycss-ferrum-focus-visible-ring:focus:not(:focus-visible) {
  outline: none;
}`}</code>
      </pre>

      <h2 id="contrast">Contrast is yours to verify</h2>
      <p>
        Effects ship fixed OKLCH colors — what contrast they hit
        depends on the surface you drop them onto. The neon and
        text-glow effects in particular assume dark backgrounds.
        Check the pairing once per page (browser devtools compute
        contrast for you), and remember WCAG exempts purely
        decorative elements while requiring 4.5:1 for text.
      </p>

      <h2 id="aria">ARIA-friendly patterns</h2>
      <p>
        Loaders announce themselves when you add{" "}
        <code>role="status"</code>; icon-only controls need
        screen-reader text. The library ships the utility for both:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<div class="roycss-loader-ring-spin" role="status" aria-live="polite">
  <span class="roycss-sr-only">Loading…</span>
</div>`}</code>
      </pre>

      <h2 id="sr-only">Screen-reader text</h2>
      <p>
        The base stylesheet ships{" "}
        <code>.roycss-sr-only</code> (plus a{" "}
        <code>.roycss-ferrum-sr-only</code> variant with a{" "}
        <code>.focusable</code> modifier that unhides on focus —
        built for skip links):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real code from dist/roycss.css */
.roycss-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}`}</code>
      </pre>

      <h2 id="audit">Audit your own usage</h2>
      <p>
        <code>roycss doctor</code> checks that you actually import
        the stylesheet and flags unknown class names, and the
        catalog&apos;s per-effect tags tell you which effects are
        motion-safe before you use them:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss doctor`}</code>
      </pre>
    </>
  );
}
