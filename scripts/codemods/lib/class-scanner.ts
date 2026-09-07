/**
 * class-scanner.ts — shared codemod core (PF-015, issue #95)
 *
 * Tokenizes the class strings of `class="…"` / `className="…"` attributes in
 * HTML / JSX / TSX / TJX sources while preserving the exact surrounding
 * whitespace. Tokens carry absolute [start, end) offsets into the source so
 * downstream transforms can perform surgical string edits without reflowing
 * formatting.
 *
 * Only *string literal* attribute values are scanned. Dynamic values
 * (`className={…}`, `class={…}`) are deliberately skipped — a conservative
 * codemod never guesses what an expression evaluates to.
 */

/** A single whitespace-delimited class token with absolute source offsets. */
export interface ClassToken {
  /** The class name exactly as written (no surrounding whitespace). */
  value: string;
  /** Inclusive start offset of the token in the source string. */
  start: number;
  /** Exclusive end offset of the token in the source string. */
  end: number;
}

/** A `class` / `className` string attribute found in the source. */
export interface ClassAttribute {
  /** Attribute name — "class" or "className". */
  name: "class" | "className";
  /** The quote character that delimited the value. */
  quote: "'" | '"';
  /** Inclusive offset of the attribute name's first character. */
  start: number;
  /** Exclusive offset just past the closing quote. */
  end: number;
  /** Inclusive offset of the first character inside the opening quote. */
  valueStart: number;
  /** Exclusive offset just past the last character before the closing quote. */
  valueEnd: number;
  /** Whitespace-delimited tokens inside the value, in source order. */
  tokens: ClassToken[];
}

const CLASS_ATTR_RE = /\b(?:className|class)(\s*)=(\s*)(["'])([\s\S]*?)\3/g;

/**
 * Split a raw attribute value into whitespace-delimited tokens, keeping
 * absolute offsets (value offset + token offset within the value).
 *
 * Whitespace runs (spaces, tabs, newlines) between tokens are preserved
 * verbatim — only token ranges are ever rewritten by the mapper.
 */
export function tokenizeAttributeValue(value: string, offset = 0): ClassToken[] {
  const tokens: ClassToken[] = [];
  const len = value.length;
  let i = 0;
  while (i < len) {
    // skip whitespace
    while (i < len && /\s/.test(value[i])) i++;
    if (i >= len) break;
    const start = i;
    while (i < len && !/\s/.test(value[i])) i++;
    tokens.push({ value: value.slice(start, i), start: offset + start, end: offset + i });
  }
  return tokens;
}

/** True when `source[i - 1]` is a real attribute boundary (or i === 0). */
function isAttrBoundary(source: string, i: number): boolean {
  if (i === 0) return true;
  return /[\s"'`]/.test(source[i - 1]);
}

/**
 * Scan a source string for `class="…"` / `className="…"` string attributes.
 *
 * Multi-line values are supported (class lists broken across lines keep their
 * exact layout). Dynamic bindings (`className={expr}`) do not match because a
 * `=` must be followed (after optional spaces) by a quote character.
 *
 * Hyphenated / namespaced attribute names that merely *contain* "class"
 * (`data-class=`, `xlink:class=`, …) are rejected: the character before the
 * matched name must be whitespace or a quote — a conservative scanner never
 * guesses at look-alike attributes.
 */
export function scanClassAttributes(source: string): ClassAttribute[] {
  const attrs: ClassAttribute[] = [];
  CLASS_ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CLASS_ATTR_RE.exec(source)) !== null) {
    if (!isAttrBoundary(source, m.index)) continue; // data-class=, xlink:class=, …
    const nameMatch = /^(className|class)/.exec(m[0]);
    if (!nameMatch) continue;
    const quote = m[3] as "'" | '"';
    const valueStart = m.index + m[0].indexOf(quote) + 1;
    const valueEnd = valueStart + m[4].length;
    attrs.push({
      name: nameMatch[1] as "class" | "className",
      quote,
      start: m.index,
      end: valueEnd + 1,
      valueStart,
      valueEnd,
      tokens: tokenizeAttributeValue(m[4], valueStart),
    });
  }
  return attrs;
}

/** True when a token is already a RoyCSS / RoyMotion library class. */
export function isRoycssClass(token: string): boolean {
  return /^(roycss|roymotion)-[A-Za-z0-9_-]+$/.test(token);
}
