/**
 * RoyCSS — Framework-Agnostic CSS Effects Library
 *
 * This module provides framework-agnostic access to all RoyCSS effects.
 * Works in React, Vue, Angular, Svelte, Solid, Vanilla JS, and any web project.
 *
 * USAGE:
 *
 * 1. Import the CSS (framework-agnostic):
 *    import "roycss/css";           // All effects
 *    import "roycss/css/minimal";   // Just animations
 *
 * 2. Use the class names:
 *    <div class="roycss-pulse-glow">Hello</div>
 *
 * 3. Or use the helper functions:
 *    import { getClass, getCSS, effects } from "roycss";
 *    <div class={getClass("pulse-glow")}>Hello</div>
 */

import { effects as allEffects, allEffectCSS } from "./roycss-effects";
import type { CSSEffect, EffectCategory, PreviewType } from "./roycss-types";

// Re-export everything for programmatic use
export { allEffects as effects, allEffectCSS, categoryMeta, categoryOrder } from "./roycss-effects";
export type { CSSEffect, EffectCategory, PreviewType } from "./roycss-types";

/**
 * Get the CSS class name for an effect by ID.
 * @example getClass("pulse-glow") → "roycss-pulse-glow"
 */
export function getClass(id: string): string {
  return `roycss-${id}`;
}

/**
 * Get the full CSS code for a specific effect by ID.
 * Returns empty string if not found.
 * @example getCSS("pulse-glow") → "/* Pulse Glow *\/ .roycss-pulse-glow { ... }"
 */
export function getCSS(id: string): string {
  const effect = allEffects.find((e) => e.id === id);
  return effect?.cssCode ?? "";
}

/**
 * Get all effects in a specific category.
 * @example getByCategory("animations") → [CSSEffect, ...]
 */
export function getByCategory(category: EffectCategory): CSSEffect[] {
  return allEffects.filter((e) => e.category === category);
}

/**
 * Search effects by keyword (matches name, description, or tags).
 * @example search("glow") → [CSSEffect, ...]
 */
export function search(query: string): CSSEffect[] {
  const q = query.toLowerCase();
  return allEffects.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Get the complete CSS string for ALL effects.
 * Useful for generating a standalone .css file.
 */
export function getAllCSS(): string {
  return allEffectCSS;
}

/**
 * Get CSS for a subset of effects by IDs.
 * Useful for tree-shaking — only include the effects you use.
 * @example getCSSForEffects(["pulse-glow", "bounce-in"])
 */
export function getCSSForEffects(ids: string[]): string {
  return allEffects
    .filter((e) => ids.includes(e.id))
    .map((e) => e.cssCode)
    .join("\n\n");
}
