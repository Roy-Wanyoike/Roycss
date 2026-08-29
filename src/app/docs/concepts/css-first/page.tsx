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
        <code>{`/* @property — typed custom properties, animatable */
@property --r-accent {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(72% 0.18 165);
}

/* Scroll-driven animation — no JS observer */
@keyframes r-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
section { animation: r-reveal; animation-timeline: view(); }

/* Container queries — responsive without JS */
@container (min-width: 480px) {
  .r-card { grid-template-columns: 1fr 1fr; }
}

/* color-mix() — runtime color blending */
.r-hover-tint:hover {
  background: color-mix(in oklch, var(--r-accent) 12%, transparent);
}`}</code>
      </pre>

      <h2 id="what-still-needs-js">What still needs JS</h2>
      <p>
        A small set of effects cannot be expressed in CSS alone and
        RoyCSS is honest about it. These live in the optional{" "}
        <code>roycss/roymotion</code> package, which adds ~3 KB of JS
        only when imported:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Mouse-tracked 3D tilt (no pointer event without JS).</li>
        <li>Canvas/WebGL effects (neon tunnels, particle networks).</li>
        <li>Multi-step scroll-scrubbing beyond <code>animation-timeline</code>.</li>
        <li>Audio-reactive visualizers.</li>
      </ul>
      <p>
        See the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/roymotion">
          RoyMotion
        </a>{" "}
        page for those opt-in JS-powered effects.
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
        <code>{`@supports (animation-timeline: view()) {
  .r-reveal-on-scroll {
    animation: r-reveal linear;
    animation-timeline: view();
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
