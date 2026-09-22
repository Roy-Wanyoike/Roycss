import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/docs/concepts/custom-properties",
  title: "Custom Properties — RoyCSS Docs",
  description: "How RoyCSS actually uses CSS custom properties: registered --roy-* @property values that effects animate, and what that means for you.",
});

export default function CustomPropertiesPage() {
  return (
    <>
      <h1>Custom Properties</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS does not use custom properties as a global theming
        layer — colors and sizes are written directly into each
        effect so every class is drop-in. What the library{" "}
        <em>does</em> use custom properties for is animation: a
        small set of per-effect <code>--roy-*</code> properties,
        registered with <code>@property</code> so the browser can
        interpolate them.
      </p>

      <h2 id="naming">The --roy-* family</h2>
      <p>
        Registered custom properties are named{" "}
        <code>--roy-&lt;effect&gt;-&lt;value&gt;</code> — they belong
        to one effect, not to a theme:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`--roy-gb-angle       angle   .roycss-card-gradient-border sweep
--roy-bg-angle       angle   .roycss-border-gradient-animated sweep
--roy-holo-angle     angle   hologram scan rotation
--roy-b16-tilt       angle   batch-16 tilt effect
--roy-b12-rating-fill length rating bar fill
--roy-dash-color     color   marching-dash color`}</code>
      </pre>
      <p>
        For the full list, grep the stylesheet — every registration
        sits next to the effect that uses it:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ grep -n "@property" node_modules/roycss/dist/roycss.css`}</code>
      </pre>

      <h2 id="why-at-property">Why @property</h2>
      <p>
        An unregistered custom property is treated as an opaque
        string — it cannot be transitioned or animated. Registering
        it with a <code>syntax</code> gives the browser a type to
        interpolate, which is how RoyCSS animates things CSS has no
        keyframe syntax for, like gradient angles:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real code from dist/roycss.css */
@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.roycss-card-gradient-border::before {
  background: linear-gradient(var(--roy-gb-angle), …);
  animation: roy-card-gb-rotate 4s linear infinite;
}

@keyframes roy-card-gb-rotate {
  to { --roy-gb-angle: 360deg; }
}`}</code>
      </pre>
      <p>
        If you author your own effects, follow the same pattern —
        register the property, animate it in keyframes. That is the
        entire trick behind the rotating rims and sweeping borders.
      </p>

      <h2 id="overriding">Overriding a registered value</h2>
      <p>
        Because <code>@property</code> rules are plain CSS, you can
        re-declare one to change an effect&apos;s starting point —
        for example, begin the gradient sweep at 90° instead of 0°:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 90deg;   /* was 0deg */
  inherits: false;
}`}</code>
      </pre>
      <p>
        Note <code>inherits: false</code> on the real declarations:
        the value is scoped to the elements using the effect, so an
        override on a container does not leak to unrelated
        elements.
      </p>

      <h2 id="no-theme-layer">What about theming?</h2>
      <p>
        There is no <code>:root</code> token set to override —
        retheming an effect means copying its CSS and editing the
        values. The CLI gets you the copy in one command, and the{" "}
        <a className="text-primary hover:underline" href="/docs/api/customization">
          Customization page
        </a>{" "}
        walks through the workflow:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss add btn-glow --copy   # CSS on your clipboard`}</code>
      </pre>

      <h2 id="runtime-tweaks">Runtime tweaks</h2>
      <p>
        Your own custom properties remain live of course — set them
        from JS and anything referencing them updates without a
        reload. A common pattern: your JS drives positional
        properties while a RoyCSS class provides the visual:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`el.style.setProperty("--my-x", e.clientX);`}</code>
      </pre>
    </>
  );
}
