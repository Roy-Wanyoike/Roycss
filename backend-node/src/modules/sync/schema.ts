/**
 * Zod schemas for the sync module.
 *
 * Defines the body shapes for the three sync endpoints (figma, github,
 * tokens) and route params (none).
 */
import { z } from "zod";

/** Body for POST /sync/figma — pull design tokens from a Figma file. */
export const SyncFigmaSchema = z.object({
  fileKey: z
    .string()
    .trim()
    .min(1, "fileKey is required")
    .max(80, "fileKey must be at most 80 characters"),
  /** Optional page/frame name to scope the sync. */
  scope: z.string().trim().max(120).optional(),
});
export type SyncFigmaInput = z.infer<typeof SyncFigmaSchema>;

/** Body for POST /sync/github — push the design system to a GitHub repo. */
export const SyncGithubSchema = z.object({
  repo: z
    .string()
    .trim()
    .min(1, "repo is required")
    .max(120, "repo must be at most 120 characters")
    .regex(
      /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
      "repo must be in 'owner/name' format",
    ),
  branch: z.string().trim().min(1).max(80).default("main"),
  /** Optional commit message override. */
  message: z.string().trim().max(200).optional(),
});
export type SyncGithubInput = z.infer<typeof SyncGithubSchema>;

/** Body for POST /sync/tokens — push the local design tokens upstream. */
export const SyncTokensSchema = z.object({
  /** Where to push the tokens. */
  target: z.enum(["figma", "github", "style-dictionary", "jsonbin"]),
  /** Optional namespace prefix for the tokens. */
  namespace: z.string().trim().max(80).optional(),
});
export type SyncTokensInput = z.infer<typeof SyncTokensSchema>;
