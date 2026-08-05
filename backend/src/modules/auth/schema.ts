/**
 * Zod schemas for the auth module.
 */
import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(160, "Email is too long")
    .regex(EMAIL_RE, "Please provide a valid email address")
    .transform((s) => s.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    // Light password policy — require at least one letter and one number.
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z
    .string()
    .trim()
    .max(120, "Name must be at most 120 characters")
    .optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

/** Public user shape returned in API responses (never includes passwordHash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}
