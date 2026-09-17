/**
 * Unit tests — text-wrap service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the greedy wrap analyzer — the branches the
 * integration happy path never reaches:
 *   - word-break / overflow-wrap / hyphens overflow strategies
 *     (break-all char-splitting, break-word overflow, hyphenation split)
 *   - paragraph tokenization edge cases (empty paragraph → empty line)
 *   - balance-score boundaries (single line = 100, all-zero widths = 0)
 *   - CSS emission branches (hanging-punctuation omitted when "none")
 *   - cache hit/miss (same reference) + TTL expiry (fake clock)
 *   - Zod rejection boundaries (empty text, containerWidth/fontSize bounds)
 *
 * The HTTP surface (envelopes, 201, validation middleware) lives in the
 * contract + integration suites.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyzeTextWrap,
  listPresets,
} from "../../src/modules/text-wrap/service.js";
import {
  TextWrapAnalyzeSchema,
  type TextWrapAnalyzeInput,
} from "../../src/modules/text-wrap/schema.js";

const BASE_PROPS: TextWrapAnalyzeInput["properties"] = {
  textWrap: "wrap",
  textWrapMode: "wrap",
  lineBreak: "auto",
  wordBreak: "normal",
  overflowWrap: "normal",
  hyphens: "none",
  hangingPunctuation: "none",
  textAlign: "start",
};

function input(over: Partial<TextWrapAnalyzeInput> = {}): TextWrapAnalyzeInput {
  return {
    text: "hello world",
    containerWidth: 400,
    fontSize: 16,
    lineHeight: 1.5,
    properties: { ...BASE_PROPS, ...(over.properties ?? {}) },
    ...over,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("analyzeTextWrap — overflow strategies (deep paths)", () => {
  it("1. wordBreak: break-all splits an oversized token character-by-character", async () => {
    // 30 chars × 5px (fontSize 10 → 0.5×10) = 150px on a 100px line → 20+10.
    const result = await analyzeTextWrap(
      input({
        text: "A".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, wordBreak: "break-all" },
      }),
    );

    expect(result.lineCount).toBe(2);
    expect(result.lines[0]!.text).toBe("A".repeat(20));
    expect(result.lines[0]!.width).toBe(100);
    expect(result.lines[1]!.text).toBe("A".repeat(10));
    expect(result.lines[1]!.width).toBe(50);
  });

  it("2. overflowWrap: anywhere follows the same char-split path as break-all", async () => {
    const result = await analyzeTextWrap(
      input({
        text: "B".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, overflowWrap: "anywhere" },
      }),
    );

    expect(result.lineCount).toBe(2);
    expect(result.lines.map((l) => l.text.length)).toEqual([20, 10]);
  });

  it("3. lineBreak: anywhere also splits mid-token", async () => {
    const result = await analyzeTextWrap(
      input({
        text: "C".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, lineBreak: "anywhere" },
      }),
    );

    expect(result.lineCount).toBe(2);
  });

  it("4. overflowWrap: break-word keeps the oversized token whole (overflow line)", async () => {
    const result = await analyzeTextWrap(
      input({
        text: "D".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, overflowWrap: "break-word" },
      }),
    );

    expect(result.lineCount).toBe(1);
    expect(result.lines[0]!.text).toBe("D".repeat(30));
    expect(result.lines[0]!.width).toBe(150);
  });

  it("5. wordBreak: break-word keeps the oversized token whole too", async () => {
    const result = await analyzeTextWrap(
      input({
        text: "E".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, wordBreak: "break-word" },
      }),
    );

    expect(result.lineCount).toBe(1);
    expect(result.lines[0]!.width).toBe(150);
  });

  it("6. default strategy (no break props) lets the token overflow the line", async () => {
    const result = await analyzeTextWrap(
      input({ text: "F".repeat(30), containerWidth: 100, fontSize: 10 }),
    );

    expect(result.lineCount).toBe(1);
    expect(result.lines[0]!.width).toBe(150);
  });

  it("7. hyphens: auto splits the oversized token at 60% with a hyphen", async () => {
    const result = await analyzeTextWrap(
      input({
        text: "G".repeat(30),
        containerWidth: 100,
        fontSize: 10,
        properties: { ...BASE_PROPS, hyphens: "auto" },
      }),
    );

    expect(result.lineCount).toBe(2);
    // floor(30 * 0.6) = 18 chars + "-" on line 1, remaining 12 on line 2.
    expect(result.lines[0]!.text).toBe("G".repeat(18) + "-");
    expect(result.lines[0]!.width).toBe(95);
    expect(result.lines[1]!.text).toBe("G".repeat(12));
    expect(result.lines[1]!.width).toBe(60);
  });
});

describe("analyzeTextWrap — tokenization + balance-score boundaries", () => {
  it("8. a paragraph that tokenizes to nothing emits an empty line", async () => {
    // Leading blank paragraph: split(/\n+/) yields ["", "alpha beta"].
    const result = await analyzeTextWrap(
      input({ text: "\n\nalpha beta", containerWidth: 400 }),
    );

    expect(result.lineCount).toBe(2);
    expect(result.lines[0]!.text).toBe("");
    expect(result.lines[0]!.width).toBe(0);
    expect(result.lines[1]!.text).toBe("alpha beta");
  });

  it("9. balance score is 100 for a single line", async () => {
    const result = await analyzeTextWrap(input({ text: "short" }));
    expect(result.balanceScore).toBe(100);
  });

  it("10. balance score is 0 when every scored line has zero width", async () => {
    // Line 1 is the empty leading paragraph (width 0) and is the only
    // non-final line → scored set is empty → score 0 (not 100, since
    // there are 2 lines).
    const result = await analyzeTextWrap(
      input({ text: "\n\nalpha", containerWidth: 400 }),
    );
    expect(result.lineCount).toBe(2);
    expect(result.balanceScore).toBe(0);
  });

  it("11. two evenly-filled lines score ratio × fullness", async () => {
    // fontSize 20 → char 10px, space 10px. Two 60px words on a 100px line:
    // each word lands on its own line (60+10+60 > 100) → widths [60, 60].
    const result = await analyzeTextWrap(
      input({ text: "aaaaaa bbbbbb", containerWidth: 100, fontSize: 20 }),
    );
    expect(result.lines.map((l) => l.width)).toEqual([60, 60]);
    // ratio 60/60 = 1, fullness 60/100 = 0.6 → 60.
    expect(result.balanceScore).toBe(60);
  });
});

describe("analyzeTextWrap — CSS emission + assessment branches", () => {
  it("12. hanging-punctuation is omitted from the CSS when 'none'", async () => {
    const result = await analyzeTextWrap(input());
    expect(result.css).not.toContain("hanging-punctuation");
    expect(result.css).toContain("text-wrap: wrap;");
    expect(result.css).toContain("text-wrap-mode: wrap;");
    expect(result.css).toContain("text-align: start;");
  });

  it("13. hanging-punctuation is emitted when set", async () => {
    const result = await analyzeTextWrap(
      input({ properties: { ...BASE_PROPS, hangingPunctuation: "first" } }),
    );
    expect(result.css).toContain("hanging-punctuation: first;");
  });

  it("14. assessment text covers every branch family", async () => {
    const forProps = async (p: Partial<TextWrapAnalyzeInput["properties"]>) =>
      (await analyzeTextWrap(input({ properties: { ...BASE_PROPS, ...p } })))
        .assessment;

    expect((await forProps({ textWrap: "balance" })).textWrap).toContain(
      "Balances line widths",
    );
    expect((await forProps({ textWrap: "pretty" })).textWrap).toContain(
      "last few lines",
    );
    expect((await forProps({ textWrap: "stable" })).textWrap).toContain(
      "Stable wrapping",
    );
    expect((await forProps({ textWrap: "nowrap" })).textWrap).toContain(
      "Greedy line-fill",
    );

    expect((await forProps({ hyphens: "auto" })).hyphens).toContain(
      "Hyphenation enabled",
    );
    expect((await forProps({ hyphens: "none" })).hyphens).toContain(
      "No auto-hyphenation",
    );

    expect((await forProps({ hangingPunctuation: "first" })).hangingPunctuation)
      .toContain("hangs outside");
    expect((await forProps({})).hangingPunctuation).toContain(
      "stays inside",
    );

    expect((await forProps({ wordBreak: "break-all" })).wordBreak).toContain(
      "Breaks words at any character",
    );
    expect((await forProps({ wordBreak: "keep-all" })).wordBreak).toContain(
      "CJK word boundaries",
    );
    expect((await forProps({})).wordBreak).toContain(
      "breaks only at whitespace",
    );
  });
});

describe("analyzeTextWrap — LRU cache behavior", () => {
  it("15. identical input returns the cached object (same reference), new input misses", async () => {
    const a = input({ text: "cache me", containerWidth: 320 });
    const first = await analyzeTextWrap(a);
    const second = await analyzeTextWrap(a);
    expect(second).toBe(first);

    const other = await analyzeTextWrap(
      input({ text: "cache me too", containerWidth: 320 }),
    );
    expect(other).not.toBe(first);
  });

  it("16. the analyze cache entry expires after its TTL (fake clock)", async () => {
    const a = input({ text: "ttl probe", containerWidth: 240 });
    const first = await analyzeTextWrap(a);
    // CACHE_TTL.textWrapAnalyze = 5 min.
    vi.advanceTimersByTime(5 * 60_000 + 1);
    const second = await analyzeTextWrap(a);
    expect(second).not.toBe(first);
    expect(second.css).toBe(first.css); // same deterministic content
  });
});

describe("listPresets", () => {
  it("17. returns the 5 seeded presets and serves the cached list on repeat calls", async () => {
    const first = await listPresets();
    expect(first).toHaveLength(5);
    expect(first.map((p) => p.id)).toEqual([
      "preset-balance",
      "preset-pretty",
      "preset-stable",
      "preset-nowrap",
      "preset-wrap",
    ]);
    const second = await listPresets();
    expect(second).toBe(first);
  });
});

describe("TextWrapAnalyzeSchema — Zod rejection boundaries", () => {
  const valid = {
    text: "hello",
    containerWidth: 400,
    properties: {},
  };

  it("18. empty / whitespace-only text is rejected", () => {
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, text: "" }).success,
    ).toBe(false);
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, text: "   " }).success,
    ).toBe(false);
  });

  it("19. containerWidth must be an int within [120, 2000]", () => {
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, containerWidth: 119 }).success,
    ).toBe(false);
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, containerWidth: 2001 }).success,
    ).toBe(false);
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, containerWidth: 320.5 })
        .success,
    ).toBe(false);
  });

  it("20. fontSize + lineHeight bounds and unknown enum values are rejected", () => {
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, fontSize: 7 }).success,
    ).toBe(false);
    expect(
      TextWrapAnalyzeSchema.safeParse({ ...valid, lineHeight: 0.1 }).success,
    ).toBe(false);
    expect(
      TextWrapAnalyzeSchema.safeParse({
        ...valid,
        properties: { wordBreak: "shatter" },
      }).success,
    ).toBe(false);
  });

  it("21. hanging-punctuation accepts only the documented keyword list", () => {
    expect(
      TextWrapAnalyzeSchema.safeParse({
        ...valid,
        properties: { hangingPunctuation: "first last" },
      }).success,
    ).toBe(true);
    expect(
      TextWrapAnalyzeSchema.safeParse({
        ...valid,
        properties: { hangingPunctuation: "bogus" },
      }).success,
    ).toBe(false);
  });

  it("22. a minimal valid payload fills in every default", () => {
    const parsed = TextWrapAnalyzeSchema.parse(valid);
    expect(parsed.fontSize).toBe(16);
    expect(parsed.lineHeight).toBe(1.5);
    expect(parsed.properties.textWrap).toBe("wrap");
    expect(parsed.properties.hyphens).toBe("none");
    expect(parsed.properties.textAlign).toBe("start");
  });
});
