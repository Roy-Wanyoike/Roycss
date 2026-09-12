/**
 * CORS configuration.
 *
 * Allows the Next.js app (default http://localhost:3000) plus any
 * origins configured via CORS_ORIGINS. In dev we also reflect the
 * Origin header back so tools like Postman / curl with custom Origin
 * headers work. In prod, only whitelisted origins are allowed.
 */
import cors, { type CorsOptions } from "cors";

import { CORS_ORIGINS, IS_PROD } from "../../config/constants.js";

const options: CorsOptions = {
  origin(origin, cb) {
    // Allow same-origin / no-origin requests (curl, server-to-server, Postman).
    if (!origin) return cb(null, true);

    if (CORS_ORIGINS.includes(origin)) {
      return cb(null, true);
    }

    if (!IS_PROD) {
      // Permissive in dev so local mobile / network hosts work.
      return cb(null, true);
    }

    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Request-Id",
    // Browser-based API-key consumers authenticate with this header
    // (src/server/middleware/api-key.ts) — it must be in allowedHeaders
    // or the preflight OPTIONS request fails (audit F-17).
    "X-API-Key",
  ],
  exposedHeaders: ["X-Request-Id"],
  credentials: true,
  maxAge: 600, // 10 min preflight cache
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(options);
