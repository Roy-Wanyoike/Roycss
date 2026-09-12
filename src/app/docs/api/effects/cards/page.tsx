import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "Cards — RoyCSS Docs",
  description: "RoyCSS card effect classes: gradient border, hover glow, spotlight, reveal, neumorphic, glassmorphism.",
};

export default function CardsPage() {
  return (
    <>
      <h1>Cards</h1>
      <p className="text-lg text-muted-foreground">
        Card effects provide the visual frame — border, background,
        radius, shadow, and hover interaction. RoyCSS ships 56
        card-category effects out of the {EFFECT_COUNT_FORMATTED}-effect
        catalog. Like every RoyCSS effect, each class is
        self-contained: there is no <code>base</code> class to apply
        first.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss-card-gradient-border   animated rainbow gradient border
roycss-card-hover-glow        emerald glow on hover
roycss-card-hover-lift        lifts with shadow on hover
roycss-card-hover-press       press-down feedback
roycss-card-spotlight         cursor-tracked spotlight (CSS-only)
roycss-card-hover-reveal      reveals hidden children on hover
roycss-card-neumorphic        soft-UI emboss
roycss-card-glassmorphism     frosted glass
roycss-card-neon              neon outline card
roycss-card-flip              3D flip (front/back/inner)`}</code>
      </pre>

      <h2 id="gradient-border">roycss-card-gradient-border</h2>
      <p>
        An animated five-hue gradient border. Achieved with a{" "}
        <code>::before</code> masked to the border ring, animating a
        registered <code>@property</code> angle — this is the effect
        that shows off <code>@property</code> interpolation:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-gradient-border">
  <h3>Pricing — Starter</h3>
  <p>$9 / user / month</p>
</article>

/* The CSS that ships in dist/roycss.css */
@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.roycss-card-gradient-border {
  position: relative;
  background: oklch(0.208 0.04 265.75);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}

.roycss-card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(var(--roy-gb-angle), oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.769 0.165 70.08), oklch(0.696 0.149 162.48));
  -webkit-mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-card-gb-rotate 4s linear infinite;
  pointer-events: none;
}

@keyframes roy-card-gb-rotate {
  to { --roy-gb-angle: 360deg; }
}`}</code>
      </pre>

      <h2 id="glow">roycss-card-hover-glow</h2>
      <p>
        Adds an emerald glow around the card on hover — pairs well
        with a text effect on the content:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-hover-glow">
  <h3>Featured</h3>
</article>`}</code>
      </pre>

      <h2 id="spotlight">roycss-card-spotlight (CSS-only)</h2>
      <p>
        A radial highlight that follows the cursor across the card
        surface — without any JavaScript, using CSS custom properties
        driven by the hover position cascade:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-spotlight">
  <h3>Camera Feed</h3>
</article>`}</code>
      </pre>

      <h2 id="glass">roycss-card-glassmorphism</h2>
      <p>
        Glassmorphism card: translucent background,{" "}
        <code>backdrop-filter</code> blur, thin border. The shipped{" "}
        <code>roycss-glass-frosted</code> class (glass family) shows
        the pattern with the full fallback chain:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-glass-frosted {
  background: color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
}`}</code>
      </pre>

      <h2 id="reveal">roycss-card-hover-reveal</h2>
      <p>
        Reveals hidden child elements on hover — a common pattern for
        pricing cards where the “Sign up” button only appears when the
        user is interested:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-hover-reveal">
  <h3>Starter</h3>
  <button class="reveal-target">Sign up</button>
</article>`}</code>
      </pre>

      <h2 id="composing">Composing</h2>
      <p>
        Card effects combine with text, button, and border effects
        without conflict — a card class owns the frame, the others own
        the content. A canonical pricing card:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="roycss-card-hover-lift">
  <h3 class="roycss-text-gradient">Pricing — Starter</h3>
  <p>$9 / user / month</p>
  <button class="roycss-btn-glow">Start trial</button>
</article>`}</code>
      </pre>
    </>
  );
}
