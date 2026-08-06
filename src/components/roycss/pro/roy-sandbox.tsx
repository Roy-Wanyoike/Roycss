"use client";

/**
 * RoySandbox — online dev environment.
 *
 * Self-contained code editor (textarea + monospace) with live
 * preview iframe (srcDoc), three file tabs (HTML / CSS / JS),
 * starter template selector, Run / Share / Fork actions. The
 * preview renders the actual editor content.
 *
 * Palette: emerald primary. No indigo / blue. TS strict, zero
 * `any`. The iframe uses `srcDoc` so it never touches the parent
 * DOM. All state is local React state — no persistence.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Code2,
  FileCode,
  GitFork,
  Hash,
  Layout,
  Play,
  Share2,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type FileKey = "html" | "css" | "js";
type TemplateId = "blank" | "dashboard" | "landing";

interface FileState {
  html: string;
  css: string;
  js: string;
}

interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: typeof Layout;
  files: FileState;
}

// ─── Templates ───────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty canvas with a single centered div.",
    icon: Layout,
    files: {
      html: `<div class="card">
  <h1>Hello, RoyCSS</h1>
  <p>Edit any file and press Run.</p>
</div>
`,
      css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: oklch(0.98 0.02 165);
  color: oklch(0.25 0.05 165);
}
.card {
  padding: 2.5rem 3rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.15);
  text-align: center;
}
h1 { margin: 0 0 0.5rem; color: oklch(0.55 0.15 165); }
p { margin: 0; color: oklch(0.45 0.04 165); }
`,
      js: `console.log("RoyCSS sandbox ready");`,
    },
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Sidebar + KPI grid + chart placeholder.",
    icon: Hash,
    files: {
      html: `<aside>
  <h2>RoyCSS</h2>
  <nav><a>Overview</a><a>Analytics</a><a>Settings</a></nav>
</aside>
<main>
  <header><h1>Overview</h1><span>Live</span></header>
  <section class="kpis">
    <div><span>Visitors</span><strong>12.4k</strong></div>
    <div><span>Revenue</span><strong>$48.2k</strong></div>
    <div><span>Churn</span><strong>1.8%</strong></div>
  </section>
  <section class="chart"><div class="bar"></div><div class="bar"></div><div class="bar"></div></section>
</main>
`,
      css: `* { box-sizing: border-box; }
body { margin: 0; display: grid; grid-template-columns: 220px 1fr;
  font-family: system-ui; background: oklch(0.98 0.01 165); color: oklch(0.25 0.04 165); }
aside { background: oklch(0.96 0.02 165); padding: 1.5rem 1rem; }
aside h2 { color: oklch(0.55 0.15 165); margin: 0 0 1rem; }
nav a { display: block; padding: 0.5rem 0.75rem; border-radius: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; }
nav a:hover { background: white; }
main { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; }
header span { background: oklch(0.55 0.15 165); color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
.kpis div { background: white; padding: 1.25rem; border-radius: 0.75rem; box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.1); }
.kpis span { color: oklch(0.5 0.03 165); font-size: 0.8rem; }
.kpis strong { display: block; font-size: 1.5rem; margin-top: 0.25rem; }
.chart { display: flex; gap: 0.5rem; align-items: flex-end; height: 120px; background: white; padding: 1rem; border-radius: 0.75rem; }
.chart .bar { flex: 1; background: oklch(0.65 0.15 165); border-radius: 0.25rem 0.25rem 0 0; }
.chart .bar:nth-child(2) { height: 80%; }
.chart .bar:nth-child(1) { height: 60%; }
.chart .bar:nth-child(3) { height: 95%; }
`,
      js: `document.querySelectorAll("nav a").forEach((el) =>
  el.addEventListener("click", () => console.log("Switch view"))
);`,
    },
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Hero + CTA + feature trio.",
    icon: Sparkles,
    files: {
      html: `<header>
  <div class="brand">RoyCSS</div>
  <button>Get Started</button>
</header>
<section class="hero">
  <h1>Ship beautiful UI,<br>faster.</h1>
  <p>A modern CSS platform with tokens, effects, and a CLI.</p>
  <button class="cta">Try the Playground</button>
</section>
<section class="features">
  <div><h3>Tokens</h3><p>OKLCH design tokens.</p></div>
  <div><h3>Effects</h3><p>200+ curated CSS effects.</p></div>
  <div><h3>CLI</h3><p>Scaffold in seconds.</p></div>
</section>
`,
      css: `* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui; color: oklch(0.25 0.04 165);
  background: linear-gradient(180deg, oklch(0.98 0.02 165), white); }
header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; }
.brand { font-weight: 700; color: oklch(0.55 0.15 165); }
header button { background: oklch(0.55 0.15 165); color: white; border: 0; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
.hero { text-align: center; padding: 5rem 2rem; }
.hero h1 { font-size: 3rem; line-height: 1.1; margin: 0 0 1rem; }
.hero p { color: oklch(0.5 0.03 165); font-size: 1.1rem; margin: 0 0 2rem; }
.cta { background: oklch(0.55 0.15 165); color: white; border: 0; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
.features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 2rem; max-width: 1000px; margin: 0 auto; }
.features div { background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.08); }
.features h3 { color: oklch(0.55 0.15 165); margin: 0 0 0.5rem; }
.features p { color: oklch(0.5 0.03 165); margin: 0; }
`,
      js: `document.querySelector(".cta").addEventListener("click", () => alert("Welcome to RoyCSS!"));`,
    },
  },
];

const FILE_TABS: { key: FileKey; label: string; icon: typeof FileCode }[] = [
  { key: "html", label: "index.html", icon: FileCode },
  { key: "css", label: "styles.css", icon: Hash },
  { key: "js", label: "script.js", icon: TypeIcon },
];

// ─── Component ───────────────────────────────────────────────────────────

export function RoySandbox() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileState>(TEMPLATES[1].files);
  const [activeTab, setActiveTab] = useState<FileKey>("html");
  const [templateId, setTemplateId] = useState<TemplateId>("dashboard");
  const [preview, setPreview] = useState<FileState>(TEMPLATES[1].files);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${preview.css}</style>
  </head>
  <body>
    ${preview.html}
    <script>
      try { ${preview.js} } catch (e) { console.error(e); }
    <\/script>
  </body>
</html>`;
  }, [preview]);

  const run = useCallback(() => {
    setPreview(files);
    toast({ title: "Preview updated", description: "Editor output rendered." });
  }, [files, toast]);

  const applyTemplate = useCallback((id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateId(tpl.id);
    setFiles(tpl.files);
    setPreview(tpl.files);
    setActiveTab("html");
  }, []);

  const share = useCallback(() => {
    toast({ title: "Shareable link copied", description: "https://sandbox.roycss.dev/p/4f7a-9c2b" });
  }, [toast]);

  const fork = useCallback(() => {
    toast({ title: "Project forked", description: "A copy is now in your workspace." });
  }, [toast]);

  const updateFile = useCallback((key: FileKey, value: string) => {
    setFiles((prev) => ({ ...prev, [key]: value }));
  }, []);

  const lineCount = files[activeTab].split("\n").length;

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg">
              <Code2 className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">RoySandbox</CardTitle>
              <CardDescription className="text-xs">
                Live HTML / CSS / JS preview.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={templateId} onValueChange={applyTemplate}>
              <SelectTrigger className="h-9 w-[170px]" aria-label="Template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-3.5" /> {t.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fork} className="gap-1.5">
              <GitFork className="size-3.5" /> Fork
            </Button>
            <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
              <Share2 className="size-3.5" /> Share
            </Button>
            <Button size="sm" onClick={run} className="gap-1.5">
              <Play className="size-3.5" /> Run
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-0 p-0 lg:grid-cols-2">
        {/* Editor */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1">
            <div className="flex">
              {FILE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
            <Badge variant="secondary" className="text-[10px]">{lineCount} lines</Badge>
          </div>
          <textarea
            value={files[activeTab]}
            onChange={(e) => updateFile(activeTab, e.target.value)}
            spellCheck={false}
            aria-label={`${activeTab} editor`}
            className="bg-background min-h-[420px] flex-1 resize-none p-4 font-mono text-xs leading-relaxed outline-none"
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="bg-emerald-500 size-2 rounded-full" />
              <span className="bg-amber-500 size-2 rounded-full" />
              <span className="bg-rose-500 size-2 rounded-full" />
              <span className="ml-2">localhost:3000</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Live Preview</Badge>
          </div>
          <iframe
            ref={iframeRef}
            title="RoySandbox preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="bg-white min-h-[420px] w-full flex-1 border-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
