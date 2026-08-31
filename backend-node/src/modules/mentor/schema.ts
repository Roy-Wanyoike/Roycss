/**
 * Zod schemas for the mentor module.
 *
 * Defines the chat-payload shape.
 * The `MentorTopic`/`MentorLevel`/`MentorProgress`/`MentorChatMessage`
 * domain types live in `../../types/index.ts`.
 */
import { z } from "zod";

/** Body for POST /mentor/chat — send a chat message to the mentor. */
export const MentorChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(4_000, "message must be at most 4000 characters"),
  topicId: z
    .string()
    .trim()
    .max(80, "topicId must be at most 80 characters")
    .optional()
    .or(z.literal("")),
});
export type MentorChatInput = z.infer<typeof MentorChatSchema>;
