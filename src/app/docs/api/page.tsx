import Link from "next/link";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference — RoyCSS Docs",
  description:
    "The RoyCSS class system: the .roycss-{category}-{name} pattern, OKLCH CSS variables, and zero-JS conventions across 1,749 effects in 28 categories.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3">
        API Reference
      </p>
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        RoyCSS API Overview
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-7">
        RoyCSS is a zero-JavaScript effect library that ships 1,749
        production-ready effects across 28 categories. Every effect is a plain
        CSS class you can drop onto any element — no runtime, no virtual DOM
        diffing, no framework lock-in.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">The class system</h2>
      <p className="mb-4 leading-7">
        All RoyCSS utility classes follow a single, predictable naming pattern.
        This makes them easy to memorize, easy to grep, and easy for AI
        assistants to suggest:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`.roycss-{category}-{name}
.roycss-{category}-{name}--{modifier}

/* Examples */
.roycss-hover-lift
.roycss-hover-glow--amber
.roycss-anim-fade-in-up
.roycss-loader-spinner--lg`}</code>
      </pre>
      <p className="mb-4 leading-7">
        The <code className="text-emerald-600 dark:text-emerald-400">category</code>{" "}
        segment maps directly to one of the 28 effect categories (hover, text,
        backgrounds, loaders, buttons, cards, animations, and so on). The{" "}
        <code className="text-emerald-600 dark:text-emerald-400">name</code>{" "}
        segment is the effect slug. Modifiers are optional and use a double-dash
        separator, mirroring BEM conventions.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">CSS variables</h2>
      <p className="mb-4 leading-7">
        Every effect reads its colors, durations, and motion curves from CSS
        custom properties. Colors use the modern OKLCH color space for
        perceptually uniform lightness, which makes theming and accessibility
        adjustments trivial.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`:root {
  /* OKLCH design tokens */
  --roy-accent: oklch(0.72 0.19 152);
  --roy-accent-fg: oklch(0.98 0.01 152);

  /* Motion tokens */
  --roy-duration: 280ms;
  --roy-ease: cubic-bezier(0.22, 1, 0.36, 1);

  /* Surface tokens */
  --roy-surface: oklch(0.18 0.01 250);
  --roy-surface-fg: oklch(0.96 0.01 250);
}`}</code>
      </pre>
      <p className="mb-4 leading-7">
        Override any token at the document, section, or component level. Effects
        automatically pick up the new values — no recompilation, no build step.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">Zero-JS contract</h2>
      <p className="mb-4 leading-7">
        RoyCSS ships a single CSS file. There is no client runtime, no
        JavaScript entry point, and no polyfills. The library weighs roughly
        18&nbsp;KB minified and gzipped for the full bundle, and tree-shakes to
        under 2&nbsp;KB when you import only the categories you use.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`/* Import everything */
@import "roycss/css";

/* Or import only what you need */
@import "roycss/css/hover";
@import "roycss/css/text";
@import "roycss/css/loaders";`}</code>
      </pre>

      <h2 className="text-2xl font-semibold mt-10 mb-3">Where to go next</h2>
      <ul className="space-y-2 mb-6 list-disc pl-6">
        <li>
          <Link
            href="/docs/api/effects"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Effects API
          </Link>{" "}
          — how effect classes are structured and composed.
        </li>
        <li>
          <Link
            href="/docs/api/roymotion"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            RoyMotion API
          </Link>{" "}
          — spring easing and animation tokens.
        </li>
        <li>
          <Link
            href="/docs/api/customization"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Customization API
          </Link>{" "}
          — overriding variables and creating themes.
        </li>
      </ul>
    </div>
  );
}
