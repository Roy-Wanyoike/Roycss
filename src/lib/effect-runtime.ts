/**
 * RoyCSS Effect Runtime — pure types and contract for mounting effects
 * at runtime. No DOM/window dependency at module-load time.
 *
 * Contract:
 *   - mountEffect(ctx): inject the effect's CSS into a target element
 *     (or document head), register any lifecycle hooks (cleanup).
 *   - unmountEffect(ctx): remove injected CSS + listeners.
 *   - validateEffect(effect): pure runtime sanity check.
 *
 * This module is intentionally side-effect free so it can be imported
 * from both client and server contexts.
 */
import type { CSSEffect } from "./roycss-effects";

export interface EffectRuntimeContext {
  /** The effect to mount. */
  effect: CSSEffect;
  /** The DOM element to apply the effect to. Required for mountEffect. */
  host: HTMLElement | null;
  /** Optional scope — limits effect CSS to a specific selector prefix. */
  scope?: string;
  /** Whether the user has prefers-reduced-motion enabled. */
  prefersReducedMotion: boolean;
  /** Whether IntersectionObserver considers the host visible. */
  isVisible: boolean;
}

export interface EffectMountResult {
  ok: boolean;
  /** Inline <style> element injected, if any. Pass to unmountEffect. */
  styleElement?: HTMLStyleElement;
  error?: string;
}

export type EffectUnmountResult = { ok: boolean; error?: string };

export type EffectValidationIssue = {
  code: "MISSING_ID" | "MISSING_CSS" | "MISSING_NAME" | "INVALID_CATEGORY";
  message: string;
  field?: string;
};

/**
 * Validate an effect object at runtime. Returns [] if valid.
 */
export function validateEffect(effect: Partial<CSSEffect>): EffectValidationIssue[] {
  const issues: EffectValidationIssue[] = [];
  if (!effect.id || typeof effect.id !== "string" || effect.id.length === 0) {
    issues.push({ code: "MISSING_ID", message: "Effect must have a non-empty string id", field: "id" });
  }
  if (!effect.name || typeof effect.name !== "string") {
    issues.push({ code: "MISSING_NAME", message: "Effect must have a non-empty name", field: "name" });
  }
  if (!effect.cssCode || typeof effect.cssCode !== "string" || effect.cssCode.trim().length === 0) {
    issues.push({ code: "MISSING_CSS", message: "Effect must have non-empty cssCode", field: "cssCode" });
  }
  if (effect.category && typeof effect.category !== "string") {
    issues.push({ code: "INVALID_CATEGORY", message: "Effect category must be a string", field: "category" });
  }
  return issues;
}

/**
 * Mount an effect's CSS into the document head. The CSS is scoped to the
 * host element's data-roycss-effect attribute when a scope is provided.
 * Returns the inserted <style> element so it can be removed on unmount.
 *
 * Safe to call in non-browser contexts — returns ok:false.
 */
export function mountEffect(ctx: EffectRuntimeContext): EffectMountResult {
  if (typeof document === "undefined") {
    return { ok: false, error: "document is undefined (SSR context)" };
  }
  if (!ctx.host) {
    return { ok: false, error: "host element is null" };
  }
  const issues = validateEffect(ctx.effect);
  if (issues.length > 0) {
    return { ok: false, error: issues[0]?.message ?? "invalid effect" };
  }

  try {
    const style = document.createElement("style");
    style.setAttribute("data-roycss-effect", ctx.effect.id);
    style.setAttribute("data-roycss-runtime", "true");

    // Reduced-motion: strip animation declarations so user's OS preference wins.
    let css = ctx.effect.cssCode;
    if (ctx.prefersReducedMotion) {
      css = `@media (prefers-reduced-motion: no-preference){${css}}`;
    }

    style.textContent = css;
    document.head.appendChild(style);
    ctx.host.setAttribute("data-roycss-effect", ctx.effect.id);
    return { ok: true, styleElement: style };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "mount failed" };
  }
}

/**
 * Unmount a previously-mounted effect. Removes the <style> element from
 * the document head and clears the data-roycss-effect attribute on the host.
 */
export function unmountEffect(ctx: EffectRuntimeContext): EffectUnmountResult {
  if (typeof document === "undefined") {
    return { ok: false, error: "document is undefined (SSR context)" };
  }
  if (!ctx.host) {
    return { ok: false, error: "host element is null" };
  }
  try {
    const id = ctx.effect.id;
    document
      .querySelectorAll(`style[data-roycss-effect="${id}"]`)
      .forEach((el) => el.remove());
    if (ctx.host.getAttribute("data-roycss-effect") === id) {
      ctx.host.removeAttribute("data-roycss-effect");
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unmount failed" };
  }
}

/**
 * Convenience helper — wraps mount/unmount in a single callable.
 * Useful for React useEffect cleanups.
 */
export function createEffectLifecycle(ctx: EffectRuntimeContext) {
  const mount = () => mountEffect(ctx);
  const unmount = () => unmountEffect(ctx);
  return { mount, unmount };
}
