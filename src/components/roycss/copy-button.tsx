"use client";

/**
 * copy-button.tsx — the shared copy-to-clipboard pill button.
 *
 * Extracted from framework-usage.tsx (issue #190) so the home dialog and
 * any server-rendered surface reuse one implementation instead of each
 * carrying its own inline copy handler. On success the button flips to a
 * "Copied" state for 2s.
 *
 * Clipboard-failure UX (P3 QA residual): copies route through the shared
 * clipboard helper (async API → execCommand fallback). If BOTH paths fail,
 * the button flips to an accessible "Copy failed — press Ctrl+C / ⌘C"
 * state (visible + role=status/aria-live=polite) for 4s and — when the
 * caller passes payloadRef — the rendered payload is selected via
 * window.getSelection so the user can copy it manually.
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  copyTextToClipboard,
  selectElementText,
  CLIPBOARD_FAILED_MESSAGE,
  CLIPBOARD_FAILED_RESET_MS,
} from "@/lib/clipboard";

interface CopyButtonProps {
  /** Raw text placed on the clipboard. */
  text: string;
  /** Shown in the aria-label ("Copy <label>"). Defaults to "Copy". */
  label?: string;
  /** Optional className merged onto the button. */
  className?: string;
  /**
   * Element rendering the payload (e.g. the adjacent <code> block). When
   * both copy paths fail it is selected via window.getSelection + Range so
   * the user can hit Ctrl+C / ⌘C themselves.
   */
  payloadRef?: React.RefObject<HTMLElement | null>;
}

export function CopyButton({
  text,
  label = "Copy",
  className,
  payloadRef,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(text);
    setCopied(ok);
    setCopyFailed(!ok);
    if (!ok) selectElementText(payloadRef?.current ?? null);
    setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, ok ? 2000 : CLIPBOARD_FAILED_RESET_MS);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
        copyFailed
          ? "bg-rose-500/15 text-rose-500"
          : copied
            ? "bg-emerald-500/15 text-emerald-500"
            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
      } ${className ?? ""}`}
    >
      {copied ? (
        <>
          <Check className="size-2.5" />
          Copied
        </>
      ) : copyFailed ? (
        <>
          <Copy className="size-2.5" />
          {CLIPBOARD_FAILED_MESSAGE}
        </>
      ) : (
        <>
          <Copy className="size-2.5" />
          Copy
        </>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copyFailed ? CLIPBOARD_FAILED_MESSAGE : ""}
      </span>
    </button>
  );
}
