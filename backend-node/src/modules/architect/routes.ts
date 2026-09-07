/**
 * Architect routes — /api/v1/architect
 *
 *   POST  /generate        kick off an architecture generation (auth: Bearer token)
 *   GET   /templates       list all architecture templates
 *   GET   /templates/:id   single template by id
 *   GET   /results/:id     single generation result by id
 *   POST  /jobs            enqueue an AI generation job → { jobId } (A7)
 *   GET   /jobs/:id        job status + result (A7)
 *
 * Mutating routes require authentication (issue #64) — generation is
 * LLM-backed when LLM keys are configured (cost/abuse vector) and
 * results accumulate in the in-process result store.
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";

import { aiRateLimit } from "../../server/middleware/rateLimit.js";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  generateArchitecture,
  getResultById,
  getTemplateById,
  listTemplates,
} from "./service.js";
import {
  ArchitectureParamsSchema,
  GenerateArchitectureSchema,
  JobParamsSchema,
} from "./schema.js";
import { getJobQueue } from "../../lib/queue.js";
import { AppError } from "../../server/middleware/error.js";

export const architectRouter = Router();

// ─── Job queue endpoints (PF-009 / issue #94 A7) ──────────────────────────
// Long-running AI generations through the job-queue abstraction (the
// LLM call can take tens of seconds). Inline execution by default —
// no worker configured — so POST /jobs stays synchronous until PF-003
// installs a Redis-backed worker.

architectRouter.post(
  "/jobs",
  aiRateLimit,
  requireAuth,
  validateBody(GenerateArchitectureSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof GenerateArchitectureSchema
    >;
    const jobId = await getJobQueue().enqueue(
      "architect.generate",
      () => generateArchitecture(input),
      { requestId: req.requestId },
    );
    res.status(201).json({ data: { jobId } });
  }),
);

architectRouter.get(
  "/jobs/:id",
  validateParams(JobParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof JobParamsSchema>;
    const job = getJobQueue().getJob(id);
    if (!job) throw AppError.notFound(`Job '${id}' not found`);
    res.json({ data: job });
  }),
);

architectRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    const items = await listTemplates();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

architectRouter.post(
  "/generate",
  aiRateLimit,
  requireAuth,
  validateBody(GenerateArchitectureSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof GenerateArchitectureSchema
    >;
    const result = await generateArchitecture(input);
    res.status(201).json({ data: result });
  }),
);

architectRouter.get(
  "/templates/:id",
  validateParams(ArchitectureParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ArchitectureParamsSchema
    >;
    const template = await getTemplateById(id);
    res.json({ data: template });
  }),
);

architectRouter.get(
  "/results/:id",
  validateParams(ArchitectureParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ArchitectureParamsSchema
    >;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
