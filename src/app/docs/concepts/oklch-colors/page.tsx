import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OKLCH Colors — RoyCSS Docs",
  description: "Why RoyCSS uses OKLCH, the perceptual color space. Predictable lightness ramps, accessible contrasts.",
};

export default function OcklchColorsPage() {
  return (
    <>
      <h1>OKLCH Colors</h1>
      <p className="text-lg text-muted-foreground">
        Every color in RoyCSS is authored in OKLCH — the perceptual
        color space. It looks like <code>oklch(72% 0.18 165)</code>{" "}
        and it produces color ramps that look even to the human eye.
      </p>

      <h2 id="what-is-oklch">What is OKLCH?</h2>
      <p>
        OKLCH stands for <strong>OK Lab Chroma Hue</strong>. Like
        HSL, it has three components — but it models human perception
        instead of RGB device values:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>L</strong> — perceived lightness, 0% to 100%.</li>
        <li><strong>C</strong> — chroma (colorfulness), 0 to ~0.37.</li>
        <li><strong>H</strong> — hue angle, 0° to 360°.</li>
      </ul>
      <p>
        RoyCSS uses OKLCH because two colors with the same{" "}
        <code>L</code> value <em>look</em> equally bright — even if
        they’re different hues. That’s impossible in HSL.
      </p>

      <h2 id="why-it-matters">Why it matters</h2>
      <p>
        Look at these two buttons. Same HSL lightness (50%) —
        wildly different perceived brightness:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* HSL — yellow looks "brighter" than blue at the same L */
background: hsl(60 100% 50%);   /* vivid yellow */
background: hsl(240 100% 50%); /* vivid blue   */`}</code>
      </pre>
      <p>
        In OKLCH the same perceived lightness produces visually
        balanced colors:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* OKLCH — both perceived as ~72% lightness */
background: oklch(72% 0.18 95);   /* warm amber */
background: oklch(72% 0.18 165);  /* emerald   */
background: oklch(72% 0.18 265);  /* violet    */`}</code>
      </pre>

      <h2 id="roycss-palette">The RoyCSS palette</h2>
      <p>
        The signature RoyCSS accent is emerald{" "}
        <code>oklch(0.696 0.149 162.48)</code> — you will see it
        (and its siblings below) written directly in the shipped
        effect rules, not behind variables. The recurring cast:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real values from dist/roycss.css */
oklch(0.696 0.149 162.48)   emerald   — the accent
oklch(0.704 0.123 182.5)   teal
oklch(0.715 0.126 215.22)  sky blue
oklch(0.606 0.219 292.72)  violet
oklch(0.769 0.165 70.08)  amber
oklch(0.656 0.212 354.31)  pink/red

/* e.g. .roycss-text-gradient sweeps four of them:
   emerald 0% → teal 40% → sky 70% → violet 100% */`}</code>
      </pre>
      <p>
        Notice the near-identical <code>L</code> values across
        hues — that is the perceptual evenness in action, and it
        is why the multi-hue gradients look balanced rather than
        blotchy.
      </p>

      <h2 id="contrast">Contrast and accessibility</h2>
      <p>
        Because <code>L</code> is perceptual, you can compute contrast
        directly: a 4.5:1 ratio against white is roughly{" "}
        <code>L ≤ 65%</code>, against near-black it’s roughly{" "}
        <code>L ≥ 55%</code>. RoyCSS stays inside those ranges for all
        text-bearing effect classes.
      </p>

      <h2 id="mixing">Blending with color-mix</h2>
      <p>
        RoyCSS leans heavily on <code>color-mix(in oklch, ...)</code>{" "}
        for tints, shades, and hover states. It works in OKLCH space
        directly, so the result is always perceptually interpolated:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Real declaration from .roycss-hover-push-up */
box-shadow: 0 20px 40px -10px
  color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);`}</code>
      </pre>

      <h2 id="browser-support">Browser support</h2>
      <p>
        OKLCH is supported in every current browser (Chrome 111+,
        Safari 15.4+, Firefox 113+). For the rare legacy engine,
        the package ships an optional fallback layer ({" "}
        <code>roycss/fallbacks</code>) that maps the OKLCH values
        to sRGB — see the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/concepts/browser-support">
          Browser Support
        </a>{" "}
        page for the matrix.
      </p>
    </>
  );
}
