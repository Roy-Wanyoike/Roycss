"use client";

/**
 * copy-button.tsx — the shared copy-to-clipboard pill button.
 *
 * Extracted from framework-usage.tsx (issue #190) so the home dialog and
 * any server-rendered surface reuse one implementation instead of each
 * carrying its own inline copy handler. On success the button flips to a
 * "Copied" state for 2s; failures are silent (clipboard unavailable).
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  /** Raw text placed on the clipboard. */
  text: string;
  /** Shown in the aria-label ("Copy <label>"). Defaults to "Copy". */
  label?: string;
  /** Optional className merged onto the button. */
  className?: string;
}

export function CopyButton({ text, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
        copied
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
      } ${className ?? ""}`}
    >
      {copied ? (
        <>
          <Check className="size-2.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-2.5" />
          Copy
        </>
      )}
    </button>
  );
}
