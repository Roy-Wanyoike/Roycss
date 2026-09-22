"use client";

/**
 * copy-format-button.tsx — one "Copy" button for a single copy-as format.
 *
 * Used by the server-rendered Copy-as <details> list on /effects/[id]
 * (issue #190): the list markup is server-rendered and crawlable; only
 * these compact buttons are client islands. Formatting goes through the
 * shared useCopyFormat hook — the exact same formatCss output as the
 * dialog's CopyAsDropdown (single source: src/lib/copy-formats.ts).
 */

import { Check, Copy } from "lucide-react";
import type { CopyFormat } from "@/lib/copy-formats";
import { useCopyFormat } from "./use-copy-format";

interface CopyFormatButtonProps {
  css: string;
  effectId: string;
  format: CopyFormat;
  /** Human label used in the aria-description ("Copy as CSS Class"). */
  label: string;
}

export function CopyFormatButton({
  css,
  effectId,
  format,
  label,
}: CopyFormatButtonProps) {
  const { copy, copiedFormat } = useCopyFormat(css, effectId);
  const copied = copiedFormat === format;

  return (
    <button
      type="button"
      onClick={() => void copy(format)}
      aria-label={`Copy as ${label}`}
      className={`flex shrink-0 items-center gap-1 px-2 py-1 min-h-7 rounded-md text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        copied
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
      }`}
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
