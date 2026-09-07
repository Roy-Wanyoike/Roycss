/**
 * Job queue abstraction (PF-009 / issue #94 A7).
 *
 * Long-running operations (accessibility audits, AI generations,
 * analytics aggregation) run through a `JobQueue` instead of inline
 * request handlers, so they can move to a worker/Redis backend in
 * PF-003 / PF-008 without changing any route.
 *
 * Two execution modes:
 *   - inline (default)  — `enqueue()` awaits the task in-process, so
 *                         behavior stays synchronous: by the time POST
 *                         /<module>/jobs responds, the job is already
 *                         completed and its result is fetchable. This
 *                         is the "no worker configured" path.
 *   - background        — the task is scheduled via the event loop
 *                         (setImmediate); POST returns immediately
 *                         with { jobId } and status transitions
 *                         queued → running → completed/failed.
 *
 * The queue is a process-wide singleton keyed by job type; job records
 * are in-memory (bounded) — statuses and results are NOT persisted
 * across restarts by design (PF-003 will persist them in Redis).
 */
import { randomUUID } from "node:crypto";

import { createLogger } from "./logger.js";

const log = createLogger("queue");

// ─── Types ────────────────────────────────────────────────────────────────

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobRecord {
  jobId: string;
  /** Job type, e.g. "accessibility.scan". */
  type: string;
  status: JobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /** Populated on success. */
  result?: unknown;
  /** Populated on failure. */
  error?: string;
  /** End-to-end request id from the enqueueing request (issue #94 A9). */
  requestId?: string;
}

export interface JobSnapshot {
  jobId: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  result?: unknown;
  error?: string;
  requestId?: string;
}

/** The queue contract — swap for a Redis/BullMQ backend in PF-003. */
export interface JobQueue {
  /** Enqueue a task; resolves with the job id. */
  enqueue<T>(type: string, task: () => Promise<T>, opts?: { requestId?: string }): Promise<string>;
  /** Current status for a job id, or undefined when unknown. */
  getStatus(jobId: string): JobStatus | undefined;
  /** Full job snapshot (status + result/error), or undefined. */
  getJob(jobId: string): JobSnapshot | undefined;
  /** Remove a finished job record. Returns true when it existed. */
  remove(jobId: string): boolean;
  /** Number of tracked jobs (diagnostics/tests). */
  readonly size: number;
}

export interface JobQueueOptions {
  /**
   * "inline" (default) — execute the task inside enqueue() so callers
   * keep synchronous behavior when no worker is configured.
   * "background" — schedule via setImmediate and return immediately.
   */
  mode?: "inline" | "background";
  /** Max retained finished jobs (LRU trim). Default 500. */
  maxHistory?: number;
}

// ─── In-process implementation (default) ──────────────────────────────────

export class InProcessJobQueue implements JobQueue {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly mode: "inline" | "background";
  private readonly maxHistory: number;

  constructor(options: JobQueueOptions = {}) {
    this.mode = options.mode ?? "inline";
    this.maxHistory = options.maxHistory ?? 500;
  }

  get size(): number {
    return this.jobs.size;
  }

  async enqueue<T>(
    type: string,
    task: () => Promise<T>,
    opts: { requestId?: string } = {},
  ): Promise<string> {
    const jobId = `job-${randomUUID()}`;
    const record: JobRecord = {
      jobId,
      type,
      status: "queued",
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      ...(opts.requestId ? { requestId: opts.requestId } : {}),
    };
    this.jobs.set(jobId, record);
    this.trimHistory();

    const run = async (): Promise<void> => {
      record.status = "running";
      record.startedAt = new Date().toISOString();
      try {
        const result = await task();
        record.status = "completed";
        record.result = result;
      } catch (err) {
        record.status = "failed";
        record.error = err instanceof Error ? err.message : String(err);
        log.warn("Job failed", { jobId, type, err: record.error });
      } finally {
        record.finishedAt = new Date().toISOString();
        this.trimHistory();
      }
    };

    if (this.mode === "inline") {
      await run();
    } else {
      // Fire-and-forget — errors are captured inside run().
      void setImmediate(() => void run());
    }
    return jobId;
  }

  getStatus(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId)?.status;
  }

  getJob(jobId: string): JobSnapshot | undefined {
    const record = this.jobs.get(jobId);
    if (!record) return undefined;
    return { ...record };
  }

  remove(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /** Keep the history bounded — oldest finished jobs go first. */
  private trimHistory(): void {
    if (this.jobs.size <= this.maxHistory) return;
    const finished = [...this.jobs.entries()].filter(
      ([, j]) => j.status === "completed" || j.status === "failed",
    );
    // Map preserves insertion order — first entries are oldest.
    for (const [id] of finished) {
      this.jobs.delete(id);
      if (this.jobs.size <= this.maxHistory) return;
    }
  }
}

// ─── Singleton used by the /jobs routes ────────────────────────────────────

const globalForQueue = globalThis as unknown as {
  __roycssJobQueue?: JobQueue;
};

/**
 * The process-wide queue. Default: in-process, inline mode (synchronous
 * behavior preserved — PF-003 will install a Redis-backed queue with a
 * worker instead).
 */
export function getJobQueue(): JobQueue {
  if (!globalForQueue.__roycssJobQueue) {
    globalForQueue.__roycssJobQueue = new InProcessJobQueue({
      mode: "inline",
    });
  }
  return globalForQueue.__roycssJobQueue;
}

/** Test-only: swap the process queue (e.g. background mode). */
export function setJobQueue(queue: JobQueue): void {
  globalForQueue.__roycssJobQueue = queue;
}

/** Test-only: restore the default inline queue. */
export function resetJobQueueForTest(): void {
  globalForQueue.__roycssJobQueue = new InProcessJobQueue({ mode: "inline" });
}
