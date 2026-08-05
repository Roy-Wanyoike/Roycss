"use client";

/**
 * RoyAI — the official AI assistant for RoyCSS.
 *
 * A self-contained chat interface that talks to the existing
 * `/api/ai-playground` route (z-ai-web-dev-sdk). The AI is a CSS
 * expert: it generates effects, answers CSS questions, and helps
 * with RoyCSS usage.
 *
 * Features:
 *   • Message list — user on the right, AI on the left, session-only
 *     history (no persistence).
 *   • Quick suggestion chips — one click sends the prompt.
 *   • Typing indicator — animated dots while the AI is thinking.
 *   • Copy button on AI messages — copies the CSS code block.
 *   • Clear chat button.
 *   • Error handling — failed requests render as an error bubble with
 *     a Retry button that re-sends the last prompt.
 *   • Auto-scroll to the latest message.
 *   • Smart content rendering — CSS code is rendered in a
 *     `<pre><code>` block, surrounding prose as paragraphs.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-free.
 *   • TS strict, zero `any`. Fetch-based API calls.
 *   • Palette follows the RoyCSS emerald theme — no indigo / blue.
 *   • Keyboard: Enter sends, Shift+Enter inserts a newline.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  error?: boolean;
}

interface Segment {
  type: "text" | "code";
  content: string;
}

interface PlaygroundResponse {
  css?: string;
  prompt?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const SUGGESTIONS = [
  "Create a neon button",
  "Make a glass card",
  "Fix my CSS",
  "Generate a loader animation",
] as const;

const WELCOME: ChatMessage = {
  id: "roy-ai-welcome",
  role: "assistant",
  content:
    "Hi, I'm RoyAI — your CSS assistant. I can generate effects, explain properties, and help with RoyCSS usage. Try a suggestion below, or ask me anything.",
};

const ENDPOINT = "/api/ai-playground";

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Generate a reasonably unique id for message keys. */
function uid(): string {
  return `m-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

/**
 * Parse an AI response into ordered text / code segments.
 *
 * Strategy:
 *   1. If the content contains fenced code blocks (```lang ... ```),
 *      split on the fences — fenced regions become code segments,
 *      everything in between becomes text segments.
 *   2. Otherwise, if the content looks like raw CSS (a selector or
 *      at-rule immediately followed by `{`), treat the whole thing
 *      as one code segment.
 *   3. Fall back to a single text segment.
 */
function parseContent(raw: string): Segment[] {
  const text = raw.trim();
  if (!text) return [];

  const segments: Segment[] = [];

  // 1. Split by fenced code blocks.
  const fence = /```[\w-]*\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(text)) !== null) {
    if (match.index > last) {
      const between = text.slice(last, match.index).trim();
      if (between) segments.push({ type: "text", content: between });
    }
    segments.push({ type: "code", content: match[1].trim() });
    last = fence.lastIndex;
  }
  if (segments.length > 0) {
    if (last < text.length) {
      const tail = text.slice(last).trim();
      if (tail) segments.push({ type: "text", content: tail });
    }
    return segments;
  }

  // 2. Raw CSS detection (no fences).
  if (
    /^[.#@][\w-]*\s*\{/m.test(text) &&
    text.includes("{") &&
    text.includes("}")
  ) {
    return [{ type: "code", content: text }];
  }

  // 3. Plain text.
  return [{ type: "text", content: text }];
}

/** Extract the first CSS code block from a message (for the Copy button). */
function extractCss(raw: string): string {
  const code = parseContent(raw).find((s) => s.type === "code");
  return code?.content ?? raw;
}

/** Whether a message contains any CSS code block. */
function hasCode(raw: string): boolean {
  return parseContent(raw).some((s) => s.type === "code");
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="RoyAI is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-primary/60 size-2 rounded-full"
          style={{
            animation: "roy-ai-typing 1.2s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-background/80 dark:bg-background/40 overflow-x-auto rounded-lg border p-3 text-xs leading-relaxed">
      <code className="font-mono whitespace-pre">{code}</code>
    </pre>
  );
}

function MessageBubble({
  message,
  copied,
  onCopy,
}: {
  message: ChatMessage;
  copied: boolean;
  onCopy: (message: ChatMessage) => void;
}) {
  const isUser = message.role === "user";
  const isError = Boolean(message.error);
  const segments = parseContent(message.content);
  const showCopy = !isUser && !isError && hasCode(message.content);

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
            isError
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary"
          )}
          aria-hidden
        >
          {isError ? <AlertCircle className="size-4" /> : <Bot className="size-4" />}
        </div>
      )}

      <div
        className={cn(
          "group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : isError
              ? "bg-destructive/10 text-destructive rounded-bl-sm"
              : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {isError ? (
          <div className="flex flex-col gap-2">
            <span className="font-medium">{message.content}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {segments.map((segment, i) =>
              segment.type === "code" ? (
                <CodeBlock key={i} code={segment.content} />
              ) : (
                <p
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    isUser ? "leading-relaxed" : "leading-relaxed"
                  )}
                >
                  {segment.content}
                </p>
              )
            )}
          </div>
        )}

        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message)}
            className="absolute -right-2 -top-2 size-7 gap-1 rounded-full border bg-card text-muted-foreground opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={copied ? "Copied" : "Copy CSS code"}
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        )}
      </div>

      {isUser && (
        <div
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-hidden
        >
          <User className="size-4" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyAI
// ═══════════════════════════════════════════════════════════════════════

export function RoyAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the newest message whenever the list or loading state
  // changes. Kept dependency-light to avoid jitter.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Reset the "copied" checkmark after a short delay.
  useEffect(() => {
    if (!copiedId) return;
    const t = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(t);
  }, [copiedId]);

  /** Call the AI playground endpoint and append the result (or error). */
  const callApi = useCallback(async (prompt: string) => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: PlaygroundResponse = await res.json();
      if (!res.ok || !data.css) {
        throw new Error(
          data.error ?? "AI request failed. Please try again."
        );
      }
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: data.css as string },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: message, error: true },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, []);

  /** Send a user prompt (from input or a suggestion chip). */
  const send = useCallback(
    (promptText: string) => {
      const prompt = promptText.trim();
      if (!prompt || loading) return;
      setLastPrompt(prompt);
      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: prompt },
      ]);
      void callApi(prompt);
    },
    [loading, callApi]
  );

  /** Re-send the last user prompt after a failure. */
  const handleRetry = useCallback(() => {
    if (!lastPrompt || loading) return;
    // Drop the trailing error bubble so the retry replaces it.
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].error) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    void callApi(lastPrompt);
  }, [lastPrompt, loading, callApi]);

  const handleClear = useCallback(() => {
    setMessages([WELCOME]);
    setInput("");
    setLastPrompt(null);
    setCopiedId(null);
    textareaRef.current?.focus();
  }, []);

  const handleCopy = useCallback(async (message: ChatMessage) => {
    const css = extractCss(message.content);
    try {
      await navigator.clipboard.writeText(css);
      setCopiedId(message.id);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context).
      // Fall back to a detached textarea.
      const ta = document.createElement("textarea");
      ta.value = css;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedId(message.id);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;
  const lastMessage = messages[messages.length - 1];

  return (
    <Card className="flex h-[640px] max-h-[85vh] w-full flex-col gap-0 overflow-hidden py-0">
      {/* Custom keyframes for the typing indicator. Scoped by name. */}
      <style>{`
        @keyframes roy-ai-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full">
          <Bot className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">RoyAI</span>
            <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              <Sparkles className="size-3" />
              CSS Assistant
            </span>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Generates effects, answers questions, helps with RoyCSS.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={messages.length <= 1}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Clear chat"
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>

      {/* ── Messages ───────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="RoyAI conversation"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            copied={copiedId === message.id}
            onCopy={handleCopy}
          />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex w-full justify-start gap-2">
            <div className="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
              <Bot className="size-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-xs">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Retry control (only when the last message is an error) */}
        {!loading && lastMessage?.error && (
          <div className="flex justify-start pl-9">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* ── Suggestion chips ───────────────────────────────────────── */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              disabled={loading}
              className="hover:border-primary hover:text-primary focus-visible:ring-ring rounded-full border bg-transparent px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────────────── */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask RoyAI for a CSS effect…"
            rows={1}
            disabled={loading}
            className="min-h-11 max-h-32 flex-1 resize-none"
            aria-label="Message RoyAI"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="size-11 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-1.5 px-1 text-[11px]">
          Enter to send · Shift+Enter for a new line · Session-only history.
        </p>
      </div>
    </Card>
  );
}
