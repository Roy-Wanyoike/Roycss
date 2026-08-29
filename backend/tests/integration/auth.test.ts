/**
 * Integration tests — POST /api/v1/auth/{register,login}
 *
 * 5 tests covering the happy path + the 4 documented error cases:
 *   1. register       — POST /register with valid email + password → 201 + token
 *   2. login          — POST /login with valid credentials → 200 + token
 *   3. wrong password — POST /login with bad password → 401 UNAUTHORIZED
 *   4. duplicate email — POST /register with already-registered email → 409 CONFLICT
 *   5. missing email  — POST /register with no email field → 400 VALIDATION_ERROR
 *
 * Test isolation strategy:
 *   - The global setup file (`setup.ts`) wipes all tables in FK-safe order
 *     before any test runs.
 *   - Each test uses a UNIQUE email (uuid suffix) so concurrent or out-of-
 *     order execution can't collide on a shared user.
 *   - Each test sends a unique `X-Forwarded-For` IP so the in-memory rate
 *     limiter (10 req/min/IP, default) never trips within a single suite.
 *     `app.set("trust proxy", 1)` is set in `createApp()`, so `req.ip`
 *     honors the forwarded header.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";

const app = createApp();

/** Generate a unique email so tests don't collide on `User.email` @unique. */
function uniqueEmail(prefix = "user"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

/** Unique IP per test so the in-memory rate limiter never trips. */
function uniqueIp(): string {
  // 198.51.100.0/24 is reserved for documentation/testing (RFC 5737).
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9"; // ≥8 chars, has letter + number

describe("POST /api/v1/auth/register + /login", () => {
  it("1. register — creates a new user and returns 201 + access + refresh tokens", async () => {
    const email = uniqueEmail("register");

    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", uniqueIp())
      .send({
        email,
        password: VALID_PASSWORD,
        name: "Register Test User",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(res.body.data.accessToken.length).toBeGreaterThan(10);
    expect(typeof res.body.data.refreshToken).toBe("string");
    expect(typeof res.body.data.expiresIn).toBe("number");

    // DB round-trip — the user actually landed in the table.
    const dbUser = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.email).toBe(email);
    expect(dbUser!.name).toBe("Register Test User");
    // passwordHash must never be the plaintext password.
    expect(dbUser!.passwordHash).not.toBe(VALID_PASSWORD);
    expect(dbUser!.passwordHash.startsWith("$2")).toBe(true); // bcrypt
  });

  it("2. login — exchanges valid credentials for a fresh token pair (200)", async () => {
    const email = uniqueEmail("login");
    const ip = uniqueIp();

    // Stage — register first so the user exists.
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", ip)
      .send({ email, password: VALID_PASSWORD });
    expect(regRes.status).toBe(201);

    // Act — login with the same credentials.
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
  });

  it("3. login with wrong password — returns 401 UNAUTHORIZED", async () => {
    const email = uniqueEmail("wrongpw");
    const ip = uniqueIp();

    // Stage — register with the correct password.
    await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", ip)
      .send({ email, password: VALID_PASSWORD });

    // Act — login with a different (wrong) password.
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: "this-is-the-wrong-password-7" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    // The error message must NOT leak which side was wrong — that's
    // a user-enumeration vulnerability.
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });

  it("4. register with a duplicate email — returns 409 CONFLICT", async () => {
    const email = uniqueEmail("dupe");
    const ip1 = uniqueIp();
    const ip2 = uniqueIp();

    // Stage — first registration succeeds.
    const first = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", ip1)
      .send({ email, password: VALID_PASSWORD });
    expect(first.status).toBe(201);

    // Act — second registration with the same email must fail.
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", ip2)
      .send({ email, password: VALID_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  it("5. register with a missing email — returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", uniqueIp())
      // No `email` field at all — should fail Zod validation in middleware.
      .send({
        password: VALID_PASSWORD,
        name: "No Email User",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // The details array should point at the missing `email` field.
    expect(Array.isArray(res.body.error.details)).toBe(true);
    const details = res.body.error.details as Array<{ path: string }>;
    const emailIssue = details.find((d) => d.path.includes("email"));
    expect(emailIssue).toBeDefined();
  });
});
