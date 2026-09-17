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
        Effects that rely on cutting-edge features ship with{" "}
        <code>@supports not (…)</code> fallbacks directly in{" "}
        <code>dist/roycss.css</code> — 37 of them. The base element
        is always styled; the enhanced behavior is the bonus:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real fallback from dist/roycss.css */
@supports not (animation-timeline: scroll(root block)) {
  .roycss-scroll-timeline-spin {
    animation: roy-b10-sts-spin 3s linear infinite;  /* auto-spin instead */
  }
}

@supports not (background: hsl(from red h s l)) {
  .roycss-property-hue-cycle {
    background: linear-gradient(135deg, oklch(0.656 0.212 354.31), …);
  }
}`}</code>
      </pre>

      <h2 id="oklch-fallback">OKLCH fallbacks — the optional layer</h2>
      <p>
        OKLCH is the RoyCSS lingua franca (1,369 unique OKLCH
        colors, 718 <code>color-mix()</code> values in the
        stylesheet). The package ships an optional fallback
        layer — <code>roycss/fallbacks</code> — that maps them to
        sRGB equivalents for older engines. Every fallback is
        gated by <code>@supports not (…)</code>, so modern
        browsers pay zero matching cost. Include it after the
        main stylesheet only if you need it:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Only in browsers that need broader support: */
<link rel="stylesheet" href="roycss.css">
<link rel="stylesheet" href="roycss-fallbacks.css">

/* Or from a bundler: */
import "roycss/css";
import "roycss/fallbacks";`}</code>
      </pre>

      <h2 id="prefix-free">Vendor prefixes, only where needed</h2>
      <p>
        The stylesheet ships ~266 <code>-webkit-</code> prefixed
        declarations — precisely the ones Safari still requires
        (mask compositing, backdrop filters) — and no{" "}
        <code>-moz-</code> prefixes. If you support browsers older
        than the matrix above, run your exported subset through
        Autoprefixer:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx postcss roycss-custom.css \\
  --use autoprefixer \\
  --output roycss-custom.prefixed.css`}</code>
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
        <a className="text-primary hover:underline" href="/docs/guides/changelog">
          changelog
        </a>
        .
      </p>
    </>
  );
}
