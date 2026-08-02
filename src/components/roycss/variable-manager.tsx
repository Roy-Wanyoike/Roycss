"use client";

import { useState, useMemo, useCallback } from "react";
import { Variable, Copy, Check, Plus, Minus, Trash2, Download } from "lucide-react";

interface Token {
  id: string;
  name: string;
  value: string;
  category: "color" | "spacing" | "font" | "radius" | "shadow" | "other";
}

let tokenId = 0;
const makeToken = (name: string, value: string, category: Token["category"]): Token => ({
  id: `token-${tokenId++}`, name, value, category,
});

const DEFAULT_TOKENS: Token[] = [
  makeToken("--primary", "oklch(0.696 0.149 162.48)", "color"),
  makeToken("--background", "oklch(0.15 0.02 250)", "color"),
  makeToken("--foreground", "oklch(0.95 0.01 250)", "color"),
  makeToken("--muted", "oklch(0.25 0.02 250)", "color"),
  makeToken("--border", "oklch(0.3 0.02 250)", "color"),
  makeToken("--radius-sm", "0.25rem", "radius"),
  makeToken("--radius-md", "0.5rem", "radius"),
  makeToken("--radius-lg", "1rem", "radius"),
  makeToken("--font-sans", "system-ui, sans-serif", "font"),
  makeToken("--font-mono", "'Courier New', monospace", "font"),
  makeToken("--space-1", "0.25rem", "spacing"),
  makeToken("--space-2", "0.5rem", "spacing"),
  makeToken("--space-4", "1rem", "spacing"),
  makeToken("--shadow-sm", "0 1px 2px oklch(0 0 0 / 0.1)", "shadow"),
];

const CATEGORIES = ["color", "spacing", "font", "radius", "shadow", "other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  color: "text-emerald-500 bg-emerald-500/10",
  spacing: "text-amber-500 bg-amber-500/10",
  font: "text-violet-500 bg-violet-500/10",
  radius: "text-cyan-500 bg-cyan-500/10",
  shadow: "text-rose-500 bg-rose-500/10",
  other: "text-muted-foreground bg-muted",
};

export function CSSVariableManager() {
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => filter === "all" ? tokens : tokens.filter(t => t.category === filter), [tokens, filter]);

  const cssOutput = useMemo(() => {
    return `:root {\n${tokens.map(t => `  ${t.name}: ${t.value};`).join("\n")}\n}`;
  }, [tokens]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(cssOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [cssOutput]);

  const addToken = () => setTokens(prev => [...prev, makeToken("--new-token", "", "other")]);
  const removeToken = (id: string) => setTokens(prev => prev.filter(t => t.id !== id));
  const updateToken = (id: string, field: keyof Token, value: string) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>All ({tokens.length})</button>
        {CATEGORIES.map(cat => {
          const count = tokens.filter(t => t.category === cat).length;
          if (count === 0) return null;
          return <button key={cat} onClick={() => setFilter(cat)} className={`px-2 py-1 rounded-md text-xs font-medium capitalize cursor-pointer ${filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{cat} ({count})</button>;
        })}
      </div>

      {/* Token list */}
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
        {filtered.map(token => (
          <div key={token.id} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20 border border-border/40">
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${CATEGORY_COLORS[token.category]}`}>{token.category.slice(0, 3)}</span>
            <input type="text" value={token.name} onChange={(e) => updateToken(token.id, "name", e.target.value)} className="w-32 h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono focus:outline-none focus:border-primary/40" />
            <input type="text" value={token.value} onChange={(e) => updateToken(token.id, "value", e.target.value)} className="flex-1 h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono focus:outline-none focus:border-primary/40" />
            {token.category === "color" && token.value && (
              <div className="size-6 rounded border border-border/40 shrink-0" style={{ background: token.value }} />
            )}
            <select value={token.category} onChange={(e) => updateToken(token.id, "category", e.target.value)} className="h-7 px-1 rounded bg-background border border-border/40 text-[10px] cursor-pointer capitalize">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => removeToken(token.id)} className="text-muted-foreground hover:text-rose-500 cursor-pointer shrink-0"><Minus className="size-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Add + Copy */}
      <div className="flex items-center gap-2">
        <button onClick={addToken} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium cursor-pointer transition-all">
          <Plus className="size-3.5" /> Add Token
        </button>
        <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied!" : "Copy CSS Variables"}
        </button>
      </div>

      {/* Preview */}
      <div className="p-3 rounded-xl border border-border/50" style={{ ["--primary" as string]: tokens.find(t => t.name === "--primary")?.value || "oklch(0.7 0.2 162)", ["--background" as string]: tokens.find(t => t.name === "--background")?.value || "#1a1a2e" }}>
        <p className="text-[10px] text-muted-foreground mb-2">Live preview using your tokens:</p>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--primary)", color: "var(--background)", borderRadius: tokens.find(t => t.name === "--radius-md")?.value || "0.5rem" }}>
            Primary Button
          </div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: "var(--border, oklch(0.3 0.02 250))", color: "var(--foreground, white)", borderRadius: tokens.find(t => t.name === "--radius-sm")?.value || "0.25rem" }}>
            Secondary
          </div>
        </div>
      </div>
    </div>
  );
}
