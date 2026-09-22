import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/concepts/class-naming",
  title: "Class Naming — RoyCSS Docs",
  description: "RoyCSS class naming conventions: the roycss- prefix, kebab-case, category-led names, and variant suffixes.",
});

export default function ClassNamingPage() {
  return (
    <>
      <h1>Class Naming</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS class names follow one pattern:{" "}
        <code>roycss-&lt;name&gt;</code>, where the name almost
        always leads with its category. Once you know the pattern you
        can guess most of the {EFFECT_COUNT_FORMATTED} class names
        without looking them up.
      </p>

      <h2 id="anatomy">Anatomy of a class</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-hover-push-up
  │      │
  │      └── effect name — what it does (push-up, glow, shimmer…)
  └───────── category prefix — which group it belongs to

└── every RoyCSS class starts with .roycss-`}</code>
      </pre>

      <h2 id="prefix">The <code>roycss-</code> prefix</h2>
      <p>
        Every RoyCSS class starts with <code>roycss-</code>. It
        prevents collisions with Tailwind, Bootstrap, and your own
        utility classes. There are zero unprefixed classes in the
        library — <code>grep &apos;roycss-&apos;</code> in your
        codebase finds every usage.
      </p>

      <h2 id="categories">Categories</h2>
      <p>
        RoyCSS groups its {EFFECT_COUNT_FORMATTED} effects into{" "}
        {CATEGORY_COUNT} categories. Most class names lead with the
        category (a few early <code>animations</code>-category
        effects skip a prefix and are simply named after the effect,
        like <code>roycss-pulse-glow</code>):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`hover        roycss-hover-*     e.g. roycss-hover-push-up, roycss-hover-scale
text         roycss-text-*      e.g. roycss-text-shimmer, roycss-text-gradient
backgrounds  roycss-bg-*        e.g. roycss-bg-aurora, roycss-bg-mesh-gradient
loaders      roycss-loader-*    e.g. roycss-loader-ring-spin, roycss-loader-bars
buttons      roycss-btn-*       e.g. roycss-btn-glow, roycss-btn-pulse
cards        roycss-card-*      e.g. roycss-card-glassmorphism, roycss-card-spotlight
borders      roycss-border-*    e.g. roycss-border-marching-ants
animations    roycss-anim-*      e.g. roycss-anim-morph-blob
             (some: plain)      e.g. roycss-pulse-glow`}</code>
      </pre>

      <h2 id="names">Names are plain English</h2>
      <p>
        Names describe <em>what</em> the effect does, in kebab-case
        English: <code>push-up</code>, <code>scale</code>,{" "}
        <code>glow</code>, <code>shimmer</code>, <code>aurora</code>,{" "}
        <code>ring-spin</code>, <code>marching-ants</code>.
      </p>

      <h2 id="variants">Variant suffixes</h2>
      <p>
        Multiple takes on the same idea append a suffix rather than
        a modifier segment — there is no BEM-style{" "}
        <code>--modifier</code> system:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-text-shimmer                 the original
roycss-text-shimmer-sweep-b18       a later batch take
roycss-card-gradient-border-b19-v2 a v2 of a batch-19 variant
roycss-bg-aurora-borealis-2         a numbered variant
roycss-ferrum-border-banner        "ferrum" family (batch theme)
roycss-vfx-neon-border             "vfx" family (batch theme)`}</code>
      </pre>
      <p>
        The <code>-b18</code>/<code>-b19</code> tags mark effects
        contributed in later authoring batches, and{" "}
        <code>ferrum-</code>/<code>vfx-</code> name sub-families
        within a category. Treat them as part of the name — search
        the catalog rather than guessing them.
      </p>

      <h2 id="combination">Combining classes</h2>
      <p>
        RoyCSS classes are self-contained: each one carries its own
        colors, padding, and transitions, so there is no{" "}
        <code>-base</code> class to stack first. Pick one structural
        effect and one interaction effect, and let each element own
        its concern:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-glassmorphism">
  <button class="roycss-btn-glow">Subscribe</button>
</article>`}</code>
      </pre>

      <h2 id="anti-patterns">Anti-patterns</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>CamelCase</strong> — RoyCSS classes are always
          kebab-case. <code>roycss-hover-PushUp</code> won&apos;t
          match anything.
        </li>
        <li>
          <strong>Skipping the prefix</strong> —{" "}
          <code>hover-push-up</code> is not a RoyCSS class; it will
          not pick up the effect.
        </li>
        <li>
          <strong>Wrong prefix era</strong> — classes like{" "}
          <code>r-hover-lift</code> or <code>r-btn-glow</code>{" "}
          (short <code>r-</code> prefix) do not exist; every class
          is fully prefixed <code>roycss-*</code>.
        </li>
      </ul>

      <h2 id="tooling">Tooling</h2>
      <p>
        <code>roycss doctor</code> scans your source for{" "}
        <code>roycss-*</code> class usages and reports unknown ones
        (typos), and <code>roycss stats</code> breaks down which
        effects you actually use:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss doctor

✓ 14 RoyCSS class usages found across 6 unique classes in 12 source files
⚠ 1 unknown roycss-* class (possible typos):
    roycss-hover-lifft`}</code>
      </pre>
      <p>
        <code>roycss info &lt;name&gt;</code> and{" "}
        <code>roycss search &lt;term&gt;</code> fuzzy-match against
        the catalog and suggest the closest real id when you miss.
        Every class name also ships in{" "}
        <code>roycss/class-index</code> if you want the exact list
        in your own tooling.
      </p>
    </>
  );
}
