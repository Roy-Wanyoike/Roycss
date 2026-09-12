/**
 * Zod schemas for the auth module.
 */
import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared email field (register + the email-token request bodies). */
const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(160, "Email is too long")
  .regex(EMAIL_RE, "Please provide a valid email address")
  .transform((s) => s.toLowerCase());

/** Shared password policy (register + reset-password). */
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  // Light password policy — require at least one letter and one number.
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const RegisterInputSchema = z.object({
  email: emailField,
  password: passwordField,
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

// ─── Email verification + password reset (PF-011 / audit F-02) ──────────

/** POST /auth/verify-email — (re)send a verification email. */
export const VerifyEmailRequestSchema = z.object({
  email: emailField,
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

/** POST /auth/verify-email/confirm — redeem the emailed token. */
export const VerifyEmailConfirmSchema = z.object({
  token: z.string().min(1, "token is required").max(128, "token is too long"),
});
export type VerifyEmailConfirm = z.infer<typeof VerifyEmailConfirmSchema>;

/** POST /auth/forgot-password — request a reset email (always 200). */
export const ForgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/** POST /auth/reset-password — redeem the token + set a new password. */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "token is required").max(128, "token is too long"),
  password: passwordField,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ─── Session lifecycle (audit F-05) ───────────────────────────────────

/** POST /auth/logout — revoke the presented refresh token. */
export const LogoutInputSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});
export type LogoutInput = z.infer<typeof LogoutInputSchema>;

// ─── Account lifecycle: export + delete (audit F-13) ──────────────────

/**
 * DELETE /auth/account — password re-confirmation. Deletion is the one
 * mutation that must not be triggerable by a stolen session alone.
 */
export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

/** Public user shape returned in API responses (never includes passwordHash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  /** Grace-mode verification flag (audit F-02): false until emailVerifiedAt. */
  emailVerified: boolean;
  createdAt: Date;
}

/**
 * GET /auth/export response — the caller's OWN data only (audit F-13).
 * No secrets ride along: passwordHash never, API keys only in masked
 * metadata form (the plaintext is unrecoverable by design).
 */
export interface AccountExport {
  /** Stable shape tag so client tooling can branch on format changes. */
  format: "roycss-account-export/v1";
  exportedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  favorites: Array<{
    id: string;
    effectId: string;
    createdAt: Date;
  }>;
  collections: Array<{
    id: string;
    name: string;
    description: string | null;
    /** Parsed from the stored JSON-string column for a usable dump. */
    effectIds: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  /** Masked metadata only (id, name, masked, scopes, timestamps). */
  apiKeys: Array<{
    id: string;
    name: string;
    masked: string;
    scopes: string[];
    orgId: string | null;
    createdAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
  }>;
}
