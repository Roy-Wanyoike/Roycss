"use client";

import { useState, useCallback } from "react";
import { ExternalLink, Code2 } from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";

/**
 * ExportToCodePen — generates a CodePen URL pre-filled with the effect's
 * HTML + CSS. One click opens CodePen with the effect ready to edit.
 *
 * Uses CodePen's URL-based pen creation API:
 * https://codepen.io/pen/define?data=<base64-encoded-JSON>
 */

interface ExportToCodePenProps {
  effect: CSSEffect;
}

export function ExportToCodePen({ effect }: ExportToCodePenProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(() => {
    setLoading(true);

    // Build HTML
    const html = `<div class="roycss-${effect.id}">
  ${effect.previewText || effect.name}
</div>`;

    // Build CSS — include a basic reset + the effect CSS
    const css = `/* ${effect.name} — ${effect.description} */
/* Exported from RoyCSS — https://roycss.com#effect=${effect.id} */

body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  background: #1a1a2e;
  font-family: system-ui, sans-serif;
}

${effect.cssCode}

/* Make the effect visible */
.roycss-${effect.id} {
  padding: 2rem;
  border-radius: 0.5rem;
}`;

    // Build the CodePen data payload
    const data = {
      title: `RoyCSS — ${effect.name}`,
      html,
      css,
      editors: "110", // HTML + CSS editors open
      layout: "left",
      css_pre_processor: "none",
      html_pre_processor: "none",
    };

    // Encode and open
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const url = `https://codepen.io/pen/define?data=${encoded}`;

    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => setLoading(false), 500);
  }, [effect]);

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
      aria-label="Open in CodePen"
      title="Open in CodePen"
    >
      <ExternalLink className="size-3.5" />
      <span className="hidden sm:inline">CodePen</span>
    </button>
  );
}
