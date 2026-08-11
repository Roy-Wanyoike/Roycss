"use client";

import { useState, useMemo, useCallback } from "react";
import { LayoutGrid, Copy, Check, Plus, Minus, Trash2 } from "lucide-react";

interface GridItem {
  id: string;
  column: string;
  row: string;
  label: string;
}

let itemId = 0;

const COL_PRESETS = [
  { name: "2 cols", value: "repeat(2, 1fr)" },
  { name: "3 cols", value: "repeat(3, 1fr)" },
  { name: "4 cols", value: "repeat(4, 1fr)" },
  { name: "Sidebar", value: "200px 1fr" },
  { name: "Holy Grail", value: "200px 1fr 200px" },
  { name: "Auto-fit", value: "repeat(auto-fit, minmax(200px, 1fr))" },
];

const ROW_PRESETS = [
  { name: "Auto", value: "auto" },
  { name: "Header/Main", value: "60px 1fr" },
  { name: "3 rows", value: "repeat(3, 1fr)" },
  { name: "Full height", value: "60px 1fr 40px" },
];

export function CSSGridGenerator() {
  const [columns, setColumns] = useState("repeat(3, 1fr)");
  const [rows, setRows] = useState("auto");
  const [gap, setGap] = useState(16);
  const [rowGap, setRowGap] = useState(16);
  const [linked, setLinked] = useState(true);
  const [items, setItems] = useState<GridItem[]>([
    { id: `item-${itemId++}`, column: "1", row: "1", label: "1" },
    { id: `item-${itemId++}`, column: "2", row: "1", label: "2" },
    { id: `item-${itemId++}`, column: "3", row: "1", label: "3" },
    { id: `item-${itemId++}`, column: "1", row: "2", label: "4" },
    { id: `item-${itemId++}`, column: "2", row: "2", label: "5" },
    { id: `item-${itemId++}`, column: "3", row: "2", label: "6" },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveRowGap = linked ? gap : rowGap;

  const containerCss = useMemo(() => {
    return [
      `display: grid;`,
      `grid-template-columns: ${columns};`,
      rows !== "auto" ? `grid-template-rows: ${rows};` : null,
      `gap: ${gap}px ${effectiveRowGap}px;`,
    ].filter(Boolean).join("\n  ");
  }, [columns, rows, gap, effectiveRowGap]);

  const selectedItem = items.find(i => i.id === selectedId);

  const itemCss = useMemo(() => {
    if (!selectedItem) return "";
    const parts: string[] = [];
    if (selectedItem.column !== "auto") parts.push(`grid-column: ${selectedItem.column};`);
    if (selectedItem.row !== "auto") parts.push(`grid-row: ${selectedItem.row};`);
    return parts.join("\n  ");
  }, [selectedItem]);

  const fullCss = useMemo(() => {
    let css = `.grid-container {\n  ${containerCss}\n}`;
    if (selectedItem && itemCss) {
      css += `\n\n.grid-item-${selectedItem.label} {\n  ${itemCss}\n}`;
    }
    return css;
  }, [containerCss, selectedItem, itemCss]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(fullCss); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [fullCss]);

  const addItem = () => setItems(prev => [...prev, { id: `item-${itemId++}`, column: "auto", row: "auto", label: String(prev.length + 1) }]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, field: keyof GridItem, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleGap = (value: number) => {
    setGap(value);
    if (linked) setRowGap(value);
  };

  return (
    <div className="space-y-4">
      {/* Grid preview */}
      <div
        className="rounded-xl border border-border/50 bg-muted/20 p-3 min-h-[160px]"
        style={{ display: "grid", gridTemplateColumns: columns, gridTemplateRows: rows !== "auto" ? rows : undefined, gap: `${gap}px ${effectiveRowGap}px` }}
      >
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all ${selectedId === item.id ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "bg-primary/15 text-primary hover:bg-primary/25"}`}
            style={{
              gridColumn: item.column !== "auto" ? item.column : undefined,
              gridRow: item.row !== "auto" ? item.row : undefined,
              minHeight: 40,
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Column presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Columns</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {COL_PRESETS.map(p => (
            <button key={p.name} onClick={() => setColumns(p.value)} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${columns === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{p.name}</button>
          ))}
        </div>
        <input type="text" value={columns} onChange={(e) => setColumns(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs font-mono focus:outline-none focus:border-primary/40" />
      </div>

      {/* Row presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Rows</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {ROW_PRESETS.map(p => (
            <button key={p.name} onClick={() => setRows(p.value)} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${rows === p.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{p.name}</button>
          ))}
        </div>
        <input type="text" value={rows} onChange={(e) => setRows(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs font-mono focus:outline-none focus:border-primary/40" />
      </div>

      {/* Gap */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs text-muted-foreground">Column Gap</label>
            <span className="text-xs font-mono text-primary">{gap}px</span>
          </div>
          <input type="range" min={0} max={48} value={gap} onChange={(e) => handleGap(parseInt(e.target.value))} className="w-full cursor-pointer" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs text-muted-foreground">Row Gap</label>
            <span className="text-xs font-mono text-primary">{effectiveRowGap}px</span>
          </div>
          <input type="range" min={0} max={48} value={effectiveRowGap} disabled={linked} onChange={(e) => setRowGap(parseInt(e.target.value))} className="w-full cursor-pointer disabled:opacity-50" />
        </div>
      </div>
      <button onClick={() => setLinked(!linked)} className={`text-xs ${linked ? "text-primary" : "text-muted-foreground"} cursor-pointer`}>
        {linked ? "🔗 Gaps linked" : "🔓 Gaps independent"}
      </button>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items ({items.length})</span>
          <button onClick={addItem} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"><Plus className="size-3" /> Add Item</button>
        </div>
        {selectedItem && (
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 mb-2">
            <p className="text-xs font-semibold text-primary mb-1.5">Item {selectedItem.label} (selected)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Grid Column</label>
                <input type="text" value={selectedItem.column} onChange={(e) => updateItem(selectedItem.id, "column", e.target.value)} placeholder="1 / 3" className="w-full h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Grid Row</label>
                <input type="text" value={selectedItem.row} onChange={(e) => updateItem(selectedItem.id, "row", e.target.value)} placeholder="1" className="w-full h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono" />
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-1">
              <button onClick={() => setSelectedId(item.id)} className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all ${selectedId === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{item.label}</button>
              <button onClick={() => removeItem(item.id)} aria-label={`Remove item ${item.label}`} className="text-muted-foreground hover:text-rose-500 cursor-pointer"><Minus className="size-3" /></button>
            </div>
          ))}
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
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin max-h-48 overflow-y-auto"><code>{fullCss}</code></pre>
      </div>
    </div>
  );
}
