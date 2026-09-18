/**
 * Unit tests — review service, LLM-configured mode (PF-007 / issue #126,
 * chunk 1).
 *
 * OPENAI_API_KEY is set via vi.hoisted BEFORE the module graph loads (so
 * the unified LLM client resolves to the OpenAI provider) and
 * `global.fetch` is stubbed with OpenAI-shaped responses — no network.
 * This exercises the REAL llm-client → openaiChat path plus reviewCode's
 * LLM mapping branches:
 *   - findings field defaults (ruleId, severity fallback, line, message,
 *     suggestion)
 *   - score clamping (150 → 100, negative → 0) and the computed formula
 *     when the LLM omits the score
 *   - non-JSON LLM output → deterministic heuristic fallback
 *   - transport error / HTTP 500 → heuristic fallback (mutation intact)
 *
 * Mock-provider behavior lives in review-service.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OPENAI_KEY = "sk-test-openai-key";

vi.hoisted(() => {
  process.env.OPENAI_API_KEY = "sk-test-openai-key";
  delete process.env.ANTHROPIC_API_KEY;
});

import { reviewCode } from "../../src/modules/review/service.js";

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

const calls: FetchCall[] = [];

let llmContent: string | null = null;
let llmStatus = 200;

beforeEach(() => {
  calls.length = 0;
  llmContent = null;
  llmStatus = 200;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: unknown, init: unknown) => {
      const i = (init ?? {}) as {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      };
      calls.push({
        url: String(url),
        method: i.method ?? "GET",
        headers: { ...(i.headers ?? {}) },
        body: typeof i.body === "string" ? i.body : undefined,
      });
      if (llmContent === null) throw new Error("network down");
      if (llmStatus !== 200) {
        return {
          ok: false,
          status: llmStatus,
          statusText: "Server Error",
          json: async () => ({ error: { message: "quota exceeded" } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: llmContent } }],
        }),
      };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function openaiContent(json: unknown): void {
  llmContent = JSON.stringify(json);
}

describe("reviewCode — LLM mapping branches", () => {
  it("1. maps a well-formed LLM verdict and clamps an out-of-range score", async () => {
    openaiContent({
      findings: [
        { severity: "critical", line: "12" }, // every default kicks in
        {
          ruleId: "rule-sec-no-eval",
          severity: "error",
          line: 42,
          message: "eval() detected",
          suggestion: "Remove the eval call",
        },
      ],
      summary: "Custom LLM summary.",
      score: 150,
    });

    const result = await reviewCode({
      filename: "src/llm-a.ts",
      language: "typescript",
      code: "eval('1')",
      focus: ["security"],
    });

    expect(result.findings).toHaveLength(2);
    expect(result.findings[0]).toEqual({
      ruleId: "rule-llm-1",
      severity: "info", // unknown severity degrades to info
      line: 1, // non-numeric line defaults to 1
      message: "Issue found by LLM reviewer.",
      suggestion: "Apply the recommended fix.",
    });
    expect(result.findings[1]).toEqual({
      ruleId: "rule-sec-no-eval",
      severity: "error",
      line: 42,
      message: "eval() detected",
      suggestion: "Remove the eval call",
    });
    expect(result.score).toBe(100); // 150 clamped
    expect(result.summary).toBe("Custom LLM summary.");
    expect(result.status).toBe("complete");

    // The OpenAI call carries the key and the focus hint.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(calls[0]!.headers.authorization).toBe(`Bearer ${OPENAI_KEY}`);
    const body = JSON.parse(calls[0]!.body!) as {
      messages: { role: string; content: string }[];
    };
    expect(body.messages[0]!.content).toContain("strict code reviewer");
    expect(body.messages[1]!.content).toContain("Focus areas: security.");
    expect(body.messages[1]!.content).toContain("```typescript");
  });

  it("2. a negative score clamps to 0", async () => {
    openaiContent({ findings: [], summary: "s", score: -20 });
    const result = await reviewCode({
      filename: "src/llm-b.ts",
      language: "typescript",
      code: "const b = 2;",
    });
    expect(result.score).toBe(0);
    expect(result.findings).toEqual([]);
  });

  it("3. a missing score is computed from the finding severities", async () => {
    openaiContent({
      findings: [
        { ruleId: "a", severity: "error", line: 1, message: "m", suggestion: "s" },
        { ruleId: "b", severity: "warning", line: 2, message: "m", suggestion: "s" },
      ],
      // no summary either → default wording
    });
    const result = await reviewCode({
      filename: "src/llm-c.ts",
      language: "typescript",
      code: "const c = 3;",
    });

    expect(result.score).toBe(100 - 18 - 8);
    expect(result.summary).toBe("2 finding(s) (1 error, 1 warning).");
  });

  it("4. non-JSON LLM output falls back to the heuristic review", async () => {
    llmContent = "The code looks fine overall — no structured verdict.";

    const result = await reviewCode({
      filename: "src/plain.ts",
      language: "typescript",
      code: "const x = 1;",
    });

    // Heuristic output: catalog rule ids, formula-based summary.
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.every((f) => f.ruleId.startsWith("rule-"))).toBe(
      true,
    );
    expect(result.summary).toMatch(/\d+ finding\(s\)/);
  });

  it("5. a transport error falls back to the heuristic review (no throw)", async () => {
    llmContent = null; // fetch rejects

    const result = await reviewCode({
      filename: "src/down.ts",
      language: "typescript",
      code: "const y = 2;",
    });
    expect(result.status).toBe("complete");
    expect(result.findings.every((f) => f.ruleId.startsWith("rule-"))).toBe(
      true,
    );
  });

  it("6. an HTTP 500 from the provider falls back to the heuristic review", async () => {
    openaiContent({ findings: [] });
    llmStatus = 500;

    const result = await reviewCode({
      filename: "src/fivehundred.ts",
      language: "typescript",
      code: "const z = 3;",
    });
    expect(result.status).toBe("complete");
    expect(result.findings.every((f) => f.ruleId.startsWith("rule-"))).toBe(
      true,
    );
  });
});
