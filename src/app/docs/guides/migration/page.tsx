import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED, FULL_CSS_MIN_GZ_KB } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/guides/migration",
  title: "Migration — RoyCSS Docs",
  description: "Migrate from other animation libraries (Animate.css, GSAP, Framer Motion) to RoyCSS with real class mappings.",
});

export default function MigrationPage() {
  return (
    <>
      <h1>Migration</h1>
      <p className="text-lg text-muted-foreground">
        This guide walks through migrating from the three most
        common animation libraries — Animate.css, GSAP, and Framer
        Motion — to RoyCSS, with concrete before/after examples
        using real shipped classes.
      </p>

      <h2 id="from-animate-css">From Animate.css</h2>
      <p>
        Animate.css classes are entry animations
        (animate__bounce, animate__fadeIn). RoyCSS ships the same
        family of entrance effects as top-level animation classes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Animate.css */
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
<h1 class="animate__animated animate__bounce">Hello</h1>

/* RoyCSS — same effect, zero JS */
import "roycss/css";
<h1 class="roycss-bounce-in">Hello</h1>`}</code>
      </pre>
      <p>
        The mapping for the most common Animate.css classes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`animate__bounce        → roycss-bounce-in
animate__fadeIn        → roycss-fade-in
animate__fadeInUp       → roycss-fade-in-up  (+ -down/-left/-right/-br/-bl)
animate__pulse         → roycss-pulse-glow
animate__flash         → roycss-text-neon-flicker-2 (attention, not identical)
animate__rubberBand    → no direct equivalent — search the catalog`}</code>
      </pre>

      <h2 id="from-gsap">From GSAP</h2>
      <p>
        GSAP is JavaScript-only. RoyCSS covers the most common GSAP
        pattern — scroll-triggered reveals — with native
        scroll-driven animations, no observer, no layout thrash:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* GSAP — ~24 KB JS + ScrollTrigger observer */
gsap.from(".card", {
  scrollTrigger: { trigger: ".card" },
  y: 40,
  opacity: 0,
  duration: 0.6,
});

/* RoyCSS — zero JS, native scroll-driven (real shipped class) */
<article class="roycss-view-timeline-reveal">…</article>

/* its CSS, from dist/roycss.css */
.roycss-view-timeline-reveal {
  animation: roy-b10-vtl-reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}`}</code>
      </pre>
      <p>
        For timeline-coordinated multi-element animations there is
        no RoyCSS equivalent — GSAP keeps earning its bytes there.
        Migrate the simple reveals, keep the timeline for the
        hero-scrollytelling.
      </p>

      <h2 id="from-framer-motion">From Framer Motion</h2>
      <p>
        Framer Motion (now Motion) is the most expensive to migrate
        because it lives inside JSX. RoyCSS classes replace the
        common entry/exit animations:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Framer Motion — ~50 KB JS */
import { motion } from "framer-motion";
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Card
</motion.div>

/* RoyCSS — zero JS */
<article class="roycss-fade-in-up">Card</article>`}</code>
      </pre>
      <p>
        For spring physics, drag interactions, and gesture-driven
        choreography, Framer Motion is still the right tool —
        RoyCSS does not ship a JS runtime, and honesty beats
        dogma. A hybrid works fine (see below).
      </p>

      <h2 id="incremental">Incremental migration</h2>
      <p>
        You don&apos;t have to flip the whole project at once.
        RoyCSS coexists with Animate.css, GSAP, and Framer Motion —
        pick a section, swap in RoyCSS, and remove the old library
        from that section only:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* New: RoyCSS for the hero, framer-motion elsewhere */
<section class="roycss-bg-aurora">
  <h1 class="roycss-text-gradient">RoyCSS</h1>
  <button class="roycss-btn-glow">Get started</button>
</section>`}</code>
      </pre>

      <h2 id="bundle-savings">Bundle savings, honestly</h2>
      <p>
        RoyCSS trades JS bytes for CSS bytes. What you save depends
        on how you load it:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Framer Motion hero + card animations     ~50 KB JS
RoyCSS, 3 hand-picked effects (export)  ~0.7 KB CSS gzipped
RoyCSS, full stylesheet                 ~${FULL_CSS_MIN_GZ_KB} KB CSS gzipped (all ${EFFECT_COUNT_FORMATTED} effects)

For a landing page: export only what you use.
For an app that uses effects everywhere: the full stylesheet
plus fewer JS animation dependencies still wins on
time-to-interactive — CSS parses off the main thread.`}</code>
      </pre>
    </>
  );
}
