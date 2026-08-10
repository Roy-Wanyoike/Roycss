/**
 * Accessibility routes — /api/v1/accessibility
 *
 *   GET   /audit/:url        mock audit for the given URL
 *   GET   /rules             WCAG rules catalog
 *   GET   /contrast/:fg/:bg  contrast ratio between two hex colors
 *   POST  /scan              run a fresh scan with options
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
} from "./schema.js";

export const accessibilityRouter = Router();

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
