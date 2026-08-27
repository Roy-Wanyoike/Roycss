import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Properties — RoyCSS Docs",
  description: "RoyCSS exposes every themeable value as a CSS custom property. Retheme without touching effect files.",
};

export default function CustomPropertiesPage() {
  return (
    <>
      <h1>Custom Properties</h1>
      <p className="text-lg text-muted-foreground">
        Every themeable value in RoyCSS is a CSS custom property —
        colors, distances, durations, easing curves. You override
        them on any container, no SCSS, no build step.
      </p>

      <h2 id="naming">Naming convention</h2>
      <p>
        All RoyCSS custom properties start with{" "}
        <code>--r-</code>, followed by the category, then the value:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`--r-accent              color   primary accent
--r-accent-strong       color   stronger accent (hovers)
--r-bg                  color   background
--r-fg                  color   foreground
--r-hover-lift          length  how far hover lifts (4px default)
--r-duration            time    default transition (180ms)
--r-easing              curve   default cubic-bezier
--r-radius              length  default border radius`}</code>
      </pre>

      <h2 id="overrides">Overriding from CSS</h2>
      <p>
        Set the variables on <code>:root</code> to retheme globally,
        or on a container to scope a theme:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Global retheme — teal instead of emerald */
:root {
  --r-accent: oklch(70% 0.11 195);
  --r-accent-strong: oklch(56% 0.13 195);
}

/* Scoped theme — only this section is amber */
.marketing-amber {
  --r-accent: oklch(80% 0.16 75);
  --r-accent-strong: oklch(65% 0.18 75);
}`}</code>
      </pre>

      <h2 id="typed-properties">Typed properties with @property</h2>
      <p>
        RoyCSS registers typed custom properties via{" "}
        <code>@property</code> so they can be animated by the browser
        directly. You don’t need to do anything — but if you define
        your own, follow the same pattern:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@property --r-hover-lift {
  syntax: "<length>";
  inherits: true;
  initial-value: 4px;
}

/* Now the browser can interpolate the lift */
.r-hover-lift {
  transition: --r-hover-lift 200ms ease-out;
}
.r-hover-lift:hover { --r-hover-lift: 12px; }`}</code>
      </pre>

      <h2 id="dark-mode">Dark mode</h2>
      <p>
        RoyCSS dark mode is just a different set of custom properties
        inside <code>prefers-color-scheme</code>. No JS, no flash:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  --r-bg: oklch(99% 0.01 200);
  --r-fg: oklch(15% 0.02 200);
  --r-accent: oklch(58% 0.20 165);
}

@media (prefers-color-scheme: dark) {
  :root {
    --r-bg: oklch(15% 0.02 200);
    --r-fg: oklch(96% 0.01 200);
    --r-accent: oklch(72% 0.18 165);
  }
}`}</code>
      </pre>

      <h2 id="runtime-tweaks">Runtime tweaks</h2>
      <p>
        Because custom properties are live, you can swap themes at
        runtime from JS without a reload — useful for theme pickers
        and A/B tests:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`document.documentElement.style.setProperty(
  "--r-accent",
  "oklch(70% 0.15 35)"  // amber
);`}</code>
      </pre>

      <h2 id="specificity">Specificity</h2>
      <p>
        Custom properties are subject to the cascade — the most
        specific declaration wins. If your override doesn’t apply,
        check that you aren’t being beaten by a more specific rule.
        A common gotcha is overriding on <code>:root</code> while
        RoyCSS is loaded later in the cascade.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Wrong — RoyCSS @import below this rule wins */
:root { --r-accent: oklch(80% 0.16 75); }
@import "roycss/effects.css";

/* Right — load RoyCSS first, override after */
@import "roycss/effects.css";
:root { --r-accent: oklch(80% 0.16 75); }`}</code>
      </pre>
    </>
  );
}
