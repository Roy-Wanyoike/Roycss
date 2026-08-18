/**
 * Copy-as: convert raw RoyCSS CSS into 7 framework-specific formats.
 *
 * The input CSS always looks like:
 * ```css
 * .roycss-<effectId> {
 *   property: value;
 *   animation: roy-<effectId> 2s infinite;
 * }
 * @keyframes roy-<effectId> { ... }
 * .roycss-<effectId>::before { ... }
 * ```
 *
 * We parse the CSS once into a structured shape (main rule + keyframes + extra
 * rules), then re-emit it in the requested format.
 */

export type CopyFormat =
  | "css"
  | "inline"
  | "tailwind"
  | "scss"
  | "cssinjs"
  | "vue"
  | "html";

export interface CopyFormatOption {
  id: CopyFormat;
  label: string;
  description: string;
  icon: string;
}

export const COPY_FORMATS: CopyFormatOption[] = [
  { id: "css", label: "CSS Class", description: "Standard CSS class definition", icon: "Code2" },
  { id: "inline", label: "Inline Style", description: 'style="..." attribute', icon: "Braces" },
  { id: "tailwind", label: "Tailwind Config", description: "Extend Tailwind theme", icon: "Wind" },
  { id: "scss", label: "SCSS Mixin", description: "@mixin with parameters", icon: "FileCode" },
  { id: "cssinjs", label: "CSS-in-JS", description: "styled-components object", icon: "Braces" },
  { id: "vue", label: "Vue SFC", description: "Scoped style block", icon: "FileCode" },
  { id: "html", label: "HTML Snippet", description: "Element + class, ready to paste", icon: "Code" },
];

/* ═══════════════════════════════════════════════════════════════
   INTERNAL CSS PARSER
   ═══════════════════════════════════════════════════════════════ */

interface ParsedDeclaration {
  prop: string;
  value: string;
}

interface ParsedRule {
  selector: string;
  body: string;
  decls: ParsedDeclaration[];
}

interface ParsedKeyframe {
  name: string;
  body: string;
  stops: ParsedRule[];
}

interface ParsedCSS {
  mainSelector: string;
  mainBody: string;
  mainDecls: ParsedDeclaration[];
  keyframes: ParsedKeyframe[];
  otherRules: ParsedRule[];
  rawCss: string;
}

/** Remove /* ... *​/ comments from CSS while preserving string literals. */
function stripComments(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 2;
    } else if (c === '"' || c === "'") {
      const quote = c;
      out += c;
      i++;
      while (i < css.length && css[i] !== quote) {
        out += css[i++];
      }
      if (i < css.length) {
        out += css[i];
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Given a string and the index of an opening `{`, return the index of the matching `}`. */
function findMatchingBrace(s: string, start: number): number {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Normalize whitespace in a CSS value (collapse runs of whitespace into a single space). */
function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Parse "prop: value; prop2: value2;" into [{prop, value}], respecting parens. */
function parseDeclarations(body: string): ParsedDeclaration[] {
  const decls: ParsedDeclaration[] = [];
  let depth = 0;
  let current = "";

  const pushDecl = (s: string) => {
    const t = s.trim();
    if (!t) return;
    const colon = t.indexOf(":");
    if (colon === -1) return;
    const prop = t.slice(0, colon).trim();
    const value = normalizeValue(t.slice(colon + 1));
    if (prop && value) decls.push({ prop, value });
  };

  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === ";" && depth === 0) {
      pushDecl(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) pushDecl(current);
  return decls;
}

/** Parse the inner body of `@keyframes` into stop rules (e.g. "0%, 100% { ... }"). */
function parseKeyframeStops(body: string): ParsedRule[] {
  const stops: ParsedRule[] = [];
  const cleaned = body.trim();
  let i = 0;
  while (i < cleaned.length) {
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
    if (i >= cleaned.length) break;
    const braceIdx = cleaned.indexOf("{", i);
    if (braceIdx === -1) break;
    const selector = cleaned.slice(i, braceIdx).trim();
    const closeIdx = findMatchingBrace(cleaned, braceIdx);
    if (closeIdx === -1) break;
    const stopBody = cleaned.slice(braceIdx + 1, closeIdx).trim();
    stops.push({ selector, body: stopBody, decls: parseDeclarations(stopBody) });
    i = closeIdx + 1;
  }
  return stops;
}

/** Parse the full CSS string into main rule + keyframes + other rules. */
function parseCss(css: string, effectId: string): ParsedCSS {
  const cleaned = stripComments(css).trim();
  const rules: ParsedRule[] = [];
  const keyframes: ParsedKeyframe[] = [];

  let i = 0;
  while (i < cleaned.length) {
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
    if (i >= cleaned.length) break;

    const braceIdx = cleaned.indexOf("{", i);
    if (braceIdx === -1) break;

    const selector = cleaned.slice(i, braceIdx).trim();
    const closeIdx = findMatchingBrace(cleaned, braceIdx);
    if (closeIdx === -1) break;
    const body = cleaned.slice(braceIdx + 1, closeIdx).trim();

    if (selector.startsWith("@keyframes")) {
      const nameMatch = selector.match(/@keyframes\s+([\w-]+)/);
      keyframes.push({
        name: nameMatch ? nameMatch[1] : "",
        body,
        stops: parseKeyframeStops(body),
      });
    } else {
      rules.push({ selector, body, decls: parseDeclarations(body) });
    }
    i = closeIdx + 1;
  }

  const mainSelector = `.roycss-${effectId}`;
  const exactMain = rules.find((r) => r.selector === mainSelector);
  const mainBody = exactMain?.body ?? "";
  const mainDecls = exactMain?.decls ?? [];
  const otherRules = rules.filter((r) => r !== exactMain);

  return {
    mainSelector,
    mainBody,
    mainDecls,
    keyframes,
    otherRules,
    rawCss: cleaned,
  };
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Convert a kebab-case CSS property to camelCase for CSS-in-JS objects. */
function camelCase(prop: string): string {
  // Vendor prefixes: -webkit-transform → WebkitTransform, -moz-transform → MozTransform
  if (prop.startsWith("-")) {
    return prop
      .slice(1)
      .replace(/(^|-)([a-z])/g, (_m, _sep, c: string) => c.toUpperCase());
  }
  return prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

/** Indent every non-empty line in `text` by `spaces` spaces. */
function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((l) => (l.length ? pad + l : l))
    .join("\n");
}

/** Pull the `animation` shorthand value out of a declaration list, if present. */
function extractAnimation(decls: ParsedDeclaration[]): string {
  const anim = decls.find(
    (d) => d.prop === "animation" || d.prop === "animation-name"
  );
  return anim ? anim.value : "";
}

/** Convert a kebab-case id like "pulse-glow" into camelCase JS identifier "pulseGlow". */
function toCamelId(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

/* ═══════════════════════════════════════════════════════════════
   FORMAT CONVERTERS
   ═══════════════════════════════════════════════════════════════ */

function formatInline(parsed: ParsedCSS): string {
  const inline = parsed.mainDecls
    .map((d) => `${d.prop}: ${d.value}`)
    .join("; ");
  const lines: string[] = [`style="${inline};"`];

  if (parsed.keyframes.length > 0 || parsed.otherRules.length > 0) {
    lines.push("");
    lines.push(
      "/* ⚠️ Keyframes & pseudo-rules can't live inline — paste the rules below into a <style> tag or stylesheet: */"
    );
    parsed.keyframes.forEach((kf) => {
      lines.push(`@keyframes ${kf.name} {`);
      lines.push(indent(kf.body, 2));
      lines.push("}");
    });
    parsed.otherRules.forEach((r) => {
      lines.push(`${r.selector} {`);
      lines.push(indent(r.body, 2));
      lines.push("}");
    });
  }
  return lines.join("\n");
}

function formatTailwind(parsed: ParsedCSS, effectId: string): string {
  const animValue = extractAnimation(parsed.mainDecls);
  const lines: string[] = [
    "// tailwind.config.js",
    "const plugin = require('tailwindcss/plugin')",
    "",
    "module.exports = {",
    "  theme: {",
    "    extend: {",
  ];

  if (animValue) {
    lines.push("      animation: {");
    lines.push(`        '${effectId}': ${JSON.stringify(animValue)},`);
    lines.push("      },");
  }

  lines.push("    },");
  lines.push("  },");
  lines.push("  plugins: [");
  lines.push("    plugin(({ addComponents }) => {");
  lines.push("      addComponents({");
  lines.push(`        ${JSON.stringify(parsed.mainSelector)}: {`);
  parsed.mainDecls.forEach((d) => {
    lines.push(`          ${camelCase(d.prop)}: ${JSON.stringify(d.value)},`);
  });
  lines.push("        },");
  parsed.otherRules.forEach((r) => {
    lines.push(`        ${JSON.stringify(r.selector)}: {`);
    r.decls.forEach((d) => {
      lines.push(`          ${camelCase(d.prop)}: ${JSON.stringify(d.value)},`);
    });
    lines.push("        },");
  });
  lines.push("      })");
  lines.push("    }),");
  lines.push("  ],");
  lines.push("}");

  if (parsed.keyframes.length > 0) {
    lines.push("");
    lines.push("/* Paste these keyframes into your global CSS (e.g. app/globals.css): */");
    parsed.keyframes.forEach((kf) => {
      lines.push(`@keyframes ${kf.name} {`);
      lines.push(indent(kf.body, 2));
      lines.push("}");
    });
  }
  return lines.join("\n");
}

function formatScss(parsed: ParsedCSS, effectId: string): string {
  const mixinName = `roycss-${effectId}`;
  const lines: string[] = [
    `// SCSS mixin — usage: @include ${mixinName};`,
    `@mixin ${mixinName} {`,
  ];

  parsed.mainDecls.forEach((d) => {
    lines.push(`  ${d.prop}: ${d.value};`);
  });

  // Nested rules (pseudo-elements, children) — rewrite .roycss-x → &
  parsed.otherRules.forEach((r) => {
    const nestedSel = r.selector.split(parsed.mainSelector).join("&");
    lines.push(`  ${nestedSel} {`);
    lines.push(indent(r.body, 4));
    lines.push("  }");
  });

  lines.push("}");

  if (parsed.keyframes.length > 0) {
    lines.push("");
    lines.push("// Keyframes are global — keep outside the @mixin");
    parsed.keyframes.forEach((kf) => {
      lines.push(`@keyframes ${kf.name} {`);
      lines.push(indent(kf.body, 2));
      lines.push("}");
    });
  }
  return lines.join("\n");
}

function formatCssInJs(parsed: ParsedCSS, effectId: string): string {
  const exportName = `${toCamelId(effectId)}Style`;
  const lines: string[] = [
    "// CSS-in-JS object — works with styled-components or emotion",
    "// import { css } from 'styled-components';   // or '@emotion/react'",
    `export const ${exportName} = {`,
  ];

  parsed.mainDecls.forEach((d) => {
    lines.push(`  ${camelCase(d.prop)}: ${JSON.stringify(d.value)},`);
  });

  // Pseudo / child rules as nested selector keys
  parsed.otherRules.forEach((r) => {
    lines.push(`  ${JSON.stringify(r.selector)}: {`);
    r.decls.forEach((d) => {
      lines.push(`    ${camelCase(d.prop)}: ${JSON.stringify(d.value)},`);
    });
    lines.push("  },");
  });

  // Keyframes as '@keyframes <name>' keys with stop objects
  if (parsed.keyframes.length > 0) {
    lines.push("  // Keyframes — register via styled-components' `keyframes` helper");
    lines.push("  // or paste as raw CSS in a <GlobalStyle>.");
    parsed.keyframes.forEach((kf) => {
      lines.push(`  ${JSON.stringify(`@keyframes ${kf.name}`)}: {`);
      kf.stops.forEach((stop) => {
        lines.push(`    ${JSON.stringify(stop.selector)}: {`);
        stop.decls.forEach((d) => {
          lines.push(`      ${camelCase(d.prop)}: ${JSON.stringify(d.value)},`);
        });
        lines.push("    },");
      });
      lines.push("  },");
    });
  }

  lines.push("};");
  return lines.join("\n");
}

function formatVue(parsed: ParsedCSS): string {
  const className = parsed.mainSelector.slice(1);
  return [
    "<style scoped>",
    parsed.rawCss,
    "</style>",
    "",
    "<!-- Use in <template>: -->",
    "<template>",
    `  <div class="${className}"></div>`,
    "</template>",
  ].join("\n");
}

function formatHtml(parsed: ParsedCSS): string {
  const className = parsed.mainSelector.slice(1);
  return [
    "<!-- 1. Paste this CSS into a stylesheet or <style> tag: -->",
    "<style>",
    parsed.rawCss,
    "</style>",
    "",
    "<!-- 2. Use the class in your HTML: -->",
    `<div class="${className}"></div>`,
  ].join("\n");
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC ENTRY POINT
   ═══════════════════════════════════════════════════════════════ */

export function formatCss(css: string, effectId: string, format: CopyFormat): string {
  const parsed = parseCss(css, effectId);

  switch (format) {
    case "css":
      // Return the raw CSS exactly as provided (preserves the original comment header etc.)
      return css;

    case "inline":
      return formatInline(parsed);

    case "tailwind":
      return formatTailwind(parsed, effectId);

    case "scss":
      return formatScss(parsed, effectId);

    case "cssinjs":
      return formatCssInJs(parsed, effectId);

    case "vue":
      return formatVue(parsed);

    case "html":
      return formatHtml(parsed);

    default:
      return css;
  }
}
