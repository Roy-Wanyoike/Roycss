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
        The default RoyCSS accent is emerald <code>oklch(72% 0.18 165)</code>{" "}
        — perceptually matched to a 4.5:1 contrast ratio against a
        near-black background. The full accent ramp:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  --r-accent-50:  oklch(96% 0.02 165);  /* subtle tint    */
  --r-accent-100: oklch(90% 0.06 165);
  --r-accent-300: oklch(80% 0.14 165);
  --r-accent-500: oklch(72% 0.18 165);  /* primary        */
  --r-accent-700: oklch(58% 0.20 165);  /* strong/active  */
  --r-accent-900: oklch(38% 0.12 165);  /* deep footer bg  */
}`}</code>
      </pre>
      <p>
        Notice that each step is a real perceptual step — no hue
        shifting between 50 and 900. That keeps your theme looking
        coherent.
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
        <code>{`.r-btn:hover {
  /* Lighten the accent by 8% perceptually */
  background: color-mix(in oklch, var(--r-accent) 92%, white 8%);
}`}</code>
      </pre>

      <h2 id="browser-support">Browser support</h2>
      <p>
        OKLCH is supported in every current browser (Chrome 111+,
        Safari 15.4+, Firefox 113+). RoyCSS ships an automatic
        <code>rgb()</code> fallback for the rare legacy engine —
        see the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/concepts/browser-support">
          Browser Support
        </a>{" "}
        page for the matrix.
      </p>
    </>
  );
}
