/**
 * Review service — Roy Review code review service.
 *
 * Backed by the unified LLM client. When an LLM key is configured, the
 * reviewer asks the LLM for a JSON object `{ findings, summary, score }`
 * and maps it into the existing ReviewResult shape. When no key is set,
 * a deterministic regex/heuristic-based review is returned — same
 * signature, same downstream cache keys.
 *
 * Reads are LRU-cached; submitting code invalidates the history list.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { chat as llmChat, isLLMConfigured } from "../../lib/llm-client.js";
import { createLogger } from "../../lib/logger.js";
import type { ReviewResult, ReviewRule } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ReviewCodeInput } from "./schema.js";

const log = createLogger("review");

const REVIEW_SYSTEM_PROMPT =
  'You are a strict code reviewer. Given code and language, return a JSON object: { "findings": [{ "ruleId": string, "severity": "error"|"warning"|"info", "line": number, "message": string, "suggestion": string }], "summary": string, "score": number (0..100) }. Respond with JSON only — no markdown fences.';

function safeJson<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

const RULES_KEY = "review:rules";
const HISTORY_KEY = "review:history";
const resultKey = (id: string): string => `review:result:${id}`;

function invalidateHistory(id?: string): void {
  cache.delete(HISTORY_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 8 review rules ────────────────────────────────────────────────
const SEED_RULES: ReviewRule[] = [
  {
    id: "rule-perf-no-n-plus-1",
    name: "Avoid N+1 query patterns",
    category: "performance",
    severity: "warning",
    description: "Loops that issue a query per iteration cause quadratic latency. Batch or join instead.",
    language: "typescript",
  },
  {
    id: "rule-perf-avoid-innerhtml",
    name: "Avoid innerHTML for large updates",
    category: "performance",
    severity: "warning",
    description: "innerHTML reflows the entire subtree. Prefer textContent or document fragments.",
    language: "typescript",
  },
  {
    id: "rule-a11y-img-alt",
    name: "Images require alt text",
    category: "accessibility",
    severity: "error",
    description: "Every <img> must have a meaningful `alt` attribute (or alt='' for decorative images).",
    language: "tsx",
  },
  {
    id: "rule-a11y-button-role",
    name: "Interactive elements use semantic buttons",
    category: "accessibility",
    severity: "error",
    description: "Use <button> for clickable actions; a <div onclick> is not keyboard accessible.",
    language: "tsx",
  },
  {
    id: "rule-sec-no-eval",
    name: "Never use eval()",
    category: "security",
    severity: "error",
    description: "eval() executes arbitrary code and is a common XSS vector. Remove it.",
    language: "javascript",
  },
  {
    id: "rule-sec-no-dangerouslyset",
    name: "Avoid dangerouslySetInnerHTML",
    category: "security",
    severity: "warning",
    description: "dangerouslySetInnerHTML bypasses React's escaping. Sanitize input first.",
    language: "tsx",
  },
  {
    id: "rule-bp-named-export",
    name: "Prefer named exports",
    category: "best-practice",
    severity: "info",
    description: "Named exports enable better refactoring and tree-shaking than default exports.",
    language: "typescript",
  },
  {
    id: "rule-main-no-magic-numbers",
    name: "Avoid magic numbers",
    category: "maintainability",
    severity: "info",
    description: "Extract literal numbers into named constants for readability.",
    language: "typescript",
  },
];

const rules: ReviewRule[] = SEED_RULES.map((r) => ({ ...r }));

// ─── Seed: 3 mock review results ─────────────────────────────────────────
const SEED_RESULTS: ReviewResult[] = [
  {
    id: "rev-seed-1",
    filename: "src/components/UserCard.tsx",
    language: "tsx",
    status: "complete",
    score: 78,
    findings: [
      {
        ruleId: "rule-a11y-img-alt",
        severity: "error",
        line: 14,
        message: "<img> is missing the `alt` attribute.",
        suggestion: "Add alt=\"User avatar\".",
      },
      {
        ruleId: "rule-bp-named-export",
        severity: "info",
        line: 3,
        message: "Default export detected; prefer a named export.",
        suggestion: "export function UserCard(...) {}",
      },
    ],
    summary: "2 findings (1 error, 1 info). Address the missing alt attribute before shipping.",
    createdAt: "2025-02-10T00:00:00.000Z",
  },
  {
    id: "rev-seed-2",
    filename: "src/lib/db.ts",
    language: "typescript",
    status: "complete",
    score: 64,
    findings: [
      {
        ruleId: "rule-perf-no-n-plus-1",
        severity: "warning",
        line: 42,
        message: "Likely N+1 query inside forEach loop.",
        suggestion: "Preload all users with a single `where id in (...)` query.",
      },
      {
        ruleId: "rule-main-no-magic-numbers",
        severity: "info",
        line: 8,
        message: "Magic number 86400 used; meaning unclear.",
        suggestion: "Extract as `const SECONDS_PER_DAY = 86400;`.",
      },
    ],
    summary: "2 findings (1 warning, 1 info). Refactor the N+1 loop before scaling.",
    createdAt: "2025-02-13T00:00:00.000Z",
  },
  {
    id: "rev-seed-3",
    filename: "src/utils/sanitize.ts",
    language: "typescript",
    status: "complete",
    score: 92,
    findings: [
      {
        ruleId: "rule-bp-named-export",
        severity: "info",
        line: 1,
        message: "Default export detected; prefer a named export.",
        suggestion: "export function sanitize(...) {}",
      },
    ],
    summary: "1 info finding. Code is otherwise clean.",
    createdAt: "2025-02-16T00:00:00.000Z",
  },
];

let history: ReviewResult[] = SEED_RESULTS.map((r) => ({ ...r }));

/** List all review rules. Cached. */
export async function listRules(): Promise<ReviewRule[]> {
  return cacheWrap(
    RULES_KEY,
    () => Promise.resolve(rules.map((r) => ({ ...r }))),
    CACHE_TTL.reviewRules,
  );
}

/** List all historical review results. Cached. */
export async function listHistory(): Promise<ReviewResult[]> {
  return cacheWrap(
    HISTORY_KEY,
    () => Promise.resolve(history.map((r) => ({ ...r }))),
    CACHE_TTL.reviewHistory,
  );
}

/** Get a single review result by id. Cached. Throws 404 if missing. */
export async function getResultById(id: string): Promise<ReviewResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = history.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Review result '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.reviewResult,
  );
}

/** Deterministic hash → 32-bit int (for mock findings variance). */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Submit code for review. Uses LLM when configured. Invalidates history cache. */
export async function reviewCode(
  input: ReviewCodeInput,
): Promise<ReviewResult> {
  let result: ReviewResult;
  if (isLLMConfigured) {
    try {
      const focus = input.focus
        ? ` Focus areas: ${input.focus.join(", ")}.`
        : "";
      const raw = await llmChat(
        [
          { role: "system", content: REVIEW_SYSTEM_PROMPT },
          {
            role: "user",
            content: `File: ${input.filename}\nLanguage: ${input.language}${focus}\n\n\`\`\`${input.language}\n${input.code.slice(0, 8000)}\n\`\`\``,
          },
        ],
        { temperature: 0.1, maxTokens: 2000 },
      );
      const parsed = safeJson<{
        findings?: {
          ruleId?: string;
          severity?: string;
          line?: number;
          message?: string;
          suggestion?: string;
        }[];
        summary?: string;
        score?: number;
      }>(raw);
      if (parsed) {
        const findings = (parsed.findings ?? []).map((f, i) => ({
          ruleId: f.ruleId ?? `rule-llm-${i + 1}`,
          severity:
            f.severity === "error" ||
            f.severity === "warning" ||
            f.severity === "info"
              ? (f.severity as "error" | "warning" | "info")
              : ("info" as const),
          line: typeof f.line === "number" ? f.line : 1,
          message: f.message ?? "Issue found by LLM reviewer.",
          suggestion: f.suggestion ?? "Apply the recommended fix.",
        }));
        const errorCount = findings.filter((f) => f.severity === "error").length;
        const warnCount = findings.filter((f) => f.severity === "warning").length;
        const score =
          typeof parsed.score === "number"
            ? Math.max(0, Math.min(100, Math.round(parsed.score)))
            : Math.max(
                0,
                100 - errorCount * 18 - warnCount * 8,
              );
        result = {
          id: `rev-${randomUUID()}`,
          filename: input.filename,
          language: input.language,
          status: "complete",
          score,
          findings,
          summary:
            parsed.summary ??
            `${findings.length} finding(s) (${errorCount} error, ${warnCount} warning).`,
          createdAt: new Date().toISOString(),
        };
        log.info("Review completed via LLM", {
          id: result.id,
          filename: input.filename,
          score: result.score,
          llm: true,
        });
      } else {
        result = mockReview(input);
        log.warn("LLM returned non-JSON, using mock review", { llm: true });
      }
    } catch (err) {
      log.warn("LLM call failed, using mock review", {
        err: (err as Error).message,
      });
      result = mockReview(input);
    }
  } else {
    result = mockReview(input);
    log.info("Review completed (mock fallback)", {
      id: result.id,
      filename: input.filename,
      score: result.score,
      llm: false,
    });
  }
  history = [result, ...history].slice(0, 100);
  invalidateHistory(result.id);
  return result;
}

/** Regex/heuristic-based deterministic review (fallback). */
function mockReview(input: ReviewCodeInput): ReviewResult {
  const h = hashString(input.filename + input.code);
  const applicable = rules.filter(
    (r) =>
      r.language === input.language ||
      r.language === "typescript" ||
      r.language === "javascript",
  );
  // Deterministic subset: pick every other rule based on hash parity.
  const picked = applicable.filter((_, i) => (h + i) % 2 === 0).slice(0, 4);
  const findings = picked.map((rule, i) => ({
    ruleId: rule.id,
    severity: rule.severity,
    line: 5 + ((h + i * 7) % 80),
    message: rule.description,
    suggestion:
      rule.category === "accessibility"
        ? "Add the missing accessibility attribute."
        : rule.category === "performance"
          ? "Refactor to avoid the performance pitfall."
          : "Apply the recommended change.",
  }));
  const errorCount = findings.filter((f) => f.severity === "error").length;
  const warnCount = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 18 - warnCount * 8);
  return {
    id: `rev-${randomUUID()}`,
    filename: input.filename,
    language: input.language,
    status: "complete",
    score: Math.round(score),
    findings,
    summary: `${findings.length} finding(s) (${errorCount} error, ${warnCount} warning).`,
    createdAt: new Date().toISOString(),
  };
}

/** Number of rules in the catalog. */
export function rulesCount(): number {
  return rules.length;
}

/** Test-only: reset history to seed. */
export function _resetReviewForTest(): void {
  history = SEED_RESULTS.map((r) => ({ ...r }));
  invalidateHistory();
}
