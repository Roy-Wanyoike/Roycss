"use client";

import { useState } from "react";
import { Terminal, PackageOpen, Code2 } from "lucide-react";
import {
  getFrameworkExamples,
  type FrameworkExample,
  type FrameworkId,
} from "@/lib/framework-adapters";
import { CopyButton } from "./copy-button";

/* ─── Code block with a header label + shared copy button ──── */
function CodeBlock({
  title,
  icon: Icon,
  code,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/30">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Icon className="size-3" />
          {title}
        </span>
        <CopyButton text={code} label={title} />
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed scrollbar-thin max-h-72 overflow-y-auto">
        <code className="font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/* ─── Main FrameworkUsage component ─────────────────────────── */
export function FrameworkUsage({
  effectId,
  effectName,
}: {
  effectId: string;
  effectName: string;
}) {
  const examples: FrameworkExample[] = getFrameworkExamples(
    effectId,
    effectName,
  );
  const [active, setActive] = useState<FrameworkId>("react");
  const current =
    examples.find((e) => e.id === active) ?? examples[0];

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <PackageOpen className="size-3.5 text-primary" />
        Use in your framework
      </h4>

      {/* Framework tab bar */}
      <div className="flex flex-wrap gap-1 mb-3 p-1 rounded-xl bg-muted/60 border border-border/40">
        {examples.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setActive(ex.id)}
            className={`flex-1 min-w-[5.5rem] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              active === ex.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-pressed={active === ex.id}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {current.description}
      </p>

      <div className="space-y-3">
        <CodeBlock title="Install" icon={Terminal} code={current.install} />
        <CodeBlock title="Import" icon={PackageOpen} code={current.import} />
        <CodeBlock title="Usage" icon={Code2} code={current.usage} />
      </div>
    </div>
  );
}
