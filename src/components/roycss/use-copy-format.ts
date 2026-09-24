"use client";

/**
 * use-copy-format.ts — shared "copy as <format>" logic.
 *
 * Extracted from CopyAsDropdown (issue #190) so the dropdown on the home
 * dialog and the Copy-as rows on /effects/[id] share ONE implementation of:
 * formatCss → clipboard → toast → 2s "Copied!" state. Do not duplicate this
 * in new surfaces; import the hook (or CopyFormatButton) instead.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { COPY_FORMATS, formatCss, type CopyFormat } from "@/lib/copy-formats";
import { copyTextToClipboard } from "@/lib/clipboard";

export interface UseCopyFormatResult {
  /** Format the CSS and write it to the clipboard. */
  copy: (format: CopyFormat) => Promise<void>;
  /** The format last copied successfully (null after the 2s window). */
  copiedFormat: CopyFormat | null;
}

export function useCopyFormat(css: string, effectId: string): UseCopyFormatResult {
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);

  const copy = useCallback(
    async (format: CopyFormat) => {
      const formatted = formatCss(css, effectId, format);
      const label = COPY_FORMATS.find((f) => f.id === format)?.label ?? format;
      // Clipboard-failure UX (P3 QA residual): the shared helper tries the
      // async Clipboard API, then the legacy execCommand fallback — the
      // error toast now fires only when BOTH paths fail (previously any
      // rejection did, even though the fallback could have succeeded).
      const ok = await copyTextToClipboard(formatted);
      if (ok) {
        setCopiedFormat(format);
        toast.success(`Copied as ${label}!`);
        setTimeout(() => setCopiedFormat(null), 2000);
      } else {
        toast.error("Failed to copy — please try again");
      }
    },
    [css, effectId]
  );

  return { copy, copiedFormat };
}
