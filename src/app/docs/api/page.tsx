import Link from "next/link";
import { type Metadata } from "next";
import {
  EFFECT_COUNT_FORMATTED,
  CATEGORY_COUNT,
  FULL_CSS_MIN_GZ_KB,
} from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "API Reference — RoyCSS Docs",
  description:
    `The RoyCSS class system: the .roycss-* namespace, OKLCH colors, and zero-runtime conventions across ${EFFECT_COUNT_FORMATTED} effects in ${CATEGORY_COUNT} categories.`,
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-primary mb-3">
        API Reference
      </p>
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        RoyCSS API Overview
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-7">
        RoyCSS is a zero-runtime effect library that ships{" "}
        {EFFECT_COUNT_FORMATTED} production-ready effects across{" "}
        {CATEGORY_COUNT} categories. Every effect is one plain CSS
        class in the <code>.roycss-*</code> namespace — drop it onto
        any element and you are done. No client runtime, no virtual
        DOM diffing, no framework lock-in.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">The class system</h2>
      <p className="mb-4 leading-7">
        All RoyCSS classes live under a single{" "}
        <code className="text-primary">roycss-</code>{" "}
        prefix, and most names lead with the category they belong
        to. This makes them easy to memorize, easy to grep, and easy
        for AI assistants to suggest:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`.roycss-{name}
/* name usually starts with its category prefix */

/* Real examples from dist/roycss.css */
.roycss-hover-push-up        /* hover category */
.roycss-btn-glow             /* buttons category */
.roycss-text-shimmer         /* text category */
.roycss-bg-aurora            /* backgrounds category */
.roycss-loader-ring-spin     /* loaders category */`}</code>
      </pre>
      <p className="mb-4 leading-7">
        The <code className="text-primary">category</code>{" "}
        prefix maps to one of the {CATEGORY_COUNT} categories (hover,
        text, backgrounds, loaders, buttons, cards, animations, and
        so on); the rest of the name is the effect slug. Variant
        takes append a suffix (<code>-2</code>, <code>-v2</code>, or
        a batch tag like <code>-b18</code>) — there are no{" "}
        <code>--modifier</code> classes and no <code>-base</code>{" "}
        classes: every class is self-contained, carrying its own
        padding, radius, colors, and hover state.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">Colors: OKLCH, hardcoded per effect</h2>
      <p className="mb-4 leading-7">
        Every effect ships with its own OKLCH colors written
        directly in the rule — that is what keeps each class
        drop-in: no token layer to install, no cascade surprises.
        The modern OKLCH color space keeps lightness perceptually
        uniform, which is what lets {EFFECT_COUNT_FORMATTED} effects
        ship with consistent-looking colors:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`/* From .roycss-btn-glow in dist/roycss.css */
.roycss-btn-glow {
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
  ...
}

/* A few effects animate a registered custom property instead —
   e.g. the gradient-border card keyframes --roy-gb-angle: */
@keyframes roy-card-gb-rotate {
  to { --roy-gb-angle: 360deg; }
}`}</code>
      </pre>
      <p className="mb-4 leading-7">
        To retheme an effect, copy its CSS (every effect page shows
        the full source) and edit the values — see the{" "}
        <Link
          href="/docs/api/customization"
          className="text-primary hover:underline"
        >
          Customization API
        </Link>
        .
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-3">Zero-runtime contract</h2>
      <p className="mb-4 leading-7">
        RoyCSS ships a single CSS file. There is no client runtime
        and no polyfill: import the stylesheet and the classes just
        work. The full minified stylesheet is{" "}
        {FULL_CSS_MIN_GZ_KB}&nbsp;KB gzipped — when you only need a
        handful of effects, export a subset with the CLI instead of
        shipping the whole file:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm mb-6">
        <code>{`/* Everything (app entry or globals.css) */
@import "roycss/css/min";

/* Or a hand-picked subset, via the CLI */
$ npx roycss export btn-glow hover-push-up text-shimmer --out src/styles/roycss.css`}</code>
      </pre>

      <h2 className="text-2xl font-semibold mt-10 mb-3">Where to go next</h2>
      <ul className="space-y-2 mb-6 list-disc pl-6">
        <li>
          <Link
            href="/docs/api/effects"
            className="text-primary hover:underline"
          >
            Effects API
          </Link>{" "}
          — how effect classes are structured and composed.
        </li>
        <li>
          <Link
            href="/docs/api/roymotion"
            className="text-primary hover:underline"
          >
            RoyMotion API
          </Link>{" "}
          — the motion subset of the catalog.
        </li>
        <li>
          <Link
            href="/docs/api/customization"
            className="text-primary hover:underline"
          >
            Customization API
          </Link>{" "}
          — retheming effects and creating your own.
        </li>
      </ul>
    </div>
  );
}
