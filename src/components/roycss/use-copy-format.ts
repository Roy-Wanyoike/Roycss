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
      try {
        await navigator.clipboard.writeText(formatted);
        setCopiedFormat(format);
        toast.success(`Copied as ${label}!`);
        setTimeout(() => setCopiedFormat(null), 2000);
      } catch {
        toast.error("Failed to copy — please try again");
      }
    },
    [css, effectId]
  );

  return { copy, copiedFormat };
}
