"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Download,
  Terminal,
  PackageOpen,
  Code2,
  Wand2,
  Search,
  ListPlus,
  Plus,
  FileCode2,
  Lightbulb,
  Rocket,
  ChevronDown,
} from "lucide-react";
import { ScrollReveal, SectionHeading } from "@/components/roycss/motion-primitives";

/* ─── Custom Accordion (no Radix = no hydration mismatch) ──── */
function AccordionItem({
  isOpen,
  onToggle,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return <div className="border-b border-border/40 last:border-b-0">{children(isOpen, onToggle)}</div>;
}

function AccordionTrigger({
  isOpen,
  onToggle,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors cursor-pointer"
    >
      {children}
      <ChevronDown className={`size-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );
}

function AccordionContent({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return <div className="pb-4 space-y-3">{children}</div>;
}

/* ─── Tiny copy button ─────────────────────────────────────── */
function CopyChip({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: use deprecated execCommand for non-HTTPS / older browsers
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setFailed(false);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setFailed(true);
        setTimeout(() => setFailed(false), 3000);
      }
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
        failed
          ? "bg-rose-500/15 text-rose-500"
          : copied
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {failed ? <Copy className="size-2.5" /> : copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      {failed ? "Failed" : copied ? "Copied" : label}
    </button>
  );
}

/* ─── Code block with header + copy ────────────────────────── */
function CodeBlock({
  title,
  icon: Icon,
  code,
}: {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/30">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {Icon && <Icon className="size-3" />}
            {title}
          </span>
          <CopyChip text={code} />
        </div>
      )}
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed scrollbar-thin">
        <code className="font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/* ─── Step header ──────────────────────────────────────────── */
function StepHeader({
  index,
  title,
  icon: Icon,
  hint,
}: {
  index: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Step {index}
        </p>
        <h3 className="font-display text-base font-semibold text-foreground leading-tight">
          {title}
        </h3>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Pro tip callout ──────────────────────────────────────── */
function ProTip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-200/90 leading-relaxed">
        <span className="font-semibold text-amber-400">Pro tip: </span>
        {children}
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export function GetStarted() {
  const [openStep, setOpenStep] = useState(1);
  return (
    <section id="get-started" className="py-16 sm:py-20 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 -z-10 bg-grid opacity-15 roycss-fade-mask-b" />
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Up and running in 60 seconds"
          title="Get Started"
          subtitle="Install once, import the stylesheet, and drop a class on any element. Choose the path that matches your stack."
        />

        <ScrollReveal delay={0.15} className="mt-10 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-4 sm:px-5">
            {/* ───── Step 1: Install ───── */}
            <AccordionItem isOpen={openStep === 1} onToggle={() => setOpenStep(openStep === 1 ? 0 : 1)}>
              {(isOpen, onToggle) => (
                <>
                  <AccordionTrigger isOpen={isOpen} onToggle={onToggle}>
                    <StepHeader
                      index={1}
                      title="Install RoyCSS"
                      icon={Download}
                      hint="Pick the package manager you already use — or skip install with the CDN."
                    />
                  </AccordionTrigger>
                  <AccordionContent isOpen={isOpen}>
                    <CodeBlock title="npm" icon={Terminal} code={`npm install roycss`} />
                    <CodeBlock title="pnpm" icon={Terminal} code={`pnpm add roycss`} />
                    <CodeBlock title="yarn" icon={Terminal} code={`yarn add roycss`} />
                    <CodeBlock title="bun" icon={Terminal} code={`bun add roycss`} />
                    <CodeBlock title="deno" icon={Terminal} code={`deno add npm:roycss`} />
                    <CodeBlock
                      title="CDN (no install)"
                      icon={PackageOpen}
                      code={`<link rel="stylesheet"
      href="https://unpkg.com/roycss/dist/roycss.min.css" />`}
                    />
                  </AccordionContent>
                </>
              )}
            </AccordionItem>

            {/* ───── Step 2: Import ───── */}
            <AccordionItem isOpen={openStep === 2} onToggle={() => setOpenStep(openStep === 2 ? 0 : 2)}>
              {(isOpen, onToggle) => (
                <>
                  <AccordionTrigger isOpen={isOpen} onToggle={onToggle}>
                    <StepHeader
                      index={2}
                      title="Import the stylesheet"
                      icon={PackageOpen}
                      hint="One global import — then use any .roycss-* class anywhere."
                    />
                  </AccordionTrigger>
                  <AccordionContent isOpen={isOpen}>
                    <CodeBlock title="React / Next.js (App Router)" icon={Code2} code={`// src/app/layout.tsx\nimport "roycss/dist/roycss.min.css";`} />
                    <CodeBlock title="Vue 3" icon={Code2} code={`// src/main.ts\nimport { createApp } from "vue";\nimport "roycss/dist/roycss.min.css";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");`} />
                    <CodeBlock title="Angular" icon={Code2} code={`// angular.json → architect.build.options.styles\n"styles": [\n  "node_modules/roycss/dist/roycss.min.css",\n  "src/styles.css"\n]`} />
                    <CodeBlock title="Svelte" icon={Code2} code={`// src/main.ts\nimport "roycss/dist/roycss.min.css";`} />
                    <CodeBlock title="Vanilla HTML" icon={Code2} code={`<link rel="stylesheet" href="roycss.css" />`} />
                  </AccordionContent>
                </>
              )}
            </AccordionItem>

            {/* ───── Step 3: Add a class ───── */}
            <AccordionItem isOpen={openStep === 3} onToggle={() => setOpenStep(openStep === 3 ? 0 : 3)}>
              {(isOpen, onToggle) => (
                <>
                  <AccordionTrigger isOpen={isOpen} onToggle={onToggle}>
                    <StepHeader
                      index={3}
                      title="Add a class to any element"
                      icon={Wand2}
                      hint="Every effect is a single self-contained class — copy, paste, ship."
                    />
                  </AccordionTrigger>
                  <AccordionContent isOpen={isOpen}>
                    <CodeBlock title="HTML" icon={Code2} code={`<button class="roycss-btn-shine">\n  Hover me\n</button>\n\n<h1 class="roycss-text-gradient">RoyCSS</h1>`} />
                    <CodeBlock title="React" icon={Code2} code={`export function CTA() {\n  return (\n    <button className="roycss-btn-shine" type="button">\n      Hover me\n    </button>\n  );\n}`} />
                    <CodeBlock title="Vue" icon={Code2} code={`<template>\n  <button class="roycss-btn-shine" type="button">\n    Hover me\n  </button>\n</template>`} />
                    <ProTip>
                      Some effects target a child <code>&lt;span&gt;</code> for an
                      extra layer of animation (e.g. shimmer sweeps, glitch layers).
                      When a snippet includes <code>&lt;span&gt;</code> in its
                      markup, keep that child — it powers the secondary animation.
                    </ProTip>
                  </AccordionContent>
                </>
              )}
            </AccordionItem>

            {/* ───── Step 4: CLI tool ───── */}
            <AccordionItem isOpen={openStep === 4} onToggle={() => setOpenStep(openStep === 4 ? 0 : 4)}>
              {(isOpen, onToggle) => (
                <>
                  <AccordionTrigger isOpen={isOpen} onToggle={onToggle}>
                    <StepHeader
                      index={4}
                      title="Use the RoyCSS CLI"
                      icon={Terminal}
                      hint="Scaffold, search, and add effects straight from your terminal."
                    />
                  </AccordionTrigger>
                  <AccordionContent isOpen={isOpen}>
                    <CodeBlock title="init — scaffold RoyCSS in a project" icon={Rocket} code={`npx roycss init`} />
                    <CodeBlock title="search — find effects by keyword" icon={Search} code={`npx roycss search "glass card"\nnpx roycss search --category hover`} />
                    <CodeBlock title="add — copy an effect's CSS to your clipboard" icon={Plus} code={`npx roycss add btn-shine\nnpx roycss add text-gradient --copy`} />
                    <CodeBlock title="list — browse all 840+ effects" icon={ListPlus} code={`npx roycss list\nnpx roycss list --category loaders --tag spinner`} />
                  </AccordionContent>
                </>
              )}
            </AccordionItem>

            {/* ───── Step 5: VS Code snippets ───── */}
            <AccordionItem isOpen={openStep === 5} onToggle={() => setOpenStep(openStep === 5 ? 0 : 5)}>
              {(isOpen, onToggle) => (
                <>
                  <AccordionTrigger isOpen={isOpen} onToggle={onToggle}>
                    <StepHeader
                      index={5}
                      title="Install the VS Code snippets"
                      icon={FileCode2}
                      hint="Type roycss- + Tab to insert any of the 840+ effects instantly."
                    />
                  </AccordionTrigger>
                  <AccordionContent isOpen={isOpen}>
                    <CodeBlock title="Install via Marketplace (CLI)" icon={Terminal} code={`code --install-extension roycss.roycss-snippets`} />
                    <CodeBlock
                      title="Or drop the snippets file in manually"
                      icon={FileCode2}
                      code={'{\n  "RoyCSS — Shine Button": {\n    "prefix": "roycss-btn-shine",\n    "body": [\n      "<button class=\\"roycss-btn-shine\\" type=\\"button\\">",\n      "  ${1:Hover me}",\n      "</button>"\n    ]\n  }\n}'}
                    />
                    <ProTip>
                      Save the snippet file at{" "}
                      <code>.vscode/roycss.code-snippets</code> in your repo, or in{" "}
                      <code>~/.config/Code/User/snippets/</code> for global access.
                    </ProTip>
                  </AccordionContent>
                </>
              )}
            </AccordionItem>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
