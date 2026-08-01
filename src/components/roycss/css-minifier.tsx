"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Copy, Check, Trash2, TrendingDown } from "lucide-react";

/**
 * CSSMinifier — paste CSS, get minified output with size savings.
 * Removes: comments, whitespace, unnecessary semicolons, leading zeros.
 * Shows before/after size, savings %, and gzip estimate.
 */

function minifyCSS(css: string): string {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove leading/trailing whitespace per line
    .replace(/^\s+/gm, "")
    .replace(/\s+$/gm, "")
    // Remove whitespace around special chars
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    // Remove last semicolon in blocks
    .replace(/;}/g, "}")
    // Remove leading zeros (0.5 → .5)
    .replace(/(:|,)0\.([0-9])/g, "$1.$2")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    // Remove final whitespace
    .trim();
}

export function CSSMinifier() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => input.trim() ? minifyCSS(input) : "", [input]);

  const stats = useMemo(() => {
    if (!input.trim() || !output) return null;
    const inputBytes = new Blob([input]).size;
    const outputBytes = new Blob([output]).size;
    const savings = Math.round((1 - outputBytes / inputBytes) * 100);
    const gzipEstimate = Math.round(outputBytes * 0.15);
    return { inputBytes, outputBytes, savings, gzipEstimate };
  }, [input, output]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [output]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Input */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Input CSS
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="/* Paste your CSS here */&#10;.my-element {&#10;  background: #10b981;&#10;  margin-left: 10px;&#10;  /* comment */&#10;  padding: 0.5rem;&#10;}"
            className="w-full h-40 p-3 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Minified Output
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
          <pre className="w-full h-40 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-mono text-foreground/80 overflow-auto scrollbar-thin whitespace-pre-wrap break-all">
            <code>{output || <span className="text-muted-foreground/40">Minified CSS will appear here…</span>}</code>
          </pre>
        </div>
      </div>

      {/* Stats */}
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
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-center">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Saved</p>
              <p className="font-mono font-bold text-emerald-500 text-sm flex items-center justify-center gap-1">
                <TrendingDown className="size-3" />{stats.savings}%
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">Gzip est.</p>
              <p className="font-mono font-bold text-primary text-sm">{formatSize(stats.gzipEstimate)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear */}
      {input && (
        <button
          onClick={() => { setInput(""); setCopied(false); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
        >
          <Trash2 className="size-3" /> Clear
        </button>
      )}
    </div>
  );
}
