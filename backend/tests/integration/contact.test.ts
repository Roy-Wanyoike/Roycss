/**
 * Integration tests — POST /api/v1/contact
 *
 * 4 tests covering the happy path + 3 validation failures:
 *   1. submit + DB round-trip via findUnique — 201 + persisted row
 *   2. missing fields 400 — empty body → 400 VALIDATION_ERROR
 *   3. invalid email 400 — bad format → 400 VALIDATION_ERROR
 *   4. too-short message 400 — < 10 chars → 400 VALIDATION_ERROR
 *
 * Test isolation:
 *   - Each test sends a unique X-Forwarded-For so the contact rate
 *     limiter (5 req/min/IP, default) never trips within the suite.
 *   - The setup file's wipe clears ContactMessage before the run;
 *     for the round-trip test we additionally read via `findUnique`
 *     keyed on a unique email so the assertion is unambiguous.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";

const app = createApp();

function uniqueIp(): string {
  const a = Math.floor(Math.random() * 250) + 1;
  const b = Math.floor(Math.random() * 250) + 1;
  return `203.0.113.${a}.${b}`.slice(0, 14); // 203.0.113.0/24 = TEST-NET-3
}

function uniqueEmail(prefix = "contact"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

describe("POST /api/v1/contact", () => {
  it("1. submit + DB round-trip — 201 and the row is persisted with findUnique", async () => {
    const email = uniqueEmail("roundtrip");
    const payload = {
      name: "Integration Test Sender",
      email,
      subject: "Just saying hi from the integration suite",
      message: "This is a long-enough message to pass the 10-char minimum length check.",
    };

    const res = await request(app)
      .post("/api/v1/contact")
      .set("X-Forwarded-For", uniqueIp())
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("string");
    expect(res.body.id.length).toBeGreaterThan(0);

    // DB round-trip via findUnique — verify the exact payload landed.
    const row = await db.contactMessage.findUnique({
      where: { id: res.body.id },
    });
    expect(row).not.toBeNull();
    expect(row!.name).toBe(payload.name);
    expect(row!.email).toBe(payload.email);
    expect(row!.subject).toBe(payload.subject);
    expect(row!.message).toBe(payload.message);
    expect(row!.read).toBe(false);
    expect(row!.createdAt).toBeInstanceOf(Date);
  });

  it("2. missing fields — empty body → 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .set("X-Forwarded-For", uniqueIp())
      // Empty body — none of name, email, message are present.
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);

    const details1 = res.body.error.details as Array<{ path: string }>;
    const paths = details1.map((d) => d.path);
    // All three required fields must be flagged.
    expect(paths).toContain("name");
    expect(paths).toContain("email");
    expect(paths).toContain("message");
  });

  it("3. invalid email — bad format → 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .set("X-Forwarded-For", uniqueIp())
      .send({
        name: "Bad Email Sender",
        email: "not-an-email",
        subject: "Subject",
        message: "A sufficiently long message body for the schema check.",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const details2 = res.body.error.details as Array<{ path: string }>;
    const emailIssue = details2.find((d) => d.path.includes("email"));
    expect(emailIssue).toBeDefined();
  });

  it("4. too-short message — < 10 chars → 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .set("X-Forwarded-For", uniqueIp())
      .send({
        name: "Short Message Sender",
        email: uniqueEmail("shortmsg"),
        subject: "Subject",
        message: "shorty", // 6 chars — under the 10-char minimum
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const details3 = res.body.error.details as Array<{ path: string; message: string }>;
    const msgIssue = details3.find((d) => d.path.includes("message"));
    expect(msgIssue).toBeDefined();
    // The Zod schema's `min(10, ...)` message includes "at least 10 characters".
    expect(msgIssue!.message).toMatch(/at least 10/i);
  });
});
