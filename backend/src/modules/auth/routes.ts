/**
 * Auth routes — /api/v1/auth
 *
 *   POST  /register     create a new account
 *   POST  /login        email + password → token pair
 *   POST  /refresh      refresh token → new token pair
 *   GET   /me           current user (requires Authorization: Bearer)
 *
 * All auth routes are rate-limited via authRateLimit (default 10/min/IP)
 * to slow down brute-force attempts.
 */
import { Router } from "express";
import type { z } from "zod";

import { authRateLimit } from "../../server/middleware/rateLimit.js";
import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
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
