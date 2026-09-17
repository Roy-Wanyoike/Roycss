import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "RoyMotion — RoyCSS Docs",
  description: "RoyMotion: the 775-effect motion subset of the RoyCSS catalog — keyframed, hover, scroll-driven, and transition effects. All pure CSS.",
};

export default function RoyMotionPage() {
  return (
    <>
      <h1>RoyMotion</h1>
      <p className="text-lg text-muted-foreground">
        RoyMotion is the name for the motion half of the RoyCSS
        catalog: the {EFFECT_COUNT_FORMATTED} shipped effects include
        775 that move — keyframed animations, hover transitions,
        scroll-driven effects, particles, and page transitions. All
        of them are pure CSS. There is no JavaScript subsystem to
        install and nothing extra to import: they are ordinary{" "}
        <code>.roycss-*</code> classes in the same{" "}
        <code>dist/roycss.css</code> stylesheet.
      </p>

      <h2 id="philosophy">Philosophy</h2>
      <p>
        RoyCSS is CSS-first by default. Anything that can be
        expressed in CSS <em>is</em> CSS here — including motion.
        Where a &quot;JS animation library&quot; would ship a runtime,
        RoyMotion uses the platform: <code>@keyframes</code>,{" "}
        <code>transition</code>, and the modern{" "}
        <code>animation-timeline: view()</code> /{" "}
        <code>scroll()</code> for scroll-driven effects (37 effects
        use it).
      </p>

      <h2 id="the-export">The motion-library export</h2>
      <p>
        Tooling can load just the motion subset as data. The
        package exposes it as a JSON file — the same data the CLI
        and MCP server read:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import motionLibrary from "roycss/motion-library";

// 775 effects, each with id, name, category, tags,
// description, previewType and the full cssCode
motionLibrary.length;                      // 775
motionLibrary[0].id;                       // "pulse-glow"
motionLibrary[0].cssCode;                  // full CSS source`}</code>
      </pre>
      <p>
        The subset spans these categories of the catalog:{" "}
        <code>animations</code> (322), <code>hover</code> (120),{" "}
        <code>microinteractions</code> (107),{" "}
        <code>particles</code> (52), <code>scroll</code> (71),{" "}
        <code>cursor</code> (44), <code>page-transitions</code>{" "}
        (39), and <code>status-state</code> (20).
      </p>

      <h2 id="using-effects">Using a motion effect</h2>
      <p>
        There is no separate import — a motion effect is just a
        class from the stylesheet you already load:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/css";

// then, anywhere:
<div class="roycss-anim-morph-blob">…</div>
<h1 class="roycss-text-kinetic-wave">Kinetic headline</h1>`}</code>
      </pre>

      <h2 id="scroll-driven">Scroll-driven motion</h2>
      <p>
        37 effects scrub against scroll position with{" "}
        <code>animation-timeline</code> — no scroll listeners, no
        JS, no layout thrash. They degrade gracefully: in browsers
        without scroll-driven animations support the element simply
        shows its static end state:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* A real shipped example — .roycss-scroll-timeline-spin */
.roycss-scroll-timeline-spin {
  animation: roy-b10-sts-spin 1s linear;
  animation-timeline: scroll(root block);
  /* When scroll-driven is unsupported, fall back
     to an infinite auto-spin via @supports */
}
@supports not (animation-timeline: scroll(root block)) {
  .roycss-scroll-timeline-spin {
    animation: roy-b10-sts-spin 3s linear infinite;
  }
}`}</code>
      </pre>

      <h2 id="reduced-motion">Reduced motion</h2>
      <p>
        Motion is opt-out for your users: 432 effect rules ship with
        a <code>prefers-reduced-motion: reduce</code> block that
        disables or freezes the animation. The showcase site also
        respects a manual kill-switch. When you compose motion
        effects into a page, keep your own animations behind the
        same media query — the platform does the rest.
      </p>

      <h2 id="css-vs-js">When you actually need JS</h2>
      <p>
        A few interactions genuinely cannot be expressed in CSS
        today — real pointer-position tracking (not just hover
        state), canvas/WebGL scenes, multi-element scroll
        choreography. RoyCSS does not ship those; the honest answer
        is a few lines of your own JS driving CSS custom properties,
        with a RoyCSS class providing the visual layer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Copy the effect's CSS and swap the hardcoded
   coordinates for custom properties you drive
   from JS. Example: .roycss-card-spotlight ships
   a hover spotlight fixed at the center: */

.roycss-card-spotlight::before {
  inset-block-start: 50%;      /* ← replace with var(--y) */
  inset-inline-start: 50%;     /* ← replace with var(--x) */
  ...
}

/* Your 3 lines of JS: on pointermove, set --x/--y. */
<article class="roycss-card-spotlight" style="--x: 50%; --y: 50%">
  <h3>Spotlight card</h3>
</article>`}</code>
      </pre>
      <p>
        For everything else, the base RoyCSS stylesheet covers it —
        browse the{" "}
        <a className="text-primary hover:underline" href="/effects">
          motion categories in the catalog
        </a>
        .
      </p>
    </>
  );
}
