/**
 * Property-registrar service — generate @property (CSS Houdini) rules from
 * a name + syntax + inherits + initialValue configuration.
 *
 * Mock backend (no DB). Seeds the 11 CSS syntax strings (with descriptions
 * and example initial values) and 4 @property presets (animated-color,
 * gradient-angle, spacing-scale, opacity-fade) demonstrating how typed
 * custom properties unlock CSS transitions, type-checking, and inheritance
 * control.
 *
 * The generate path returns:
 *   - css          : the @property rule (omits `initial-value` for the
 *                    universal `*` syntax, per spec)
 *   - fallbackCss  : a `:root { --foo: <value>; }` declaration that works
 *                    on browsers without @property support — the
 *                    "untyped-variable hack" equivalent
 *   - demoCss      : a small demo block consuming the var with a transition
 *                    (typed properties interpolate smoothly; untyped
 *                    properties jump at 50%)
 *
 * Reads are LRU-cached; generations cache per input hash.
 *
 * Reference: CSS Properties and Values API Level 1 §2 (@property).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { PropertyRegistrarGenerateInput } from "./schema.js";

const log = createLogger("property-registrar");

// ─── Types ───────────────────────────────────────────────────────────────
export interface SyntaxInfo {
  /** The CSS syntax string (e.g. "<color>"). */
  syntax: string;
  /** Short human-readable description. */
  description: string;
  /** Example initial value, valid for this syntax. */
  example: string;
  /** Whether this syntax forbids `initial-value` (only `*` does). */
  forbidsInitialValue: boolean;
}

export interface PropertyRegistrarResult {
  /** The @property rule. */
  css: string;
  /** Fallback declaration block (works without @property support). */
  fallbackCss: string;
  /** Optional demo block showing the property in use. */
  demoCss: string;
  /** Whether the universal `*` (untyped) syntax was used. */
  untyped: boolean;
  /** Human-readable summary. */
  explanation: string;
  /** Caveats and notes. */
  notes: string[];
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface PropertyRegistrarPreset {
  id: string;
  name: string;
  description: string;
  input: PropertyRegistrarGenerateInput;
}

// ─── Seed: 11 CSS syntax strings ─────────────────────────────────────────
const SEED_SYNTAXES: SyntaxInfo[] = [
  {
    syntax: "<color>",
    description: "A CSS color value — hex, named, rgb(), hsl(), oklch(), etc.",
    example: "#e66465",
    forbidsInitialValue: false,
  },
  {
    syntax: "<length>",
    description: "A distance value (px, em, rem, vw, ch, etc.).",
    example: "0px",
    forbidsInitialValue: false,
  },
  {
    syntax: "<percentage>",
    description: "A percentage value (0% to 100% or beyond).",
    example: "0%",
    forbidsInitialValue: false,
  },
  {
    syntax: "<length-percentage>",
    description: "Either a length or a percentage — accepts either form.",
    example: "0px",
    forbidsInitialValue: false,
  },
  {
    syntax: "<number>",
    description: "A unitless real number (e.g. opacity, line-height).",
    example: "0",
    forbidsInitialValue: false,
  },
  {
    syntax: "<integer>",
    description: "A unitless whole number (e.g. z-index, column-count).",
    example: "0",
    forbidsInitialValue: false,
  },
  {
    syntax: "<angle>",
    description: "An angle (deg, rad, turn, grad) — used for transforms.",
    example: "0deg",
    forbidsInitialValue: false,
  },
  {
    syntax: "<time>",
    description: "A duration (s or ms) — used by transition/animation.",
    example: "0s",
    forbidsInitialValue: false,
  },
  {
    syntax: "<resolution>",
    description: "A resolution (dpi, dpcm, dppx) — used by media queries.",
    example: "1x",
    forbidsInitialValue: false,
  },
  {
    syntax: "<url>",
    description: "A URL reference (url(...) or bare string per spec).",
    example: "url('/img/blank.svg')",
    forbidsInitialValue: false,
  },
  {
    syntax: "*",
    description:
      "Universal syntax — any valid CSS token sequence. Disallows initial-value.",
    example: "",
    forbidsInitialValue: true,
  },
];

// ─── Seed: 4 @property presets ───────────────────────────────────────────
const SEED_PRESETS: PropertyRegistrarPreset[] = [
  {
    id: "preset-animated-color",
    name: "Animated Color",
    description:
      "A <color>-typed custom property that interpolates smoothly between two values via transition.",
    input: {
      name: "--theme-accent",
      syntax: "<color>",
      inherits: true,
      initialValue: "#7c3aed",
      demoSelector: ".btn",
      demoProperty: "background",
      demoValue: "#ec4899",
    },
  },
  {
    id: "preset-gradient-angle",
    name: "Gradient Angle",
    description:
      "An <angle>-typed property that drives a conic/linear-gradient direction — animatable.",
    input: {
      name: "--gradient-angle",
      syntax: "<angle>",
      inherits: false,
      initialValue: "0deg",
      demoSelector: ".aurora",
      demoProperty: "background",
      demoValue: "linear-gradient(calc(var(--gradient-angle) + 90deg), #34d399, #06b6d4)",
    },
  },
  {
    id: "preset-spacing-scale",
    name: "Spacing Scale",
    description:
      "A <length>-typed property for an inherited spacing token — change once, cascade everywhere.",
    input: {
      name: "--space-block",
      syntax: "<length>",
      inherits: true,
      initialValue: "16px",
      demoSelector: ".stack",
      demoProperty: "padding",
      demoValue: "24px",
    },
  },
  {
    id: "preset-opacity-fade",
    name: "Opacity Fade",
    description:
      "A <number>-typed property for opacity — interpolates 0..1 across the transition.",
    input: {
      name: "--overlay-alpha",
      syntax: "<number>",
      inherits: false,
      initialValue: "0",
      demoSelector: ".overlay",
      demoProperty: "opacity",
      demoValue: "1",
    },
  },
];

const syntaxes: SyntaxInfo[] = SEED_SYNTAXES.map((s) => ({ ...s }));
const presets: PropertyRegistrarPreset[] = SEED_PRESETS.map((p) => ({
  ...p,
  input: { ...p.input },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────

function buildCss(input: PropertyRegistrarGenerateInput): string {
  const lines: string[] = [];
  lines.push(`@property ${input.name} {`);
  lines.push(`  syntax: "${input.syntax}";`);
  lines.push(`  inherits: ${input.inherits};`);
  // The universal `*` syntax forbids `initial-value` per the CSS Properties
  // and Values API spec §2.1.
  if (input.syntax !== "*" && input.initialValue !== undefined) {
    lines.push(`  initial-value: ${input.initialValue};`);
  }
  lines.push(`}`);
  return lines.join("\n");
}

function buildFallbackCss(input: PropertyRegistrarGenerateInput): string {
  // The "untyped-variable hack" — declare the var as a plain custom
  // property in a high-specificity scope so older browsers without
  // @property support still resolve var() references. For the universal
  // `*` syntax, this is also the only way to provide an initial value
  // (since @property disallows it).
  const value = input.initialValue ?? "";
  const lines: string[] = [];
  lines.push(
    `/* Fallback: plain custom property for browsers without @property support */`,
  );
  lines.push(`${input.demoSelector} {`);
  if (value) {
    lines.push(`  ${input.name}: ${value};`);
  } else {
    lines.push(`  /* ${input.name} has no initial value (universal syntax) */`);
  }
  lines.push(`}`);
  return lines.join("\n");
}

function buildDemoCss(input: PropertyRegistrarGenerateInput): string {
  const transitionProp = input.syntax === "*" ? input.name : input.name;
  const lines: string[] = [];
  lines.push(`/* Demo: typed property interpolates; untyped jumps at 50% */`);
  lines.push(`${input.demoSelector} {`);
  lines.push(`  ${input.demoProperty}: var(${input.name});`);
  lines.push(`  transition: ${transitionProp} 0.4s ease;`);
  lines.push(`}`);
  if (input.demoValue) {
    lines.push(`${input.demoSelector}:hover {`);
    lines.push(`  ${input.name}: ${input.demoValue};`);
    lines.push(`}`);
  }
  return lines.join("\n");
}

function buildExplanation(input: PropertyRegistrarGenerateInput): string {
  const typed = input.syntax !== "*";
  const inheritsVerb = input.inherits ? "inherits" : "does not inherit";
  if (typed) {
    return (
      `Registers ${input.name} as a typed custom property (syntax "${input.syntax}") ` +
      `that ${inheritsVerb} down the DOM tree. ` +
      `Because the browser knows the value's type, transitions on this property ` +
      `interpolate smoothly — and any value that doesn't match the syntax is ` +
      `rejected at parse time, falling back to the registered initial value.`
    );
  }
  return (
    `Registers ${input.name} with the universal "*" syntax — it accepts any ` +
    `CSS token sequence but the spec disallows initial-value, so a separate ` +
    `:root declaration provides the default. Untyped properties do NOT ` +
    `interpolate (they jump discretely at 50% of the transition), so prefer ` +
    `typed syntaxes for animated values.`
  );
}

function buildNotes(input: PropertyRegistrarGenerateInput): string[] {
  const notes: string[] = [];
  if (input.syntax === "*") {
    notes.push(
      "Universal `*` syntax forbids `initial-value` — set the default via a :root declaration instead.",
    );
    notes.push(
      "Untyped properties do not interpolate; transitions on them jump at 50%.",
    );
  } else {
    notes.push(
      `Initial value "${input.initialValue ?? ""}" must match the ${input.syntax} syntax or it is rejected.`,
    );
    notes.push(
      "Typed properties interpolate smoothly and enable transition/animation.",
    );
  }
  if (input.inherits) {
    notes.push(
      "inherits:true cascades the value to descendants — change once on a parent and all children update.",
    );
  } else {
    notes.push(
      "inherits:false isolates the value per element — useful for component-scoped tokens.",
    );
  }
  notes.push(
    "Always declare the @property rule in a global stylesheet (not scoped) so it's registered before use.",
  );
  return notes;
}

// ─── Public service API ──────────────────────────────────────────────────

/** List all 11 CSS syntax strings with descriptions. Cached. */
export async function listSyntaxes(): Promise<SyntaxInfo[]> {
  return cacheWrap(
    "property-registrar:syntaxes",
    () => Promise.resolve(syntaxes.map((s) => ({ ...s }))),
    CACHE_TTL.propertyRegistrarSyntaxes,
  );
}

/** List all 4 @property presets. Cached. */
export async function listPresets(): Promise<PropertyRegistrarPreset[]> {
  return cacheWrap(
    "property-registrar:presets",
    () =>
      Promise.resolve(
        presets.map((p) => ({ ...p, input: { ...p.input } })),
      ),
    CACHE_TTL.propertyRegistrarPresets,
  );
}

/** Generate @property CSS from name + syntax + inherits + initialValue. */
export async function generateProperty(
  input: PropertyRegistrarGenerateInput,
): Promise<PropertyRegistrarResult> {
  const cacheKey = `property-registrar:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const css = buildCss(input);
      const fallbackCss = buildFallbackCss(input);
      const demoCss = buildDemoCss(input);
      const untyped = input.syntax === "*";

      log.info("Property registered", {
        name: input.name,
        syntax: input.syntax,
        inherits: input.inherits,
        untyped,
      });

      return Promise.resolve({
        css,
        fallbackCss,
        demoCss,
        untyped,
        explanation: buildExplanation(input),
        notes: buildNotes(input),
        support: {
          baseline: "2022 (@property)",
          chrome: "85+",
          safari: "16.4+",
          firefox: "128+",
        },
      });
    },
    CACHE_TTL.propertyRegistrarGenerate,
  );
}
