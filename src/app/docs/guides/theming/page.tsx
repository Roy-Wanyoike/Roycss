import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = pageMeta({
  path: "/docs/guides/theming",
  title: "Theming — RoyCSS Docs",
  description: "A brand-color migration, done honestly: vendor the effects you use, convert your palette to OKLCH, and keep contrast in check.",
});

export default function ThemingPage() {
  return (
    <>
      <h1>Theming</h1>
      <p className="text-lg text-muted-foreground">
        This guide walks through a full brand-color migration. One
        thing to know up front: RoyCSS does not ship a theme-token
        layer — the {EFFECT_COUNT_FORMATTED} effects carry their
        OKLCH colors written directly in the CSS, which is what
        keeps them drop-in. Theming therefore means vendoring the
        effects you use and editing them, and the tooling below
        makes that cheap.
      </p>

      <h2 id="step-1-pick">Step 1 — Pick your accent in OKLCH</h2>
      <p>
        Your brand probably ships as a hex or RGB color. Convert it
        to OKLCH so it sits cleanly on the perceptual lightness
        scale. The repo ships a migration script that converts hex
        literals in your CSS files to OKLCH:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# from a clone of the repo — converts hex/rgba in place
$ bun run scripts/migrate-colors.ts src/styles/brand.css

# one-off conversion (any OKLCH color picker works too):
#   #b91c1c  →  oklch(0.50 0.20 25)`}</code>
      </pre>

      <h2 id="step-2-apply">Step 2 — Vendor and recolor the effects</h2>
      <p>
        Export the effects you use, then replace the shipped
        emerald (<code>oklch(0.696 0.149 162.48)</code> and friends)
        with your brand color:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss-cli export btn-glow hover-push-up text-shimmer \\
    --out src/styles/roycss.css

/* then edit src/styles/roycss.css */
.roycss-btn-glow {
  background: oklch(0.50 0.20 25);   /* ← your brand red */
  ...
}

.roycss-hover-push-up:hover {
  box-shadow: 0 20px 40px -10px
    color-mix(in oklch, oklch(0.50 0.20 25) 40%, transparent);
}`}</code>
      </pre>
      <p>
        A find-and-replace across the vendored file is usually
        enough — effects consistently use the same handful of
        emerald OKLCH values.
      </p>

      <h2 id="step-3-dark">Step 3 — Add dark mode</h2>
      <p>
        Most brand colors look different on dark backgrounds.
        Bump the L value up a few points for dark mode so contrast
        stays strong — in your vendored copy:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`.roycss-btn-glow { background: oklch(0.50 0.20 25); }

@media (prefers-color-scheme: dark) {
  .roycss-btn-glow { background: oklch(0.65 0.22 25); }  /* lighter on dark */
}`}</code>
      </pre>

      <h2 id="step-4-tokens">Step 4 — Bridge to your design tokens</h2>
      <p>
        If you have a design-token file, point the vendored
        effects at your variables so they track the brand system:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* in your vendored roycss.css */
.roycss-btn-glow {
  background: var(--brand-primary);
  color: var(--text-on-primary);
  border-radius: var(--radius-md);
}`}</code>
      </pre>
      <p>
        Now every brand change propagates to the effects you
        bridged — anything still loaded from{" "}
        <code>dist/roycss.css</code> keeps its shipped colors, so
        bridge everything you use.
      </p>

      <h2 id="step-5-sections">Step 5 — Section-scoped themes</h2>
      <p>
        For marketing sections that need a different palette
        (holiday campaign, sale event), vendor a second copy of
        the effect with the alternate colors and scope both to
        their sections:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`<section class="holiday">
  <h1 class="roycss-text-gradient holiday-text">Holiday sale</h1>
</section>

/* your override, after the effect's own rule */
.holiday-text.roycss-text-gradient {
  background: linear-gradient(90deg, oklch(0.80 0.16 75), oklch(0.65 0.18 75));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}`}</code>
      </pre>

      <h2 id="step-6-test">Step 6 — Verify contrast</h2>
      <p>
        Check your recolored values with your browser devtools
        (both Chromium and Firefox compute contrast for a selected
        color pair). Rules of thumb in OKLCH: against white stay{" "}
        <code>L ≤ 0.65</code> for 4.5:1 text contrast; against
        near-black stay <code>L ≥ 0.55</code>. The CLI can also
        keep you honest about color format:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss-cli doctor

⚠ Found 6 hex/rgba color literals in user CSS — RoyCSS v2 recommends oklch()
  Run: bun run scripts/migrate-colors.ts`}</code>
      </pre>

      <h2 id="checklist">Theming checklist</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Convert your brand color to OKLCH.</li>
        <li>Export the effects you use (<code>roycss export … --out</code>) and edit them.</li>
        <li>Replace the shipped emerald values with your accent.</li>
        <li>Add a <code>prefers-color-scheme: dark</code> variant for your copies.</li>
        <li>Bridge to design tokens if you have them.</li>
        <li>Verify contrast in devtools; run <code>roycss doctor</code> for format drift.</li>
      </ul>
    </>
  );
}
