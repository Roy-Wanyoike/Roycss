/**
 * Unit tests — designer service, LLM-configured mode (PF-007 / issue #126,
 * chunk 1).
 *
 * OPENAI_API_KEY is set via vi.hoisted BEFORE the module graph loads (so
 * the unified LLM client resolves to the OpenAI provider) and
 * `global.fetch` is stubbed with OpenAI-shaped responses — no network.
 * This exercises the REAL llm-client → openaiChat path plus
 * generateDesign's merge branches:
 *   - LLM-suggested tokens merge over the mock base and re-derive the
 *     component CSS (bg/fg/radius/primary/secondary)
 *   - an empty JSON object ({}) leaves the base mock design untouched
 *   - non-JSON output and transport errors keep the base design (the
 *     result is still recorded)
 *   - the palette hint reaches the user prompt
 *
 * Mock-provider behavior lives in designer-service.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OPENAI_KEY = "sk-test-openai-key";

vi.hoisted(() => {
  process.env.OPENAI_API_KEY = "sk-test-openai-key";
  delete process.env.ANTHROPIC_API_KEY;
});

import {
  _resetDesignerForTest,
  generateDesign,
  getResultById,
} from "../../src/modules/designer/service.js";

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
  _resetDesignerForTest();
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

describe("generateDesign — LLM merge branches", () => {
  it("1. LLM tokens merge over the base and re-derive the component CSS", async () => {
    llmContent = JSON.stringify({
      "--color-primary": "#123456",
      "--radius-base": "2rem",
    });

    const result = await generateDesign({
      prompt: "Design a futuristic dashboard shell",
      presetId: "preset-apple",
      components: ["hero"],
    });

    // Merged: LLM values win, base tokens survive.
    expect(result.tokens["--color-primary"]).toBe("#123456");
    expect(result.tokens["--radius-base"]).toBe("2rem");
    expect(result.tokens["--font-base"]).toBe("SF Pro Display");

    // The component CSS is re-derived from the merged tokens.
    const css = result.components[0]!.css;
    expect(css).toContain("border-radius: 2rem;");
    expect(css).toContain("border: 2px solid #123456;");
    expect(css).toContain("background: #f2f2f7;"); // --color-bg from base
    expect(css).toContain("color: #1c1c1e;"); // --color-fg from base
    expect(css).toContain("color: #5856d6;"); // --color-secondary from base

    // The OpenAI call carries the key + the designer system prompt.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(calls[0]!.headers.authorization).toBe(`Bearer ${OPENAI_KEY}`);
    const body = JSON.parse(calls[0]!.body!) as {
      messages: { role: string; content: string }[];
    };
    expect(body.messages[0]!.content).toContain("expert UI designer");
    expect(body.messages[1]!.content).toContain(
      "Brief: Design a futuristic dashboard shell.",
    );
    expect(body.messages[1]!.content).toContain("Components: hero.");
  });

  it("2. the palette hint reaches the user prompt when provided", async () => {
    llmContent = JSON.stringify({ "--color-bg": "#abcdef" });
    await generateDesign({
      prompt: "Design a brand-first landing page",
      palette: ["#111111", "#222222"],
      components: ["card"],
    });
    const body = JSON.parse(calls[0]!.body!) as {
      messages: { role: string; content: string }[];
    };
    expect(body.messages[1]!.content).toContain(
      "Brand palette: #111111, #222222.",
    );
  });

  it("3. an empty JSON object ({}) leaves the base mock design untouched", async () => {
    llmContent = "{}";
    const result = await generateDesign({
      prompt: "Design an empty-token design system",
      components: ["hero"],
    });
    expect(result.tokens["--color-primary"]).toBe("#007aff");
    expect(result.components[0]!.css).toContain("border-radius: 1.25rem;");
  });

  it("4. non-JSON output keeps the base design (still recorded in history)", async () => {
    llmContent = "Sure! Here is a design idea: use lots of whitespace.";
    const result = await generateDesign({
      prompt: "Design a whitespace-heavy minimal page",
      components: ["hero"],
    });
    expect(result.tokens["--color-primary"]).toBe("#007aff");
    await expect(getResultById(result.id)).resolves.toBeDefined();
  });

  it("5. a transport error keeps the base design (no throw)", async () => {
    llmContent = null;
    const result = await generateDesign({
      prompt: "Design a page while the network is down",
      components: ["hero"],
    });
    expect(result.status).toBe("complete");
    expect(result.tokens["--color-primary"]).toBe("#007aff");
  });

  it("6. an HTTP 500 from the provider keeps the base design", async () => {
    llmContent = "{}";
    llmStatus = 500;
    const result = await generateDesign({
      prompt: "Design a page while the provider errors",
      components: ["hero"],
    });
    expect(result.tokens["--color-primary"]).toBe("#007aff");
  });
});
