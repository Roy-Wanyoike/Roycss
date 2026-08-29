import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Effects API — RoyCSS Docs",
  description: "How RoyCSS effect classes work: category files, class anatomy, custom-property consumption, composable classes.",
};

export default function EffectsApiPage() {
  return (
    <>
      <h1>Effects API</h1>
      <p className="text-lg text-muted-foreground">
        The RoyCSS effects API is the surface you interact with every
        day. It is the same whether you import globally, per
        category, or per effect: one class per effect, composed on
        any element.
      </p>

      <h2 id="anatomy">Anatomy</h2>
      <p>
        Every RoyCSS effect is one CSS class. The class is scoped to
        a category, an action, and (optionally) a modifier:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-hover-lift-emerald
   │     │     │
   │     │     └── modifier (emerald accent variant)
   │     └──────── action   (lift, scale, glow…)
   └────────────── category (hover, text, bg…)`}</code>
      </pre>
      <p>
        Most effects accept zero modifiers. Modifiers are reserved
        for cases where a single class would otherwise require
        multiple CSS variables.
      </p>

      <h2 id="file-layout">File layout</h2>
      <p>
        Each effect is a single CSS file, organized by category:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss/
  effects/
    hover/
      lift.css
      scale.css
      glow.css
      ...
    text/
      shimmer.css
      gradient.css
      ...
    backgrounds/
      aurora.css
      mesh.css
      ...`}</code>
      </pre>

      <h2 id="composition">Composition rules</h2>
      <p>
        RoyCSS classes are designed to compose. The general rule:
        one class per category, applied to the same element. They
        don’t fight for the same property.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-hover-lift r-border-shine">
  ...
  <button class="r-btn-glow-emerald">Save</button>
</article>`}</code>
      </pre>
      <p>
        If you do stack two effects from the same category, the
        last-declared one wins — but you almost never want this.
        The lint command will warn you.
      </p>

      <h2 id="variables">Custom-property consumption</h2>
      <p>
        Every effect documents the custom properties it reads. You
        can inspect any effect with the CLI:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss inspect r-hover-lift

.r-hover-lift {
  transition:
    transform 180ms var(--r-easing, cubic-bezier(0.2,0.8,0.2,1)),
    box-shadow 180ms ease-out;
}
.r-hover-lift:hover {
  transform: translateY(var(--r-hover-lift, 4px));
}

# Consumes:
#   --r-hover-lift  (length, default 4px)
#   --r-easing      (curve, default cubic-bezier(0.2,0.8,0.2,1))
#   --r-accent      (color, used by shadow)`}</code>
      </pre>

      <h2 id="categories-list">The seven categories</h2>
      <p>
        RoyCSS groups its 1,869 effects into seven categories. Each
        has its own API page with the full class list:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/hover">Hover Effects</a> — r-hover-* lift, scale, glow</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/text">Text Effects</a> — r-text-* shimmer, gradient</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/backgrounds">Backgrounds</a> — r-bg-* aurora, mesh</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/loaders">Loaders</a> — r-loader-* ring, dots</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/buttons">Buttons</a> — r-btn-* glow, pulse</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/cards">Cards</a> — r-card-* base, glow</li>
        <li><a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/effects/borders">Borders</a> — r-border-* shine, draw</li>
      </ul>

      <h2 id="opt-in-js">Opt-in JS effects</h2>
      <p>
        A handful of effects live in <code>roycss/roymotion</code>{" "}
        because they require JS (canvas, pointer tracking, etc.).
        They are not part of the base stylesheet and never affect
        your bundle unless you import them. See{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/roymotion">
          RoyMotion
        </a>
        .
      </p>
    </>
  );
}
