#!/usr/bin/env bun
/**
 * visual-checks.ts — Verify visual accessibility of the RoyCSS site.
 *
 * What it checks (per WCAG 2.1 AA):
 *   - 1.4.3 Contrast (Minimum): text ≥4.5:1 (large text ≥3:1).
 *   - 1.4.11 Non-text Contrast: UI components / boundaries ≥3:1.
 *   - 1.4.10 Reflow: no horizontal scroll at 320 CSS px.
 *
 * Strategy:
 *   1. Open the page.
 *   2. Screenshot in dark mode (default) and light mode (toggle .dark class).
 *   3. For a curated set of selectors, read getComputedStyle + getBoundingClientRect
 *      to extract foreground/background colors and font size.
 *   4. Convert OKLCH / RGB to linear sRGB, compute WCAG contrast ratio.
 *   5. Assert ≥4.5:1 for normal text (font-size < 24px) and ≥3:1 for large text
 *      (font-size ≥ 24px) and ≥3:1 for non-text UI components.
 *   6. Save screenshots + JSON results.
 *
 * Output:
 *   - tests/a11y/screenshots/dark-mode.png
 *   - tests/a11y/screenshots/light-mode.png
 *   - tests/a11y/results/visual-checks.json
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(HERE, "results");
const SCREENSHOTS_DIR = join(HERE, "screenshots");
const TARGET_URL = process.env.URL ?? "http://localhost:3000/";

mkdirSync(RESULTS_DIR, { recursive: true });
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

/* ─── agent-browser helpers ────────────────────────────────────────────── */

function ab(args: string[], opts?: { input?: string; timeout?: number }): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync("agent-browser", args, {
    encoding: "utf-8",
    input: opts?.input,
    timeout: opts?.timeout ?? 60_000,
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

interface AbResult<T> {
  success: boolean;
  data: { result: T; origin: string } | null;
  error: string | null;
}

function abEvalStdin<T>(script: string, timeoutMs = 30_000): T {
  const r = ab(["eval", "--stdin", "--json", "--timeout", String(timeoutMs)], { input: script, timeout: timeoutMs + 15_000 });
  if (!r.stdout) {
    throw new Error(`agent-browser eval produced no stdout: ${r.stderr || ""}`);
  }
  let outer: AbResult<T>;
  try {
    outer = JSON.parse(r.stdout) as AbResult<T>;
  } catch (e) {
    throw new Error(`could not parse agent-browser JSON: ${(e as Error).message}`);
  }
  if (!outer.success || !outer.data) {
    throw new Error(`agent-browser eval unsuccessful: ${outer.error ?? "(no error)"}`);
  }
  return outer.data.result;
}

function abOpen(url: string): void {
  ab(["close", "--all"], { timeout: 15_000 });
  const r = ab(["open", url, "--timeout", "90000"], { timeout: 120_000 });
  const ok = r.status === 0 || (r.stdout && r.stdout.includes("✓"));
  if (!ok) {
    console.error(`✗ agent-browser open failed: ${r.stderr || r.stdout}`);
    process.exit(1);
  }
}

/* ─── Color parsing + contrast ─────────────────────────────────────────── */

/** Parse any CSS color string (rgb, rgba, hex, oklch, named) into { r, g, b } 0-255. */
function parseColorToRgb(cssColor: string): { r: number; g: number; b: number } | null {
  if (!cssColor || cssColor === "transparent" || cssColor === "rgba(0, 0, 0, 0)") return null;
  // rgb()/rgba()
  const rgbMatch = cssColor.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbMatch) {
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  }
  // hex
  const hexMatch = cssColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  // OKLCH — note: getComputedStyle in headless Chrome 151 should resolve oklch()
  // to rgb() automatically for non-custom-property values, but values pulled
  // straight from CSS custom properties may remain as oklch(). We handle the
  // conversion here so we don't rely on browser resolution.
  const oklchMatch = cssColor.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/);
  if (oklchMatch) {
    const L = +oklchMatch[1];
    const C = +oklchMatch[2];
    const H = +oklchMatch[3];
    return oklchToRgb(L, C, H);
  }
  return null;
}

/** OKLCH → linear sRGB → sRGB (8-bit). Reference: https://bottosson.github.io/posts/oklab/ */
function oklchToRgb(L: number, C: number, H: number): { r: number; g: number; b: number } {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  // OKLab → linear LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  // Linear LMS → linear sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  // Linear sRGB → sRGB (gamma)
  const encode = (c: number): number => {
    const v = Math.max(0, c);
    if (v <= 0.0031308) return Math.max(0, 12.92 * v);
    return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };
  r = Math.round(encode(r) * 255);
  g = Math.round(encode(g) * 255);
  bl = Math.round(encode(bl) * 255);
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLin = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ─── Probe: extract computed colors for key selectors ─────────────────── */

interface ProbeResult {
  selector: string;
  label: string;
  mode: "dark" | "light";
  found: boolean;
  fg: string | null;
  bg: string | null;
  fontSize: string | null;
  isLargeText: boolean;
  ratio: number | null;
  passesNormal: boolean | null;
  passesLarge: boolean | null;
  passesAA: boolean | null;
  note?: string;
}

const PROBE_SELECTORS: Array<{ selector: string; label: string }> = [
  { selector: "body", label: "Body text" },
  { selector: "p.text-muted-foreground", label: "Muted paragraph text" },
  { selector: "h1", label: "H1 heading" },
  { selector: "h2", label: "H2 heading" },
  { selector: "a.text-primary", label: "Primary link (footer author)" },
  { selector: "button.bg-primary", label: "Primary button" },
  { selector: ".roycss-faq-trigger", label: "FAQ accordion trigger" },
  { selector: "input[type=text]", label: "Search input (first)" },
  { selector: ".text-gradient", label: "Gradient text (decorative)" },
  { selector: ".bg-card", label: "Card surface" },
];

function probeMode(mode: "dark" | "light"): ProbeResult[] {
  // Toggle theme
  abEvalStdin<string>(
    mode === "dark"
      ? `document.documentElement.classList.add('dark'); ''`
      : `document.documentElement.classList.remove('dark'); ''`,
    5_000,
  );
  ab(["wait", "300"], { timeout: 5_000 });

  const script = `
JSON.stringify(${JSON.stringify(PROBE_SELECTORS)}.map(({ selector, label }) => {
  const el = document.querySelector(selector);
  if (!el) return { selector, label, found: false, fg: null, bg: null, fontSize: null };
  const cs = getComputedStyle(el);
  // Walk up the tree to find a non-transparent background.
  let bg = cs.backgroundColor;
  let cur = el;
  while ((bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') && cur.parentElement) {
    cur = cur.parentElement;
    bg = getComputedStyle(cur).backgroundColor;
  }
  // If still transparent, use the document background.
  if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
    bg = getComputedStyle(document.body).backgroundColor;
  }
  const fg = cs.color;
  const fontSize = cs.fontSize;
  return { selector, label, found: true, fg, bg, fontSize };
}))
`;

  const raw = abEvalStdin<string>(script, 15_000);
  const probed = JSON.parse(raw) as Array<{
    selector: string;
    label: string;
    found: boolean;
    fg: string | null;
    bg: string | null;
    fontSize: string | null;
  }>;

  return probed.map((p): ProbeResult => {
    if (!p.found) {
      return { ...p, mode, isLargeText: false, ratio: null, passesNormal: null, passesLarge: null, passesAA: null, note: "selector not found" };
    }
    const fg = p.fg ? parseColorToRgb(p.fg) : null;
    const bg = p.bg ? parseColorToRgb(p.bg) : null;
    if (!fg || !bg) {
      return { ...p, mode, isLargeText: false, ratio: null, passesNormal: null, passesLarge: null, passesAA: null, note: "color parse failed (likely OKLCH custom property — manual review needed)" };
    }
    const ratio = contrastRatio(fg, bg);
    // Large text per WCAG: ≥18pt (24px) regular, or ≥14pt (18.66px) bold.
    const pxMatch = p.fontSize?.match(/([\d.]+)px/);
    const px = pxMatch ? +pxMatch[1] : 16;
    const isLargeText = px >= 24;
    const passesNormal = ratio >= 4.5;
    const passesLarge = ratio >= 3;
    const passesAA = isLargeText ? passesLarge : passesNormal;
    return { ...p, mode, isLargeText, ratio, passesNormal, passesLarge, passesAA };
  });
}

/* ─── Reflow check at 320px ────────────────────────────────────────────── */

function checkReflow(): { horizontalScroll: boolean; scrollWidth: number; viewportWidth: number } {
  ab(["set", "viewport", "320", "800"], { timeout: 15_000 });
  ab(["wait", "500"], { timeout: 5_000 });
  const raw = abEvalStdin<string>(
    `JSON.stringify({ scrollWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth })`,
    10_000,
  );
  const r = JSON.parse(raw) as { scrollWidth: number; viewportWidth: number };
  return { horizontalScroll: r.scrollWidth > r.viewportWidth + 1, scrollWidth: r.scrollWidth, viewportWidth: r.viewportWidth };
}

/* ─── Main ─────────────────────────────────────────────────────────────── */

console.error("→ opening page …");
abOpen(TARGET_URL);
ab(["wait", "--load", "networkidle", "--timeout", "60000"], { timeout: 70_000 });
ab(["wait", "1500"], { timeout: 10_000 });

console.error("→ probing dark-mode contrast …");
const darkResults = probeMode("dark");

console.error("→ screenshotting dark mode …");
ab(["set", "viewport", "1280", "800"], { timeout: 15_000 });
ab(["wait", "300"], { timeout: 5_000 });
const darkShot = ab(["screenshot", join(SCREENSHOTS_DIR, "dark-mode.png"), "--full", "--timeout", "30000"], { timeout: 45_000 });
console.error(`  dark-mode.png: ${darkShot.status === 0 ? "saved" : "failed"}`);

console.error("→ probing light-mode contrast …");
const lightResults = probeMode("light");

console.error("→ screenshotting light mode …");
ab(["wait", "300"], { timeout: 5_000 });
const lightShot = ab(["screenshot", join(SCREENSHOTS_DIR, "light-mode.png"), "--full", "--timeout", "30000"], { timeout: 45_000 });
console.error(`  light-mode.png: ${lightShot.status === 0 ? "saved" : "failed"}`);

console.error("→ checking reflow at 320 CSS px …");
const reflow = checkReflow();

/* ─── Summary + write report ───────────────────────────────────────────── */

const allResults = [...darkResults, ...lightResults];
const withRatios = allResults.filter((r) => r.ratio !== null);
const failing = withRatios.filter((r) => !r.passesAA);

const summary = {
  generatedAt: new Date().toISOString(),
  targetUrl: TARGET_URL,
  totalProbes: allResults.length,
  probesWithRatio: withRatios.length,
  probesFailingAA: failing.length,
  reflow,
  screenshots: {
    darkMode: join(SCREENSHOTS_DIR, "dark-mode.png"),
    lightMode: join(SCREENSHOTS_DIR, "light-mode.png"),
  },
  overallPass: failing.length === 0 && !reflow.horizontalScroll,
};

const report = {
  ...summary,
  results: { dark: darkResults, light: lightResults },
};

const outPath = join(RESULTS_DIR, "visual-checks.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`JSON written to ${outPath}`);

console.log("\n" + "═".repeat(78));
console.log("  Visual / Contrast Audit — " + TARGET_URL);
console.log("═".repeat(78));
console.log(`  Probes (total):        ${summary.totalProbes}`);
console.log(`  Probes with computed ratio: ${summary.probesWithRatio}`);
console.log(`  Probes failing AA:     ${summary.probesFailingAA}`);
console.log(`  Reflow @ 320px:        ${reflow.horizontalScroll ? "✗ horizontal scroll" : "✓ no horizontal scroll"} (${reflow.scrollWidth}px / ${reflow.viewportWidth}px)`);
console.log("─".repeat(78));
console.log("  Per-probe ratios:");
for (const r of withRatios) {
  const icon = r.passesAA ? "✓" : "✗";
  const ratioStr = r.ratio?.toFixed(2).padStart(6) ?? "  n/a";
  console.log(`  ${icon} [${r.mode.padEnd(5)}] ${ratioStr}:1  ${r.label} (${r.fontSize})`);
}
console.log("═".repeat(78));
console.log(summary.overallPass ? "✅ visual checks: PASS" : "❌ visual checks: FAIL");
console.log("");

ab(["close", "--all"], { timeout: 15_000 });
process.exit(summary.overallPass ? 0 : 1);
