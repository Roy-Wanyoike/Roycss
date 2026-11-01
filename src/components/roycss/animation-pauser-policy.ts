/**
 * Hydration-ownership policy for AnimationPauser (issue #299).
 *
 * Problem: with streaming SSR + selective hydration (Next.js App Router,
 * next/dynamic Suspense boundaries), AnimationPauser's mount effect can run
 * while some server-rendered Suspense boundaries have NOT hydrated yet
 * (their JS chunks are still in flight). The IntersectionObserver's initial
 * pass stamped `data-animation-paused="true"` onto EVERY matching
 * `[class*='roycss-']` element — including spans inside not-yet-hydrated
 * boundaries (e.g. the effect showcase grid's LivePreview/TextPreview
 * spans). When React later hydrated those boundaries, the server HTML it
 * was reconciling no longer matched what React would render (the attribute
 * React never wrote was on the node) — surfacing as the intermittent
 * "data-animation-paused" hydration mismatch on the featured TextPreview
 * span reported in #299.
 *
 * Fix contract (deterministic first render; post-mount application):
 *   1. React markup NEVER renders the attribute — server HTML is the
 *      deterministic default (animations running).
 *   2. The pauser only writes the attribute to elements React already
 *      OWNS — detected via the `__reactFiber$*` expando react-dom attaches
 *      to every host instance it creates/hydrates. Unclaimed nodes are
 *      skipped and retried on a bounded timer instead of being mutated
 *      pre-hydration.
 *
 * DOM-free and unit-testable (tests/unit/animation-pause-hydration.test.ts)
 * — element ownership is injected as a predicate.
 */

/** react-dom attaches this expando to every host element it creates. */
export const REACT_FIBER_EXPANDO_PREFIX = "__reactFiber$";

/**
 * True when react-dom has claimed `el` (created or hydrated it). Any
 * object with an own key starting with `__reactFiber$` qualifies — node
 * tests pass plain objects; the browser passes real Elements.
 */
export function isReactOwned(el: object): boolean {
  for (const key of Object.keys(el)) {
    if (key.startsWith(REACT_FIBER_EXPANDO_PREFIX)) return true;
  }
  return false;
}

/**
 * The data attribute AnimationPauser toggles. Distinct from the site-wide
 * `data-animations-paused` (plural, on <html>) set by the Pause animations
 * toggle + pre-paint init script — see globals.css for both hooks.
 */
export const ANIMATION_PAUSED_ATTR = "data-animation-paused";

/**
 * Decide the attribute action for one observed element.
 *   - "stamp"  → off-screen + React-owned: freeze CSS animations.
 *   - "unstamp"→ on-screen: unfreeze (safe even pre-ownership — the
 *                attribute can only be present if a previous stamp put it
 *                there, and stamps never touch unowned nodes).
 *   - "skip"   → off-screen but NOT yet React-owned: leave the server HTML
 *                untouched (hydration in flight) and retry later.
 */
export type PauseAction = "stamp" | "unstamp" | "skip";

export function pauseActionFor(
  el: object,
  isIntersecting: boolean,
  owned: boolean = isReactOwned(el),
): PauseAction {
  if (isIntersecting) return "unstamp";
  return owned ? "stamp" : "skip";
}

/** How long (ms) between retries for elements not yet claimed by React. */
export const HYDRATION_RETRY_INTERVAL_MS = 1000;

/** Bounded retry budget — after ~30s give up (element is gone or inert). */
export const HYDRATION_RETRY_MAX_ATTEMPTS = 30;
