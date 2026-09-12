import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSS-First Architecture — RoyCSS Docs",
  description: "Why RoyCSS is built with zero JavaScript runtime. The CSS-first philosophy, tradeoffs, and when to break the rule.",
};

export default function CssFirstPage() {
  return (
    <>
      <h1>CSS-First Architecture</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is built on a single rule: if an effect can be expressed
        in CSS, it must be. There is no JavaScript runtime — no
        observers, no rAF loops, no hydration step. You ship CSS, the
        browser does the rest.
      </p>

      <h2 id="philosophy">The philosophy</h2>
      <p>
        Most animation libraries reach for JavaScript the moment a
        transition gets non-trivial. RoyCSS takes the opposite stance.
        The library uses every modern CSS feature — keyframes,
        <code>@property</code>, scroll-driven animations, container
        queries, <code>color-mix()</code>, <code>oklch()</code>,
        <code>prefers-reduced-motion</code> — to express effects that
        used to require JS.
      </p>
      <p>
        The payoff:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Zero JS</strong> — your bundle stays small.</li>
        <li><strong>No hydration</strong> — effects are present on first paint, before React/Vue mount.</li>
        <li><strong>No layout thrash</strong> — transforms and opacity are GPU-composited.</li>
        <li><strong>Survives SSR</strong> — no flash of unstyled content, no hydration mismatch.</li>
      </ul>

      <h2 id="what-css-can-do">What CSS can do today</h2>
      <p>
        Here is the toolbox RoyCSS leans on. Each entry used to need
        JavaScript; none of them do anymore:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* @property — typed custom properties, animatable.
   Real registration from dist/roycss.css: */
@property --roy-gb-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* Scroll-driven animation — no JS observer.
   Real pattern from the scroll category: */
.roycss-scroll-timeline-spin {
  animation: roy-b10-sts-spin 1s linear;
  animation-timeline: scroll(root block);
}

/* color-mix() — runtime color blending.
   Real declaration from .roycss-hover-push-up: */
box-shadow: 0 20px 40px -10px
  color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);`}</code>
      </pre>

      <h2 id="what-still-needs-js">What still needs JS</h2>
      <p>
        A small set of interactions cannot be expressed in CSS
        today and RoyCSS is honest about it — the library simply
        does not ship them. When you hit one of these, write the
        few lines of JS yourself and let a RoyCSS class provide
        the visual layer:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Mouse-position-tracked 3D tilt (hover state is not pointer position).</li>
        <li>Canvas/WebGL scenes (neon tunnels, particle networks).</li>
        <li>Multi-element scroll choreography beyond <code>animation-timeline</code>.</li>
        <li>Audio-reactive visualizers.</li>
      </ul>
      <p>
        The catalog&apos;s motion subset is documented on the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/roymotion">
          RoyMotion
        </a>{" "}
        page — including the pattern for bridging your own JS to a
        RoyCSS effect via custom properties.
      </p>

      <h2 id="progressive-enhancement">Progressive enhancement</h2>
      <p>
        Because the base layer is plain CSS, RoyCSS effects work in
        any browser — old browsers just see the underlying element
        without the animation. There is no broken state, only a
        simpler state. Pair it with <code>@supports</code> guards if
        you want stricter behavior:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real fallback shipped for .roycss-scroll-timeline-spin */
@supports not (animation-timeline: scroll(root block)) {
  .roycss-scroll-timeline-spin {
    animation: roy-b10-sts-spin 3s linear infinite;
  }
}`}</code>
      </pre>

      <h2 id="when-to-break-the-rule">When to break the rule</h2>
      <p>
        CSS-first is a default, not a religion. Three legitimate
        reasons to add JS:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>The effect requires user input that has no CSS hook.</li>
        <li>You need to coordinate multiple elements precisely (e.g. choreographed sequence).</li>
        <li>You are integrating with a JS-first router or framework that already bundles JS.</li>
      </ul>
      <p>
        For those cases RoyCSS gives you a stable escape hatch — see
        the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/guides/creating-custom-effects">
          Custom Effects
        </a>{" "}
        guide.
      </p>
    </>
  );
}
