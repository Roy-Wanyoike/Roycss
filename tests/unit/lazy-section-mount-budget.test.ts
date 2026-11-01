import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DRAIN_INTERVAL_MS,
  LazySectionMountQueue,
  MOUNT_BUDGET_PER_DRAIN,
  LAZY_SECTION_MOUNTED_EVENT,
  viewportDistancePriority,
} from "@/components/roycss/lazy-section-mount-queue";

const ROOT = join(__dirname, "..", "..");
const LAZY_SRC = join(ROOT, "src/components/roycss/lazy-section.tsx");
const PAGE_SRC = join(ROOT, "src/components/roycss/roycss-page.tsx");

/**
 * Issue #299 — bounded LazySection mount budget.
 *
 * Symptom: Home → Platform ▾ → Playground taken BEFORE the lazy sections
 * load smooth-scrolled to a stale position; every LazySection the flight
 * crossed flipped to mounted in the same handful of frames (~2k animated
 * previews at once), the GPU pegged under SwiftShader, rAF starved, and
 * the anchor correction loop stalled — landing ~28k px short.
 *
 * Fix under test:
 *   1. All LazySection mounts are granted through ONE module-level queue
 *      (page-level budget) that drains at most MOUNT_BUDGET_PER_DRAIN
 *      mounts per tick, spaced DRAIN_INTERVAL_MS apart, closest-to-viewport
 *      (rootMargin-priority) first. The queue logic is a DOM-free class —
 *      tested here with a fake scheduler.
 *   2. LazySection still mounts one-shot (never unmounts), cancels its
 *      queued request on unmount, and announces mounts via the
 *      `roycss-lazy-section-mounted` event so the anchor correction loop
 *      can fix the landing the moment the TARGET section expands.
 */

/** Fake scheduler capturing (fn, ms) pairs without running them. */
function makeFakeScheduler() {
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const scheduler = (fn: () => void, ms: number) => {
    scheduled.push({ fn, ms });
    return scheduled.length;
  };
  return { scheduled, scheduler };
}

/* ─── 1. queue semantics (real logic, fake clock) ────────────────────── */

describe("LazySectionMountQueue — bounded drain budget (#299)", () => {
  it("grants at most MOUNT_BUDGET_PER_DRAIN mounts per drain tick", () => {
    const { scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    const mounted: number[] = [];
    for (let i = 0; i < 10; i++) {
      queue.request(() => mounted.push(i), i);
    }
    expect(queue.pendingCount).toBe(10);
    expect(queue.drainNow()).toBe(MOUNT_BUDGET_PER_DRAIN);
    expect(mounted).toHaveLength(MOUNT_BUDGET_PER_DRAIN);
    expect(queue.pendingCount).toBe(10 - MOUNT_BUDGET_PER_DRAIN);
  });

  it("mounts closest-to-viewport requests first (rootMargin-priority)", () => {
    const { scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    const mounted: string[] = [];
    // Enqueued far → near → middle; drain must grant near, then far-or-middle
    // in ascending distance order.
    queue.request(() => mounted.push("far"), 28_000);
    queue.request(() => mounted.push("near"), 120);
    queue.request(() => mounted.push("middle"), 9_400);
    queue.drainNow();
    expect(mounted).toEqual(["near", "middle"]);
    queue.drainNow();
    expect(mounted).toEqual(["near", "middle", "far"]);
  });

  it("schedules the first drain immediately and spaces subsequent bursts", () => {
    const { scheduled, scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    queue.request(() => {}, 5);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].ms).toBe(0); // fast path for the common single scroll

    // Requests arriving while a drain is pending share it — no extra timers.
    queue.request(() => {}, 6);
    queue.request(() => {}, 7);
    expect(scheduled).toHaveLength(1);

    // Draining with one request still queued → reschedule at the spacing
    // interval, so bursts never land in the same frame.
    queue.drainNow();
    expect(scheduled).toHaveLength(2);
    expect(scheduled[1].ms).toBe(DRAIN_INTERVAL_MS);
    scheduler(() => {}, 0);
  });

  it("keeps draining until the queue empties (one-shot mounts preserved)", () => {
    const { scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    const mounted: number[] = [];
    for (let i = 0; i < 7; i++) {
      queue.request(() => mounted.push(i), 10 - i);
    }
    let ticks = 0;
    while (queue.pendingCount > 0 && ticks < 10) {
      queue.drainNow();
      ticks += 1;
    }
    expect(mounted).toHaveLength(7);
    expect(ticks).toBe(Math.ceil(7 / MOUNT_BUDGET_PER_DRAIN));
  });

  it("cancel() drops a queued request (section unmounted before its turn)", () => {
    const { scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    let mounted = false;
    const id = queue.request(() => {
      mounted = true;
    }, 1);
    queue.request(() => {}, 2);
    queue.cancel(id);
    queue.drainNow();
    expect(mounted).toBe(false);
    // The remaining (non-cancelled) request was granted by the drain.
    expect(queue.pendingCount).toBe(0);
  });

  it("a throwing mount never wedges the queue", () => {
    const { scheduler } = makeFakeScheduler();
    const queue = new LazySectionMountQueue(scheduler);
    queue.request(() => {
      throw new Error("boom");
    }, 1);
    queue.request(() => {}, 2);
    expect(() => queue.drainNow()).not.toThrow();
    expect(queue.pendingCount).toBe(0);
  });

  it("viewportDistancePriority is the absolute distance from the viewport", () => {
    expect(viewportDistancePriority(-250)).toBe(250);
    expect(viewportDistancePriority(28_000)).toBe(28_000);
    expect(viewportDistancePriority(0)).toBe(0);
  });

  it("the page-level budget constants are small on purpose", () => {
    // Two mounts per 80ms tick: a full 8-section force-mount spreads over
    // ~320ms instead of one frame — enough headroom for the GPU without
    // making normal scrolling feel lazy.
    expect(MOUNT_BUDGET_PER_DRAIN).toBeGreaterThanOrEqual(1);
    expect(MOUNT_BUDGET_PER_DRAIN).toBeLessThanOrEqual(4);
    expect(DRAIN_INTERVAL_MS).toBeGreaterThanOrEqual(16);
    expect(DRAIN_INTERVAL_MS).toBeLessThanOrEqual(200);
  });
});

/* ─── 2. LazySection integration (source-level pins) ─────────────────── */

describe("LazySection — mount budget integration (#299)", () => {
  const src = readFileSync(LAZY_SRC, "utf8");

  it("routes mounts through the shared module-level queue (page-wide budget)", () => {
    expect(src).toContain("sharedLazySectionMountQueue.request");
    expect(src).toContain("sharedLazySectionMountQueue.cancel");
  });

  it("prioritizes by the section's distance from the viewport", () => {
    expect(src).toContain(
      "requestMount(viewportDistancePriority(entry.boundingClientRect.top))",
    );
  });

  it("keeps one-shot semantics — mounted never flips back", () => {
    expect(src).toContain("if (mounted) return;");
    expect(src).toContain("setMounted(true)");
    expect(src).not.toContain("setMounted(false)");
  });

  it("cancels the queued request when the section unmounts", () => {
    const effectStart = src.indexOf("if (mounted) return;");
    const cleanup = src.indexOf("return () => {", effectStart);
    expect(cleanup).toBeGreaterThan(-1);
    const cleanupBlock = src.slice(cleanup, cleanup + 300);
    expect(cleanupBlock).toContain("sharedLazySectionMountQueue.cancel");
  });

  it("announces mounts via the roycss-lazy-section-mounted event", () => {
    expect(src).toContain("LAZY_SECTION_MOUNTED_EVENT");
    expect(src).toContain("window.dispatchEvent(new CustomEvent(LAZY_SECTION_MOUNTED_EVENT");
    expect(src).toContain("id,");
  });

  it("the no-IntersectionObserver fallback also goes through the queue", () => {
    expect(src).toContain('typeof IntersectionObserver === "undefined"');
    expect(src).not.toContain("queueMicrotask(() => setMounted(true))");
  });

  it("the event name constant is exported for the anchor correction listener", () => {
    expect(LAZY_SECTION_MOUNTED_EVENT).toBe("roycss-lazy-section-mounted");
  });
});

/* ─── 3. anchor correction wiring (source-level pins) ────────────────── */

describe("scrollToSection — target-mounted bounded correction (#299)", () => {
  const full = readFileSync(PAGE_SRC, "utf8");
  const start = full.indexOf("function scrollToSection(");
  const end = full.indexOf("\n}\n", start);
  const src = full.slice(start, end);

  it("listens once for the target section's mount event", () => {
    expect(src).toContain("LAZY_SECTION_MOUNTED_EVENT, onTargetMounted");
    expect(src).toContain("once: true");
  });

  it("filters the event to the anchor's own section id", () => {
    expect(src).toContain("if (!detail || detail.id !== targetId) return;");
    expect(src).toContain("const targetId = id.slice(1);");
  });

  it("the listener triggers the existing bounded correction pass", () => {
    expect(src).toContain("correctPassImpl?.();");
    expect(src).toContain("correctPassImpl = correctPass;");
  });

  it("detaches the listener when the loop finishes (no listener leaks)", () => {
    const terminal = src.indexOf("if (timedOut || Math.abs(drift) <= 8 || corrections >= 8) {");
    expect(terminal).toBeGreaterThan(-1);
    const block = src.slice(terminal, terminal + 260);
    expect(block).toContain("detachTargetMountedListener?.()");
  });

  it("a newer nav click supersedes the previous target-mounted listener", () => {
    expect(src).toContain("detachTargetMountedListener?.();");
    expect(full).toContain("let detachTargetMountedListener: (() => void) | null = null;");
  });

  it("keeps the #258 contracts intact (instant corrections, 8-pass budget)", () => {
    expect(src).toContain('behavior: "instant"');
    expect(src).toContain("corrections >= 8");
    expect(src).toContain("> 12000");
    expect(src.split('behavior: "smooth"').length - 1).toBe(1);
  });
});
