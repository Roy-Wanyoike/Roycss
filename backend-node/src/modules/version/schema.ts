/**
 * Zod schemas for the version module.
 *
 * Defines the body shape for POST /version/check-upgrade.
 */
import { z } from "zod";

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** Body for POST /version/check-upgrade — check if an upgrade is available. */
export const CheckUpgradeSchema = z.object({
  /** The currently-installed version (defaults to the platform current). */
  current: z
    .string()
    .trim()
    .min(1)
    .regex(SEMVER_RE, "current must be a valid semver")
    .optional(),
});
export type CheckUpgradeInput = z.infer<typeof CheckUpgradeSchema>;
