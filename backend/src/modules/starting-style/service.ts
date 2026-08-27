/**
 * Starting-style service — generate @starting-style CSS from a duration +
 * easing + animated properties + allow-discrete configuration.
 *
 * 6 starting-style presets (fade-in, slide-up, scale-up, opacity-transition,
 * height-collapse, transform-in) demonstrate how `@starting-style` +
 * (optionally) `transition-behavior: allow-discrete` enable entry
 * animations for elements that previously had no old computed style (e.g.
 * display:none → visible, modal opens, popover shows).
 *
 * The generate path returns:
 *   - baseCss           : the visible (final) state with the transition
 *   - hiddenCss         : the hidden state (.is-hidden class)
 *   - startingStyleCss  : the @starting-style rule declaring the FROM state
 *                         for the enter transition
 *   - combinedCss       : all three blocks concatenated (copy-paste ready)
 *
 * Reference: CSS Transitions Module Level 2 §4 (@starting-style).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { StartingStyleGenerateInput } from "./schema.js";

const log = createLogger("starting-style");

// ─── Types ───────────────────────────────────────────────────────────────
export interface StartingStyleResult {
  /** The visible (final) state with the transition declaration. */
  baseCss: string;
  /** The hidden state (selected by `.is-hidden` or similar). */
  hiddenCss: string;
  /** The @starting-style rule declaring the FROM state for entry. */
  startingStyleCss: string;
  /** All three blocks concatenated, copy-paste ready. */
  combinedCss: string;
  /** Whether transition-behavior: allow-discrete was emitted. */
  allowDiscrete: boolean;
  /** Human-readable summary. */
  explanation: string;
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface StartingStylePreset {
  id: string;
  name: string;
  description: string;
  input: StartingStyleGenerateInput;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function easingString(input: StartingStyleGenerateInput): string {
  if (input.easing === "cubic-bezier" && input.cubicBezier) {
    const [a, b, c, d] = input.cubicBezier;
    return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
  }
  return input.easing;
}

function hasTransformLike(input: StartingStyleGenerateInput): boolean {
  return (
    input.properties.includes("transform") ||
    input.properties.includes("scale") ||
    input.properties.includes("translate")
  );
}

/** Build the `transition` declaration value. */
function transitionValue(input: StartingStyleGenerateInput): string {
  const ease = easingString(input);
  const dur = `${input.duration}ms`;
  const parts: string[] = [];
  for (const p of input.properties) {
    parts.push(`${p} ${dur} ${ease}`);
  }
  if (input.allowDiscrete) {
    parts.push(`display ${dur} ${ease} allow-discrete`);
  }
  return parts.join(", ");
}

/** The "visible" state — what the element looks like at rest. */
function buildBaseCss(input: StartingStyleGenerateInput): string {
  const lines: string[] = [];
  lines.push(`${input.selector} {`);
  if (input.properties.includes("opacity")) {
    lines.push(`  opacity: 1;`);
  }
  if (hasTransformLike(input)) {
    lines.push(`  transform: translateY(0) scale(1);`);
  }
  if (input.properties.includes("color")) {
    lines.push(`  color: currentColor;`);
  }
  if (input.properties.includes("background-color")) {
    lines.push(`  background-color: var(--bg, transparent);`);
  }
  if (input.properties.includes("border-color")) {
    lines.push(`  border-color: var(--border, transparent);`);
  }
  lines.push(`  transition: ${transitionValue(input)};`);
  lines.push(`}`);
  return lines.join("\n");
}

/** The "hidden" state — selected by `.is-hidden`. */
function buildHiddenCss(input: StartingStyleGenerateInput): string {
  const lines: string[] = [];
  lines.push(`${input.selector}.${input.hiddenClass} {`);
  if (input.properties.includes("opacity")) {
    lines.push(`  opacity: 0;`);
  }
  if (hasTransformLike(input)) {
    lines.push(
      `  transform: translateY(${input.translateY}px) scale(${input.scaleFrom});`,
    );
  }
  if (input.allowDiscrete) {
    lines.push(`  display: none;`);
  }
  lines.push(`}`);
  return lines.join("\n");
}

/** The @starting-style rule declaring the FROM state for entry. */
function buildStartingStyleCss(input: StartingStyleGenerateInput): string {
  const lines: string[] = [];
  lines.push(`@starting-style {`);
  lines.push(`  ${input.selector} {`);
  if (input.properties.includes("opacity")) {
    lines.push(`    opacity: 0;`);
  }
  if (hasTransformLike(input)) {
    lines.push(
      `    transform: translateY(${input.translateY}px) scale(${input.scaleFrom});`,
    );
  }
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join("\n");
}

function buildExplanation(input: StartingStyleGenerateInput): string {
  const animatedProps = input.properties.join(", ");
  const disc = input.allowDiscrete
    ? ` Includes \`transition-behavior: allow-discrete\` so the \`display: none\` on \`.${input.hiddenClass}\` is deferred to end-of-transition, enabling exit animations.`
    : "";
  return (
    `Generates a ${input.duration}ms ${easingString(input)} enter animation on ${input.selector} ` +
    `animating ${animatedProps}. The @starting-style rule declares the FROM state ` +
    `(opacity 0, translated/scaled) that the browser uses on the very first frame ` +
    `when the element transitions into its visible state.${disc}`
  );
}

// ─── 6 starting-style presets ─────────────────────────────────────────────
const PRESETS: StartingStylePreset[] = [
  {
    id: "preset-fade-in",
    name: "Fade In",
    description:
      "Simple opacity fade — the classic entry animation. 200ms ease-out.",
    input: {
      selector: ".tooltip",
      duration: 200,
      easing: "ease-out",
      properties: ["opacity"],
      translateY: 0,
      scaleFrom: 1,
      allowDiscrete: false,
      hiddenClass: "is-hidden",
    },
  },
  {
    id: "preset-slide-up",
    name: "Slide Up",
    description:
      "Opacity + translateY slide-in for toasts and notifications. 300ms ease-out.",
    input: {
      selector: ".toast",
      duration: 300,
      easing: "ease-out",
      properties: ["opacity", "transform"],
      translateY: 16,
      scaleFrom: 1,
      allowDiscrete: false,
      hiddenClass: "is-hidden",
    },
  },
  {
    id: "preset-scale-up",
    name: "Scale Up",
    description:
      "Opacity + scale pop-in for modals and popovers. 250ms springy cubic-bezier overshoot.",
    input: {
      selector: ".modal",
      duration: 250,
      easing: "cubic-bezier",
      cubicBezier: [0.34, 1.56, 0.64, 1],
      properties: ["opacity", "transform"],
      translateY: 0,
      scaleFrom: 0.9,
      allowDiscrete: false,
      hiddenClass: "is-hidden",
    },
  },
  {
    id: "preset-opacity-transition",
    name: "Opacity Transition",
    description:
      "Pure long-form opacity transition — 500ms ease-in-out for ambient cross-fades between slides.",
    input: {
      selector: ".slide",
      duration: 500,
      easing: "ease-in-out",
      properties: ["opacity"],
      translateY: 0,
      scaleFrom: 1,
      allowDiscrete: false,
      hiddenClass: "is-hidden",
    },
  },
  {
    id: "preset-height-collapse",
    name: "Height Collapse (Display → none)",
    description:
      "Collapsible disclosure pattern — `transition-behavior: allow-discrete` lets `display: none` participate in the transition so an accordion can animate its close. 250ms ease-out.",
    input: {
      selector: ".accordion-panel",
      duration: 250,
      easing: "ease-out",
      properties: ["opacity", "transform"],
      translateY: -8,
      scaleFrom: 1,
      allowDiscrete: true,
      hiddenClass: "is-collapsed",
    },
  },
  {
    id: "preset-transform-in",
    name: "Transform In (Translate + Scale, no opacity)",
    description:
      "Pure transform entry — translate + scale, no opacity. Useful when the element must remain visible throughout (e.g. inline icons). 300ms ease-out.",
    input: {
      selector: ".icon-pop",
      duration: 300,
      easing: "ease-out",
      properties: ["transform"],
      translateY: 12,
      scaleFrom: 0.85,
      allowDiscrete: false,
      hiddenClass: "is-hidden",
    },
  },
];

const presets: StartingStylePreset[] = PRESETS.map((p) => ({
  ...p,
  input: { ...p.input },
}));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 6 starting-style presets. Cached. */
export async function listPresets(): Promise<StartingStylePreset[]> {
  return cacheWrap(
    "starting-style:presets",
    () =>
      Promise.resolve(presets.map((p) => ({ ...p, input: { ...p.input } }))),
    CACHE_TTL.startingStylePresets,
  );
}

/** Generate @starting-style CSS from duration + easing + properties config. */
export async function generateStartingStyle(
  input: StartingStyleGenerateInput,
): Promise<StartingStyleResult> {
  const cacheKey = `starting-style:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const baseCss = buildBaseCss(input);
      const hiddenCss = buildHiddenCss(input);
      const startingStyleCss = buildStartingStyleCss(input);
      const combinedCss = [baseCss, hiddenCss, startingStyleCss].join("\n\n");

      log.info("Starting-style generated", {
        selector: input.selector,
        duration: input.duration,
        easing: input.easing,
        allowDiscrete: input.allowDiscrete,
        propertyCount: input.properties.length,
      });

      return Promise.resolve({
        baseCss,
        hiddenCss,
        startingStyleCss,
        combinedCss,
        allowDiscrete: input.allowDiscrete,
        explanation: buildExplanation(input),
        support: {
          baseline: "2024 (@starting-style)",
          chrome: "117+",
          safari: "17.5+",
          firefox: "129+",
        },
      });
    },
    CACHE_TTL.startingStyleGenerate,
  );
}
