/**
 * Auth routes — /api/v1/auth
 *
 *   POST  /register     create a new account
 *   POST  /login        email + password → token pair
 *   POST  /refresh      refresh token → new token pair
 *   GET   /me           current user (requires Authorization: Bearer)
 *
 *   ─── Email lifecycle (PF-011 / audit F-02) ───────────────────────
 *   POST  /verify-email          (re)send a verification email    [public]
 *   POST  /verify-email/confirm  redeem the emailed token         [public]
 *   POST  /forgot-password       request a reset email            [public, always 200]
 *   POST  /reset-password         redeem token + new password      [public]
 *
 *   ─── Session lifecycle (audit F-05) ───────────────────────────
 *   POST  /logout        revoke the presented refresh token     [public, idempotent]
 *   POST  /logout-all    revoke every session for the caller    [Bearer JWT only]
 *
 *   ─── LOGIN POLICY (grace mode) ───────────────────────────────────
 *   An UNVERIFIED email still logs in — the response carries
 *   `user.emailVerified: false` so the UI shows a verify banner.
 *   Rationale: while the mailer runs on the mock transport (no
 *   RESEND_API_KEY), locking users out would brick every dev/test
 *   account. When real email ships, flip `requireVerifiedEmail`
 *   below to reject with 403 instead of flagging.
 *
 *   ─── No user enumeration (audit F-02) ───────────────────────────
 *   /verify-email + /forgot-password return the SAME 200 shape
 *   whether or not the address has an account; only the emailed
 *   link's existence differs. /reset-password + /verify-email/confirm
 *   fail with a uniform "Invalid or expired token" 400.
 *
 *   POST  /api-keys     mint an API key (issue #65)      [Bearer JWT only]
 *   GET   /api-keys     list the caller's keys, masked   [Bearer JWT only]
 *   DELETE /api-keys/:id revoke (soft-delete) a key      [Bearer JWT only]
 *
 * All auth routes are rate-limited via authRateLimit (default 10/min/IP)
 * to slow down brute-force attempts. The API-key management routes are
 * defined HERE (not in a nested router) so the API.md generator's route
 * walker (scripts/lib/walk-routes.ts) picks them up; the logic lives in
 * modules/api-keys/{schema,service}.ts.
 *
 * Management endpoints mount `jwtOnly` BEFORE `requireAuth`: X-API-Key
 * credentials are rejected outright so a leaked key can never mint more
 * keys, list them, or keep itself alive.
 */
import { Router } from "express";
import type { z } from "zod";

import { authRateLimit } from "../../server/middleware/rateLimit.js";
import { requireAuth } from "../../server/middleware/auth.js";
import { jwtOnly } from "../../server/middleware/api-key.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody, validateParams } from "../../server/middleware/validate.js";
import {
  ForgotPasswordSchema,
  LoginInputSchema,
  LogoutInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
  ResetPasswordSchema,
  VerifyEmailConfirmSchema,
  VerifyEmailRequestSchema,
} from "./schema.js";
import {
  confirmEmailVerification,
  getCurrentUser,
  loginUser,
  logoutAll,
  logoutUser,
  refreshTokens,
  registerUser,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
} from "./service.js";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../api-keys/service.js";import { recordAuditEvent } from "../audit/service.js";

import {
  ApiKeyParamsSchema,
  CreateApiKeySchema,
} from "../api-keys/schema.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimit,
  validateBody(RegisterInputSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof RegisterInputSchema>;
    const result = await registerUser(input);
    await recordAuditEvent({
      actor: result.user.id,
      action: "auth.user.register",
      resourceType: "user",
      resourceId: result.user.id,
      requestId: req.requestId,
      metadata: { email: result.user.email },
    });
    res.status(201).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });
  }),
);

authRouter.post(
  "/login",
  authRateLimit,
  validateBody(LoginInputSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof LoginInputSchema>;
    const result = await loginUser(input);
    await recordAuditEvent({
      actor: result.user.id,
      action: "auth.user.login",
      resourceType: "user",
      resourceId: result.user.id,
      requestId: req.requestId,
      metadata: { email: result.user.email },
    });
    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });
  }),
);

authRouter.post(
  "/refresh",
  authRateLimit,
  validateBody(RefreshInputSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof RefreshInputSchema>;
    const result = await refreshTokens(input.refreshToken);
    await recordAuditEvent({
      actor: result.user.id,
      action: "auth.token.refresh",
      resourceType: "user",
      resourceId: result.user.id,
      requestId: req.requestId,
    });
    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;
    const user = await getCurrentUser(userId);
    res.json({ data: user });
  }),
);

// ─── Session lifecycle (audit F-05) ─────────────────────────────────

/**
 * Logout: revoke the presented refresh token server-side. Public +
 * IDEMPOTENT — a garbage/unknown/expired token is still a 200 (logout
 * must never leak token validity, and a stale cookie shouldn't error).
 * The client clears its cookies; the row death is what matters.
 */
authRouter.post(
  "/logout",
  authRateLimit,
  validateBody(LogoutInputSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof LogoutInputSchema>;
    await logoutUser(input);
    res.json({ data: { ok: true } });
  }),
);

/**
 * Logout everywhere: revoke every live refresh token for the caller.
 * Bearer-JWT-ONLY (jwtOnly, like the API-key management routes): a
 * leaked X-API-Key must not be usable to sign the owner out of all
 * their sessions — that's a lockout DoS / cover-your-tracks vector.
 */
authRouter.post(
  "/logout-all",
  authRateLimit,
  jwtOnly,
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await logoutAll(req.user!.sub);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "auth.session.logout_all",
      resourceType: "user",
      resourceId: req.user!.sub,
      requestId: req.requestId,
      metadata: { revoked: result.revoked },
    });
    res.json({ data: result });
  }),
);

// ─── Email lifecycle (PF-011 / audit F-02) ─────────────────────────────
// All four stay public: the token in the body/URL IS the credential
// (someone clicking an email link has no Bearer token yet). Each is
// rate-limited under the auth tier (10/min/IP) like the other public
// auth routes.

/**
 * (Re)send a verification email. Always 200 with the same shape —
 * unknown addresses and already-verified accounts are silent no-ops
 * so this route can't be used to enumerate registered emails.
 */
authRouter.post(
  "/verify-email",
  authRateLimit,
  validateBody(VerifyEmailRequestSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof VerifyEmailRequestSchema>;
    await requestEmailVerification(input);
    res.json({
      data: {
        sent: true,
        message:
          "If that address has an unverified RoyCSS account, a verification link is on its way.",
      },
    });
  }),
);

/** Redeem the emailed verification token — sets emailVerifiedAt. */
authRouter.post(
  "/verify-email/confirm",
  authRateLimit,
  validateBody(VerifyEmailConfirmSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof VerifyEmailConfirmSchema>;
    const user = await confirmEmailVerification(input);
    await recordAuditEvent({
      actor: user.id,
      action: "auth.email.verify",
      resourceType: "user",
      resourceId: user.id,
      requestId: req.requestId,
    });
    res.json({ data: user });
  }),
);

/**
 * Request a password-reset email. ALWAYS 200 — identical response for
 * known and unknown addresses (no enumeration; audit F-02). The
 * actual reset requires the single-use token from the email.
 */
authRouter.post(
  "/forgot-password",
  authRateLimit,
  validateBody(ForgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ForgotPasswordSchema>;
    await requestPasswordReset(input);
    res.json({
      data: {
        sent: true,
        message:
          "If that address has a RoyCSS account, a password-reset link is on its way.",
      },
    });
  }),
);

/**
 * Redeem a reset token + set the new password. Invalid/expired/reused
 * tokens → 400 with a uniform message. A successful reset
 * invalidates every issued refresh token (session kill-switch — see
 * revokeAllUserRefreshTokens in service.ts).
 */
authRouter.post(
  "/reset-password",
  authRateLimit,
  validateBody(ResetPasswordSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ResetPasswordSchema>;
    const result = await resetPassword(input);
    await recordAuditEvent({
      // Actor is resolved from the token inside the service — the route
      // never sees it; audit without email (PII minimization, audit F-13).
      actor: result.userId,
      action: "auth.password.reset",
      resourceType: "user",
      resourceId: result.userId,
      requestId: req.requestId,
    });
    res.json({
      data: {
        reset: true,
        message: "Password updated. Sign in with your new password.",
      },
    });
  }),
);

// ─── API key management (issue #65 / PF-002) ─────────────────────────────
// Bearer JWT ONLY (`jwtOnly` + `requireAuth`) — X-API-Key is rejected with
// 401 so a leaked key cannot mint, enumerate, or resurrect keys.

/**
 * Mint a key. The plaintext key appears EXACTLY ONCE, in this response —
 * it is not stored (only a bcrypt hash is) and cannot be recovered later.
 */
authRouter.post(
  "/api-keys",
  authRateLimit,
  jwtOnly,
  requireAuth,
  validateBody(CreateApiKeySchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CreateApiKeySchema>;
    const result = await createApiKey({ ...input, ownerId: req.user!.sub });
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "auth.api_key.create",
      resourceType: "api_key",
      resourceId: result.apiKey.id,
      requestId: req.requestId,
    });
    res.status(201).json({
      data: {
        apiKey: result.apiKey,
        key: result.plaintext,
        warning:
          "Store this key now — it is shown only once and cannot be recovered.",
      },
    });
  }),
);

/** List the caller's keys — masked, with lifecycle timestamps. */
authRouter.get(
  "/api-keys",
  jwtOnly,
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listApiKeys(req.user!.sub);
    res.json({ data: items, meta: { count: items.length } });
  }),
);

/** Soft-delete (revoke) one of the caller's keys by id. */
authRouter.delete(
  "/api-keys/:id",
  jwtOnly,
  requireAuth,
  validateParams(ApiKeyParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ApiKeyParamsSchema>;
    const revoked = await revokeApiKey(req.user!.sub, id);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "auth.api_key.revoke",
      resourceType: "api_key",
      resourceId: id,
      requestId: req.requestId,
    });
    res.json({ data: revoked });
  }),
);
