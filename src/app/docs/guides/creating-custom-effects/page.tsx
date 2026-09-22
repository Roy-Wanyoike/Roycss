import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/docs/guides/creating-custom-effects",
  title: "Custom Effects — RoyCSS Docs",
  description: "Build your own RoyCSS-style effect: naming, reduced-motion guards, @property where needed, and keeping the CSS-first discipline.",
});

export default function CreatingCustomEffectsPage() {
  return (
    <>
      <h1>Creating Custom Effects</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is open CSS — nothing stops you from writing your
        own effect class in the same style. This guide walks
        through the conventions the shipped effects follow, so
        yours feel native next to them.
      </p>

      <h2 id="anatomy">Anatomy of a RoyCSS effect</h2>
      <p>
        Every shipped effect follows the same structure. Mimic it
        for your own:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* 1. Title comment, like the shipped effects */
/* my-hover-wobble — playful 4deg wobble on hover */

/* 2. The base rule (self-contained: own easing, own timing) */
.my-hover-wobble {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 3. The interaction rule */
.my-hover-wobble:hover {
  animation: my-wobble 600ms ease-out;
}

/* 4. The keyframes — prefix them with your own namespace */
@keyframes my-wobble {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-4deg); }
  75%  { transform: rotate(4deg); }
  100% { transform: rotate(0deg); }
}

/* 5. Reduced-motion guard — 432 shipped rules carry one */
@media (prefers-reduced-motion: reduce) {
  .my-hover-wobble:hover { animation: none; }
}`}</code>
      </pre>

      <h2 id="naming">Naming your effect</h2>
      <p>
        The library namespace is <code>roycss-*</code>. Your custom
        effects are yours — use your own prefix so they never
        collide with (or get flagged against) the catalog:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Good — your own prefix, category-led, kebab-case */
.my-hover-wobble
.my-btn-shine

/* Good too — project prefix */
.acme-card-spotlight

/* Avoid — collides with the library namespace;
   roycss doctor will report it as an unknown
   roycss-* class (possible typo) */
.roycss-hover-wobble

/* Avoid — generic name, collides with anything */
.wobble`}</code>
      </pre>
      <p>
        Exception: if you intend to contribute the effect upstream
        (see below), name it <code>roycss-</code>-style from the
        start — the maintainer&apos;s checklist expects the
        convention.
      </p>

      <h2 id="registered-props">Animate with @property when CSS can&apos;t</h2>
      <p>
        The trick behind the shipped rotating rims: register a
        typed custom property so the browser can interpolate it in
        keyframes. Use it for anything CSS has no syntax to tween:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real pattern from dist/roycss.css */
@property --my-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.my-rim {
  background: linear-gradient(var(--my-angle), …);
  animation: my-rim-spin 4s linear infinite;
}

@keyframes my-rim-spin {
  to { --my-angle: 360deg; }
}`}</code>
      </pre>

      <h2 id="composability">Stay composable</h2>
      <p>
        Shipped effects avoid fighting over the same property.
        Don&apos;t write a custom effect that clobbers{" "}
        <code>transform</code> another effect is using:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Bad — !important overrides any co-applied hover lift */
.my-hover-wobble:hover {
  transform: translateY(8px) !important;
}

/* Good — animate via keyframes only; the wobble
   composes with a separate lift transition */
.my-hover-wobble:hover {
  animation: my-wobble 600ms ease-out;
}`}</code>
      </pre>

      <h2 id="scaffold">Scaffold a starting point</h2>
      <p>
        The CLI can scaffold a working project with one effect
        wired up — a good base for building your own on top:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss create my-site --template vanilla --effect pulse-glow

✓ Project created at my-site
  roycss.css   ← starts with the pulse-glow effect's CSS

# add more shipped effects as you build:
$ npx roycss add btn-glow`}</code>
      </pre>

      <h2 id="share">Share your effect</h2>
      <p>
        Custom effects that follow the conventions can be PR&apos;d
        back to the RoyCSS library — the catalog itself grew by
        authoring batches (you&apos;ll see <code>-b18</code> /{" "}
        <code>-b19</code> suffixes from that process). See the{" "}
        <a className="text-primary hover:underline" href="/docs/guides/contributing">
          Contributing
        </a>{" "}
        guide for the submission checklist.
      </p>
    </>
  );
}
