"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Printer,
  Monitor,
  FileText,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Lightbulb,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * PrintSimulator — a `@media print` previewer.
 *
 * Renders user-supplied HTML + CSS inside an isolated `<iframe>` (via `srcdoc`)
 * so the `@media print` rules can be observed WITHOUT opening the browser's
 * print dialog.
 *
 * The trick that powers "Print" mode: the CSS is rewritten so that
 * `@media print { ... }` becomes `@media screen { ... }`, forcing the print
 * rules to apply to the on-screen iframe. A white/black baseline is also
 * injected to mimic the printed appearance.
 *
 * Features
 *  - HTML + CSS textareas (Tabs to switch) preloaded with a realistic
 *    article example that exercises every common print technique.
 *  - Screen / Print mode toggle (shadcn Tabs).
 *  - Page size select (A4 / A5 / US Letter / US Legal) — sets iframe aspect.
 *  - Margin select (None / Narrow / Normal / Wide) — padding inside the page.
 *  - Show page breaks — dashed markers for `.page-break` elements.
 *  - Action buttons: Load example, Clear, Copy print CSS, Print iframe.
 *  - Collapsible best-practices tips panel.
 *
 * Security
 *  - The iframe uses `sandbox="allow-same-origin allow-modals"` so the parent
 *    can call `contentWindow.print()`. `allow-scripts` is intentionally
 *    omitted — user-supplied HTML cannot execute JavaScript.
 *  - `srcdoc` iframes are same-origin by default; no cross-origin concerns.
 */

type Mode = "screen" | "print";
type PageSize = "a4" | "a5" | "letter" | "legal";
type Margin = "none" | "narrow" | "normal" | "wide";

interface PageSpec {
  /** CSS `aspect-ratio` value, e.g. "1 / 1.414". */
  aspect: string;
  /** Max preview width in pixels (within the parent container). */
  maxWidth: number;
  label: string;
}

const PAGE_SIZES: Record<PageSize, PageSpec> = {
  a4: { aspect: "1 / 1.414", maxWidth: 440, label: "A4 · 210 × 297 mm" },
  a5: { aspect: "1 / 1.414", maxWidth: 310, label: "A5 · 148 × 210 mm" },
  letter: { aspect: "8.5 / 11", maxWidth: 440, label: "Letter · 8.5 × 11 in" },
  legal: { aspect: "8.5 / 14", maxWidth: 440, label: "Legal · 8.5 × 14 in" },
};

const MARGINS: Record<Margin, { px: number; label: string }> = {
  none: { px: 0, label: "None" },
  narrow: { px: 14, label: "Narrow · 0.5 in" },
  normal: { px: 28, label: "Normal · 1 in" },
  wide: { px: 42, label: "Wide · 1.5 in" },
};

const DEFAULT_HTML = `<header>
  <h1>The Quarterly Report</h1>
  <nav>
    <a href="/home">Home</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</header>

<div class="container">
  <article>
    <h1>Understanding Print Stylesheets</h1>
    <p class="byline">By <strong>Jane Doe</strong> · Published March 2025</p>

    <p>Print stylesheets are an often-overlooked aspect of web design.
       They control how your pages appear when printed on paper, ensuring
       your content remains readable and well-formatted offline.</p>

    <div class="ad">Advertisement: Buy our Premium Plan today!</div>

    <h2>Why They Matter</h2>
    <p>Many users still print web pages — recipes, booking confirmations,
       articles for offline reading. A good print stylesheet hides
       navigation, expands link URLs, and prevents awkward page breaks.</p>

    <div class="callout">
      <strong>Tip:</strong> Always preview your print styles before relying
      on them in production.
    </div>

    <div class="page-break"></div>

    <h2>Best Practices</h2>
    <p>For more, visit <a href="https://example.com/guide">our guide</a>
       or <a href="https://example.com/faq">the FAQ</a>.</p>

    <aside class="sidebar">
      <h3>Related Articles</h3>
      <ul>
        <li><a href="/post/1">CSS Grid Layouts</a></li>
        <li><a href="/post/2">Custom Properties</a></li>
      </ul>
    </aside>
  </article>
</div>

<footer>
  <p>© 2025 Example Corp.
     <a href="/privacy">Privacy</a> ·
     <a href="/terms">Terms</a></p>
</footer>
`;

const DEFAULT_CSS = `/* ===== Screen styles ===== */
body {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  margin: 0;
  color: #1c1917;
  background: #f5f5f4;
  line-height: 1.6;
}
.container { max-width: 680px; margin: 0 auto; padding: 1rem; }

header {
  background: #1c1917;
  color: #fafaf9;
  padding: 1rem 1.5rem;
}
header h1 { color: #fafaf9; margin: 0 0 0.5rem; font-size: 1.4rem; }
header nav { display: flex; gap: 1rem; }
header nav a { color: #d6d3d1; text-decoration: none; }
header nav a:hover { color: #fafaf9; text-decoration: underline; }

article {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 4px;
}
article h1 { color: #0c0a09; margin-top: 0; }
article h2 { color: #1c1917; margin-top: 1.5rem; }

a { color: #0d9488; }

.byline { color: #57534e; font-size: 0.9rem; margin-top: -0.25rem; }

.callout {
  background: #fef3c7;
  border-left: 4px solid #d97706;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 0 4px 4px 0;
}

.ad {
  background: #fce7f3;
  border: 2px dashed #db2777;
  padding: 1rem;
  text-align: center;
  color: #9d174d;
  border-radius: 4px;
  margin: 1rem 0;
}

aside.sidebar {
  background: #ecfccb;
  padding: 1rem;
  margin-top: 1.5rem;
  border-radius: 4px;
}
aside.sidebar h3 { margin-top: 0; }

footer {
  background: #e7e5e4;
  padding: 1rem;
  text-align: center;
  color: #44403c;
}

/* ===== Print styles ===== */
@media print {
  body {
    background: white !important;
    color: black !important;
    font-size: 12pt;
    line-height: 1.4;
  }
  header, footer, .ad, .sidebar, aside { display: none !important; }
  .container { max-width: none; padding: 0; }
  article { padding: 0; background: white !important; }

  a { color: black; text-decoration: none; }
  a::after {
    content: " (" attr(href) ")";
    color: #555;
    font-size: 0.85em;
  }

  h1, h2, h3 { page-break-after: avoid; }
  table, img, .callout { page-break-inside: avoid; }

  .page-break { display: none; }
}
`;

const PRINT_TIPS: string[] = [
  "Use pt, mm, or in units — pixels are unreliable for print layout.",
  "Avoid position: fixed and position: sticky; they don't repeat on each printed page.",
  "Hide navigation, sidebars, ads, and interactive controls with display: none.",
  'Expand link URLs with `a::after { content: " (" attr(href) ")"; }` so printed links stay useful.',
  "Set `body { background: white; color: black; }` — printers often skip background colors.",
  "Use `page-break-after: avoid` on headings to prevent orphaned headings at page bottoms.",
  "Use `page-break-inside: avoid` on tables, images, and figures to prevent splitting.",
  "Add `@page { margin: 1in; }` for printed-page margins (separate from on-screen padding).",
  'Always preview before printing — never assume the browser "just works".',
];

/**
 * Extract the `@media print { ... }` block from a stylesheet, correctly
 * handling nested braces. Returns the full block including the `@media print {`
 * prefix and the closing `}`, or "" if no print block is found.
 */
function extractPrintBlock(css: string): string {
  const startMatch = css.match(/@media\s+print\s*(?:and\s*\([^)]*\))?\s*\{/i);
  if (!startMatch || startMatch.index === undefined) return "";
  const startIdx = startMatch.index;
  const openIdx = startIdx + startMatch[0].length - 1; // index of '{'
  let depth = 1;
  let i = openIdx + 1;
  const n = css.length;
  while (i < n && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  return css.slice(startIdx, i);
}

/**
 * Build the full HTML document string for the iframe `srcdoc` attribute.
 * In Print mode the CSS is rewritten so `@media print` rules apply on screen.
 */
function buildSrcDoc(
  html: string,
  css: string,
  mode: Mode,
  margin: Margin,
  showBreaks: boolean,
): string {
  try {
    let effectiveCss = css;
    if (mode === "print") {
      // Rewrite `@media print {` → `@media screen {` so the print rules
      // apply to the on-screen iframe, simulating the printed appearance.
      effectiveCss = css.replace(
        /@media\s+print\s*(?:and\s*\([^)]*\))?\s*\{/gi,
        "@media screen {",
      );
    }

    const marginPx = MARGINS[margin].px;
    const marginRule =
      marginPx > 0 ? `body { padding: ${marginPx}px !important; }` : "";

    // Visualize `.page-break` markers as dashed orange lines + labels.
    // `display: block !important` overrides the print rule that hides them.
    const breakStyles = showBreaks
      ? `
.page-break {
  display: block !important;
  height: 0 !important;
  border-top: 2px dashed #ea580c !important;
  margin: 1rem 0 !important;
  position: relative;
}
.page-break::after {
  content: "page break";
  position: absolute;
  top: -7px;
  left: 0;
  background: #ea580c;
  color: white;
  font-size: 9px;
  font-family: ui-monospace, monospace;
  padding: 1px 5px;
  border-radius: 2px;
  letter-spacing: 0.5px;
  line-height: 1;
}
`
      : "";

    // In print mode, force a white background + black text baseline so the
    // simulated page resembles actual printed output.
    const baseline =
      mode === "print"
        ? "html, body { background: #ffffff !important; color: #000000 !important; }"
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Print preview</title>
<style>
${effectiveCss}
${breakStyles}
${marginRule}
${baseline}
</style>
</head>
<body>
${html}
</body>
</html>`;
  } catch {
    return `<!DOCTYPE html><html><body><p style="color:#dc2626;font-family:system-ui;padding:1rem">Error building preview.</p></body></html>`;
  }
}

export function PrintSimulator() {
  const [html, setHtml] = useState<string>(DEFAULT_HTML);
  const [css, setCss] = useState<string>(DEFAULT_CSS);
  const [mode, setMode] = useState<Mode>("screen");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState<Margin>("normal");
  const [showBreaks, setShowBreaks] = useState<boolean>(true);
  const [tipsOpen, setTipsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inputTab, setInputTab] = useState<string>("html");

  // Initial srcdoc is built synchronously so the iframe renders immediately
  // on mount without waiting for the first debounce cycle.
  const [srcDoc, setSrcDoc] = useState<string>(() =>
    buildSrcDoc(DEFAULT_HTML, DEFAULT_CSS, "screen", "normal", true),
  );

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced srcdoc rebuild on any input change (~300ms).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSrcDoc(buildSrcDoc(html, css, mode, margin, showBreaks));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [html, css, mode, margin, showBreaks]);

  const loadExample = useCallback(() => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setMode("screen");
    setPageSize("a4");
    setMargin("normal");
    setShowBreaks(true);
  }, []);

  const clearAll = useCallback(() => {
    setHtml("");
    setCss("");
  }, []);

  const copyPrintCss = useCallback(async () => {
    const block = extractPrintBlock(css);
    const text = block.length > 0 ? block : css;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [css]);

  const printIframe = useCallback(() => {
    try {
      const w = iframeRef.current?.contentWindow;
      if (w) {
        w.focus();
        w.print();
      }
    } catch {
      /* cross-origin or sandboxed — silently ignore */
    }
  }, []);

  const page = PAGE_SIZES[pageSize];
  const marginInfo = MARGINS[margin];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Printer className="size-5 shrink-0 text-primary" />
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold leading-tight">
            Print Stylesheet Simulator
          </h3>
          <p className="text-xs text-muted-foreground leading-snug">
            Preview how{" "}
            <code className="font-mono text-foreground/80">@media print</code>{" "}
            rules render — without opening the browser print dialog.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={loadExample}>
          <RefreshCw />
          Load example
        </Button>
        <Button size="sm" variant="outline" onClick={clearAll}>
          <Trash2 />
          Clear
        </Button>
        <Button size="sm" variant="outline" onClick={copyPrintCss}>
          {copied ? (
            <Check className="text-emerald-500" />
          ) : (
            <Copy />
          )}
          {copied ? "Copied!" : "Copy print CSS"}
        </Button>
        <Button size="sm" onClick={printIframe}>
          <Printer />
          Print iframe
        </Button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="screen" className="px-3">
              <Monitor />
              Screen
            </TabsTrigger>
            <TabsTrigger value="print" className="px-3">
              <Printer />
              Print
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1.5">
          <Label
            htmlFor="ps-page-size"
            className="text-xs text-muted-foreground"
          >
            Page
          </Label>
          <Select
            value={pageSize}
            onValueChange={(v) => setPageSize(v as PageSize)}
          >
            <SelectTrigger id="ps-page-size" size="sm" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="a5">A5</SelectItem>
              <SelectItem value="letter">US Letter</SelectItem>
              <SelectItem value="legal">US Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Label
            htmlFor="ps-margin-size"
            className="text-xs text-muted-foreground"
          >
            Margins
          </Label>
          <Select
            value={margin}
            onValueChange={(v) => setMargin(v as Margin)}
          >
            <SelectTrigger id="ps-margin-size" size="sm" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="narrow">Narrow</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="ps-show-breaks"
            checked={showBreaks}
            onCheckedChange={setShowBreaks}
          />
          <Label htmlFor="ps-show-breaks" className="text-xs">
            Show breaks
          </Label>
        </div>
      </div>

      {/* Input tabs (HTML / CSS) — stacked above the preview to give the
          preview full width (~440px) on a max-w-2xl Sheet. */}
      <Tabs value={inputTab} onValueChange={setInputTab}>
        <TabsList className="w-full">
          <TabsTrigger value="html" className="flex-1">
            <FileText />
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="flex-1">
            <Maximize2 />
            CSS
          </TabsTrigger>
        </TabsList>
        <TabsContent value="html" className="mt-2">
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            aria-label="HTML input for print preview"
            placeholder="<header>...</header><article>...</article>"
            className="font-mono text-xs min-h-[260px] resize-y leading-relaxed"
          />
        </TabsContent>
        <TabsContent value="css" className="mt-2">
          <Textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            spellCheck={false}
            aria-label="CSS input for print preview"
            placeholder="body { ... } @media print { ... }"
            className="font-mono text-xs min-h-[260px] resize-y leading-relaxed"
          />
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={mode === "print" ? "default" : "secondary"}
              className="font-mono text-[10px] uppercase tracking-wide"
            >
              {mode === "print" ? (
                <Printer className="size-3" />
              ) : (
                <Monitor className="size-3" />
              )}
              {mode}
            </Badge>
            <span className="text-xs text-muted-foreground">{page.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {marginInfo.label}
          </span>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 sm:p-6 flex justify-center overflow-auto">
          <div
            className="bg-white shadow-lg ring-1 ring-black/5"
            style={{
              width: "100%",
              maxWidth: page.maxWidth,
              aspectRatio: page.aspect,
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title="Print preview"
              sandbox="allow-same-origin allow-modals"
              className="block w-full h-full bg-white"
              style={{ border: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Tips panel */}
      <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-primary" />
            <span className="text-xs font-medium">
              Print CSS best practices
            </span>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  tipsOpen && "rotate-180",
                )}
              />
              <span className="sr-only">Toggle tips</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <ul className="mt-2 space-y-1.5 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            {PRINT_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 leading-relaxed">
                <span className="text-primary shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
