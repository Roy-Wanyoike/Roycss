"use client";

import { Terminal, PackageOpen, Code2 } from "lucide-react";
import {
  getFrameworkExamples,
  type FrameworkExample,
} from "@/lib/framework-adapters";
import { FrameworkTabs } from "./framework-tabs";
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
/**
 * "Use in your framework" for the effect detail DIALOG (issue #190; ARIA
 * tabs semantics via the shared FrameworkTabs since issue #246).
 *
 * The tab bar + panel structure (visual design) and the per-panel copy
 * buttons are unchanged — the only delta is semantics: the stack buttons
 * are now role="tab" with aria-selected + roving tabindex + arrow-key
 * navigation instead of the old pressed-state toggle buttons, and the
 * active stack's content lives in a role="tabpanel" wired by
 * aria-labelledby. The React default tab matches the historical
 * useState("react") seed.
 */
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

  const panels = examples.map((ex) => (
    <div key={ex.id}>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {ex.description}
      </p>
      <div className="space-y-3">
        <CodeBlock title="Install" icon={Terminal} code={ex.install} />
        <CodeBlock title="Import" icon={PackageOpen} code={ex.import} />
        <CodeBlock title="Usage" icon={Code2} code={ex.usage} />
      </div>
    </div>
  ));

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <PackageOpen className="size-3.5 text-primary" />
        Use in your framework
      </h4>

      <FrameworkTabs
        examples={examples}
        panels={panels}
        initialActiveId="react"
      />
    </div>
  );
}
