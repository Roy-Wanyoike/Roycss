"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Copy,
  Check,
  Share2,
  Code2,
  Eye,
  Sun,
  Moon,
  Terminal,
  Accessibility,
  Gauge,
  Trash2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ═══════════════════════════════════════════════════════════════
   DEFAULT CONTENT — Glow button sample
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_HTML = `<!-- RoyCSS Glow Button -->
<button class="roycss-glow-btn">
  Click me
</button>`;

const DEFAULT_CSS = `.roycss-glow-btn {
  padding: 12px 24px;
  border-radius: 8px;
  background: #10b981;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.roycss-glow-btn:hover {
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
  transform: translateY(-2px);
}

.roycss-glow-btn:active {
  transform: translateY(0);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}`;

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface ConsoleMessage {
  id: number;
  level: "log" | "warn" | "error" | "info";
  text: string;
  timestamp: number;
}

interface PlaygroundV2Props {
  initialHtml?: string;
  initialCss?: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function buildPreviewDoc(
  html: string,
  css: string,
  theme: "light" | "dark",
  messagePort: number,
): string {
  const bg = theme === "dark" ? "#0a0a0a" : "#ffffff";
  const fg = theme === "dark" ? "#e5e7eb" : "#111827";
  const font =
    theme === "dark"
      ? "system-ui, -apple-system, sans-serif"
      : "system-ui, -apple-system, sans-serif";

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 16px;
    background: ${bg};
    color: ${fg};
    font-family: ${font};
    min-height: 100vh;
    box-sizing: border-box;
  }
  * { box-sizing: border-box; }
  body { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; }
  ${css}
</style>
</head>
<body>
${html}
<script>
  (function () {
    const send = (level, args) => {
      try {
        const text = Array.prototype.map.call(args, function (a) {
          if (a === null) return "null";
          if (a === undefined) return "undefined";
          if (typeof a === "object") {
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          }
          return String(a);
        }).join(" ");
        window.parent.postMessage({
          source: "roycss-playground-v2",
          port: ${messagePort},
          level: level,
          text: text,
          ts: Date.now()
        }, "*");
      } catch (e) { /* noop */ }
    };
    ["log", "warn", "error", "info"].forEach(function (lvl) {
      const orig = console[lvl];
      console[lvl] = function () {
        send(lvl, arguments);
        orig.apply(console, arguments);
      };
    });
    window.addEventListener("error", function (e) {
      send("error", [e.message + " (line " + (e.lineno || 0) + ")"]);
    });
  })();
<\/script>
</body>
</html>`;
}

function computeMetrics(html: string, css: string) {
  const lines = (html + "\n" + css).split("\n").length;
  const bytes = new Blob([html + css]).size;
  const rules = (css.match(/[^{}]*\{[^{}]*\}/g) || []).length;
  const selectors = (css.match(/^[^{}]+(?=\{)/gm) || []).length;
  return { lines, bytes, rules, selectors };
}

function roughA11y(html: string): { pass: string[]; warn: string[] } {
  const pass: string[] = [];
  const warn: string[] = [];
  if (/<button[^>]*>[\s\S]*?<\/button>/i.test(html)) pass.push("Interactive buttons detected");
  if (/<input/i.test(html) && !/aria-label|<label/i.test(html))
    warn.push("Form inputs should have labels");
  if (/<img[^>]*>/i.test(html) && !/<img[^>]*alt=/i.test(html))
    warn.push("Images missing alt text");
  if (/<a[^>]*>/i.test(html) && !/<a[^>]*aria-label|<a[^>]*>[\s\S]+?<\/a>/i.test(html))
    warn.push("Empty links detected");
  if (/role=|aria-/.test(html)) pass.push("ARIA attributes used");
  if (pass.length === 0 && warn.length === 0) warn.push("Add semantic HTML for better a11y");
  return { pass, warn };
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function PlaygroundV2({ initialHtml, initialCss }: PlaygroundV2Props) {
  const [html, setHtml] = useState(initialHtml ?? DEFAULT_HTML);
  const [css, setCss] = useState(initialCss ?? DEFAULT_CSS);
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState<"code" | "share" | null>(null);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [running, setRunning] = useState(true);
  const msgIdRef = useRef(0);
  // Mount-stable unique port so multiple playgrounds don't collide
  const [messagePort] = useState(() => Math.floor(Math.random() * 1_000_000_000));

  // Debounced preview state
  const [debouncedHtml, setDebouncedHtml] = useState(html);
  const [debouncedCss, setDebouncedCss] = useState(css);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "roycss-playground-v2") return;
      if (data.port !== messagePort) return;
      setMessages((prev) =>
        [
          ...prev.slice(-199),
          {
            id: ++msgIdRef.current,
            level: data.level as ConsoleMessage["level"],
            text: String(data.text),
            timestamp: Number(data.ts) || Date.now(),
          },
        ],
      );
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [messagePort]);

  // Debounce preview updates (500ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedHtml(html);
      setDebouncedCss(css);
    }, 500);
    return () => clearTimeout(t);
  }, [html, css]);

  const previewDoc = useMemo(
    () =>
      buildPreviewDoc(
        debouncedHtml,
        debouncedCss,
        theme,
        messagePort,
      ),
    [debouncedHtml, debouncedCss, theme, messagePort],
  );

  const metrics = useMemo(() => computeMetrics(html, css), [html, css]);
  const a11y = useMemo(() => roughA11y(html), [html]);

  const handleReset = useCallback(() => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setMessages([]);
    setRunning(true);
  }, []);

  const handleCopyCode = useCallback(async () => {
    const combined = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`;
    try {
      await navigator.clipboard.writeText(combined);
      setCopied("code");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [html, css]);

  const handleShare = useCallback(async () => {
    try {
      const payload = { h: html, c: css };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const hash = `#playground=${encoded}`;
      const url = `${window.location.origin}${window.location.pathname}${hash}`;
      await navigator.clipboard.writeText(url);
      setCopied("share");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [html, css]);

  const clearConsole = useCallback(() => setMessages([]), []);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Code2 className="size-3" />
            RoyCSS Playground 2.0
          </Badge>
          <Badge variant="outline" className="gap-1">
            {metrics.lines} lines
          </Badge>
          <Badge variant="outline" className="gap-1">
            {(metrics.bytes / 1024).toFixed(2)} KB
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} aria-label="Reset code">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyCode} aria-label="Copy code">
            {copied === "code" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            Copy Code
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} aria-label="Share via URL">
            {copied === "share" ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
            Share
          </Button>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col gap-4 lg:flex-row lg:h-[600px]">
        {/* LEFT — Editor */}
        <div className="flex flex-1 flex-col gap-2">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "html" | "css")}
            className="flex flex-1 flex-col"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="html" className="gap-1.5">
                  <Code2 className="size-3.5" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-1.5">
                  <Code2 className="size-3.5" />
                  CSS
                </TabsTrigger>
              </TabsList>
              <span className="text-xs text-muted-foreground">
                {activeTab === "html" ? html.split("\n").length : css.split("\n").length} lines
              </span>
            </div>

            <TabsContent value="html" className="mt-2 flex-1">
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                aria-label="HTML editor"
                className="h-full min-h-[400px] resize-none overflow-auto font-mono text-sm leading-relaxed lg:h-[520px]"
              />
            </TabsContent>

            <TabsContent value="css" className="mt-2 flex-1">
              <Textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                spellCheck={false}
                aria-label="CSS editor"
                className="h-full min-h-[400px] resize-none overflow-auto font-mono text-sm leading-relaxed lg:h-[520px]"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT — Preview */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Eye className="size-3" />
                Live Preview
              </Badge>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="text-xs text-muted-foreground transition hover:text-foreground"
                aria-label={running ? "Pause preview" : "Resume preview"}
              >
                {running ? "Live" : "Paused"}
              </button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleTheme}
              aria-label="Toggle preview theme"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              {theme === "light" ? "Dark" : "Light"}
            </Button>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-lg border bg-background">
            <iframe
              title="RoyCSS Playground preview"
              srcDoc={running ? previewDoc : undefined}
              sandbox="allow-scripts"
              className="h-full min-h-[400px] w-full bg-background lg:min-h-[520px]"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM — Console + A11y + Metrics */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Console */}
        <Card className="md:col-span-2">
          <CardContent className="flex h-48 flex-col p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-emerald-600" />
                <span className="text-sm font-semibold">Console</span>
                {messages.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {messages.length}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearConsole}
                aria-label="Clear console"
                disabled={messages.length === 0}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1 rounded-md bg-muted/40 p-2">
              {messages.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Console output will appear here. Use console.log/warn/error inside the preview.
                </p>
              ) : (
                <ul className="space-y-1 font-mono text-xs">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={
                        m.level === "error"
                          ? "text-rose-600 dark:text-rose-400"
                          : m.level === "warn"
                            ? "text-amber-600 dark:text-amber-400"
                            : m.level === "info"
                              ? "text-sky-600 dark:text-sky-400"
                              : "text-foreground/80"
                      }
                    >
                      <span className="text-muted-foreground">
                        [{new Date(m.timestamp).toLocaleTimeString()}]
                      </span>{" "}
                      <span className="uppercase opacity-70">{m.level}</span>{" "}
                      {m.text}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Metrics + A11y stacked */}
        <div className="flex flex-col gap-4">
          {/* Metrics */}
          <Card>
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Gauge className="size-4 text-emerald-600" />
                <span className="text-sm font-semibold">Metrics</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/40 p-2">
                  <dt className="text-muted-foreground">Total lines</dt>
                  <dd className="font-mono font-semibold">{metrics.lines}</dd>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-mono font-semibold">
                    {(metrics.bytes / 1024).toFixed(2)} KB
                  </dd>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <dt className="text-muted-foreground">CSS rules</dt>
                  <dd className="font-mono font-semibold">{metrics.rules}</dd>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <dt className="text-muted-foreground">Selectors</dt>
                  <dd className="font-mono font-semibold">{metrics.selectors}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* A11y */}
          <Card>
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <Accessibility className="size-4 text-emerald-600" />
                <span className="text-sm font-semibold">Accessibility</span>
              </div>
              <ScrollArea className="max-h-32">
                <ul className="space-y-1 text-xs">
                  {a11y.pass.map((p) => (
                    <li key={`p-${p}`} className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="mt-0.5 size-3 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                  {a11y.warn.map((w) => (
                    <li key={`w-${w}`} className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="mt-0.5 size-3 shrink-0 text-amber-500">!</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Play indicator */}
      {!running && (
        <div className="mt-2 flex items-center justify-center">
          <Button size="sm" variant="outline" onClick={() => setRunning(true)}>
            <Play className="size-4" />
            Resume Preview
          </Button>
        </div>
      )}
    </motion.div>
  );
}
