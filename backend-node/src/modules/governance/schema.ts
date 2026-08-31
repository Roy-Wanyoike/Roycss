/**
 * Zod schemas for the governance module.
 *
 * Defines the body shapes for the approve/reject endpoints and route
 * params for /governance/approvals/:id.
 */
import { z } from "zod";

/** Body for POST /governance/approvals/:id/approve. */
export const ApproveSchema = z.object({
  /** Optional reviewer handle; defaults to a system reviewer. */
  reviewer: z.string().trim().min(1).max(120).optional(),
  /** Optional note added to the audit log. */
  note: z.string().trim().max(2000).optional(),
});
export type ApproveInput = z.infer<typeof ApproveSchema>;

/** Body for POST /governance/approvals/:id/reject. */
export const RejectSchema = z.object({
  reviewer: z.string().trim().min(1).max(120).optional(),
  /** Required reason when rejecting. */
  reason: z
    .string()
    .trim()
    .min(10, "reason must be at least 10 characters")
    .max(2000, "reason must be at most 2000 characters"),
});
export type RejectInput = z.infer<typeof RejectSchema>;

/** Route params for /governance/approvals/:id. */
export const GovernanceParamsSchema = z.object({
  id: z.string().min(1),
});
