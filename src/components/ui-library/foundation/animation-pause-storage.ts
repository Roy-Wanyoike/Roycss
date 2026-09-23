/**
 * Animation-pause persistence primitives (issue #214 tail).
 *
 * Pure, DOM-free logic shared by:
 *   - the pre-hydration pause init script semantics (src/app/layout.tsx), and
 *   - `PauseAnimationsToggle` (src/components/roycss/pause-animations-toggle.tsx).
 *
 * Extracted so the "read stored value → apply, write only on explicit user
 * toggle" contract is unit-testable in the node vitest environment
 * (tests/unit/animation-pause-storage.test.ts) with a mocked `localStorage`
 * — without needing a DOM. Mirrors the #160 theme pattern in
 * theme-storage.ts: the layout init script must stay behaviorally
 * equivalent to `readStoredAnimationPause()`; the unit test evaluates the
 * literal script string from layout.tsx to guard against drift.
 */

/** Whether the visitor asked for site animations to be paused. */
export type StoredAnimationPause = boolean;

/**
 * The single localStorage key used by the init script and the toggle.
 * Follows the `roycss-*` storage-key convention (roycss-theme, …).
 */
export const ANIMATION_PAUSE_STORAGE_KEY = "roycss-animations-paused";

/** Minimal storage surface (subset of DOM Storage) for testability. */
export interface AnimationPauseStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Read the stored pause preference, accepting only the exact strings
 * "true"/"false". Returns `null` for missing, corrupt, or inaccessible
 * values — callers fall back to "animations running" (no attribute) in
 * that case, matching the toggle's default `aria-pressed={false}` state.
 */
export function readStoredAnimationPause(
  storage: AnimationPauseStorageLike | null | undefined,
): StoredAnimationPause | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ANIMATION_PAUSE_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a pause preference as "true"/"false". Must ONLY be called from
 * an explicit user action (the PauseAnimationsToggle handler) — never on
 * mount/hydration. The pre-paint init script in layout.tsx READS this key
 * but NEVER WRITES it, mirroring the issue #160 theme contract.
 */
export function writeStoredAnimationPause(
  storage: AnimationPauseStorageLike | null | undefined,
  paused: StoredAnimationPause,
): void {
  if (!storage) return;
  try {
    storage.setItem(ANIMATION_PAUSE_STORAGE_KEY, paused ? "true" : "false");
  } catch {
    /* noop — private browsing / quota errors must never break the UI */
  }
}
