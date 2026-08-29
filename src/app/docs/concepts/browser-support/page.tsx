import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browser Support — RoyCSS Docs",
  description: "RoyCSS browser support matrix with automatic @supports fallbacks for older engines.",
};

export default function BrowserSupportPage() {
  return (
    <>
      <h1>Browser Support</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS targets the last two years of every major browser.
        Older browsers get the underlying element without the effect —
        never a broken layout.
      </p>

      <h2 id="matrix">Support matrix</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`Browser            Min version   Status
─────────────────────────────────────────
Chrome             111          ✅ full
Edge               111          ✅ full
Safari             15.4         ✅ full
Firefox            113          ✅ full
iOS Safari         15.4         ✅ full
Samsung Internet   22           ✅ full
─────────────────────────────────────────
Chrome 90–110      ⚠️ fallback (no OKLCH)
Safari 14          ⚠️ fallback (no OKLCH)
IE 11              ❌ no RoyCSS`}</code>
      </pre>

      <h2 id="progressive-enhancement">Progressive enhancement</h2>
      <p>
        RoyCSS effects are layered with <code>@supports</code> so
        older engines gracefully skip them. The base element is
        always styled; the effect is the bonus:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Base style — always applied */
.r-btn-glow-emerald {
  background: #0d9488;  /* teal fallback */
  color: #fff;
  padding: 0.5rem 1rem;
}

/* OKLCH enhancement — newer engines */
@supports (background: oklch(72% 0.18 165)) {
  .r-btn-glow-emerald {
    background: oklch(58% 0.20 165);
  }
}

/* Hover glow — only if transitions work */
@supports (transition: transform 180ms) {
  .r-btn-glow-emerald:hover { /* … */ }
}`}</code>
      </pre>

      <h2 id="oklch-fallback">OKLCH fallbacks</h2>
      <p>
        OKLCH is the RoyCSS lingua franca. Browsers that don’t
        understand it get an sRGB <code>rgb()</code> fallback
        automatically generated at build time. The CLI’s{" "}
        <code>bundle</code> command emits both:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss bundle --out dist/effects.css --fallback

Wrote dist/effects.css       (4.2 KB OKLCH)
Wrote dist/effects.fallback.css (5.1 KB rgb fallback)`}</code>
      </pre>

      <h2 id="prefix-free">No vendor prefixes</h2>
      <p>
        RoyCSS ships zero vendor prefixes. Modern browsers no longer
        need them for the features the library uses. If you support
        Safari below 15.4 or older, run the bundle through Autoprefixer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx postcss dist/effects.css \\
  --use autoprefixer \\
  --output dist/effects.prefixed.css`}</code>
      </pre>

      <h2 id="reduced-motion">Reduced motion everywhere</h2>
      <p>
        <code>prefers-reduced-motion</code> has been supported since
        2017 (Chrome 74, Safari 10.1, Firefox 63). RoyCSS depends
        on it for its accessibility guard.
      </p>

      <h2 id="scroll-driven">Scroll-driven animations</h2>
      <p>
        Scroll-driven animations (<code>animation-timeline: view()</code>)
        are the only RoyCSS feature with limited support — Chrome 115+,
        Edge 115+, and Safari 17.4+. Older engines see the element
        fully visible (no animation), which is the correct
        progressive-enhancement behavior.
      </p>

      <h2 id="policy">Support policy</h2>
      <p>
        RoyCSS drops support for a browser when its global usage
        falls below 0.2% and it has been superseded by a version
        two years old or more. The current matrix is updated every
        quarter on the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/guides/changelog">
          changelog
        </a>
        .
      </p>
    </>
  );
}
