import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cards — RoyCSS Docs",
  description: "RoyCSS card effect classes: base reset, glow, lift-combo, gradient border, hover-reveal.",
};

export default function CardsPage() {
  return (
    <>
      <h1>Cards</h1>
      <p className="text-lg text-muted-foreground">
        Card classes provide the visual frame — border, background,
        radius, shadow — and pair with hover effects for interaction.
        RoyCSS ships 156 card classes under the{" "}
        <code>r-card-*</code> namespace.
      </p>

      <h2 id="core-classes">Core classes</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-card-base             base reset + shadow
r-card-glow             emerald outer glow
r-card-glow-soft         softer halo
r-card-gradient-border   emerald gradient border
r-card-spotlight          cursor-tracked spotlight (CSS-only)
r-card-reveal             reveal child on hover
r-card-stack             layered stacked-card look
r-card-glass              glassmorphism backdrop`}</code>
      </pre>

      <h2 id="base">r-card-base</h2>
      <p>
        The base reset layer. Apply it to any card-shaped container
        to get consistent padding, radius, and shadow. It does
        nothing on hover — pair with a hover effect for interaction:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-hover-lift">
  <h3>Pricing — Starter</h3>
  <p>$9 / user / month</p>
</article>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-base {
  background: var(--r-card-bg, oklch(99% 0.005 200));
  border: 1px solid oklch(85% 0.01 200);
  border-radius: var(--r-radius, 12px);
  padding: 1.25rem;
  box-shadow:
    0 1px 2px oklch(15% 0.02 200 / 0.05),
    0 4px 12px oklch(15% 0.02 200 / 0.08);
}`}</code>
      </pre>

      <h2 id="glow">r-card-glow</h2>
      <p>
        Adds an emerald outer glow around the card. Pairs with{" "}
        <code>r-card-base</code> + <code>r-hover-lift</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-card-glow r-hover-lift">
  <h3>Featured</h3>
</article>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-glow {
  box-shadow:
    0 0 0 1px oklch(72% 0.18 165 / 0.15),
    0 8px 32px -4px oklch(72% 0.18 165 / 0.30);
}`}</code>
      </pre>

      <h2 id="gradient-border">r-card-gradient-border</h2>
      <p>
        An emerald→teal gradient border. Achieved with a padded
        wrapper that holds a gradient background, and an inner
        solid-color background:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-gradient-border {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--r-card-bg), var(--r-card-bg)) padding-box,
    linear-gradient(135deg, oklch(72% 0.18 165), oklch(70% 0.11 195)) border-box;
}`}</code>
      </pre>

      <h2 id="spotlight">r-card-spotlight (CSS-only)</h2>
      <p>
        A radial highlight that follows the cursor across the card
        surface — without any JavaScript. Uses a CSS-only mouse-tracked
        technique with <code>:has()</code> and a hover-driven radial
        gradient:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-spotlight {
  position: relative;
  isolation: isolate;
}
.r-card-spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    240px circle at var(--x, 50%) var(--y, 50%),
    oklch(72% 0.18 165 / 0.15),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 240ms;
}
.r-card-spotlight:hover::before { opacity: 1; }`}</code>
      </pre>
      <p>
        For real pointer tracking, see{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/api/roymotion">
          RoyMotion
        </a>{" "}
        — but the CSS version above is enough for most marketing
        cards.
      </p>

      <h2 id="glass">r-card-glass</h2>
      <p>
        Glassmorphism card: translucent background, backdrop blur,
        thin border. Falls back to solid background where{" "}
        <code>backdrop-filter</code> is unsupported:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-glass {
  background: oklch(99% 0.005 200 / 0.65);
  backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid oklch(100% 0 0 / 0.18);
}
@supports not (backdrop-filter: blur(1px)) {
  .r-card-glass { background: oklch(99% 0.005 200); }
}`}</code>
      </pre>

      <h2 id="reveal">r-card-reveal</h2>
      <p>
        Reveals a hidden child element on hover. Common pattern for
        pricing cards where the “Sign up” button only appears when
        the user is interested:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-card-reveal">
  <h3>Starter</h3>
  <button class="r-card-reveal-target">Sign up</button>
</article>`}</code>
      </pre>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.r-card-reveal-target {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 200ms, transform 200ms;
}
.r-card-reveal:hover .r-card-reveal-target {
  opacity: 1;
  transform: translateY(0);
}`}</code>
      </pre>

      <h2 id="composing">Composing</h2>
      <p>
        RoyCSS cards are designed to layer with all hover, border,
        and button effects. A canonical pricing card:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<article class="r-card-base r-card-glow r-hover-lift r-border-shine">
  <h3>Pricing — Starter</h3>
  <p>$9 / user / month</p>
  <button class="r-btn-base r-btn-glow-emerald">Start trial</button>
</article>`}</code>
      </pre>
    </>
  );
}
