/**
 * Unified LLM client — supports OpenAI + Anthropic via fetch (no SDKs).
 *
 * Resolution order:
 *   1. ANTHROPIC_API_KEY → calls https://api.anthropic.com/v1/messages
 *   2. OPENAI_API_KEY    → calls https://api.openai.com/v1/chat/completions
 *   3. neither set       → returns deterministic mock responses so the
 *      rest of the backend stays fully functional in dev without keys.
 *
 * All chat() responses are LRU-cached by (provider, model, messages-hash)
 * so the same prompt returns the same answer within the cache window —
 * this keeps downstream caches (architect/designer/…) coherent.
 *
 * chatStream() yields string chunks; for the mock provider it splits a
 * deterministic string into N chunks.
 */
import { env } from "../config/env.js";
import { LRUCache } from "./cache.js";
import { createLogger } from "./logger.js";

const log = createLogger("llm-client");

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  /** Override the model id; otherwise provider-default. */
  model?: string;
  /** 0..1 sampling temperature. Default 0.2 (deterministic-ish). */
  temperature?: number;
  /** Max tokens to generate. Default 1024. */
  maxTokens?: number;
  /** Cache TTL ms; 0 = use default 5min. */
  cacheTtlMs?: number;
  /** Bypass the LRU cache for this call. */
  noCache?: boolean;
}

export type LLMProvider = "openai" | "anthropic" | "mock";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const ANTHROPIC_DEFAULT_MODEL = "claude-3-5-haiku-latest";

const DEFAULT_CACHE_TTL = 5 * 60_000; // 5 min
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.2;

// Module-scoped LRU so prompt→answer is memoized across calls.
const responseCache = new LRUCache<string>({ maxEntries: 256 });

function provider(): LLMProvider {
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  if (env.OPENAI_API_KEY) return "openai";
  return "mock";
}

/** True iff at least one LLM provider key is configured. */
export const isLLMConfigured: boolean = provider() !== "mock";

/** Currently-active provider (resolved once at module load). */
export const llmProvider: LLMProvider = provider();

/** Stable hash for the (provider, model, messages, options) tuple. */
function hashKey(
  msgs: LLMMessage[],
  opts: LLMOptions,
  prov: LLMProvider,
): string {
  const payload = JSON.stringify({
    p: prov,
    m: opts.model,
    t: opts.temperature,
    x: opts.maxTokens,
    msgs,
  });
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${prov}:${(h >>> 0).toString(36)}`;
}

// ─── Mock provider ──────────────────────────────────────────────────────

/** Deterministic mock completion — derives a string from the prompt hash. */
function mockComplete(messages: LLMMessage[]): string {
  const sys = messages.find((m) => m.role === "system")?.content ?? "";
  const user = messages.find((m) => m.role === "user")?.content ?? "";
  const asksJson = /json|tokens|findings|techstack/i.test(sys);
  if (asksJson) {
    // Emit a small valid JSON the caller can merge into their schema.
    return JSON.stringify({
      note: "mock-llm",
      echo: user.slice(0, 200),
      generatedAt: new Date().toISOString(),
    });
  }
  return `[mock-llm] ${sys.slice(0, 80) || "assistant"}: ${user.slice(0, 200)}`;
}

// ─── OpenAI provider ────────────────────────────────────────────────────

interface OpenAIChoice {
  message?: { content?: string };
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?: { message?: string };
}

async function openaiChat(
  messages: LLMMessage[],
  opts: LLMOptions,
): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? OPENAI_DEFAULT_MODEL,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({})) as OpenAIResponse).error;
    throw new Error(`OpenAI ${res.status}: ${err?.message ?? res.statusText}`);
  }
  const data = (await res.json()) as OpenAIResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Anthropic provider ─────────────────────────────────────────────────

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  error?: { message?: string };
}

async function anthropicChat(
  messages: LLMMessage[],
  opts: LLMOptions,
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model ?? ANTHROPIC_DEFAULT_MODEL,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: system || undefined,
      messages: turns,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({})) as AnthropicResponse).error;
    throw new Error(
      `Anthropic ${res.status}: ${err?.message ?? res.statusText}`,
    );
  }
  const data = (await res.json()) as AnthropicResponse;
  return data.content?.map((c) => c.text ?? "").join("") ?? "";
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Run a chat completion. Returns the assistant's text. LRU-cached unless
 * `options.noCache` is true. Throws on network/HTTP errors from the
 * configured provider — mock provider never throws.
 */
export async function chat(
  messages: LLMMessage[],
  options: LLMOptions = {},
): Promise<string> {
  const prov = provider();
  const key = hashKey(messages, options, prov);
  if (!options.noCache) {
    const hit = responseCache.get(key);
    if (hit !== undefined) return hit;
  }
  let out: string;
  if (prov === "anthropic") {
    out = await anthropicChat(messages, options);
  } else if (prov === "openai") {
    out = await openaiChat(messages, options);
  } else {
    out = mockComplete(messages);
  }
  if (!options.noCache) {
    responseCache.set(key, out, options.cacheTtlMs ?? DEFAULT_CACHE_TTL);
  }
  return out;
}

/**
 * Stream a chat completion as an async iterable of string chunks.
 *
 * For the mock provider, the deterministic completion is split into 3
 * chunks so the streaming code path is exercised end-to-end without a
 * real key.
 */
export async function* chatStream(
  messages: LLMMessage[],
  options: LLMOptions = {},
): AsyncGenerator<string> {
  const prov = provider();
  if (prov === "openai") {
    // Stream OpenAI via SSE.
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model ?? OPENAI_DEFAULT_MODEL,
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`OpenAI stream ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed keep-alive lines.
        }
      }
    }
    return;
  }
  // Fallback (mock + Anthropic) — emit the full chat() in 3 chunks.
  const full = await chat(messages, { ...options, noCache: true });
  if (prov === "anthropic" && full.length > 60) {
    const third = Math.floor(full.length / 3);
    yield full.slice(0, third);
    yield full.slice(third, third * 2);
    yield full.slice(third * 2);
  } else {
    // Mock: split into 3 chunks too.
    const third = Math.ceil(full.length / 3) || 1;
    for (let i = 0; i < full.length; i += third) {
      yield full.slice(i, i + third);
    }
  }
}

// Re-export the option type alias for callers that import it.
export type LLMOpts = LLMOptions;

log.debug("LLM client loaded", { provider: llmProvider, configured: isLLMConfigured });

