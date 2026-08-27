import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Migration — RoyCSS Docs",
  description: "Migrate from other animation libraries (Framer Motion, GSAP, Animate.css) to RoyCSS.",
};

export default function MigrationPage() {
  return (
    <>
      <h1>Migration</h1>
      <p className="text-lg text-muted-foreground">
        This guide walks through migrating from the three most
        common animation libraries — Animate.css, GSAP, and Framer
        Motion — to RoyCSS, with concrete before/after examples.
      </p>

      <h2 id="from-animate-css">From Animate.css</h2>
      <p>
        Animate.css classes are entry animations (animate__bounce,
        animate__fade-in). RoyCSS has equivalents under the{" "}
        <code>r-text-reveal</code> and <code>r-hover-*</code>{" "}
        namespaces:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Animate.css */
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
<h1 class="animate__animated animate__bounce">Hello</h1>

/* RoyCSS — same effect, smaller payload, no JS */
@import "roycss/effects/text.css";
<h1 class="r-text-reveal">Hello</h1>`}</code>
      </pre>
      <p>
        The mapping table for the most common Animate.css classes:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`animate__bounce        → r-hover-wobble (on hover)
animate__fadeIn        → r-text-reveal
animate__fadeInUp      → r-text-reveal-up
animate__pulse         → r-btn-pulse
animate__flash         → r-border-pulse
animate__rubberBand    → r-hover-bounce`}</code>
      </pre>

      <h2 id="from-gsap">From GSAP</h2>
      <p>
        GSAP is JavaScript-only. RoyCSS covers most GSAP use cases
        with scroll-driven animations:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* GSAP — 2.4 KB JS + observer */
gsap.from(".card", {
  scrollTrigger: { trigger: ".card" },
  y: 40,
  opacity: 0,
  duration: 0.6,
});

/* RoyCSS — zero JS, native scroll-driven */
<article class="r-card-base r-text-reveal">…</article>`}</code>
      </pre>
      <p>
        For timeline-coordinated multi-element animations, fall
        back to RoyMotion’s{" "}
        <code>rScrollScrub</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<script type="module">
  import { rScrollScrub } from "roycss/roymotion";
  rScrollScrub.init("[data-r-scrub]");
</script>`}</code>
      </pre>

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

/* RoyCSS — zero JS, animated on scroll */
<article class="r-card-base r-text-reveal-up">Card</article>`}</code>
      </pre>
      <p>
        For complex choreography, RoyMotion is ~3 KB and covers
        the gap:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import { r3DTilt } from "roycss/roymotion";
const handles = r3DTilt.init("[data-r3d-tilt]");`}</code>
      </pre>

      <h2 id="incremental">Incremental migration</h2>
      <p>
        You don’t have to flip the whole project at once. RoyCSS
        coexists with Animate.css, GSAP, and Framer Motion — pick
        a section, swap in RoyCSS, and remove the old library from
        that section only.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Old: framer-motion for the hero */
import { motion } from "framer-motion";

/* New: RoyCSS for the hero, framer-motion elsewhere */
<section class="r-bg-aurora">
  <h1 class="r-text-gradient r-text-reveal">RoyCSS</h1>
</section>`}</code>
      </pre>

      <h2 id="bundle-savings">Bundle savings</h2>
      <p>
        Typical migration savings for a small marketing site:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Before (Framer Motion + Animate.css):  ~70 KB JS
After (RoyCSS effects + RoyMotion):       ~3 KB JS + 12 KB CSS
─────────────────────────────────────────────────────────────
Net savings:                              ~55 KB (78% reduction)`}</code>
      </pre>
    </>
  );
}
