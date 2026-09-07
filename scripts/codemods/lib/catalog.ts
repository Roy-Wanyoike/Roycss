/**
 * catalog.ts — shared codemod core (PF-015, issue #95)
 *
 * Loads the real RoyCSS effect catalog (src/lib) and exposes the set of
 * class selectors it actually defines. Every mapping target of every
 * *inbound* codemod must be a member of this set — the codemod test suite
 * pins that invariant so a mapping can never reference a class the library
 * does not ship.
 */

import { effects } from "../../../src/lib/roycss-effects";

/** All `.roycss-*` class selectors defined by the catalog (memoized). */
let cachedClasses: Set<string> | null = null;

export function getCatalogClasses(): Set<string> {
  if (cachedClasses) return cachedClasses;
  const classes = new Set<string>();
  const selectorRe = /\.((?:roycss|roymotion)-[A-Za-z0-9_-]+)/g;
  for (const effect of effects) {
    for (const m of effect.cssCode.matchAll(selectorRe)) {
      classes.add(m[1]);
    }
  }
  cachedClasses = classes;
  return classes;
}

/** Number of unique catalog classes (1 selector per effect id plus helpers). */
export function catalogClassCount(): number {
  return getCatalogClasses().size;
}

/** True when `cls` is a class the catalog really defines. */
export function isCatalogClass(cls: string): boolean {
  return getCatalogClasses().has(cls);
}

/**
 * The full cssCode of the effect that defines the given class, or `null`
 * when the class is unknown. Used by the outbound to-vanilla-css codemod to
 * emit a self-contained plain-CSS block.
 */
export function getEffectCssForClass(cls: string): string | null {
  const re = new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_-])`);
  for (const effect of effects) {
    if (re.test(effect.cssCode)) return effect.cssCode;
  }
  return null;
}
