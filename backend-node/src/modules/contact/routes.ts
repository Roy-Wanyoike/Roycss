/**
 * Contact routes — /api/v1/contact
 *
 *   POST  /    submit a contact message
 *
 * Wired with:
 *   - validateBody (Zod schema)
 *   - contactRateLimit (5/min per IP)
 *
 * Validation runs BEFORE the contact limiter (issue #209 P3): a
 * malformed body must not consume form-submission quota. There is no
 * abuse regression — the GLOBAL general limiter still throttles every
 * unauthenticated request (100/min/IP), so invalid-payload floods are
 * bounded by that tier; only real, valid submissions draw the
 * contact-tier budget.
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
  validateBody(ContactInputSchema),
  contactRateLimit,
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
