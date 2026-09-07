/**
 * Unit tests — JobQueue abstraction (PF-009 / issue #94 A7).
 *
 *   1. Inline mode (default, no worker configured): enqueue awaits the
 *      task — the job is completed when POST /jobs would return, and
 *      getResult/getJob expose the result (synchronous behavior kept).
 *   2. Background mode: status transitions queued → running →
 *      completed and the result arrives after the task settles.
 *   3. Failures are captured as status "failed" + error message.
 *   4. Unknown ids → undefined; remove() drops finished records.
 *   5. requestId is carried on the job record (issue #94 A9).
 */
import { describe, expect, it } from "vitest";

import {
  InProcessJobQueue,
  getJobQueue,
  resetJobQueueForTest,
  setJobQueue,
  type JobQueue,
} from "../../src/lib/queue.js";

function tick(): Promise<void> {
  // Let scheduled setImmediate callbacks + microtasks run.
  return new Promise((resolve) => setImmediate(resolve));
}

describe("InProcessJobQueue (issue #94 A7)", () => {
  it("1. inline mode completes the job before enqueue resolves", async () => {
    const queue = new InProcessJobQueue({ mode: "inline" });
    const jobId = await queue.enqueue("test.compute", async () => 41 + 1);
    expect(queue.getStatus(jobId)).toBe("completed");
    const job = queue.getJob(jobId)!;
    expect(job.status).toBe("completed");
    expect(job.result).toBe(42);
    expect(job.type).toBe("test.compute");
    expect(job.startedAt).toBeTruthy();
    expect(job.finishedAt).toBeTruthy();
  });

  it("2. background mode transitions queued → running → completed", async () => {
    const queue = new InProcessJobQueue({ mode: "background" });
    const started: string[] = [];
    const jobId = await queue.enqueue("test.background", async () => {
      started.push("task");
      return "done-value";
    });
    expect(queue.getStatus(jobId)).toBe("queued");

    await tick();
    await tick();

    const job = queue.getJob(jobId)!;
    expect(job.status).toBe("completed");
    expect(job.result).toBe("done-value");
    expect(started).toEqual(["task"]);
  });

  it("3. task failures are captured — status failed + error message", async () => {
    const queue = new InProcessJobQueue({ mode: "inline" });
    const jobId = await queue.enqueue("test.explode", async () => {
      throw new Error("boom");
    });
    const job = queue.getJob(jobId)!;
    expect(job.status).toBe("failed");
    expect(job.error).toBe("boom");
    expect(job.result).toBeUndefined();
  });

  it("4. unknown ids → undefined; remove() drops records", async () => {
    const queue = new InProcessJobQueue({ mode: "inline" });
    const jobId = await queue.enqueue("test.temp", async () => 1);
    expect(queue.getJob("job-does-not-exist")).toBeUndefined();
    expect(queue.getStatus("job-does-not-exist")).toBeUndefined();

    expect(queue.remove(jobId)).toBe(true);
    expect(queue.getJob(jobId)).toBeUndefined();
    expect(queue.remove(jobId)).toBe(false);
  });

  it("5. requestId is attached and the process singleton is swappable", async () => {
    const queue: JobQueue = new InProcessJobQueue({ mode: "inline" });
    const jobId = await queue.enqueue("test.request-id", async () => null, {
      requestId: "req-abc-123",
    });
    expect(queue.getJob(jobId)!.requestId).toBe("req-abc-123");

    // Singleton + swap + reset (what the /jobs routes consume).
    setJobQueue(queue);
    expect(getJobQueue()).toBe(queue);
    resetJobQueueForTest();
    expect(getJobQueue()).not.toBe(queue);
    const singletonId = await getJobQueue().enqueue("test.singleton", async () => 7);
    expect(getJobQueue().getStatus(singletonId)).toBe("completed");
  });

  it("6. history stays bounded under many jobs", async () => {
    const queue = new InProcessJobQueue({ mode: "inline", maxHistory: 10 });
    for (let i = 0; i < 30; i++) {
      await queue.enqueue(`test.burst.${i}`, async () => i);
    }
    expect(queue.size).toBeLessThanOrEqual(10);
  });
});
