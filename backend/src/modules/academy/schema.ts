/**
 * Zod schemas for the academy module.
 *
 * Defines the route params and the progress-update payload.
 * The `LearningPath`/`Lesson` domain types live in `../../types/index.ts`.
 */
import { z } from "zod";

export const PathLevelEnum = z.enum([
  "Associate",
  "Professional",
  "Expert",
  "Architect",
]);

export const LessonTypeEnum = z.enum(["video", "reading", "lab", "quiz"]);

/** Route params for /paths/:id. */
export const PathParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /paths/:id/progress — mark a lesson complete/incomplete. */
export const ProgressInputSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required"),
  completed: z.boolean(),
});
export type ProgressInput = z.infer<typeof ProgressInputSchema>;
