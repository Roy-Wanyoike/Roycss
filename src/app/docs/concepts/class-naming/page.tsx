import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Class Naming — RoyCSS Docs",
  description: "RoyCSS class naming conventions: r- prefix, kebab-case, category-action-modifier pattern.",
};

export default function ClassNamingPage() {
  return (
    <>
      <h1>Class Naming</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS class names follow one pattern:{" "}
        <code>r-&lt;category&gt;-&lt;action&gt;-&lt;modifier?&gt;</code>.
        Once you know the pattern you can guess any of the 1,869
        class names without looking them up.
      </p>

      <h2 id="anatomy">Anatomy of a class</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-btn-glow-emerald
│ │    │     │
│ │    │     └── modifier — emerald accent variant
│ │    └──────── action — what the effect does
│ └───────────── category — which group it belongs to
└─────────────── prefix — every RoyCSS class starts with r-`}</code>
      </pre>

      <h2 id="prefix">The <code>r-</code> prefix</h2>
      <p>
        Every RoyCSS class starts with <code>r-</code>. It prevents
        collisions with Tailwind, Bootstrap, and your own utility
        classes. There are zero unprefixed classes in the library.
      </p>

      <h2 id="categories">Categories</h2>
      <p>
        RoyCSS groups its 1,869 effects into seven categories, each
        with its own class namespace:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`hover       r-hover-*        e.g. r-hover-lift, r-hover-scale
text        r-text-*         e.g. r-text-shimmer, r-text-gradient
backgrounds r-bg-*           e.g. r-bg-aurora, r-bg-mesh
loaders     r-loader-*       e.g. r-loader-ring, r-loader-dots
buttons     r-btn-*          e.g. r-btn-glow-emerald, r-btn-pulse
cards       r-card-*         e.g. r-card-base, r-card-glow
borders     r-border-*       e.g. r-border-shine, r-border-draw`}</code>
      </pre>

      <h2 id="actions">Actions</h2>
      <p>
        Actions describe <em>what</em> the effect does, in plain
        English. Common verbs: <code>lift</code>, <code>scale</code>,
        <code>glow</code>, <code>shimmer</code>, <code>aurora</code>,
        <code>ring</code>, <code>dots</code>, <code>pulse</code>.
      </p>

      <h2 id="modifiers">Modifiers</h2>
      <p>
        Modifiers customize the action — typically a color, an
        intensity, or a direction. They’re always last and always
        kebab-case:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-btn-glow-emerald    accent variant
r-btn-glow-soft      intensity variant
r-hover-lift-strong  intensity variant
r-bg-aurora-vertical direction variant`}</code>
      </pre>

      <h2 id="combination">Combining classes</h2>
      <p>
        RoyCSS classes are designed to compose. Pick one per
        category and stack them — they don’t fight for the same
        properties:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-hover-lift r-border-shine">
  <button class="r-btn-glow-emerald">Subscribe</button>
</article>`}</code>
      </pre>

      <h2 id="reserved">Reserved suffixes</h2>
      <p>
        Three suffixes carry semantic meaning across the library:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><code>-soft</code> — gentler version (lower opacity / shorter duration).</li>
        <li><code>-strong</code> — bolder version (higher chroma / longer lift).</li>
        <li><code>-emerald</code>/<code>-teal</code>/<code>-amber</code>/<code>-rose</code> — accent variants.</li>
      </ul>

      <h2 id="anti-patterns">Anti-patterns</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>CamelCase</strong> — RoyCSS classes are always kebab-case.
          <code>r-hover-Lift</code> won’t match anything.
        </li>
        <li>
          <strong>Skipping the prefix</strong> — <code>hover-lift</code>{" "}
          is not a RoyCSS class. It will not pick up the effect.
        </li>
        <li>
          <strong>Reordering segments</strong> —{" "}
          <code>r-emerald-glow-btn</code> won’t resolve. The order is
          always prefix → category → action → modifier.
        </li>
      </ul>

      <h2 id="tooling">Tooling</h2>
      <p>
        The RoyCSS CLI lints your class names against the known set
        and suggests the closest match for typos:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss lint src/**/*.tsx
src/SaveButton.tsx:12  warning  Unknown "r-hover-lifft"
                                did you mean "r-hover-lift"?`}</code>
      </pre>
    </>
  );
}
