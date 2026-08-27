import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customization — RoyCSS Docs",
  description: "Customize RoyCSS: theme variables, color overrides, dark mode, design-token integration.",
};

export default function CustomizationPage() {
  return (
    <>
      <h1>Customization</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is themed entirely with CSS custom properties. There
        is no config file, no build step — set the variables you
        want to change on any container and the cascade does the
        rest.
      </p>

      <h2 id="global-theme">Global theme override</h2>
      <p>
        Set the four primary variables on <code>:root</code> and
        you’ve rethemed the whole library:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  --r-accent:        oklch(70% 0.11 195);  /* teal */
  --r-accent-strong: oklch(56% 0.13 195);
  --r-bg:            oklch(99% 0.005 200);
  --r-fg:            oklch(15% 0.02 200);
}`}</code>
      </pre>
      <p>
        Every effect that reads <code>--r-accent</code> now uses teal.
        No effect file edits, no rebuild.
      </p>

      <h2 id="full-palette">Full palette variables</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  /* Accent ramp — perceptual 50…900 */
  --r-accent-50:  oklch(96% 0.02 165);
  --r-accent-100: oklch(90% 0.06 165);
  --r-accent-300: oklch(80% 0.14 165);
  --r-accent-500: oklch(72% 0.18 165);
  --r-accent-700: oklch(58% 0.20 165);
  --r-accent-900: oklch(38% 0.12 165);

  /* Surfaces */
  --r-bg:               oklch(99% 0.005 200);
  --r-card-bg:          oklch(99% 0.005 200);
  --r-fg:               oklch(15% 0.02 200);
  --r-muted:            oklch(45% 0.02 200);

  /* Sizing & motion */
  --r-radius:    12px;
  --r-hover-lift: 4px;
  --r-duration:  180ms;
  --r-easing:    cubic-bezier(0.2, 0.8, 0.2, 1);
}`}</code>
      </pre>

      <h2 id="scoped-theme">Scoped theme overrides</h2>
      <p>
        Custom properties cascade. Setting them on a container
        scopes the override to that subtree only:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="marketing-amber">
  <h1 class="r-text-gradient">Limited time</h1>
  <button class="r-btn-base r-btn-glow-emerald">Subscribe</button>
</section>

<style>
  .marketing-amber {
    --r-accent: oklch(80% 0.16 75);
    --r-accent-strong: oklch(65% 0.18 75);
  }
</style>`}</code>
      </pre>

      <h2 id="dark-mode">Dark mode</h2>
      <p>
        RoyCSS dark mode is a different set of variables inside the
        user-agent media query. No JS, no flash:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-color-scheme: dark) {
  :root {
    --r-bg:       oklch(15% 0.02 200);
    --r-card-bg:  oklch(18% 0.02 200);
    --r-fg:       oklch(96% 0.01 200);
    --r-muted:    oklch(70% 0.02 200);
    --r-accent:   oklch(72% 0.18 165);
  }
}`}</code>
      </pre>

      <h2 id="design-tokens">Design-token integration</h2>
      <p>
        If your project uses a design-token file (Style Dictionary,
        W3C Design Tokens, or Tailwind theme), you can wire RoyCSS
        variables to your tokens with a single bridge:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  /* Bridge RoyCSS to your design tokens */
  --r-accent: var(--my-brand-primary);
  --r-accent-strong: var(--my-brand-primary-active);
  --r-bg: var(--my-surface-base);
  --r-fg: var(--my-text-primary);
}`}</code>
      </pre>

      <h2 id="runtime-swap">Runtime theme swap</h2>
      <p>
        Custom properties are live — change them at runtime and the
        page re-themes instantly, no reload:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`function setTheme(accent) {
  document.documentElement.style.setProperty("--r-accent", accent);
}

// Example: amber for a holiday campaign
setTheme("oklch(80% 0.16 75)");`}</code>
      </pre>

      <h2 id="disable-effects">Disabling effects entirely</h2>
      <p>
        If you need a one-off static page, drop RoyCSS effects for a
        section by overriding the duration to 0:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.no-motion {
  --r-duration: 0ms;
  --r-hover-lift: 0px;
}`}</code>
      </pre>

      <h2 id="next-steps">Next steps</h2>
      <p>
        The{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/guides/theming">
          Theming guide
        </a>{" "}
        walks through a full brand-color migration with a runnable
        example.
      </p>
    </>
  );
}
