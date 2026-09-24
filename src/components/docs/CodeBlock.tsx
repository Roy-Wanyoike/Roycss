"use client";

/**
 * CodeBlock — Lightweight syntax-highlighted code block with copy button.
 *
 * Props:
 *   • code       — the raw code text
 *   • language   — language label (e.g. "bash", "tsx", "css"). Optional.
 *   • filename   — optional filename chip rendered in the header
 *
 * No external syntax-highlighting library is used — this renders a plain
 * <pre><code> with Tailwind styling for portability and bundle size.
 * A single "Copy" button lives in the header; on click it writes the
 * raw code to the clipboard and shows a "Copied!" confirmation for 2s.
 */

import { useState, useCallback, useRef } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  copyTextToClipboard,
  selectElementText,
  CLIPBOARD_FAILED_MESSAGE,
  CLIPBOARD_FAILED_RESET_MS,
} from "@/lib/clipboard";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // `<code>` maps to plain HTMLElement in the DOM (no HTMLCodeElement).
  const codeRef = useRef<HTMLElement>(null);

  // Clipboard-failure UX (P3 QA residual): the shared helper tries the
  // async Clipboard API, then the legacy textarea + execCommand fallback.
  // If BOTH fail, select the rendered payload so the user can hit
  // Ctrl+C / ⌘C themselves, flip to an accessible "Copy failed" state
  // (role=status, aria-live=polite) and auto-reset after 4s. The success
  // path ("Copied!" + 2s reset) is unchanged.
  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(code);
    setCopied(ok);
    setCopyFailed(!ok);
    if (!ok) selectElementText(codeRef.current);
    setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, ok ? 2000 : CLIPBOARD_FAILED_RESET_MS);
  }, [code]);

  const label = filename ?? language ?? "code";

  return (
    <div
      className={cn(
        "group relative my-4 rounded-lg border border-border/60 overflow-hidden bg-zinc-950 text-zinc-50",
        className,
      )}
    >
      {/* Header: filename / language label + copy button */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="size-3.5 shrink-0 text-zinc-400" />
          <span className="text-xs font-mono text-zinc-300 truncate">
            {label}
          </span>
          {language && filename && (
            // Issue #213: zinc-500 measured 3.78:1 on the zinc-900/80 header
            // (WCAG AA needs 4.5:1 for 11px text) — zinc-400 gives 6.93:1.
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 shrink-0">
              {language}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer shrink-0",
            copyFailed
              ? "text-rose-500 bg-rose-500/10"
              : copied
                ? "text-primary bg-primary/10"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied!
            </>
          ) : copyFailed ? (
            <>
              <Copy className="size-3.5" />
              {CLIPBOARD_FAILED_MESSAGE}
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
          <span role="status" aria-live="polite" className="sr-only">
            {copyFailed ? CLIPBOARD_FAILED_MESSAGE : ""}
          </span>
        </button>
      </div>
      {/* Body: the actual code */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed scrollbar-thin">
        <code ref={codeRef} className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
