/**
 * Contact routes — /api/v1/contact
 *
 *   POST  /    submit a contact message
 *
 * Wired with:
 *   - contactRateLimit (5/min per IP)
 *   - validateBody (Zod schema)
 *
 * Returns 201 on success, 400 on validation failure, 429 on rate-limit,
 * 503 on DB write failure.
 */
import { Router } from "express";
import type { z } from "zod";

import { contactRateLimit } from "../../server/middleware/rateLimit.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { submitContactMessage } from "./service.js";
import { ContactInputSchema } from "./schema.js";

export const contactRouter = Router();

contactRouter.post(
  "/",
  contactRateLimit,
  validateBody(ContactInputSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ContactInputSchema>;
    const result = await submitContactMessage(input);
    res.status(201).json({
      ok: true,
      message: "Thanks for reaching out! Your message has been received.",
      id: result.id,
    });
  }),
);
