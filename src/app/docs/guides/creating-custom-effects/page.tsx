import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Effects — RoyCSS Docs",
  description: "Build your own RoyCSS-style effect: naming, custom properties, reduced-motion guard, lint registration.",
};

export default function CreatingCustomEffectsPage() {
  return (
    <>
      <h1>Creating Custom Effects</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is open CSS — nothing stops you from writing your own
        <code>r-</code>-prefixed effect class. This guide walks
        through the conventions, the reduced-motion guard, and how
        to register the class with the RoyCSS linter.
      </p>

      <h2 id="anatomy">Anatomy of a RoyCSS effect</h2>
      <p>
        Every RoyCSS effect file follows the same structure. Mimic
        it for your own effects so they feel native:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* 1. Title + description comment */
/* r-hover-wobble — playful 4deg wobble on hover */

/* 2. The base rule */
.r-hover-wobble {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 3. The hover rule */
.r-hover-wobble:hover {
  animation: r-wobble 600ms ease-out;
}

/* 4. The keyframes */
@keyframes r-wobble {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-4deg); }
  75%  { transform: rotate(4deg); }
  100% { transform: rotate(0deg); }
}

/* 5. Reduced-motion guard */
@media (prefers-reduced-motion: reduce) {
  .r-hover-wobble:hover { animation: none; }
}`}</code>
      </pre>

      <h2 id="naming">Naming your effect</h2>
      <p>
        Follow the convention: <code>r-&lt;category&gt;-&lt;action&gt;-&lt;modifier?&gt;</code>.
        Your custom effect should slot into an existing category
        if possible:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Good — fits in the hover category */
.r-hover-wobble
.r-hover-bounce

/* Acceptable — new category is OK if it’s genuinely new */
.r-confetti-burst

/* Avoid — generic name, no prefix, collides */
.wobble
.btn-fancy`}</code>
      </pre>

      <h2 id="variables">Use the existing variables</h2>
      <p>
        Reuse RoyCSS variables wherever you can — your effect
        inherits the user’s theme for free:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-hover-wobble {
  /* Reuse --r-accent for any color work */
  box-shadow: 0 0 0 1px oklch(72% 0.18 165 / 0.10);

  /* Reuse --r-duration for consistency */
  transition: transform var(--r-duration, 180ms);
}`}</code>
      </pre>

      <h2 id="composability">Stay composable</h2>
      <p>
        RoyCSS effects are designed to stack. Don’t write a custom
        effect that fights with <code>transform</code> — use it
        additive with other effects:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Bad — overrides transform entirely */
.r-hover-wobble:hover {
  transform: translateY(8px) !important;  /* kills r-hover-lift */
}

/* Good — additive */
.r-hover-wobble:hover {
  animation: r-wobble 600ms ease-out;
  /* No transform property — leaves r-hover-lift alone */
}`}</code>
      </pre>

      <h2 id="register-linter">Register with the linter</h2>
      <p>
        Drop a <code>roycss.local.json</code> at your project root
        with your custom classes. The CLI linter will then accept
        them — and suggest them in autocompletion:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "classes": [
    "r-hover-wobble",
    "r-confetti-burst"
  ],
  "variables": [
    "--r-hover-wobble-deg"
  ]
}`}</code>
      </pre>

      <h2 id="share">Share your effect</h2>
      <p>
        Custom effects that follow the conventions can be PR’d back
        to the RoyCSS library. See the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/guides/contributing">
          Contributing
        </a>{" "}
        guide for the submission checklist.
      </p>
    </>
  );
}
