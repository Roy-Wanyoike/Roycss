/**
 * Zod schemas for the live module.
 */
import { z } from "zod";

/** Body for POST /live/sessions. */
export const CreateSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title must be at most 160 characters"),
  hostId: z.string().trim().min(1).max(120),
  hostName: z.string().trim().min(1).max(120).optional(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

/** Body for POST /live/sessions/:id/message. */
export const PostMessageSchema = z.object({
  userId: z.string().trim().min(1).max(120),
  content: z
    .string()
    .trim()
    .min(1, "Message must be at least 1 character")
    .max(4000, "Message must be at most 4000 characters"),
});
export type PostMessageInput = z.infer<typeof PostMessageSchema>;

/** Route params for /live/sessions/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
