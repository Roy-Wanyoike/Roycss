/**
 * mapper.ts — shared codemod core (PF-015, issue #95)
 *
 * A `MappingTable` maps a source-framework class to a RoyCSS class
 * (string) or to `null` when the source class is *recognized* but has no
 * honest RoyCSS equivalent (kept in place and reported — never silently
 * transformed).
 *
 * `applyMapping` runs the table over every `class` / `className` attribute
 * of a source string using the class-scanner, performing surgical token
 * replacement so whitespace and quoting are preserved byte-for-byte.
 */

import { scanClassAttributes, isRoycssClass, type ClassToken } from "./class-scanner";

/** source class → RoyCSS class, or `null` for "recognized, no equivalent". */
export type MappingTable = Record<string, string | null>;

/** One applied replacement: source token → target token. */
export interface Replacement {
  from: string;
  to: string;
}

export interface MappingOptions {
  /**
   * Regexes for source-framework utility classes that intentionally stay
   * as-is (e.g. Tailwind layout utilities). Matched tokens are counted in
   * the `ignored` bucket instead of `unknown` — they are never touched.
   */
  ignore?: RegExp[];
  /**
   * Skip tokens that are already RoyCSS/RoyMotion classes (default true —
   * inbound codemods must not touch them). Outbound codemods set this to
   * false because `roycss-*` is exactly what they consume.
   */
  skipRoycss?: boolean;
}

export interface MappingResult {
  /** The transformed source (identical to the input when nothing matched). */
  output: string;
  /** Replacements actually applied, in source order. */
  replaced: Replacement[];
  /** Classes not present in the mapping table (kept + reported). */
  unknown: string[];
  /** Classes mapped to `null` — recognized, no RoyCSS equivalent (kept). */
  kept: string[];
  /** Classes matching an `ignore` pattern — framework utilities kept as-is. */
  ignored: string[];
  /** RoyCSS/RoyMotion classes found in the source (kept by inbound codemods). */
  alreadyRoycss: string[];
}

function classify(
  token: string,
  table: MappingTable,
  options: Required<Pick<MappingOptions, "skipRoycss">> & { ignore: RegExp[] },
  buckets: Omit<MappingResult, "output" | "replaced">,
): string | null {
  const push = (list: string[], value: string) => {
    if (!list.includes(value)) list.push(value);
  };
  if (options.skipRoycss && isRoycssClass(token)) {
    push(buckets.alreadyRoycss, token);
    return null;
  }
  if (token in table) {
    const target = table[token];
    if (target === null || target === undefined) {
      push(buckets.kept, token);
      return null;
    }
    return target;
  }
  if (options.ignore.some((re) => re.test(token))) {
    push(buckets.ignored, token);
    return null;
  }
  push(buckets.unknown, token);
  return null;
}

/**
 * Apply a mapping table to every `class` / `className` attribute in `source`.
 *
 * Replacement is performed as a single backward pass over the collected token
 * ranges so earlier offsets stay valid. Idempotent by construction: targets
 * are RoyCSS classes, and RoyCSS tokens are skipped on the next run.
 */
export function applyMapping(source: string, table: MappingTable, options: MappingOptions = {}): MappingResult {
  const resolved = {
    skipRoycss: options.skipRoycss ?? true,
    ignore: options.ignore ?? [],
  };
  const buckets = { unknown: [] as string[], kept: [] as string[], ignored: [] as string[], alreadyRoycss: [] as string[] };
  const replaced: Replacement[] = [];
  const edits: Array<{ token: ClassToken; target: string }> = [];

  for (const attr of scanClassAttributes(source)) {
    for (const token of attr.tokens) {
      const target = classify(token.value, table, resolved, buckets);
      if (target !== null) {
        edits.push({ token, target });
        if (!replaced.some((r) => r.from === token.value && r.to === target)) {
          replaced.push({ from: token.value, to: target });
        }
      }
    }
  }

  let output = source;
  for (let i = edits.length - 1; i >= 0; i--) {
    const { token, target } = edits[i];
    output = output.slice(0, token.start) + target + output.slice(token.end);
  }

  return { output, replaced, ...buckets };
}
