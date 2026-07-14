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
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal, SectionHeading } from "@/components/roycss/motion-primitives";

/* ─── Tiny copy button ─────────────────────────────────────── */
function CopyChip({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
        copied
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      {copied ? "Copied" : label}
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
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {Icon && <Icon className="size-3" />}
            {title}
          </span>
          <CopyChip text={code} />
        </div>
      )}
      <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed scrollbar-thin">
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
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Step {index}
        </p>
        <h3 className="font-display text-base font-semibold text-foreground leading-tight">
          {title}
        </h3>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
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
      <div className="text-[11px] text-amber-200/90 leading-relaxed">
        <span className="font-semibold text-amber-400">Pro tip: </span>
        {children}
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export function GetStarted() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid opacity-15 roycss-fade-mask-b" />
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Up and running in 60 seconds"
          title="Get Started"
          subtitle="Install once, import the stylesheet, and drop a class on any element. Choose the path that matches your stack."
        />

        <ScrollReveal delay={0.15} className="mt-10 max-w-3xl mx-auto">
          <Accordion
            type="single"
            collapsible
            defaultValue="step-1"
            className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-4 sm:px-5"
          >
            {/* ───── Step 1: Install ───── */}
            <AccordionItem value="step-1" className="border-border/40">
              <AccordionTrigger className="hover:no-underline">
                <StepHeader
                  index={1}
                  title="Install RoyCSS"
                  icon={Download}
                  hint="Pick the package manager you already use — or skip install with the CDN."
                />
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <CodeBlock
                  title="npm"
                  icon={Terminal}
                  code={`npm install roycss`}
                />
                <CodeBlock
                  title="yarn"
                  icon={Terminal}
                  code={`yarn add roycss`}
                />
                <CodeBlock
                  title="bun"
                  icon={Terminal}
                  code={`bun add roycss`}
                />
                <CodeBlock
                  title="CDN (no install)"
                  icon={PackageOpen}
                  code={`<link rel="stylesheet"
      href="https://unpkg.com/roycss/dist/roycss.min.css" />`}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ───── Step 2: Import ───── */}
            <AccordionItem value="step-2" className="border-border/40">
              <AccordionTrigger className="hover:no-underline">
                <StepHeader
                  index={2}
                  title="Import the stylesheet"
                  icon={PackageOpen}
                  hint="One global import — then use any .roycss-* class anywhere."
                />
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <CodeBlock
                  title="React / Next.js (App Router)"
                  icon={Code2}
                  code={`// src/app/layout.tsx
import "roycss/dist/roycss.min.css";`}
                />
                <CodeBlock
                  title="Vue 3"
                  icon={Code2}
                  code={`// src/main.ts
import { createApp } from "vue";
import "roycss/dist/roycss.min.css";
import App from "./App.vue";
createApp(App).mount("#app");`}
                />
                <CodeBlock
                  title="Angular"
                  icon={Code2}
                  code={`// angular.json → architect.build.options.styles
"styles": [
  "node_modules/roycss/dist/roycss.min.css",
  "src/styles.css"
]`}
                />
                <CodeBlock
                  title="Svelte"
                  icon={Code2}
                  code={`// src/main.ts
import "roycss/dist/roycss.min.css";`}
                />
                <CodeBlock
                  title="Vanilla HTML"
                  icon={Code2}
                  code={`<link rel="stylesheet" href="roycss.css" />`}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ───── Step 3: Add a class ───── */}
            <AccordionItem value="step-3" className="border-border/40">
              <AccordionTrigger className="hover:no-underline">
                <StepHeader
                  index={3}
                  title="Add a class to any element"
                  icon={Wand2}
                  hint="Every effect is a single self-contained class — copy, paste, ship."
                />
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <CodeBlock
                  title="HTML"
                  icon={Code2}
                  code={`<button class="roycss-btn-shine">
  Hover me
</button>

<h1 class="roycss-text-gradient">RoyCSS</h1>`}
                />
                <CodeBlock
                  title="React"
                  icon={Code2}
                  code={`export function CTA() {
  return (
    <button className="roycss-btn-shine" type="button">
      Hover me
    </button>
  );
}`}
                />
                <CodeBlock
                  title="Vue"
                  icon={Code2}
                  code={`<template>
  <button class="roycss-btn-shine" type="button">
    Hover me
  </button>
</template>`}
                />
                <ProTip>
                  Some effects target a child <code>&lt;span&gt;</code> for an
                  extra layer of animation (e.g. shimmer sweeps, glitch layers).
                  When a snippet includes <code>&lt;span&gt;</code> in its
                  markup, keep that child — it powers the secondary animation.
                </ProTip>
              </AccordionContent>
            </AccordionItem>

            {/* ───── Step 4: CLI tool ───── */}
            <AccordionItem value="step-4" className="border-border/40">
              <AccordionTrigger className="hover:no-underline">
                <StepHeader
                  index={4}
                  title="Use the RoyCSS CLI"
                  icon={Terminal}
                  hint="Scaffold, search, and add effects straight from your terminal."
                />
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <CodeBlock
                  title="init — scaffold RoyCSS in a project"
                  icon={Rocket}
                  code={`npx roycss init`}
                />
                <CodeBlock
                  title="search — find effects by keyword"
                  icon={Search}
                  code={`npx roycss search "glass card"
npx roycss search --category hover`}
                />
                <CodeBlock
                  title="add — copy an effect's CSS to your clipboard"
                  icon={Plus}
                  code={`npx roycss add btn-shine
npx roycss add text-gradient --copy`}
                />
                <CodeBlock
                  title="list — browse all 700+ effects"
                  icon={ListPlus}
                  code={`npx roycss list
npx roycss list --category loaders --tag spinner`}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ───── Step 5: VS Code snippets ───── */}
            <AccordionItem value="step-5" className="border-border/40">
              <AccordionTrigger className="hover:no-underline">
                <StepHeader
                  index={5}
                  title="Install the VS Code snippets"
                  icon={FileCode2}
                  hint="Type roycss- + Tab to insert any of the 700 effects instantly."
                />
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <CodeBlock
                  title="Install via Marketplace (CLI)"
                  icon={Terminal}
                  code={`code --install-extension roycss.roycss-snippets`}
                />
                <CodeBlock
                  title="Or drop the snippets file in manually"
                  icon={FileCode2}
                  code={`{
  "RoyCSS — Shine Button": {
    "prefix": "roycss-btn-shine",
    "body": [
      "<button class=\\"roycss-btn-shine\\" type=\\"button\\">",
      "  \${1:Hover me}",
      "</button>"
    ],
    "description": "Insert the RoyCSS shine-sweep button"
  },
  "RoyCSS — Gradient Text": {
    "prefix": "roycss-text-gradient",
    "body": [
      "<span class=\\"roycss-text-gradient\\">\${1:RoyCSS}</span>"
    ],
    "description": "Insert the RoyCSS animated gradient text"
  }
}`}
                />
                <ProTip>
                  Save the snippet file at{" "}
                  <code>.vscode/roycss.code-snippets</code> in your repo, or in{" "}
                  <code>~/.config/Code/User/snippets/</code> for global access.
                </ProTip>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
