"use client";

import { useState, useMemo, useCallback } from "react";
import { Type, Copy, Check } from "lucide-react";

const FONT_FAMILIES = [
  { name: "System UI", value: "system-ui, sans-serif" },
  { name: "Geist Sans", value: "var(--font-geist-sans), sans-serif" },
  { name: "Space Grotesk", value: "var(--font-display), sans-serif" },
  { name: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { name: "Monospace", value: "var(--font-geist-mono), monospace" },
  { name: "Courier", value: "'Courier New', monospace" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
];

const FONT_WEIGHTS = [
  { name: "Thin", value: "100" },
  { name: "Light", value: "300" },
  { name: "Regular", value: "400" },
  { name: "Medium", value: "500" },
  { name: "Semibold", value: "600" },
  { name: "Bold", value: "700" },
  { name: "Extrabold", value: "800" },
  { name: "Black", value: "900" },
];

const LINE_HEIGHTS = ["0.8", "1", "1.2", "1.4", "1.5", "1.6", "1.8", "2", "2.5"];
const LETTER_SPACINGS = ["-0.05em", "-0.02em", "0", "0.02em", "0.05em", "0.1em", "0.15em", "0.2em"];

export function FontPreviewTool() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState("400");
  const [lineHeight, setLineHeight] = useState("1.5");
  const [letterSpacing, setLetterSpacing] = useState("0");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [textTransform, setTextTransform] = useState<"none" | "uppercase" | "lowercase" | "capitalize">("none");
  const [textDecoration, setTextDecoration] = useState<"none" | "underline" | "line-through" | "overline">("none");
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    return [
      `font-family: ${fontFamily};`,
      `font-size: ${fontSize}px;`,
      `font-weight: ${fontWeight};`,
      `line-height: ${lineHeight};`,
      `letter-spacing: ${letterSpacing};`,
      `font-style: ${fontStyle};`,
      `text-transform: ${textTransform};`,
      `text-decoration: ${textDecoration};`,
    ].join("\n  ");
  }, [fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontStyle, textTransform, textDecoration]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`.my-text {\n  ${cssValue}\n}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [cssValue]);

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="p-6 rounded-xl bg-muted/20 border border-border/50 min-h-[100px] flex items-center justify-center">
        <p style={{
          fontFamily, fontSize: `${fontSize}px`, fontWeight, lineHeight,
          letterSpacing, fontStyle, textTransform, textDecoration,
          textAlign: "center", wordBreak: "break-word",
        }}>{text || "Type something..."}</p>
      </div>

      {/* Text input */}
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your text..."
        className="w-full h-10 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm focus:outline-none" />

      {/* Font family */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Font Family</label>
        <div className="flex flex-wrap gap-1">
          {FONT_FAMILIES.map(f => (
            <button key={f.name} onClick={() => setFontFamily(f.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${fontFamily === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              style={{ fontFamily: f.value }}>{f.name}</button>
          ))}
        </div>
      </div>

      {/* Size slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Size</label>
          <span className="text-xs font-mono text-primary">{fontSize}px</span>
        </div>
        <input type="range" min={8} max={96} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full cursor-pointer" />
      </div>

      {/* Weight + Line height + Letter spacing */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Weight</label>
          <select value={fontWeight} onChange={(e) => setFontWeight(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
            {FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Line Height</label>
          <select value={lineHeight} onChange={(e) => setLineHeight(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
            {LINE_HEIGHTS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Letter Space</label>
          <select value={letterSpacing} onChange={(e) => setLetterSpacing(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
            {LETTER_SPACINGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Style toggles */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Style</label>
          <div className="flex gap-1">
            {(["normal", "italic"] as const).map(s => (
              <button key={s} onClick={() => setFontStyle(s)} className={`flex-1 py-1 rounded-md text-xs font-medium cursor-pointer capitalize ${fontStyle === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Transform</label>
          <select value={textTransform} onChange={(e) => setTextTransform(e.target.value as typeof textTransform)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer capitalize">
            <option value="none">None</option><option value="uppercase">Upper</option><option value="lowercase">Lower</option><option value="capitalize">Capitalize</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Decoration</label>
          <select value={textDecoration} onChange={(e) => setTextDecoration(e.target.value as typeof textDecoration)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer capitalize">
            <option value="none">None</option><option value="underline">Underline</option><option value="line-through">Strikethrough</option><option value="overline">Overline</option>
          </select>
        </div>
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>.my-text {`{`}\n  {cssValue}\n{`}`}</code></pre>
      </div>
    </div>
  );
}
