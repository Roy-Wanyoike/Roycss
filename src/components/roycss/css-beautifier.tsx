"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Braces, Copy, Check, Trash2, TrendingUp } from "lucide-react";

/**
 * CSSBeautifier — opposite of the minifier. Takes compressed/messy CSS
 * and formats it into readable, indented output.
 */

function beautifyCSS(css: string): string {
  let formatted = css
    // Remove existing formatting
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    // Add newlines after {
    .replace(/\{/g, " {\n  ")
    // Add newlines before }
    .replace(/\}/g, "\n}\n")
    // Add newlines after ;
    .replace(/;/g, ";\n  ")
    // Add space after :
    .replace(/:(?!\s)/g, ": ")
    // Remove trailing spaces
    .replace(/ +$/gm, "")
    // Remove empty lines
    .replace(/\n\s*\n/g, "\n")
    // Remove leading whitespace before }
    .replace(/\n  \}/g, "\n}")
    // Fix indentation for nested rules (basic)
    .replace(/\n  ([^{}\n]+)\{/g, "\n  $1 {")
    // Ensure final newline
    .trim();

  // Add newline at end
  if (formatted && !formatted.endsWith("\n")) formatted += "\n";
  return formatted;
}

export function CSSBeautifier() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => input.trim() ? beautifyCSS(input) : "", [input]);

  const stats = useMemo(() => {
    if (!input.trim() || !output) return null;
    const inputBytes = new Blob([input]).size;
    const outputBytes = new Blob([output]).size;
    const lines = output.split("\n").length;
    const gzipEstimate = Math.round(outputBytes * 0.15);
    return { inputBytes, outputBytes, lines, gzipEstimate };
  }, [input, output]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [output]);

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Input CSS (minified or messy)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=".my-element{background:#10b981;margin-left:10px;padding:0.5rem}.other{color:red}"
            className="w-full h-40 p-3 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Beautified Output
            </label>
            {output && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre className="w-full h-40 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-mono text-foreground/80 overflow-auto scrollbar-thin whitespace-pre">
            <code>{output || <span className="text-muted-foreground/40">Beautified CSS will appear here…</span>}</code>
          </pre>
        </div>
      </div>

      <AnimatePresence>
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">Before</p>
              <p className="font-mono font-bold text-foreground text-sm">{formatSize(stats.inputBytes)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">After</p>
              <p className="font-mono font-bold text-foreground text-sm">{formatSize(stats.outputBytes)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">Lines</p>
              <p className="font-mono font-bold text-foreground text-sm">{stats.lines}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">Gzip est.</p>
              <p className="font-mono font-bold text-primary text-sm">{formatSize(stats.gzipEstimate)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {input && (
        <button onClick={() => { setInput(""); setCopied(false); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer">
          <Trash2 className="size-3" /> Clear
        </button>
      )}
    </div>
  );
}
