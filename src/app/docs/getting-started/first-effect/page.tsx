import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Your First Effect — RoyCSS Docs",
  description: "Step-by-step tutorial: add a hover lift effect with an emerald glow, all in pure CSS with zero JS.",
};

export default function FirstEffectPage() {
  return (
    <>
      <h1>Your First Effect</h1>
      <p className="text-lg text-muted-foreground">
        In this tutorial you&apos;ll wire up a card with a glass
        surface and an emerald glow button — the RoyCSS
        &quot;hello world&quot;. Zero JavaScript, zero config, two
        classes.
      </p>

      <h2 id="prereqs">Prerequisites</h2>
      <p>
        RoyCSS already installed in your project. If not, follow the{" "}
        <a className="text-primary hover:underline" href="/docs/getting-started/installation">
          Installation
        </a>{" "}
        guide first.
      </p>

      <h2 id="step-1-import">Step 1 — Import the stylesheet</h2>
      <p>
        Every class ships in one stylesheet, so a single import is
        all you need. Drop it in your global stylesheet or app
        entry point:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/css";
/* or the minified twin: import "roycss/css/min" */`}</code>
      </pre>

      <h2 id="step-2-markup">Step 2 — The markup</h2>
      <p>
        RoyCSS is markup-agnostic. A plain <code>&lt;div&gt;</code> or
        <code>&lt;article&gt;</code> works — no special components
        required.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-glassmorphism">
  <h3>Pricing — Starter</h3>
  <p>$9 / user / month</p>
  <button type="button" class="roycss-btn-glow">
    Start free trial
  </button>
</article>`}</code>
      </pre>

      <h2 id="step-3-result">Step 3 — What you&apos;ll see</h2>
      <p>
        The card renders as a glass panel (blurred backdrop,
        translucent surface, 1px border). Hover the button: an
        emerald halo blooms behind it — a GPU-composited{" "}
        <code>box-shadow</code>, no layout cost, easing in over
        300ms.
      </p>
      <p>
        All of this happens with zero JavaScript. The hover state
        is a pure CSS pseudo-class.
      </p>

      <h2 id="step-4-customize">Step 4 — Make it yours</h2>
      <p>
        RoyCSS effects carry their OKLCH colors written directly
        in the CSS — there is no token layer, so retheming means
        owning a copy. The CLI puts the effect on your clipboard in
        one command, then you edit freely:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss add btn-glow --copy

/* your edited copy — teal instead of emerald, pill radius */
.roycss-btn-glow {
  background: oklch(0.70 0.11 195);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}`}</code>
      </pre>

      <h2 id="step-5-reduced-motion">Step 5 — Respect reduced motion</h2>
      <p>
        Effect rules that animate ship their own{" "}
        <code>prefers-reduced-motion: reduce</code> guard, so users
        who ask for stillness get it automatically. If you author
        your own effects or overrides, keep the same contract —
        wrap them in a media query:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-reduced-motion: reduce) {
  .my-hover-lift:hover {
    transform: none;        /* no movement */
    box-shadow: 0 0 0 1px oklch(0.696 0.149 162.48); /* keep the cue */
  }
}`}</code>
      </pre>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>
        If nothing happens on hover, check three things:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          The stylesheet is loaded. Open DevTools → Sources and
          confirm <code>roycss.css</code> shows up.
        </li>
        <li>
          The class is spelled correctly. RoyCSS classes are
          kebab-case, fully prefixed <code>roycss-</code> (e.g.{" "}
          <code>roycss-btn-glow</code>, not <code>roycss-btn-Glow</code>{" "}
          or <code>r-btn-glow</code>). Run{" "}
          <code>npx roycss info &lt;effect-id&gt;</code> if unsure.
        </li>
        <li>
          You are not running <code>prefers-reduced-motion: reduce</code>{" "}
          in your OS — RoyCSS respects it and disables motion.
        </li>
      </ul>

      <h2 id="whats-next">What’s next</h2>
      <p>
        You now have the full RoyCSS workflow. Head to the{" "}
        <a className="text-primary hover:underline" href="/docs/api/effects">
          Effects API
        </a>{" "}
        reference to browse all {EFFECT_COUNT_FORMATTED} effects, or read about the{" "}
        <a className="text-primary hover:underline" href="/docs/concepts/css-first">
          CSS-first architecture
        </a>{" "}
        to understand why no JavaScript is involved.
      </p>
    </>
  );
}
