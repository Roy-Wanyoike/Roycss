/**
 * Certifications routes — /api/v1/certifications
 *
 *   GET  /                 list all certifications
 *   GET  /verify/:id       verify a certification by its verify code
 *   GET  /:id              single certification by id
 *   POST /:id/exam         submit exam answers for a certification
 *
 * Order matters: `/verify/:id` is declared before `/:id` so the literal
 * "verify" path segment isn't captured as a certification id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getCertificationById,
  listCertifications,
  submitExam,
  verifyCertification,
} from "./service.js";
import { CertificationExamSchema, CertificationParamsSchema } from "./schema.js";

export const certificationsRouter = Router();

certificationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listCertifications();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

certificationsRouter.get(
  "/verify/:id",
  validateParams(CertificationParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CertificationParamsSchema
    >;
    const earned = await verifyCertification(id);
    res.json({ data: earned });
  }),
);

certificationsRouter.get(
  "/:id",
  validateParams(CertificationParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CertificationParamsSchema
    >;
    const cert = await getCertificationById(id);
    res.json({ data: cert });
  }),
);

certificationsRouter.post(
  "/:id/exam",
  validateParams(CertificationParamsSchema),
  validateBody(CertificationExamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CertificationParamsSchema
    >;
    const input = req.body as unknown as z.infer<
      typeof CertificationExamSchema
    >;
    const result = await submitExam({
      certificationId: id,
      userId: input.userId,
      userName: input.userName,
      answers: input.answers,
    });
    res.status(201).json({ data: result });
  }),
);
