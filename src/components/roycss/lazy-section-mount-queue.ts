/**
 * Bounded mount budget for LazySection (issue #299).
 *
 * Problem: a mega-menu anchor jump (Home → Platform ▾ → Playground) taken
 * BEFORE the lazy sections load smooth-scrolls across the whole page. Every
 * LazySection the flight path crosses gets its IntersectionObserver callback
 * in the same handful of frames and flips to "mounted" at once — ~2k animated
 * previews materialize simultaneously, the GPU pegs (SwiftShader headless
 * hard-hangs; real GPUs just jank), rAF/starvation stalls the anchor
 * correction loop, and navigation lands at a stale position.
 *
 * Fix: all LazySection mounts are coordinated through this module-level
 * queue. A section that becomes intersecting does not mount immediately —
 * it enqueues a mount request with a priority (its distance from the
 * viewport) and the queue drains at most `MOUNT_BUDGET_PER_DRAIN` mounts
 * per tick, spaced `DRAIN_INTERVAL_MS` apart, closest-to-viewport first.
 * The browser gets breathing room between mount bursts, so content layout
 * and the anchor correction loop converge instead of starving.
 *
 * One-shot semantics are unchanged: a mounted LazySection never unmounts;
 * the budget shapes the RATE of mounts, not the final page composition.
 *
 * This module is DOM-free and dependency-free so the cap/queue/priority
 * logic is unit-testable in the node vitest environment
 * (tests/unit/lazy-section-mount-budget.test.ts) — the scheduler is
 * injected (setTimeout in the app, a fake clock in tests).
 */

/** Mounts granted per drain tick. Kept small so a burst spreads over frames. */
export const MOUNT_BUDGET_PER_DRAIN = 2;

/** Spacing (ms) between drain ticks while requests remain queued. */
export const DRAIN_INTERVAL_MS = 80;

/** A queued LazySection mount. */
export interface LazySectionMountRequest {
  /** Stable id assigned by the queue at request() time. */
  readonly id: number;
  /**
   * Lower = mounts sooner. The producer passes the section's distance from
   * the viewport (|boundingClientRect.top|) so the sections nearest the
   * reader mount first ("rootMargin-priority").
   */
  priority: number;
  /** Idempotent callback that flips the section's mounted flag. */
  readonly mount: () => void;
}

export type LazySectionScheduler = (fn: () => void, ms: number) => unknown;

/** Default browser scheduler. */
export const defaultScheduler: LazySectionScheduler = (fn, ms) => setTimeout(fn, ms);

export class LazySectionMountQueue {
  private pending = new Map<number, LazySectionMountRequest>();
  private drainTimer: unknown = null;
  private drainScheduledFor: number | null = null;
  private nextId = 1;
  private readonly scheduler: LazySectionScheduler;
  private readonly budget: number;

  constructor(
    scheduler: LazySectionScheduler = defaultScheduler,
    budget: number = MOUNT_BUDGET_PER_DRAIN,
  ) {
    this.scheduler = scheduler;
    this.budget = Math.max(1, budget);
  }

  /**
   * Enqueue a mount. The first request in an empty queue drains on the next
   * tick (setTimeout 0 — the common single-section scroll path stays
   * near-immediate); requests arriving while a drain is pending share that
   * drain and subsequent bursts space out by DRAIN_INTERVAL_MS.
   */
  request(mount: () => void, priority: number): number {
    const id = this.nextId++;
    this.pending.set(id, { id, priority, mount });
    if (this.drainTimer === null) {
      this.scheduleDrain(0);
    }
    return id;
  }

  /** Cancel a queued request (section unmounted before its turn). */
  cancel(id: number): void {
    this.pending.delete(id);
  }

  /** Drop everything (used by tests and by unmount-all paths). */
  clear(): void {
    this.pending.clear();
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  get hasScheduledDrain(): boolean {
    return this.drainTimer !== null;
  }

  /** Test hook: run one drain tick synchronously (ignores the scheduler). */
  drainNow(): number {
    this.cancelScheduledDrain();
    return this.drain();
  }

  private scheduleDrain(ms: number): void {
    this.drainScheduledFor = ms;
    this.drainTimer = this.scheduler(() => {
      this.drainTimer = null;
      this.drainScheduledFor = null;
      this.drain();
    }, ms);
  }

  /**
   * The scheduler surface is intentionally minimal (fn, ms) — it cannot
   * clearTimeout. A synchronous test drain simply supersedes the pending
   * callback: when the (never-fired-in-tests) timer eventually runs it
   * finds an empty queue and becomes a no-op.
   */
  private cancelScheduledDrain(): void {
    this.drainTimer = null;
    this.drainScheduledFor = null;
  }

  /**
   * Grant up to `budget` mounts, closest-to-viewport (lowest priority
   * value) first. Re-schedules itself while requests remain.
   * Returns the number of mounts granted.
   */
  private drain(): number {
    if (this.pending.size === 0) return 0;

    const sorted = [...this.pending.values()].sort(
      (a, b) => a.priority - b.priority || a.id - b.id,
    );
    const granted = sorted.slice(0, this.budget);
    for (const req of granted) {
      this.pending.delete(req.id);
      try {
        req.mount();
      } catch {
        /* a mount throwing must never wedge the queue */
      }
    }

    if (this.pending.size > 0) {
      this.scheduleDrain(DRAIN_INTERVAL_MS);
    }
    return granted.length;
  }
}

/**
 * Priority helper: distance of a section from the viewport. The LazySection
 * IntersectionObserver hands us the entry's boundingClientRect; sections
 * nearest the viewport (smallest |top|) mount first.
 */
export function viewportDistancePriority(top: number): number {
  return Math.abs(top);
}

/**
 * The single shared queue used by every LazySection on the page. Module
 * scope is deliberate — the budget is a PAGE-level contract (issue #299).
 */
export const sharedLazySectionMountQueue = new LazySectionMountQueue();

/** Event dispatched (client-side) whenever a LazySection mounts. */
export const LAZY_SECTION_MOUNTED_EVENT = "roycss-lazy-section-mounted";

export interface LazySectionMountedDetail {
  id?: string;
  /** Rendered content height at mount time (px). */
  height?: number;
}
