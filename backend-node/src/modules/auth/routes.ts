/**
 * Auth routes — /api/v1/auth
 *
 *   POST  /register     create a new account
 *   POST  /login        email + password → token pair
 *   POST  /refresh      refresh token → new token pair
 *   GET   /me           current user (requires Authorization: Bearer)
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
  getCurrentUser,
  loginUser,
  refreshTokens,
  registerUser,
} from "./service.js";
import {
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
} from "./schema.js";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../api-keys/service.js";
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
    res.json({ data: revoked });
  }),
);
