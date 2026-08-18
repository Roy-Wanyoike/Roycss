/**
 * Zod schemas for the pair module.
 *
 * Defines the body shape for POST /pair/chat and route params (none).
 */
import { z } from "zod";

/** Body for POST /pair/chat — send a message to Roy Pair. */
export const PairChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(10_000, "message must be at most 10,000 characters"),
  /** Optional session id; a new session is created if omitted. */
  sessionId: z.string().trim().min(1).optional(),
  /** Programming language context. */
  language: z
    .enum([
      "typescript",
      "javascript",
      "tsx",
      "jsx",
      "css",
      "html",
      "python",
      "go",
      "rust",
      "other",
    ])
    .default("typescript"),
  /** Optional code snippet the user is asking about. */
  code: z.string().max(50_000).optional(),
});
export type PairChatInput = z.infer<typeof PairChatSchema>;
