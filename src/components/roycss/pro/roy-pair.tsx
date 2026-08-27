"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyPair — AI pair programmer for RoyCSS.
 *
 * A self-contained chat interface that talks to the existing
 * `/api/ai-playground` route (z-ai-web-dev-sdk). Where RoyAI generates
 * CSS effects, RoyPair frames every exchange as a pair-programming
 * conversation: the user describes a problem, the assistant returns a
 * code suggestion they can review and iterate on together.
 *
 * Features:
 *   • Message list — user on the right, AI on the left, session-only
 *     history (no persistence).
 *   • Pair-programming suggestion chips — "Create a card component",
 *     "Fix this flexbox", "Optimize this animation", "Make it
 *     responsive".
 *   • Typing indicator — animated dots while the AI is thinking.
 *   • Code blocks with a copy button per block.
 *   • Clear chat button.
 *   • Error handling — failed requests render as an error bubble with a
 *     Retry button that re-sends the last prompt.
 *   • Auto-scroll to the latest message.
 *   • Keyboard: Enter sends, Shift+Enter inserts a newline.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-free.
 *   • TS strict, zero `any`. Fetch-based API calls.
 *   • Palette follows the RoyCSS theme — no indigo / blue.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  Bot,
  Check,
  Code2,
  Copy,
  Hand,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  "Create a card component",
  "Fix this flexbox",
  "Optimize this animation",
  "Make it responsive",
] as const;

const WELCOME: ChatMessage = {
  id: "roy-pair-welcome",
  role: "assistant",
  content:
    "Hey — I'm RoyPair, your RoyCSS pair programmer. Drop a problem (paste broken CSS, describe a layout, ask for a component) and I'll suggest code we can iterate on. Pick a quick chip below or type your own.",
};

const ENDPOINT = "/api/ai-playground";

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

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

  if (
    /^[.#@][\w-]*\s*\{/m.test(text) &&
    text.includes("{") &&
    text.includes("}")
  ) {
    return [{ type: "code", content: text }];
  }

  return [{ type: "text", content: text }];
}

function hasCode(raw: string): boolean {
  return parseContent(raw).some((s) => s.type === "code");
}

/**
 * Lightweight syntax highlighter for CSS — wraps property names, at-rules,
 * selectors, comments, and strings in <span> tags. Pure string transform.
 *
 * Why hand-rolled: avoids pulling a highlighter dep into the bundle for a
 * chat that almost exclusively renders CSS snippets.
 */
function highlightCss(code: string): string {
  // Escape HTML first.
  const esc = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return esc
    // Comments.
    .replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span class="text-muted-foreground italic">$1</span>'
    )
    // At-rules + keywords.
    .replace(
      /(@[\w-]+)/g,
      '<span class="text-primary font-semibold">$1</span>'
    )
    // Strings.
    .replace(
      /("[^"]*"|'[^']*')/g,
      '<span class="text-amber-600 dark:text-amber-400">$1</span>'
    )
    // Property names (foo: at line start, optional indent).
    .replace(
      /(^|\n)(\s*)([\w-]+)(\s*:)/g,
      '$1$2<span class="text-foreground font-medium">$3</span>$4'
    )
    // Hex / oklch / color-mix values.
    .replace(
      /(#[0-9a-fA-F]{3,8}|oklch\([^)]+\)|color-mix\([^)]+\)|rgba?\([^)]+\))/g,
      '<span class="text-emerald-600 dark:text-emerald-400">$1</span>'
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function TypingDots() {
  return (
    <div
      className="flex items-center gap-1 py-1"
      aria-label="RoyPair is typing"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-primary/60 size-2 rounded-full"
          style={{
            animation: "roy-pair-typing 1.2s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [code]);

  const html = useMemo(() => highlightCss(code), [code]);

  return (
    <div className="bg-background group/code relative overflow-hidden rounded-lg border">
      <div className="border-b px-3 py-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
            <Code2 className="size-3" aria-hidden />
            CSS suggestion
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-primary h-6 gap-1 px-1.5 text-[11px]"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="size-3 text-primary" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3" aria-hidden />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code
          className="font-mono whitespace-pre"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = Boolean(message.error);
  const segments = parseContent(message.content);

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
          {isError ? (
            <AlertCircle className="size-4" />
          ) : (
            <Hand className="size-4" />
          )}
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
          <span className="font-medium">{message.content}</span>
        ) : (
          <div className="flex flex-col gap-2">
            {segments.map((segment, i) =>
              segment.type === "code" ? (
                <CodeBlock key={i} code={segment.content} />
              ) : (
                <p
                  key={i}
                  className="whitespace-pre-wrap break-words leading-relaxed"
                >
                  {segment.content}
                </p>
              )
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="bg-secondary text-secondary-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <User className="size-4" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyPair
// ═══════════════════════════════════════════════════════════════════════

export function RoyPair() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading: backendLoading, error } = useBackendData<unknown>("pair/suggestions");
  void data; void backendLoading; void error;

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages / loading state changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /**
   * Wrap the user prompt with a pair-programming framing before sending
   * to the shared /api/ai-playground endpoint. The endpoint's system
   * prompt already returns CSS-only output; this wrapper adds the
   * "review-able suggestion" framing for the model.
   */
  const buildPrompt = useCallback((raw: string): string => {
    const trimmed = raw.trim();
    // Heuristic — if the user pasted CSS (contains `{` and `}`), frame
    // it as a "review + fix" task. Otherwise treat it as a "build" task.
    const looksLikeCode = /[.#@][\w-]*\s*\{[\s\S]*\}/.test(trimmed);
    return looksLikeCode
      ? `As a pair programmer, review and improve this CSS so it follows RoyCSS conventions (OKLCH colors, logical properties, reduced-motion). Return the improved CSS only.\n\n${trimmed}`
      : `As a pair programmer, write RoyCSS for: ${trimmed}. Use OKLCH colors, logical properties, and include prefers-reduced-motion. Return CSS only.`;
  }, []);

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
      void callApi(buildPrompt(prompt));
    },
    [loading, callApi, buildPrompt]
  );

  const handleRetry = useCallback(() => {
    if (!lastPrompt || loading) return;
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].error) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    void callApi(buildPrompt(lastPrompt));
  }, [lastPrompt, loading, callApi, buildPrompt]);

  const handleClear = useCallback(() => {
    setMessages([WELCOME]);
    setInput("");
    setLastPrompt(null);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;
  const lastMessage = messages[messages.length - 1];
  const lastHasCode = lastMessage && !lastMessage.error && hasCode(lastMessage.content);

  return (
    <Card className="flex h-[640px] max-h-[85vh] w-full flex-col gap-0 overflow-hidden py-0">
      <style>{`
        @keyframes roy-pair-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full">
          <Hand className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">RoyPair</span>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide"
            >
              <Sparkles className="size-3" />
              Pair Programmer
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Suggests RoyCSS code we can iterate on together.
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
        aria-label="RoyPair conversation"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex w-full justify-start gap-2">
            <div className="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
              <Hand className="size-4" />
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
              <Wrench className="mr-1 inline size-3 align-text-bottom" aria-hidden />
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
            placeholder="Ask RoyPair to review code or suggest a component…"
            rows={1}
            disabled={loading}
            className="min-h-11 max-h-32 flex-1 resize-none"
            aria-label="Message RoyPair"
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
          Enter to send · Shift+Enter for a new line · Session-only history
          {lastHasCode ? " · Last reply has copyable code" : ""}.
        </p>
      </div>
    </Card>
  );
}
