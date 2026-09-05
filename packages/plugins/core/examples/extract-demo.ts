/**
 * Extraction demo — NOT executed by CI.
 *
 * Run from the repo root:
 *
 *   bun packages/plugins/core/examples/extract-demo.ts
 *
 * Scans a realistic JSX page against the real shipped stylesheet
 * (dist/roycss.css, 1959 effects) and prints what the build plugins would
 * emit: kept rules, kept @keyframes, and output size vs. the full size.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractStylesheet, scanClasses } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..", "..");
const stylesheetPath = join(repoRoot, "dist", "roycss.css");
const fullCss = readFileSync(stylesheetPath, "utf8");

const SAMPLE_JSX = `
export function LandingPage({ variant }: { variant: "hero" | "quiet" }) {
  const heroClass = [
    "roycss-card-3d",
    variant === "hero" && "roycss-shine-border-wrap",
  ].filter(Boolean).join(" ");

  return (
    <main className={heroClass}>
      <h1 className={\`roycss-animated-gradient-text \${variant === "hero" ? "roycss-pulse-glow" : ""}\`}>
        Ship less CSS
      </h1>
      <button className="roycss-bounce-in r-btn r-btn-primary">Get started</button>
      <div className="roycss-float" aria-hidden="true" />
      <div className="roycss-property-progress-bar" role="progressbar" />
    </main>
  );
}
`;

const usedClasses = scanClasses(SAMPLE_JSX);
const result = extractStylesheet(fullCss, usedClasses);

const fmt = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
const pct = (part: number, total: number): string =>
  total === 0 ? "0%" : `${((part / total) * 100).toFixed(2)}%`;

console.log("RoyCSS extraction demo (core scan + extract)");
console.log("──────────────────────────────────────────────");
console.log(`stylesheet      : ${stylesheetPath}`);
console.log(`input size      : ${fmt(result.inputBytes)} (${result.totalRules} style rules, ${result.totalKeyframes} @keyframes)`);
console.log(`classes scanned : ${usedClasses.length}`);
console.log(`  matched       : ${result.matchedClasses.join(", ")}`);
console.log(`  unmatched     : ${result.unmatchedClasses.join(", ") || "(none)"}`);
console.log("──────────────────────────────────────────────");
console.log(`kept style rules: ${result.keptRules} (${pct(result.keptRules, result.totalRules)} of stylesheet)`);
console.log(`kept @keyframes : ${result.keptKeyframes}`);
console.log(`kept at-blocks  : ${result.keptAtRuleBlocks} (@media/@supports/@property)`);
console.log(`output size     : ${fmt(result.outputBytes)} (${pct(result.outputBytes, result.inputBytes)} of full CSS)`);
console.log("──────────────────────────────────────────────");
console.log("First 40 lines of the extracted stylesheet:");
console.log(result.css.split("\n").slice(0, 40).map((l) => `  ${l}`).join("\n"));
