/**
 * Accessibility routes — /api/v1/accessibility
 *
 *   GET   /audit/:url        mock audit for the given URL
 *   GET   /rules             WCAG rules catalog
 *   GET   /contrast/:fg/:bg  contrast ratio between two hex colors
 *   POST  /scan              run a fresh scan with options
 *   POST  /jobs              enqueue an audit job → { jobId } (A7)
 *   GET   /jobs/:id          job status + result (A7)
 *
 * Order matters: static collection routes are declared before /:param
 * so /rules and /contrast aren't captured as the url.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  auditUrl,
  computeContrast,
  listRules,
  scan,
} from "./service.js";
import {
  A11yScanSchema,
  AuditUrlParamsSchema,
  ContrastParamsSchema,
  JobParamsSchema,
} from "./schema.js";
import { getJobQueue } from "../../lib/queue.js";
import { AppError } from "../../server/middleware/error.js";

export const accessibilityRouter = Router();

// ─── Job queue endpoints (PF-009 / issue #94 A7) ──────────────────────────
// The queue executes inline by default (no worker configured), so POST
// /jobs behaves synchronously — the job is already completed when the
// response arrives. A Redis-backed worker (PF-003) swaps in unchanged.

accessibilityRouter.post(
  "/jobs",
  validateBody(A11yScanSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof A11yScanSchema>;
    const jobId = await getJobQueue().enqueue(
      "accessibility.scan",
      () => scan(input),
      { requestId: req.requestId },
    );
    res.status(201).json({ data: { jobId } });
  }),
);

accessibilityRouter.get(
  "/jobs/:id",
  validateParams(JobParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof JobParamsSchema>;
    const job = getJobQueue().getJob(id);
    if (!job) throw AppError.notFound(`Job '${id}' not found`);
    res.json({ data: job });
  }),
);

accessibilityRouter.get(
  "/rules",
  asyncHandler(async (_req, res) => {
    const rules = await listRules();
    res.json({ data: rules, meta: { count: rules.length } });
  }),
);

accessibilityRouter.get(
  "/contrast/:fg/:bg",
  validateParams(ContrastParamsSchema),
  asyncHandler(async (req, res) => {
    const { fg, bg } = req.params as unknown as z.infer<
      typeof ContrastParamsSchema
    >;
    const result = await computeContrast(fg, bg);
    res.json({ data: result });
  }),
);

accessibilityRouter.post(
  "/scan",
  validateBody(A11yScanSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof A11yScanSchema>;
    const audit = await scan(input);
    res.status(201).json({ data: audit });
  }),
);

accessibilityRouter.get(
  "/audit/:url",
  validateParams(AuditUrlParamsSchema),
  asyncHandler(async (req, res) => {
    const { url } = req.params as unknown as z.infer<
      typeof AuditUrlParamsSchema
    >;
    const audit = await auditUrl(url);
    res.json({ data: audit });
  }),
);
