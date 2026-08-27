import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your First Effect — RoyCSS Docs",
  description: "Step-by-step tutorial: add a hover lift effect with an emerald glow, all in pure CSS with zero JS.",
};

export default function FirstEffectPage() {
  return (
    <>
      <h1>Your First Effect</h1>
      <p className="text-lg text-muted-foreground">
        In this tutorial you’ll wire up a card with a hover lift and
        an emerald glow button — the RoyCSS “hello world”. Zero
        JavaScript, zero config, two classes.
      </p>

      <h2 id="prereqs">Prerequisites</h2>
      <p>
        RoyCSS already installed in your project. If not, follow the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/installation">
          Installation
        </a>{" "}
        guide first.
      </p>

      <h2 id="step-1-import">Step 1 — Import the categories you need</h2>
      <p>
        We need the hover, cards, and buttons categories for this
        tutorial. Drop these imports in your global stylesheet or app
        entry point:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/effects/hover.css";
import "roycss/effects/cards.css";
import "roycss/effects/buttons.css";`}</code>
      </pre>

      <h2 id="step-2-markup">Step 2 — The markup</h2>
      <p>
        RoyCSS is markup-agnostic. A plain <code>&lt;div&gt;</code> or
        <code>&lt;article&gt;</code> works — no special components
        required.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-hover-lift">
  <h3>Pricing — Starter</h3>
  <p>$9 / user / month</p>
  <button type="button" class="r-btn-glow-emerald">
    Start free trial
  </button>
</article>`}</code>
      </pre>

      <h2 id="step-3-result">Step 3 — What you’ll see</h2>
      <p>
        Hover the card: it lifts 4px on the Y axis (a GPU
        <code>transform: translateY</code> — no layout cost), casts a
        soft emerald shadow, and eases in over 180ms. Click the
        button: an emerald halo blooms behind it.
      </p>
      <p>
        All of this happens with zero JavaScript. The hover and click
        states are pure CSS pseudo-classes.
      </p>

      <h2 id="step-4-customize">Step 4 — Customize via CSS variables</h2>
      <p>
        Every themeable value in RoyCSS is an OKLCH custom property.
        Override them on <code>:root</code> (or any container) to
        retheme without touching effect files:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  /* Switch the entire library from emerald to teal */
  --r-accent: oklch(70% 0.11 195);
  --r-accent-strong: oklch(56% 0.13 195);

  /* Make hover lifts more pronounced */
  --r-hover-lift: 8px;
}`}</code>
      </pre>

      <h2 id="step-5-reduced-motion">Step 5 — Respect reduced motion</h2>
      <p>
        RoyCSS ships with a global <code>prefers-reduced-motion</code>
        guard that disables non-essential motion for users who ask
        for it. If you author your own overrides, keep the same
        contract — wrap them in a media query:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-reduced-motion: reduce) {
  .r-hover-lift:hover {
    transform: none;        /* no movement */
    box-shadow: 0 0 0 1px var(--r-accent); /* but keep the cue */
  }
}`}</code>
      </pre>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>
        If nothing happens on hover, check three things:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          The stylesheet is loaded. Open DevTools → Sources and confirm
          <code>hover.css</code> shows up.
        </li>
        <li>
          The class is spelled correctly. RoyCSS classes are
          kebab-case prefixed with <code>r-</code> (e.g.{" "}
          <code>r-hover-lift</code>, not <code>r-hover-Lift</code>).
        </li>
        <li>
          You are not running <code>prefers-reduced-motion: reduce</code>{" "}
          in your OS — RoyCSS respects it and disables motion.
        </li>
      </ul>

      <h2 id="whats-next">What’s next</h2>
      <p>
        You now have the full RoyCSS workflow. Head to the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects">
          Effects API
        </a>{" "}
        reference to browse all 1,869 effects, or read about the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/concepts/css-first">
          CSS-first architecture
        </a>{" "}
        to understand why no JavaScript is involved.
      </p>
    </>
  );
}
