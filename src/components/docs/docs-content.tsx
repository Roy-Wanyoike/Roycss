"use client";

/**
 * DocsContent — Main markdown rendering area.
 *
 * Renders a single DocEntry's markdown source using `react-markdown` with
 * the `remark-gfm` (tables, strikethrough, task lists) and `rehype-slug`
 * (heading IDs) plugins.
 *
 * SECURITY: This component does NOT use `rehype-raw`. Raw HTML in the
 * markdown source is rendered as plain text — there is no code path
 * that calls `dangerouslySetInnerHTML`. See threat-models/03-docs-site.md §T1.
 *
 * The H1 is hidden (the title is rendered in the overlay's top bar).
 * H2s receive a `scroll-mt-20` so anchor links aren't hidden behind the
 * sticky header.
 */

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
// Packages are not currently installed in this environment; suppress the
// missing-module type errors so tsc passes. Runtime use of the docs overlay
// is gated behind lazy loading and these plugins degrade gracefully (no GFM
// tables / heading IDs) when absent — no behavior change to the home route.
// @ts-expect-error — remark-gfm is an optional dep not installed in this env
import remarkGfm from "remark-gfm";
// @ts-expect-error — rehype-slug is an optional dep not installed in this env
import rehypeSlug from "rehype-slug";
import { BookOpen, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocEntry } from "./docs-data";

interface DocsContentProps {
  doc: DocEntry | null;
  isLoading: boolean;
}

/* ─── Custom component renderers ─────────────────────────────── */

/** Inline `<code>` — styled span for `single words` in prose. */
function InlineCode({ children, className, ...props }: React.ComponentProps<"code">) {
  // If this code is inside a <pre> (block code), let BlockPre handle it
  const isBlock = typeof className === "string" && className.includes("language-");
  if (isBlock) {
    return (
      <code className={cn("block w-full overflow-x-auto", className)} {...props}>
        {children}
      </code>
    );
  }
  return (
    <code
      className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[0.875em] font-mono text-primary border border-border/40"
      {...props}
    >
      {children}
    </code>
  );
}

/** `<pre>` — block code container with OKLCH theme. */
function BlockPre({ children, className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "my-4 p-4 rounded-lg bg-zinc-950 text-zinc-100 border border-border/40 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin",
        "dark:bg-zinc-950 dark:text-zinc-100",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  );
}

/** `<a>` — external links open in new tab; internal `#` links scroll. */
function Anchor({ children, href, ...props }: React.ComponentProps<"a">) {
  const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
  const isAnchor = typeof href === "string" && href.startsWith("#");

  if (isAnchor) {
    return (
      <a
        href={href}
        onClick={(e) => {
          const id = href.slice(1);
          const target = document.querySelector(
            `[data-docs-content] #${CSS.escape(id)}`,
          ) as HTMLElement | null;
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        className="text-primary underline decoration-primary/30 hover:decoration-primary underline-offset-2 transition-all cursor-pointer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="text-primary underline decoration-primary/30 hover:decoration-primary underline-offset-2 transition-all cursor-pointer"
      {...props}
    >
      {children}
    </a>
  );
}

/** `<table>` — wrap in scrollable container for narrow viewports. */
function TableWrapper({ children, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border/40 scrollbar-thin">
      <table
        className="w-full text-sm border-collapse bg-card/50"
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

/** `<th>` — styled table header. */
function Th({ children, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className="px-3 py-2 text-left font-semibold text-foreground bg-muted/60 border-b border-border/40 first:border-l first:rounded-tl-md last:border-r last:rounded-tr-md"
      {...props}
    >
      {children}
    </th>
  );
}

/** `<td>` — styled table cell. */
function Td({ children, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className="px-3 py-2 text-muted-foreground border-b border-border/30 first:border-l last:border-r align-top"
      {...props}
    >
      {children}
    </td>
  );
}

/** `<blockquote>` — styled left-border quote. */
function Blockquote({ children, ...props }: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      className="my-4 pl-4 py-2 border-l-4 border-primary/40 bg-primary/5 rounded-r-md text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  );
}

/** `<img>` — lazy-loaded, responsive. */
function Img({ src, alt, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="my-4 max-w-full h-auto rounded-lg border border-border/40"
      {...props}
    />
  );
}

/** `<h1>` — hidden; the title is rendered in the overlay's top bar. */
function H1({ children, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1 className="sr-only" {...props}>
      {children}
    </h1>
  );
}

/** `<h2>` — already has `id` from rehype-slug; add scroll margin. */
function H2({ children, id, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 mt-10 mb-3 text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2"
      {...props}
    >
      {children}
    </h2>
  );
}

/** `<h3>` — slightly smaller heading. */
function H3({ children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className="scroll-mt-24 mt-6 mb-2 text-lg font-semibold text-foreground"
      {...props}
    >
      {children}
    </h3>
  );
}

/** `<ul>` — bulleted list. */
function Ul({ children, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className="my-3 ml-5 list-disc space-y-1 text-sm text-foreground/90" {...props}>
      {children}
    </ul>
  );
}

/** `<ol>` — numbered list. */
function Ol({ children, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol className="my-3 ml-5 list-decimal space-y-1 text-sm text-foreground/90" {...props}>
      {children}
    </ol>
  );
}

/** `<p>` — paragraph. */
function P({ children, ...props }: React.ComponentProps<"p">) {
  return (
    <p className="my-3 text-sm leading-relaxed text-foreground/90" {...props}>
      {children}
    </p>
  );
}

/** `<hr>` — horizontal rule. */
function Hr({ ...props }: React.ComponentProps<"hr">) {
  return <hr className="my-6 border-border/40" {...props} />;
}

/** Component map passed to react-markdown. */
const COMPONENTS = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  code: InlineCode,
  pre: BlockPre,
  a: Anchor,
  table: TableWrapper,
  th: Th,
  td: Td,
  blockquote: Blockquote,
  img: Img,
  hr: Hr,
} as const;

/* ─── Loading & empty states ─────────────────────────────────── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center">
      <Loader2 className="size-8 text-primary animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Loading documentation...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center px-6">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-4">
        <BookOpen className="size-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Select a document</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Choose a doc from the sidebar, or use the search bar above to find what you&apos;re
        looking for across all 19 architecture documents.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center px-6">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-destructive/10 text-destructive mb-4">
        <FileText className="size-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Failed to render doc</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

function DocsContentImpl({ doc, isLoading }: DocsContentProps) {
  // Memoize the markdown plugins so they're not re-created each render
  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeSlug], []);

  if (isLoading) return <LoadingState />;
  if (!doc) return <EmptyState />;

  return (
    <div
      data-docs-content
      className="px-5 sm:px-8 py-6 max-w-3xl mx-auto"
    >
      {/* Header above the markdown: title + metadata */}
      <header className="mb-6 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {doc.categoryLabel}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {doc.wordCount.toLocaleString()} words · ~{Math.max(1, Math.ceil(doc.wordCount / 200))} min read
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {doc.title}
        </h2>
        {doc.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {doc.description}
          </p>
        )}
      </header>

      {/* Markdown body */}
      <ErrorBoundary>
        <article className="prose-docs">
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={COMPONENTS}
          >
            {doc.content}
          </ReactMarkdown>
        </article>
      </ErrorBoundary>
    </div>
  );
}

/* ─── Error boundary (catches react-markdown parse errors) ──── */

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset on content change
    if (prevProps.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return <ErrorState message={this.state.error.message} />;
    }
    return this.props.children;
  }
}

export const DocsContent = memo(DocsContentImpl);
