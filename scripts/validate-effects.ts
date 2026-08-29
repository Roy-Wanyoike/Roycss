/**
 * Validates all RoyCSS effects for correctness and consistency.
 *
 * Run with: `bun run scripts/validate-effects.ts`
 *
 * Checks performed per effect:
 *   1. Required metadata fields present (id, name, category, cssCode)
 *   2. CSS brace balance ({ === })
 *   3. CSS uses the `roycss-` class prefix
 *   4. Any @keyframes use the `roy-` prefix
 *   5. Category exists in `categoryMeta`
 *   6. No duplicate IDs
 *   7. prefers-reduced-motion fallback exists when animation present
 *
 * Exits with code 1 if any errors are found.
 */

import { effects } from "../src/lib/roycss-effects";
import { categoryMeta } from "../src/lib/roycss-types";

let errors = 0;
let warnings = 0;
const seen = new Map<string, number>();
const validCategories = new Set(Object.keys(categoryMeta));

for (const effect of effects) {
  const issues: string[] = [];

  // 1. Check required fields
  if (!effect.id) issues.push("missing id");
  if (!effect.name) issues.push("missing name");
  if (!effect.category) issues.push("missing category");
  if (!effect.cssCode) issues.push("missing cssCode");

  // 5. Check category exists
  if (effect.category && !validCategories.has(effect.category)) {
    issues.push(`unknown category: ${effect.category}`);
  }

  // 6. Check for duplicates
  if (effect.id) {
    const count = seen.get(effect.id) ?? 0;
    if (count > 0) issues.push(`duplicate id: ${effect.id}`);
    seen.set(effect.id, count + 1);
  }

  // 2–4, 7. CSS-level checks
  if (effect.cssCode) {
    const css = effect.cssCode;

    // 2. Check CSS brace balance
    const opens = (css.match(/{/g) ?? []).length;
    const closes = (css.match(/}/g) ?? []).length;
    if (opens !== closes) {
      issues.push(`unbalanced braces: ${opens} open, ${closes} close`);
    }

    // 3. Check roycss- prefix
    if (!css.includes("roycss-")) {
      issues.push("no roycss- class prefix");
    }

    // 4. Check roy- keyframes prefix
    if (css.includes("@keyframes") && !css.includes("roy-")) {
      issues.push("keyframes missing roy- prefix");
    }

    // 7. Check prefers-reduced-motion
    if (css.includes("@keyframes") || css.includes("animation")) {
      if (!css.includes("prefers-reduced-motion")) {
        issues.push("animation without prefers-reduced-motion fallback");
      }
    }
  }

  if (issues.length > 0) {
    console.error(
      `❌ ${effect.id ?? "unknown"}: ${issues.join(", ")}`,
    );
    errors++;
  }
}

console.log(`\n${effects.length} effects validated`);
console.log(`${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
