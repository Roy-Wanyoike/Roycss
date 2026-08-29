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

import { useState, useCallback } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context). Fall
      // back to a hidden textarea + execCommand for legacy paths.
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // give up silently
      }
    }
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
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
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
            copied
              ? "text-primary bg-primary/10"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      {/* Body: the actual code */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed scrollbar-thin">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
