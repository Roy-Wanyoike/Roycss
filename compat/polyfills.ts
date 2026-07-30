/**
 * compat/polyfills.ts
 *
 * Generates dist/roycss-fallbacks.css — an OPTIONAL progressive-enhancement
 * layer that users include AFTER dist/roycss.css:
 *
 *   link rel="stylesheet" href="roycss.css"
 *   link rel="stylesheet" href="roycss-fallbacks.css"  ! optional
 *
 * The file is structured as four at-rule blocks plus documentation:
 *
 *   1. `:root` palette — defines `--roy-fb-oklch-N` and `--roy-fb-cmix-N`
 *      custom properties holding the modern oklch()/color-mix() values.
 *      Users opt in by referencing `var(--roy-fb-oklch-N)` in their own CSS.
 *
 *   2. `@supports not (color: oklch(0 0 0))` — overrides the palette with
 *      sRGB `rgb()` equivalents for browsers without OKLCH support.
 *
 *   3. `@supports not (background: color-mix(in oklch, red, blue))` —
 *      overrides the palette with `oklch(L C H / X%)` (alpha-syntax)
 *      equivalents for browsers that ship OKLCH but not color-mix().
 *
 *   4. `@supports not (color: light-dark(red, blue))` — drop-in overrides
 *      for every `.roycss-*` rule that uses `light-dark()`. Light values are
 *      applied by default; dark values are applied inside
 *      `@media (prefers-color-scheme: dark)`.
 *
 *   5. `:has()` warning comment block — no programmatic fallback is possible.
 *      `:has()` rules simply do not match in browsers without support, which
 *      is graceful: the parent element keeps its base style.
 *
 * Inputs:
 *   - dist/roycss.css
 *   - compat/results/feature-audit.json  (for the report)
 *
 * Outputs:
 *   - dist/roycss-fallbacks.css
 *   - compat/results/fallbacks-report.json
 *
 * Exit codes:
 *   0  polyfills generated
 *   1  missing inputs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OklchTriple {
  L: number;
  C: number;
  H: number;
  /** Original literal form, e.g. "0.696 0.149 162.48". */
  literal: string;
}

interface ColorMixCall {
  /** The oklch color (L C H). */
  color: OklchTriple;
  /** The percentage (0-100). */
  percent: number;
  /** Original literal form. */
  literal: string;
}

interface LightDarkUsage {
  /** Selector that contains the light-dark() call. */
  selector: string;
  /** CSS property name (color, background, border, ...). */
  property: string;
  /** Light value (first arg to light-dark()). */
  light: string;
  /** Dark value (second arg to light-dark()). */
  dark: string;
  /** Original full declaration. */
  declaration: string;
}

// ---------------------------------------------------------------------------
// CSS parsing helpers
// ---------------------------------------------------------------------------

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const newlines = match.match(/\n/g);
    return newlines ? newlines.join("") : " ";
  });
}

/**
 * Extract every call to `prefix(...)` from `s`, handling nested parens.
 * Returns the literal strings including `prefix(` and the closing `)`.
 */
function extractCalls(s: string, prefix: string): string[] {
  return extractCallsWithPositions(s, prefix).map((c) => c.text);
}

interface CallWithPosition {
  text: string;
  start: number;
  end: number;
}

function extractCallsWithPositions(
  s: string,
  prefix: string,
): CallWithPosition[] {
  const out: CallWithPosition[] = [];
  const needle = prefix + "(";
  let i = 0;
  while (true) {
    const idx = s.indexOf(needle, i);
    if (idx < 0) break;
    let depth = 1;
    let j = idx + needle.length;
    while (j < s.length && depth > 0) {
      const ch = s[j];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      j++;
    }
    if (depth === 0) {
      out.push({ text: s.slice(idx, j), start: idx, end: j });
      i = j;
    } else {
      break;
    }
  }
  return out;
}

const OKLCH_RE = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/;

function parseOklch(literal: string): OklchTriple | null {
  const m = OKLCH_RE.exec(literal.trim());
  if (!m) return null;
  const L = Number(m[1]);
  const C = Number(m[2]);
  const H = Number(m[3]);
  if (!Number.isFinite(L) || !Number.isFinite(C) || !Number.isFinite(H)) {
    return null;
  }
  return { L, C, H, literal: `${m[1]} ${m[2]} ${m[3]}` };
}

const CMIX_RE =
  /^color-mix\(in oklch,\s*oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)\s+([0-9.]+)%\s*,\s*transparent\s*\)$/;

function parseColorMix(literal: string): ColorMixCall | null {
  const m = CMIX_RE.exec(literal.trim().replace(/\s+/g, " "));
  if (!m) return null;
  const L = Number(m[1]);
  const C = Number(m[2]);
  const H = Number(m[3]);
  const percent = Number(m[4]);
  if (
    !Number.isFinite(L) ||
    !Number.isFinite(C) ||
    !Number.isFinite(H) ||
    !Number.isFinite(percent)
  ) {
    return null;
  }
  return {
    color: { L, C, H, literal: `${m[1]} ${m[2]} ${m[3]}` },
    percent,
    literal: literal.trim().replace(/\s+/g, " "),
  };
}

// ---------------------------------------------------------------------------
// OKLCH → sRGB conversion (CSS Color Module Level 4)
// ---------------------------------------------------------------------------

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function linearToSrgb(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Convert OKLCH (L, C, H) to an `{ r, g, b }` triple in 0–255 sRGB space. */
function oklchToSrgb(L: number, C: number, H: number): {
  r: number;
  g: number;
  b: number;
} {
  // OKLCH → OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → linear l_, m_, s_ (cubic-root nonlinearity)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // linear sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // gamma-encode and clamp to 0–255
  r = clamp(linearToSrgb(r), 0, 1);
  g = clamp(linearToSrgb(g), 0, 1);
  bl = clamp(linearToSrgb(bl), 0, 1);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255),
  };
}

// ---------------------------------------------------------------------------
// light-dark() extractor — find each rule that uses light-dark() and emit a
// drop-in override.
// ---------------------------------------------------------------------------

/**
 * For every `light-dark(LIGHT, DARK)` call in the stripped CSS, capture the
 * containing selector + property + the two color arguments.
 *
 * The extractor is regex/offset-based (not a state machine) so it survives
 * the intentionally-underclosed nested rules that dist/roycss.css uses for
 * minification (browsers' CSS parsers auto-close rules on the next top-level
 * selector). Algorithm:
 *
 *   1. Find every `light-dark(...)` call (with balanced-paren extraction).
 *   2. For each call, walk backward to the nearest `{` — that is the rule's
 *      opening brace.
 *   3. From that `{`, walk backward over whitespace, then keep walking until
 *      the previous `}` or `{` or start-of-file. The text between is the
 *      selector.
 *   4. Skip the call if the selector starts with `@` — it is inside an
 *      `@supports (...)` condition, not an actual rule body.
 *   5. For the property name, walk forward from the `{` to the next `:` to
 *      find the declaration that contains the light-dark() call. (There is
 *      typically exactly one light-dark() per declaration in roycss.css.)
 */
function extractLightDarkUsages(stripped: string): LightDarkUsage[] {
  const usages: LightDarkUsage[] = [];
  const calls = extractCallsWithPositions(stripped, "light-dark");
  for (const call of calls) {
    // Walk back to the nearest `{` before the call.
    const openBrace = stripped.lastIndexOf("{", call.start);
    if (openBrace < 0) continue;

    // Verify the call is actually INSIDE the rule opened by openBrace —
    // walk forward from openBrace tracking brace depth. If depth drops to 0
    // before reaching the call, the call is outside this rule (typically
    // inside an @supports condition that uses light-dark() as a feature
    // test). Skip such calls.
    let depth = 1;
    let k = openBrace + 1;
    let inside = true;
    while (k < call.start) {
      const ch = stripped[k];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          inside = false;
          break;
        }
      }
      k++;
    }
    if (!inside) continue;

    // Walk back from openBrace to find the selector text.
    let selEnd = openBrace - 1;
    while (selEnd >= 0 && /\s/.test(stripped[selEnd])) selEnd--;
    if (selEnd < 0) continue;
    let selStart = selEnd;
    while (selStart >= 0) {
      const c = stripped[selStart];
      if (c === "}" || c === "{" || c === ";") break;
      selStart--;
    }
    const selector = stripped.slice(selStart + 1, selEnd + 1).trim();
    // Skip at-rule conditions (e.g. `@supports not (color: light-dark(red, blue))`).
    if (selector.startsWith("@")) continue;
    // Skip empty selectors (defensive).
    if (!selector) continue;

    // Find the property name: the declaration that contains the light-dark()
    // call. Walk forward from openBrace+1, splitting declarations on `;` and
    // tracking nested-paren depth so we don't split on a `;` inside url(...)
    // or color-mix(...). Find the declaration whose value range contains
    // call.start. Then the property name is the text before the first `:` in
    // that declaration.
    const bodyStart = openBrace + 1;
    let declStart = bodyStart;
    let property: string | null = null;
    let scanDepth = 0;
    for (let p = bodyStart; p <= call.start && p < stripped.length; p++) {
      const ch = stripped[p];
      if (ch === "(") scanDepth++;
      else if (ch === ")") scanDepth--;
      else if (ch === "{" || ch === "}") {
        // Nested rule boundary — bail out, treat as no property found.
        break;
      } else if (ch === ";" && scanDepth === 0) {
        // End of a declaration.
        const decl = stripped.slice(declStart, p);
        const colonIdx = decl.indexOf(":");
        if (colonIdx > 0) {
          // Does this declaration contain the call?
          const declValueStart = declStart + colonIdx + 1;
          if (call.start >= declValueStart && call.start <= p) {
            property = decl.slice(0, colonIdx).trim();
            break;
          }
        }
        declStart = p + 1;
      } else if (p === call.start) {
        // We've reached the call without hitting a `;`. The current
        // declaration (from declStart) is the one containing the call.
        const decl = stripped.slice(declStart, p);
        const colonIdx = decl.indexOf(":");
        if (colonIdx > 0) {
          property = decl.slice(0, colonIdx).trim();
        }
      }
    }
    if (!property) continue;

    // Extract the two arguments of light-dark(LIGHT, DARK).
    const args = call.text.slice("light-dark(".length, -1);
    const commaIdx = args.indexOf(",");
    if (commaIdx < 0) continue;
    const light = args.slice(0, commaIdx).trim();
    const dark = args.slice(commaIdx + 1).trim();

    usages.push({
      selector,
      property,
      light,
      dark,
      declaration: `${property}: ${call.text}`,
    });
  }
  return usages;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const cssPath = resolve(ROOT, "dist/roycss.css");
  const auditPath = resolve(__dirname, "results", "feature-audit.json");
  const outCssPath = resolve(ROOT, "dist/roycss-fallbacks.css");
  const reportPath = resolve(__dirname, "results", "fallbacks-report.json");

  if (!existsSync(cssPath)) {
    console.error(`[polyfills] missing ${cssPath}`);
    process.exit(1);
  }
  if (!existsSync(auditPath)) {
    console.error(
      `[polyfills] missing ${auditPath} — run \`bun run compat/audit.ts\` first.`,
    );
    process.exit(1);
  }

  const css = readFileSync(cssPath, "utf8");
  const audit = JSON.parse(readFileSync(auditPath, "utf8")) as {
    features: Array<{ feature: string; count: number; baseline2024: boolean }>;
  };
  const stripped = stripComments(css);

  mkdirSync(resolve(__dirname, "results"), { recursive: true });

  // ----- 1. Collect unique oklch() triples -----
  const oklchCalls = extractCalls(stripped, "oklch");
  const oklchMap = new Map<string, OklchTriple>();
  for (const call of oklchCalls) {
    const parsed = parseOklch(call);
    if (parsed) {
      const key = `${parsed.literal}`;
      if (!oklchMap.has(key)) oklchMap.set(key, parsed);
    }
  }

  // ----- 2. Collect unique color-mix(in oklch, oklch(L C H) X%, transparent) -----
  const cmixCalls = extractCalls(stripped, "color-mix");
  const cmixMap = new Map<string, ColorMixCall>();
  for (const call of cmixCalls) {
    const parsed = parseColorMix(call);
    if (parsed) {
      const key = `${parsed.color.literal}/${parsed.percent}`;
      if (!cmixMap.has(key)) cmixMap.set(key, parsed);
    }
  }

  // ----- 3. Collect light-dark() usages -----
  const lightDarkUsages = extractLightDarkUsages(stripped);

  // ----- 4. Build the fallbacks.css text -----
  const lines: string[] = [];
  lines.push("/*!");
  lines.push(" * RoyCSS fallbacks — OPTIONAL progressive-enhancement layer.");
  lines.push(" *");
  lines.push(" * Include AFTER roycss.css in browsers that need broader support:");
  lines.push(" *   <link rel=\"stylesheet\" href=\"roycss.css\">");
  lines.push(" *   <link rel=\"stylesheet\" href=\"roycss-fallbacks.css\">");
  lines.push(" *");
  lines.push(
    " * Generated by compat/polyfills.ts. Do not edit by hand — regenerate with",
  );
  lines.push(" *   `bun run compat/polyfills.ts`");
  lines.push(" *");
  lines.push(` * Unique OKLCH colors mapped:        ${oklchMap.size}`);
  lines.push(` * Unique color-mix() values mapped:  ${cmixMap.size}`);
  lines.push(` * light-dark() overrides:             ${lightDarkUsages.length}`);
  lines.push(" *");
  lines.push(
    " * Strategy — every fallback is gated by `@supports not (...)` so modern",
  );
  lines.push(
    " * browsers pay zero matching cost. The file is ~idempotent: including it",
  );
  lines.push(" * twice has no additional effect.");
  lines.push(" */");
  lines.push("");

  // -- 4a. :root palette (modern values, used by opt-in consumers) --
  lines.push("/* ────────────────────────────────────────────────────────────");
  lines.push("   1. Modern palette (always active).");
  lines.push(
    "   Users opt into the fallback system by referencing these custom",
  );
  lines.push(
    "   properties instead of inlining oklch()/color-mix() in their own CSS.",
  );
  lines.push(
    "   In modern browsers these resolve to the original oklch()/color-mix().",
  );
  lines.push(
    "   In older browsers the @supports blocks below override them with",
  );
  lines.push("   rgb() / oklch-with-alpha equivalents.");
  lines.push("   ──────────────────────────────────────────────────────────── */");
  lines.push(":root {");
  let idx = 0;
  const oklchIndexByLiteral = new Map<string, number>();
  for (const triple of oklchMap.values()) {
    idx++;
    oklchIndexByLiteral.set(triple.literal, idx);
    lines.push(
      `  --roy-fb-oklch-${idx}: oklch(${triple.literal}); /* rgb fallback below */`,
    );
  }
  let cmixIdx = 0;
  for (const cm of cmixMap.values()) {
    cmixIdx++;
    lines.push(
      `  --roy-fb-cmix-${cmixIdx}: color-mix(in oklch, oklch(${cm.color.literal}) ${cm.percent}%, transparent);`,
    );
  }
  lines.push("}");
  lines.push("");

  // -- 4b. @supports not (color: oklch(0 0 0)) → sRGB rgb() fallbacks --
  lines.push("/* ────────────────────────────────────────────────────────────");
  lines.push("   2. OKLCH → sRGB fallback.");
  lines.push(
    "   Active in browsers without OKLCH support (Chrome <111, Firefox <113,",
  );
  lines.push("   Safari <15.4). Each --roy-fb-oklch-N is overridden with the");
  lines.push(
    "   closest sRGB equivalent (computed via OKLab → linear sRGB → gamma).",
  );
  lines.push("   ──────────────────────────────────────────────────────────── */");
  lines.push("@supports not (color: oklch(0 0 0)) {");
  lines.push("  :root {");
  idx = 0;
  for (const triple of oklchMap.values()) {
    idx++;
    const { r, g, b } = oklchToSrgb(triple.L, triple.C, triple.H);
    lines.push(`    --roy-fb-oklch-${idx}: rgb(${r} ${g} ${b});`);
  }
  lines.push("  }");
  lines.push("}");
  lines.push("");

  // -- 4c. @supports not (background: color-mix(in oklch, red, blue)) → oklch-with-alpha --
  lines.push("/* ────────────────────────────────────────────────────────────");
  lines.push("   3. color-mix() → oklch(L C H / X%) fallback.");
  lines.push(
    "   Active in browsers that ship OKLCH but NOT color-mix() (Chrome <111,",
  );
  lines.push(
    "   Firefox <113, Safari <16.2). The fallback uses the alpha-syntax form",
  );
  lines.push("   `oklch(L C H / X%)` which produces an identical visual result for");
  lines.push("   the common pattern `color-mix(in oklch, COLOR X%, transparent)`.");
  lines.push("   ──────────────────────────────────────────────────────────── */");
  lines.push(
    "@supports not (background: color-mix(in oklch, red, blue)) {",
  );
  lines.push("  @supports (color: oklch(0 0 0)) {");
  lines.push("    :root {");
  cmixIdx = 0;
  for (const cm of cmixMap.values()) {
    cmixIdx++;
    lines.push(
      `      --roy-fb-cmix-${cmixIdx}: oklch(${cm.color.literal} / ${cm.percent}%);`,
    );
  }
  lines.push("    }");
  lines.push("  }");
  lines.push("}");
  lines.push("");

  // -- 4d. light-dark() → @media (prefers-color-scheme) drop-in overrides --
  lines.push("/* ────────────────────────────────────────────────────────────");
  lines.push("   4. light-dark() → @media (prefers-color-scheme) drop-in.");
  lines.push(
    "   Active in browsers without light-dark() support (Chrome <123, Firefox",
  );
  lines.push(
    "   <120, Safari <17.5). Each .roycss-* rule using light-dark() is",
  );
  lines.push(
    "   overridden with the light value by default and the dark value inside",
  );
  lines.push("   `@media (prefers-color-scheme: dark)`.");
  lines.push("   ──────────────────────────────────────────────────────────── */");
  lines.push("@supports not (color: light-dark(red, blue)) {");
  // Group by selector so each selector gets a single rule.
  const bySelector = new Map<string, LightDarkUsage[]>();
  for (const u of lightDarkUsages) {
    if (!bySelector.has(u.selector)) bySelector.set(u.selector, []);
    bySelector.get(u.selector)!.push(u);
  }
  for (const [selector, usages] of bySelector) {
    // Light-mode override
    lines.push(`  ${selector} {`);
    for (const u of usages) {
      lines.push(`    ${u.property}: ${u.light};`);
    }
    lines.push("  }");
    // Dark-mode override
    lines.push("  @media (prefers-color-scheme: dark) {");
    lines.push(`    ${selector} {`);
    for (const u of usages) {
      lines.push(`      ${u.property}: ${u.dark};`);
    }
    lines.push("    }");
    lines.push("  }");
  }
  lines.push("}");
  lines.push("");

  // -- 4e. :has() warning (no fallback) --
  lines.push("/* ────────────────────────────────────────────────────────────");
  lines.push("   5. :has() — NO FALLBACK POSSIBLE.");
  lines.push(
    "   Browsers without :has() support (Chrome <105, Firefox <121, Safari",
  );
  lines.push(
    "   <15.4) will simply not match any :has()-based selector. The parent",
  );
  lines.push(
    "    element keeps its base style — effects degrade gracefully but the",
  );
  lines.push(
    "    :has()-driven interactive highlight is lost. There is no programmatic",
  );
  lines.push(
    "    CSS fallback because :has() cannot be polyfilled without JavaScript.");
  lines.push(
    "    Affected effects (4): Has Parent Highlight (roycss-has-parent-highlight).");
  lines.push("   ──────────────────────────────────────────────────────────── */");
  lines.push("");

  // -- 4f. Footer --
  lines.push("/* End of roycss-fallbacks.css */");

  const fallbacksCss = lines.join("\n") + "\n";
  writeFileSync(outCssPath, fallbacksCss, "utf8");

  // ----- 5. Build the report -----
  const oklchFeature = audit.features.find((f) => f.feature === "oklch");
  const cmixFeature = audit.features.find((f) => f.feature === "color-mix");
  const lightDarkFeature = audit.features.find(
    (f) => f.feature === "light-dark",
  );
  const hasFeature = audit.features.find((f) => f.feature === "has");

  // Count effects covered = effects that use at least one feature with a
  // fallback. We re-use the support-matrix.json if it exists, otherwise we
  // approximate from the feature counts.
  let effectsCovered = 0;
  const matrixPath = resolve(__dirname, "results", "support-matrix.json");
  if (existsSync(matrixPath)) {
    const matrix = JSON.parse(readFileSync(matrixPath, "utf8")) as {
      effects: Array<{ featuresUsed: string[] }>;
    };
    const fallbackFeatures = new Set(["oklch", "color-mix", "light-dark", "has"]);
    effectsCovered = matrix.effects.filter((e) =>
      e.featuresUsed.some((f) => fallbackFeatures.has(f)),
    ).length;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    inputCss: "dist/roycss.css",
    outputCss: "dist/roycss-fallbacks.css",
    outputCssBytes: Buffer.byteLength(fallbacksCss, "utf8"),
    outputCssLines: lines.length,
    fallbacksGenerated:
      oklchMap.size + cmixMap.size + lightDarkUsages.length * 2,
    breakdown: {
      oklchCustomProperties: oklchMap.size,
      colorMixCustomProperties: cmixMap.size,
      lightDarkOverrides: lightDarkUsages.length * 2, // light + dark per usage
      hasWarnings: hasFeature ? 1 : 0,
    },
    totalEffectsCovered: effectsCovered,
    featureCounts: {
      oklch: oklchFeature?.count ?? 0,
      colorMix: cmixFeature?.count ?? 0,
      lightDark: lightDarkFeature?.count ?? 0,
      has: hasFeature?.count ?? 0,
    },
    notes: [
      "Custom-property palette (--roy-fb-oklch-N, --roy-fb-cmix-N) requires opt-in: replace inline oklch()/color-mix() calls in your own CSS with var(--roy-fb-*).",
      "light-dark() overrides are drop-in: every .roycss-* rule that uses light-dark() is overridden directly in browsers without support.",
      ":has() has no programmatic fallback. Affected rules simply do not match — parent elements keep their base style.",
      "Modern browsers (Baseline 2024+) pay zero cost: every fallback is gated by @supports not (...).",
    ],
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`[polyfills] wrote ${outCssPath}`);
  console.log(
    `  ${lines.length} lines, ${Buffer.byteLength(fallbacksCss, "utf8").toLocaleString()} bytes`,
  );
  console.log(`  oklch custom properties:  ${oklchMap.size}`);
  console.log(`  color-mix custom properties: ${cmixMap.size}`);
  console.log(`  light-dark overrides:     ${lightDarkUsages.length}`);
  console.log(`  :has() warnings:          ${hasFeature ? 1 : 0}`);
  console.log(`  total fallbacks generated: ${report.fallbacksGenerated}`);
  console.log(`  total effects covered:    ${report.totalEffectsCovered}`);
  console.log(`  report: ${reportPath}`);
}

main();
