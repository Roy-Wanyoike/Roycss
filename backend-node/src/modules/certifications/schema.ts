/**
 * Zod schemas for the certifications module.
 *
 * Defines the exam-payload shape and the route params for /:id and
 * /verify/:id.
 * The `Certification`/`EarnedCertification`/`ExamQuestion` domain types
 * live in `../../types/index.ts`.
 */
import { z } from "zod";

/** Route params for /certifications/:id and /certifications/verify/:id. */
export const CertificationParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /certifications/:id/exam — submit exam answers. */
export const CertificationExamSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "userId is required")
    .max(80, "userId must be at most 80 characters"),
  userName: z
    .string()
    .trim()
    .min(1, "userName is required")
    .max(120, "userName must be at most 120 characters"),
  /** Index of the chosen option for each question. */
  answers: z
    .array(z.number().int().min(0))
    .min(1, "answers must contain at least one entry")
    .max(50, "answers must contain at most 50 entries"),
});
export type CertificationExamInput = z.infer<typeof CertificationExamSchema>;
