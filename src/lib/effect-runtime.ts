import type { CSSEffect } from "./roycss-types";

/**
 * EffectRuntime — a type-safe contract for mounting and unmounting
 * individual CSS effects in arbitrary containers, plus validation.
 *
 * This is a pure module (no React, no DOM access at import time).
 * Components like the effect detail dialog, the AI playground, or
 * external consumers can adopt this contract to mount effects in a
 * controlled way without reaching into the global lazy-injection
 * pipeline.
 *
 * The existing DynamicEffectCSS component (which lazily injects CSS
 * via IntersectionObserver + MutationObserver) is unaffected and
 * remains the primary mechanism for the main effects grid.
 */

// ──────────────────────────────────────────────────────────────────────
// CSP nonce (global type augmentation)
// ──────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    /**
     * Optional CSP nonce. If set by the host page (typically a
     * CSP-enabled Next.js layout), the lazy `<style>` tag created by
     * DynamicEffectCSS and the per-effect styles created here receive
     * this nonce so they are allowed under a strict
     * `style-src 'nonce-...'` Content-Security-Policy.
     */
    __roycssNonce?: string;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Runtime context
// ──────────────────────────────────────────────────────────────────────

export interface EffectRuntimeContext {
  /** The effect being mounted. */
  effectId: string;
  /** The container element the preview is mounted into. */
  container: HTMLElement;
  /** Whether the user prefers reduced motion. When true, the runtime
   *  annotates the preview element with a `data-reduce-motion` attr
   *  so effect CSS can opt out of animation via attribute selectors. */
  prefersReducedMotion: boolean;
  /** Whether the preview is "live" (interactive — hover effects respond)
   *  or static (e.g., for screenshot pipelines / OG rendering). */
  isLive: boolean;
}

// ──────────────────────────────────────────────────────────────────────
// Mount / Unmount
// ──────────────────────────────────────────────────────────────────────

const STYLE_DATA_ATTR = "data-roycss-runtime-effect";
const PREVIEW_DATA_ATTR = "data-roycss-runtime-preview";

/**
 * Read the host-provided CSP nonce, if any. Returns the empty string
 * when no nonce has been provided (in which case the host's CSP must
 * allow `style-src 'unsafe-inline'` or no CSP is enforced).
 */
function readNonce(): string {
  if (typeof window === "undefined") return "";
  return typeof window.__roycssNonce === "string" ? window.__roycssNonce : "";
}

function createStyleFor(effect: CSSEffect): HTMLStyleElement {
  const style = document.createElement("style");
  style.setAttribute(STYLE_DATA_ATTR, effect.id);
  const nonce = readNonce();
  if (nonce) {
    style.nonce = nonce;
  }
  style.textContent = effect.cssCode;
  return style;
}

function findStyleFor(effectId: string): HTMLStyleElement | null {
  return document.head.querySelector<HTMLStyleElement>(
    `style[${STYLE_DATA_ATTR}="${effectId}"]`,
  );
}

function ensureStyle(effect: CSSEffect): HTMLStyleElement {
  const existing = findStyleFor(effect.id);
  if (existing) return existing;
  const style = createStyleFor(effect);
  document.head.appendChild(style);
  return style;
}

function createPreviewFor(effect: CSSEffect): HTMLElement {
  const cls = `roycss-${effect.id}`;
  const text = effect.previewText ?? "RoyCSS";

  let el: HTMLElement;
  switch (effect.previewType) {
    case "button": {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = text;
      el = btn;
      break;
    }
    case "text": {
      el = document.createElement("span");
      el.textContent = text;
      break;
    }
    case "loader": {
      el = document.createElement("div");
      const childCount = effect.childCount ?? 0;
      for (let i = 0; i < childCount; i++) {
        const span = document.createElement("span");
        span.dataset.roycssLoaderChild = String(i);
        el.appendChild(span);
      }
      break;
    }
    case "card":
    case "background":
    case "box":
    default: {
      el = document.createElement("div");
      break;
    }
  }

  el.classList.add(cls);
  el.setAttribute(PREVIEW_DATA_ATTR, effect.id);
  el.setAttribute("role", "presentation");
  return el;
}

/** Result of mounting an effect — the shared `<style>` and the
 *  preview element. Both are also discoverable via data-attributes. */
export interface MountedEffect {
  style: HTMLStyleElement;
  preview: HTMLElement;
}

/**
 * Inject the effect's CSS and mount a live preview element inside the
 * given container. Idempotent: if a preview for the same effect ID is
 * already mounted in `container`, this is a no-op and returns the
 * existing elements.
 */
export function mountEffect(
  effect: CSSEffect,
  container: HTMLElement,
  ctx: EffectRuntimeContext,
): MountedEffect {
  const existing = container.querySelector<HTMLElement>(
    `[${PREVIEW_DATA_ATTR}="${effect.id}"]`,
  );
  if (existing) {
    return { style: ensureStyle(effect), preview: existing };
  }

  const style = ensureStyle(effect);
  const preview = createPreviewFor(effect);
  if (ctx.prefersReducedMotion) {
    preview.setAttribute("data-reduce-motion", "");
  }
  if (!ctx.isLive) {
    preview.setAttribute("data-static-preview", "");
  }
  container.appendChild(preview);
  return { style, preview };
}

/**
 * Remove the effect's preview element from `container` and, if no
 * other preview still references the effect's CSS anywhere in the
 * document, remove the shared `<style>` tag too.
 */
export function unmountEffect(
  effect: CSSEffect,
  container: HTMLElement,
): void {
  const preview = container.querySelector<HTMLElement>(
    `[${PREVIEW_DATA_ATTR}="${effect.id}"]`,
  );
  if (preview) {
    preview.remove();
  }
  // Only remove the shared <style> if nothing else is still using it.
  const stillUsed = document.querySelector<HTMLElement>(
    `[${PREVIEW_DATA_ATTR}="${effect.id}"]`,
  );
  if (!stillUsed) {
    const style = findStyleFor(effect.id);
    if (style) style.remove();
  }
}

// ──────────────────────────────────────────────────────────────────────
// Validation (pure static analysis — no DOM access, no side effects)
// ──────────────────────────────────────────────────────────────────────

export type EffectValidationSeverity = "error" | "warning" | "info";

export interface EffectValidationIssue {
  severity: EffectValidationSeverity;
  message: string;
  /** Optional remediation hint shown to the author. */
  detail?: string;
}

export interface EffectValidationResult {
  effectId: string;
  /** `true` only when no `error`-severity issues were found. */
  valid: boolean;
  issues: EffectValidationIssue[];
}

const KEYFRAMES_DEF_RE = /@keyframes\s+([A-Za-z0-9_-]+)/g;
const ANIMATION_NAME_RE = /animation-name\s*:\s*([A-Za-z0-9_-]+)/g;
const ANIMATION_SHORTHAND_RE = /animation\s*:\s*([A-Za-z][\w-]*)/g;
const VAR_USE_RE = /var\(\s*(--[\w-]+)/g;
const VAR_DEF_RE = /(^|[{;])\s*(--[\w-]+)\s*:/g;
const ROYCSS_CLASS_RE = /\.roycss-([A-Za-z0-9_-]+)/g;

const TIMING_KEYWORDS = new Set<string>([
  "none",
  "initial",
  "inherit",
  "unset",
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
  "infinite",
  "forwards",
  "backwards",
  "both",
  "running",
  "paused",
  "cubic-bezier",
  "steps",
]);

function collectMatches(re: RegExp, src: string): string[] {
  const out = new Set<string>();
  // Clone the (stateful) global regex so repeated calls don't share lastIndex.
  const local = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null = null;
  while ((m = local.exec(src)) !== null) {
    out.add(m[1]);
  }
  return [...out];
}

/**
 * Validate an effect's CSS for common authoring mistakes.
 *
 * Pure static analysis — no DOM access, no side effects. Safe to call
 * from a server component or a CLI tool.
 *
 * Checks:
 *  - **error** if the CSS does not define a `.roycss-{id}` selector
 *    matching the effect id (otherwise mounting produces no output).
 *  - **warning** for each `animation` referenced but not defined in
 *    this effect's CSS (it may be defined globally — soft warning).
 *  - **info** for each `var(--foo)` used but not defined in this
 *    effect's CSS (it may be provided by the host page).
 *  - **info** if the effect does not include a `prefers-reduced-motion`
 *    override.
 */
export function validateEffect(effect: CSSEffect): EffectValidationResult {
  const issues: EffectValidationIssue[] = [];
  const css = effect.cssCode;

  const definedKeyframes = new Set(collectMatches(KEYFRAMES_DEF_RE, css));
  const referencedAnimations = new Set<string>([
    ...collectMatches(ANIMATION_NAME_RE, css),
    ...collectMatches(ANIMATION_SHORTHAND_RE, css),
  ]);

  for (const name of referencedAnimations) {
    if (TIMING_KEYWORDS.has(name)) continue;
    if (!definedKeyframes.has(name)) {
      issues.push({
        severity: "warning",
        message: `Animation "${name}" is referenced but no @keyframes with that name is defined in this effect's CSS.`,
        detail:
          "If this keyframe is defined globally elsewhere, you can ignore this warning. Otherwise add the missing @keyframes block.",
      });
    }
  }

  const usedVars = collectMatches(VAR_USE_RE, css);
  const definedVars = new Set(collectMatches(VAR_DEF_RE, css));
  for (const v of usedVars) {
    if (!definedVars.has(v)) {
      issues.push({
        severity: "info",
        message: `CSS variable ${v} is used but not defined in this effect's CSS.`,
        detail:
          "The variable may be provided by the host page's :root or a parent element. Confirm the host defines it before shipping.",
      });
    }
  }

  const definedClasses = collectMatches(ROYCSS_CLASS_RE, css);
  if (!definedClasses.includes(effect.id)) {
    issues.push({
      severity: "error",
      message: `Effect CSS does not define a ".roycss-${effect.id}" selector matching the effect id.`,
      detail:
        "Effects are mounted under the .roycss-{id} class. Without it, mounting the effect produces no visible output.",
    });
  }

  if (!/prefers-reduced-motion/.test(css)) {
    issues.push({
      severity: "info",
      message: "Effect does not include a prefers-reduced-motion override.",
      detail:
        "Animated effects should respect prefers-reduced-motion by disabling or reducing motion for users who request it.",
    });
  }

  const valid = !issues.some((i) => i.severity === "error");
  return { effectId: effect.id, valid, issues };
}
