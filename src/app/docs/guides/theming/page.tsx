import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theming — RoyCSS Docs",
  description: "Complete theming guide: rebrand RoyCSS with your own OKLCH palette, dark mode, and design tokens.",
};

export default function ThemingPage() {
  return (
    <>
      <h1>Theming</h1>
      <p className="text-lg text-muted-foreground">
        This guide walks through a full brand-color migration:
        switch RoyCSS from emerald to your brand color, set up
        dark mode, and bridge to your design-token file.
      </p>

      <h2 id="step-1-pick">Step 1 — Pick your accent in OKLCH</h2>
      <p>
        Your brand probably ships as a hex or RGB color. Convert it
        to OKLCH so it sits cleanly inside RoyCSS’s perceptual
        ramp. You can use the CLI:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss palette from-color "#b91c1c"

oklch(50% 0.20 25)   ← your base

# RoyCSS ramp (auto-generated, perceptual)
--r-accent-50:  oklch(96% 0.03 25);
--r-accent-100: oklch(90% 0.08 25);
--r-accent-300: oklch(70% 0.18 25);
--r-accent-500: oklch(50% 0.20 25);
--r-accent-700: oklch(40% 0.18 25);
--r-accent-900: oklch(28% 0.12 25);`}</code>
      </pre>

      <h2 id="step-2-apply">Step 2 — Apply the override</h2>
      <p>
        Drop the variables into your global stylesheet, after the
        RoyCSS import so they win the cascade:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@import "roycss/effects.css";

:root {
  --r-accent:        oklch(50% 0.20 25);
  --r-accent-strong: oklch(40% 0.18 25);
}`}</code>
      </pre>
      <p>
        Every effect that reads <code>--r-accent</code> — buttons,
        glows, text gradients — now uses your brand color.
      </p>

      <h2 id="step-3-dark">Step 3 — Add dark mode</h2>
      <p>
        Most brand colors look different on dark backgrounds.
        Bump the L value up a few percentage points for dark mode
        so contrast stays strong:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`@media (prefers-color-scheme: dark) {
  :root {
    --r-bg:        oklch(15% 0.02 200);
    --r-card-bg:   oklch(18% 0.02 200);
    --r-fg:        oklch(96% 0.01 200);
    --r-accent:    oklch(65% 0.22 25);  /* lighter on dark */
    --r-accent-strong: oklch(72% 0.20 25);
  }
}`}</code>
      </pre>

      <h2 id="step-4-tokens">Step 4 — Bridge to your design tokens</h2>
      <p>
        If you have a design-token file, point RoyCSS at it so the
        library tracks your brand system:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  --r-accent:        var(--brand-primary);
  --r-accent-strong: var(--brand-primary-hover);
  --r-bg:            var(--surface-base);
  --r-card-bg:       var(--surface-raised);
  --r-fg:            var(--text-primary);
  --r-muted:         var(--text-muted);
  --r-radius:        var(--radius-md);
  --r-duration:      var(--motion-fast);
  --r-easing:        var(--motion-ease-out);
}`}</code>
      </pre>
      <p>
        Now every brand change propagates to RoyCSS automatically.
      </p>

      <h2 id="step-5-sections">Step 5 — Section-scoped themes</h2>
      <p>
        For marketing sections that need a different palette
        (holiday campaign, sale event), override on a container:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="r-bg-aurora holiday-amber">
  <h1 class="r-text-gradient">Holiday sale</h1>
</section>

.holiday-amber {
  --r-accent: oklch(80% 0.16 75);
  --r-accent-strong: oklch(65% 0.18 75);
}`}</code>
      </pre>

      <h2 id="step-6-test">Step 6 — Verify contrast</h2>
      <p>
        The CLI ships a contrast checker that flags variables that
        fall below WCAG AA:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss palette check

--r-accent on --r-bg:    7.6:1   ✅ AAA
--r-accent on --r-card: 7.4:1   ✅ AAA
--r-accent on white:    4.2:1   ⚠️  below AA (4.5:1)`}</code>
      </pre>
      <p>
        Fix below-AA values by raising <code>--r-accent-strong</code>{" "}
        lightness until the checker is happy.
      </p>

      <h2 id="checklist">Theming checklist</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Override <code>--r-accent</code> and <code>--r-accent-strong</code> on <code>:root</code>.</li>
        <li>Set <code>--r-bg</code> and <code>--r-fg</code> if you change surfaces.</li>
        <li>Add a <code>prefers-color-scheme: dark</code> block.</li>
        <li>Bridge to design tokens if you have them.</li>
        <li>Run <code>roycss palette check</code> for contrast.</li>
      </ul>
    </>
  );
}
