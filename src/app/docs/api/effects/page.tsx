import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/api/effects",
  title: "Effects API — RoyCSS Docs",
  description: "How RoyCSS effect classes work: the single stylesheet, class anatomy, self-contained classes, and the per-category API pages.",
});

export default function EffectsApiPage() {
  return (
    <>
      <h1>Effects API</h1>
      <p className="text-lg text-muted-foreground">
        The RoyCSS effects API is the surface you interact with every
        day: one self-contained CSS class per effect, composed on any
        element. All {EFFECT_COUNT_FORMATTED} classes ship in a single
        stylesheet — <code>dist/roycss.css</code> — so there is exactly
        one source of truth and no drift between files.
      </p>

      <h2 id="anatomy">Anatomy</h2>
      <p>
        Every effect is one CSS class in the{" "}
        <code>.roycss-</code> namespace. Most names lead with the
        category the effect belongs to:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-hover-push-up
   │      │
   │      └── effect name (push-up, scale, shimmer…)
   └──────── category prefix (hover, text, bg, btn, card…)
   (a handful of animations use the shorter roycss-anim- prefix)

/* Real examples from dist/roycss.css */
.roycss-hover-push-up      /* hover category */
.roycss-btn-glow           /* buttons category */
.roycss-text-shimmer       /* text category */
.roycss-bg-aurora          /* backgrounds category */
.roycss-loader-ring-spin   /* loaders category */
.roycss-card-gradient-border /* cards category */
.roycss-border-marching-ants /* borders category */`}</code>
      </pre>
      <p>
        Variants and second takes append a suffix ({" "}
        <code>-2</code>, <code>-v2</code>, or a batch tag like{" "}
        <code>-b18</code>) rather than a modifier system — for example{" "}
        <code>.roycss-text-shimmer-sweep-b18</code>. There are no{" "}
        <code>--modifier</code> or <code>-base</code> classes: each
        class carries its own padding, radius, colors, and hover
        state.
      </p>

      <h2 id="file-layout">File layout</h2>
      <p>
        The package is one stylesheet on purpose. In the published
        package you will find:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss/
  dist/
    roycss.css          ← every effect class (readable)
    roycss.min.css      ← same rules, minified
    roycss-critical.css ← curated above-the-fold subset
    roycss-fallbacks.css ← optional progressive enhancement
    effects.json        ← machine-readable catalog
    class-index.json    ← every class name + properties
    motion-library.json ← the motion subset (775 effects)`}</code>
      </pre>
      <p>
        There are no per-category files to import — see the{" "}
        <a className="text-primary hover:underline" href="/docs/guides/tree-shaking">
          tree-shaking guide
        </a>{" "}
        for shipping a subset with the CLI.
      </p>

      <h2 id="composition">Composition rules</h2>
      <p>
        RoyCSS classes are self-contained by design. Combine one
        structural effect (card, button) with one interaction effect
        (hover, loader) on the same element or in the same tree:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-glassmorphism">
  ...
  <button class="roycss-btn-glow">Save</button>
</article>`}</code>
      </pre>
      <p>
        Because every class sets its own colors, padding, and
        transitions, stacking two effects that fight over the same
        property (two hover transforms, for instance) means the
        last-declared one wins — you almost never want this. Pick one
        effect per element per concern.
      </p>

      <h2 id="variables">Custom-property consumption</h2>
      <p>
        A small number of effects animate a registered custom
        property (e.g. the gradient-border card keyframes its own{" "}
        <code>--roy-gb-angle</code> from <code>0deg</code> to{" "}
        <code>360deg</code>). These are per-effect properties
        registered with <code>@property</code> — they are listed in
        the effect&apos;s CSS, not on a shared{" "}
        <code>:root</code> token set. You can print any effect&apos;s
        full CSS with the CLI:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss-cli info hover-push-up

Push Up (roycss-hover-push-up)

Description: Element lifts up while a shadow grows beneath it like it's floating
Category: Hover Effects
Tags: push, lift, float, hover
Preview Type: box

CSS:
/* Hover Push Up */
.roycss-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-push-up:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px -10px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}

Add to project: roycss add hover-push-up
Copy to clipboard: roycss add hover-push-up --copy`}</code>
      </pre>
      <p>
        Every effect page in the{" "}
        <a className="text-primary hover:underline" href="/effects">
          catalog
        </a>{" "}
        shows the same CSS with a copy button.
      </p>

      <h2 id="categories-list">The category API pages</h2>
      <p>
        RoyCSS groups its {EFFECT_COUNT_FORMATTED} effects into{" "}
        {CATEGORY_COUNT} categories. Seven of them have a dedicated
        API page with the full class list:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><a className="text-primary hover:underline" href="/docs/api/effects/hover">Hover Effects</a> — roycss-hover-* push-up, scale, glow</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/text">Text Effects</a> — roycss-text-* shimmer, gradient</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/backgrounds">Backgrounds</a> — roycss-bg-* aurora, mesh</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/loaders">Loaders</a> — roycss-loader-* ring, dots</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/buttons">Buttons</a> — roycss-btn-* glow, pulse</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/cards">Cards</a> — roycss-card-* glass, gradient-border</li>
        <li><a className="text-primary hover:underline" href="/docs/api/effects/borders">Borders</a> — roycss-border-* marching-ants, neon-pulse</li>
      </ul>
      <p>
        For the remaining categories, browse the{" "}
        <a className="text-primary hover:underline" href="/effects">
          full effect catalog
        </a>{" "}
        — every category and effect has its own page.
      </p>

      <h2 id="data-exports">Machine-readable exports</h2>
      <p>
        Tooling (the CLI, the MCP server, editors) reads the same
        catalog the stylesheet is built from — so the class list you
        see in the docs and the CSS you ship can never drift:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import catalog from "roycss/effects.json";   // all ${EFFECT_COUNT_FORMATTED} effects
import motion  from "roycss/motion-library"; // the 775-effect motion subset
import classes from "roycss/class-index";    // every class name + properties`}</code>
      </pre>
    </>
  );
}
