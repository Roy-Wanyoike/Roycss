/**
 * RoyCSS class scanner.
 *
 * Finds `roycss-*` (full effect classes) and `r-*` (utility shorthand) class
 * tokens inside arbitrary source text: JSX/TSX, plain HTML, template
 * literals, `className` arrays, `clsx(...)` calls, Svelte/Astro class
 * directives — anything where a class-looking token appears.
 *
 * The scanner is deliberately token-based rather than AST-based:
 *
 *   • it never misses classes in strings the compiler would only see late
 *     (template literals, array joins, ternaries, directive syntaxes);
 *   • a false positive is harmless — the extractor simply keeps a few extra
 *     rules — while a false negative silently drops styles.
 *
 * Token boundaries are enforced with a lookbehind so CSS-ish words such as
 * `pointer-events`, `filter-`, `prefers-reduced-motion` or `--roy-*` custom
 * properties are never mistaken for classes.
 */

/**
 * Matches a class token that starts with `roycss-` or `r-` and is *not*
 * preceded by a word character or hyphen (so `linear-gradient`,
 * `pointer-events`, `--roy-x` … never match).
 */
const ROYCSS_CLASS_TOKEN =
  /(?<![\w-])((?:roycss-|r-)[A-Za-z0-9_-]+)/g;

/**
 * Scan a single source string for RoyCSS class usage.
 *
 * @param source source code or markup (JSX/TSX/HTML/Svelte/Astro/…)
 * @returns unique class tokens, sorted (deterministic)
 */
export function scanClasses(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(ROYCSS_CLASS_TOKEN)) {
    found.add(match[1]);
  }
  return [...found].sort();
}

/**
 * Scan several source strings at once (convenience — the union of
 * {@link scanClasses} over every item).
 *
 * @param sources source code strings
 * @returns unique class tokens, sorted (deterministic)
 */
export function scanSources(sources: readonly string[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    for (const match of source.matchAll(ROYCSS_CLASS_TOKEN)) {
      found.add(match[1]);
    }
  }
  return [...found].sort();
}

/**
 * Cheap predicate: does this token look like a RoyCSS class?
 * (`roycss-*` effect class or `r-*` utility shorthand.)
 */
export function isRoyCssClass(token: string): boolean {
  return /^(?:roycss-|r-)[A-Za-z0-9_-]+$/.test(token);
}
