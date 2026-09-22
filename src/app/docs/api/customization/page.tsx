import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/api/customization",
  title: "Customization — RoyCSS Docs",
  description: "Customize RoyCSS honestly: copy an effect's CSS and edit it, override registered @property values, bridge to your design tokens, and disable motion.",
});

export default function CustomizationPage() {
  return (
    <>
      <h1>Customization</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS effects ship with their colors, sizes, and curves
        written directly in the CSS — there is deliberately no theme
        token layer, because that is what keeps all{" "}
        {EFFECT_COUNT_FORMATTED} classes drop-in with zero setup.
        Customization therefore means: copy the effect, own the
        copy. The CLI makes that a one-liner.
      </p>

      <h2 id="copy-and-edit">Copy and edit (the main path)</h2>
      <p>
        Every effect&apos;s CSS is small and self-contained, so the
        intended workflow is to vendor the effects you use and edit
        them freely:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Copy one effect's CSS to your clipboard
$ npx roycss add hover-push-up --copy

# Or write it to a file next to your styles
$ npx roycss add hover-push-up
Created roycss-hover-push-up.css

# Or export a hand-picked set into one stylesheet
$ npx roycss export btn-glow hover-push-up text-shimmer --out src/styles/roycss.css`}</code>
      </pre>
      <p>
        Then edit your copy — swap the OKLCH values, resize, or
        change the easing. The copy is yours; nothing in the package
        fights you:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Your vendored + edited copy of .roycss-btn-glow */
.roycss-btn-glow {
  background: oklch(0.55 0.22 25);   /* ← was emerald; now red */
  color: oklch(1 0 89.88);
  border: none;
  padding: 12px 28px;               /* ← your sizing */
  border-radius: 999px;             /* ← pill instead of 12px */
  ...
}`}</code>
      </pre>

      <h2 id="property-overrides">Registered @property overrides</h2>
      <p>
        A handful of effects animate registered custom properties
        (the <code>--roy-*</code> family) with{" "}
        <code>@property</code>. Because they are registered, you can
        re-declare them — for example, start the gradient-border
        card&apos;s sweep from a different angle:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Ships as initial-value: 0deg; keyframed to 360deg */
@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 90deg;   /* ← your override */
  inherits: false;
}`}</code>
      </pre>

      <h2 id="design-tokens">Design-token integration</h2>
      <p>
        Because your copy is plain CSS, bridging to a design-token
        file (Style Dictionary, W3C Design Tokens, Tailwind theme)
        is just editing the copy to reference your variables:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Your vendored copy, bridged to your tokens */
.roycss-btn-glow {
  background: var(--my-brand-primary);
  color: var(--my-text-on-primary);
  border-radius: var(--my-radius-md);
}`}</code>
      </pre>
      <p>
        The flip side is honest to state: overriding a token later
        re-themes only the copies you bridged, not effects still
        loaded from <code>dist/roycss.css</code>. For full brand
        control, vendor everything you use.
      </p>

      <h2 id="dark-mode">Dark mode</h2>
      <p>
        Effects are not tokenized, so there is no automatic light /
        dark switch. In practice this matters less than it sounds:
        most effects were authored against dark surfaces (the
        catalog previews use a dark theme), and effects that need a
        specific backdrop ship it — for example the neon effects
        carry their own dark background. For your vendored copies,
        use the media query directly:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-color-scheme: dark) {
  .roycss-btn-glow {          /* your copy */
    background: oklch(0.75 0.15 160);
    color: oklch(0.15 0.02 160);
  }
}`}</code>
      </pre>

      <h2 id="sizing">Sizing overrides</h2>
      <p>
        Many effects ship demo sizing ({" "}
        <code>inline-size: 140px</code> and friends) so they preview
        well in the catalog. Override the size in your own CSS —
        specificity of a second class in your stylesheet is enough:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.my-panel.roycss-border-gradient-animated {
  inline-size: auto;
  block-size: auto;
  padding: 24px;
}`}</code>
      </pre>

      <h2 id="disable-effects">Disabling motion</h2>
      <p>
        432 effect rules already ship a{" "}
        <code>prefers-reduced-motion: reduce</code> block that
        freezes or disables their animation. For your vendored
        copies and any page-level motion, keep the same contract:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-reduced-motion: reduce) {
  .roycss-btn-glow,        /* your copies */
  .roycss-hover-push-up {
    animation: none;
    transition-duration: 0.01ms;
  }
}`}</code>
      </pre>

      <h2 id="next-steps">Next steps</h2>
      <p>
        The{" "}
        <a className="text-primary hover:underline" href="/docs/guides/theming">
          Theming guide
        </a>{" "}
        walks through a full brand-color migration with a runnable
        example, and{" "}
        <a className="text-primary hover:underline" href="/docs/guides/creating-custom-effects">
          Creating custom effects
        </a>{" "}
        shows how to build your own effects in the same style.
      </p>
    </>
  );
}
