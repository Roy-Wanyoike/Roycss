import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoyMotion — RoyCSS Docs",
  description: "RoyMotion: the optional JS-powered animation subsystem. Pointer tracking, canvas, scroll-scrubbing.",
};

export default function RoyMotionPage() {
  return (
    <>
      <h1>RoyMotion</h1>
      <p className="text-lg text-muted-foreground">
        RoyMotion is the opt-in JavaScript subsystem of RoyCSS. It
        contains the handful of effects that genuinely need JS —
        pointer-tracked 3D tilt, canvas/WebGL effects, scroll
        scrubbing beyond <code>animation-timeline</code>. The whole
        package is ~3 KB gzipped and only loaded when you import it.
      </p>

      <h2 id="philosophy">Philosophy</h2>
      <p>
        RoyCSS is CSS-first by default. RoyMotion exists only for
        the cases where CSS cannot express an effect — and the
        library is honest about that line. Anything that can be done
        in CSS <em>is</em> done in CSS, even inside RoyMotion.
      </p>

      <h2 id="install">Install / import</h2>
      <p>
        RoyMotion is a separate entry point so bundlers can
        tree-shake it from projects that don’t use it:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import "roycss/roymotion.css";          /* base CSS  */
import { r3DTilt } from "roycss/roymotion"; /* JS effect    */`}</code>
      </pre>

      <h2 id="effects">Available effects</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Effect            Size (gz)   Description
─────────────────────────────────────────────────────────
r3DTilt          0.9 KB     Pointer-tracked 3D card tilt
rSpotlight       0.4 KB     Pointer-tracked radial highlight
rScrollScrub     0.8 KB     Multi-step scroll scrubbing
rNeonTunnel      1.2 KB     Three.js tunnel flight (canvas)
rMatrixRain      0.6 KB     Canvas 2D matrix rain
rParticleNet    1.1 KB     Three.js particle network
rAuroraWebGL    1.4 KB     Three.js flowing aurora`}</code>
      </pre>

      <h2 id="r3dtilt">r3DTilt</h2>
      <p>
        Real 3D card tilt that follows the cursor. CSS-only tilt
        exists in <code>r-hover-tilt</code>, but for tracking the
        pointer RoyMotion gives you a 1 KB helper:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article data-r3d-tilt class="r-card-base">
  <h3>3D tilt card</h3>
</article>

<script type="module">
  import { r3DTilt } from "roycss/roymotion";
  r3DTilt.init("[data-r3d-tilt]", { max: 8 });
</script>`}</code>
      </pre>
      <p>
        RoyMotion respects <code>prefers-reduced-motion</code>{" "}
        automatically — under reduced motion the tilt is disabled
        and the card stays flat.
      </p>

      <h2 id="rspotlight">rSpotlight</h2>
      <p>
        Pointer-tracked radial highlight. The CSS-only version (in{" "}
        <code>r-card-spotlight</code>) works for static configs;
        RoyMotion adds real pointer tracking:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article data-r-spotlight class="r-card-base">…</article>

<script type="module">
  import { rSpotlight } from "roycss/roymotion";
  rSpotlight.init("[data-r-spotlight]");
</script>`}</code>
      </pre>

      <h2 id="rscrollscrub">rScrollScrub</h2>
      <p>
        Multi-step scroll scrubbing. CSS-only{" "}
        <code>animation-timeline: view()</code> covers most cases —
        use RoyMotion when you need to coordinate multiple elements
        against a single scroll progress:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section data-r-scrub>
  <h1>Story page</h1>
  <p data-r-scrb-step="0">…</p>
  <p data-r-scrb-step="1">…</p>
  <p data-r-scrb-step="2">…</p>
</section>

<script type="module">
  import { rScrollScrub } from "roycss/roymotion";
  rScrollScrub.init("[data-r-scrub]");
</script>`}</code>
      </pre>

      <h2 id="webgl">WebGL effects</h2>
      <p>
        Three.js-powered effects — neon tunnels, particle networks,
        flowing auroras. They bundle Three.js (lazy-loaded) so the
        cost is paid only by pages that actually use them:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<canvas data-r-neon-tunnel></canvas>

<script type="module">
  const { rNeonTunnel } = await import("roycss/roymotion");
  rNeonTunnel.init("[data-r-neon-tunnel]");
</script>`}</code>
      </pre>

      <h2 id="cleanup">Cleanup</h2>
      <p>
        RoyMotion effects register an{" "}
        <code>unobserve()</code> method. For SPAs that mount/unmount
        views, call it to release listeners and GPU layers:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`import { r3DTilt } from "roycss/roymotion";

const handles = r3DTilt.init("[data-r3d-tilt]");
// on unmount
handles.forEach(h => h.unobserve());`}</code>
      </pre>

      <h2 id="css-vs-js">When to use RoyMotion</h2>
      <p>
        Default to CSS-only effects. Reach for RoyMotion only when:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>You need real pointer position (not just hover state).</li>
        <li>You need canvas/WebGL.</li>
        <li>You need multi-step scroll choreography.</li>
      </ul>
      <p>
        For everything else, the base RoyCSS stylesheet covers it.
      </p>
    </>
  );
}
