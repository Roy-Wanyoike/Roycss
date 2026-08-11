"use client";

/**
 * NestingConverter — a self-contained CSS Nesting Converter (flat ↔ nested).
 *
 * Converts between flat CSS (with repeated selectors / BEM-style) and nested
 * CSS using the native CSS Nesting syntax (`&`). Native CSS nesting is
 * baseline (2023+) in all major browsers; this tool helps developers
 * modernize old CSS and understand the syntax.
 *
 * Two directions:
 *   • "Nest"     (flat → nested, default): pastes flat CSS in, gets nested.
 *   • "Flatten"  (nested → flat):          pastes nested CSS in, gets flat.
 *
 * Features:
 *   - Custom brace-matching tokenizer (no external CSS parser dependency).
 *     Handles strings, comments, parens (`:not(.a, .b)`), brackets
 *     (`[data-x="y"]`), at-rules (`@media`, `@supports`, `@keyframes`,
 *     `@font-face`, leaf `@import`/`@charset`), combinators (`>`, `+`, `~`),
 *     pseudo-classes/elements (`:hover`, `::before`, `:nth-child(n)`).
 *   - Round-trip safe: flat → nested → flat yields equivalent CSS.
 *   - Options: indent (2/4/tab), merge duplicate selectors, preserve comments.
 *   - Copy output, swap (output → input + flip direction), load example, clear.
 *   - Stats: input rules, output rules, max nesting depth.
 *
 * All parsing is client-side. Defensive try/catch around the converter; on
 * failure a red `Alert` shows the error message and the UI stays responsive.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Code2,
  Copy,
  GitCompare,
  IndentIncrease,
  Sparkles,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================
// Types
// ============================================================

type Direction = "nest" | "flatten";
type IndentStyle = "2" | "4" | "tab";

interface ConvertOptions {
  indent: IndentStyle;
  mergeDuplicates: boolean;
  preserveComments: boolean;
}

/** A declaration: `prop: value`. */
interface Decl {
  prop: string;
  value: string;
}

/** A parsed CSS node — discriminated union. */
type CssNode =
  | { kind: "comment"; text: string }
  | { kind: "decl"; prop: string; value: string }
  | { kind: "raw"; text: string }
  | { kind: "rule"; selector: string; body: CssNode[] }
  | {
      kind: "atRule";
      prelude: string;
      body: CssNode[] | null;
      leaf: boolean;
    };

// ============================================================
// Parser — brace-matching tokenizer (no external deps)
// ------------------------------------------------------------
// Walks the string char by char, tracking brace depth, comments,
// strings, and parens. Produces a tree of `CssNode`s.
//
// Top-level rules:    `selector { ... }`  →  rule node
// At-rules w/ body:   `@media (...) { ... }` → atRule node (leaf=false)
// Leaf at-rules:      `@import url(...);`  →  atRule node (leaf=true)
// Declarations:       `prop: value;`       →  decl node
// Comments:           `/* ... *​/`          →  comment node
// Anything else:      →  raw node (pass-through)
// ============================================================

/** Parse a CSS string into a tree of nodes. */
function parseCss(input: string): CssNode[] {
  const root: CssNode[] = [];
  const n = input.length;
  let i = 0;
  while (i < n) {
    const prevI = i;
    const stoppedAt = parseItems(input, i, n, root);
    i = stoppedAt;
    // Skip the closing brace that stopped us (if any).
    if (i < n && input[i] === "}") i++;
    // Safety: ensure forward progress to avoid infinite loops.
    if (i === prevI) i++;
  }
  return root;
}

/**
 * Parse a sequence of items (rules, declarations, at-rules, comments)
 * from `start` until we hit a `}` (at the current depth) or end of input.
 * Returns the index of the stopping position (the `}` or end).
 */
function parseItems(
  input: string,
  start: number,
  end: number,
  out: CssNode[],
): number {
  let i = start;
  let buffer = "";
  while (i < end) {
    const c = input[i];

    // Comment?
    if (c === "/" && i + 1 < end && input[i + 1] === "*") {
      const closeIdx = input.indexOf("*/", i + 2);
      const commentEnd = closeIdx === -1 ? end : closeIdx + 2;
      out.push({ kind: "comment", text: input.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }

    // String? (handle escapes)
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < end) {
        const cj = input[j];
        if (cj === "\\") {
          j += 2;
          continue;
        }
        if (cj === c) {
          j++;
          break;
        }
        j++;
      }
      buffer += input.slice(i, j);
      i = j;
      continue;
    }

    // Closing brace → end of this block.
    if (c === "}") {
      flushDeclBuffer(buffer, out);
      return i;
    }

    // Semicolon → declaration (or leaf at-rule).
    if (c === ";") {
      const trimmed = buffer.trim();
      if (trimmed) out.push(parseDecl(trimmed));
      buffer = "";
      i++;
      continue;
    }

    // Opening brace → nested rule or at-rule.
    if (c === "{") {
      const selector = buffer.trim();
      buffer = "";
      const bodyNodes: CssNode[] = [];
      const after = parseItems(input, i + 1, end, bodyNodes);
      if (selector.startsWith("@")) {
        out.push({
          kind: "atRule",
          prelude: selector,
          body: bodyNodes,
          leaf: false,
        });
      } else if (selector) {
        out.push({ kind: "rule", selector, body: bodyNodes });
      }
      // Skip past the closing brace.
      if (after < end && input[after] === "}") i = after + 1;
      else i = after;
      continue;
    }

    // Regular char.
    buffer += c;
    i++;
  }
  // Flush trailing buffer (last decl with no `;`).
  flushDeclBuffer(buffer, out);
  return i;
}

/** Flush the buffer as a declaration (or raw / leaf at-rule). */
function flushDeclBuffer(buffer: string, out: CssNode[]): void {
  const trimmed = buffer.trim();
  if (trimmed) out.push(parseDecl(trimmed));
}

/** Parse a declaration string into a decl, raw, or leaf at-rule node. */
function parseDecl(text: string): CssNode {
  const trimmed = text.trim();
  if (trimmed.startsWith("@")) {
    return { kind: "atRule", prelude: trimmed, body: null, leaf: true };
  }
  // Find the first `:` not inside parens (e.g. `:not(...)`, `url(...:...)`).
  let depth = 0;
  let colonIdx = -1;
  for (let k = 0; k < trimmed.length; k++) {
    const c = trimmed[k];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ":" && depth === 0) {
      colonIdx = k;
      break;
    }
  }
  if (colonIdx === -1) return { kind: "raw", text };
  const prop = trimmed.slice(0, colonIdx).trim();
  const value = trimmed.slice(colonIdx + 1).trim();
  if (!prop) return { kind: "raw", text };
  return { kind: "decl", prop, value };
}

// ============================================================
// Selector utilities
// ============================================================

/**
 * Split a selector list by top-level commas (respecting `()`, `[]`,
 * and strings). E.g. `.a, .b, :is(.c, .d)` → [".a", ".b", ":is(.c, .d)"].
 */
function splitCommaList(s: string): string[] {
  const parts: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let parenDepth = 0;
  let inString: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      current += c;
      if (c === "\\") {
        if (i + 1 < s.length) {
          current += s[i + 1];
          i++;
        }
        continue;
      }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      current += c;
      continue;
    }
    if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;
    else if (c === "(") parenDepth++;
    else if (c === ")") parenDepth--;
    if (c === "," && bracketDepth === 0 && parenDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = "";
      continue;
    }
    current += c;
  }
  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

interface SelectorPart {
  compound: string;
  /** How this compound relates to the previous one. `null` = first / pseudo extension. */
  combinator: " " | ">" | "+" | "~" | null;
}

/**
 * Split a single selector (no top-level commas) into compound parts by
 * combinators (space, `>`, `+`, `~`), respecting `()`, `[]`, strings.
 * Then split each compound into [base, ...pseudos] so pseudo-classes/
 * elements become their own parts (e.g. `.card:hover` → [".card", ":hover"]).
 *
 * E.g. `.card > .title:hover` →
 *   [(".card", null), (".title", ">"), (":hover", null)]
 */
function splitSelector(selector: string): SelectorPart[] {
  const parts: SelectorPart[] = [];
  let current = "";
  let pendingCombinator: " " | ">" | "+" | "~" | null = null;
  let bracketDepth = 0;
  let parenDepth = 0;
  let inString: '"' | "'" | null = null;
  let i = 0;
  while (i < selector.length) {
    const c = selector[i];
    if (inString) {
      current += c;
      if (c === "\\") {
        if (i + 1 < selector.length) {
          current += selector[i + 1];
          i += 2;
          continue;
        }
      }
      if (c === inString) inString = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      current += c;
      i++;
      continue;
    }
    if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;
    else if (c === "(") parenDepth++;
    else if (c === ")") parenDepth--;
    if (bracketDepth > 0 || parenDepth > 0) {
      current += c;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      if (current.trim() !== "") {
        parts.push({
          compound: current.trim(),
          combinator: pendingCombinator,
        });
        current = "";
        pendingCombinator = " ";
      }
      i++;
      continue;
    }
    if (c === ">" || c === "+" || c === "~") {
      if (current.trim() !== "") {
        parts.push({
          compound: current.trim(),
          combinator: pendingCombinator,
        });
        current = "";
      }
      pendingCombinator = c;
      i++;
      // Skip following whitespace.
      while (
        i < selector.length &&
        (selector[i] === " " ||
          selector[i] === "\t" ||
          selector[i] === "\n" ||
          selector[i] === "\r")
      ) {
        i++;
      }
      continue;
    }
    current += c;
    i++;
  }
  if (current.trim() !== "") {
    parts.push({ compound: current.trim(), combinator: pendingCombinator });
  }
  // First part's combinator is always null (top-level).
  if (parts.length > 0) parts[0].combinator = null;

  // Split each compound into [base, ...pseudos].
  const expanded: SelectorPart[] = [];
  for (const part of parts) {
    const pieces = splitCompound(part.compound);
    if (pieces.length === 0) continue;
    expanded.push({ compound: pieces[0], combinator: part.combinator });
    for (let k = 1; k < pieces.length; k++) {
      expanded.push({ compound: pieces[k], combinator: null });
    }
  }
  return expanded;
}

/**
 * Split a compound selector into [base, pseudo1, pseudo2, ...].
 * The base is the leading simple selectors (type/universal/class/id/
 * attribute). Pseudos are trailing `:...` or `::...` tokens.
 * If the compound is all pseudo (no base), returns [compound] (no split).
 *
 * E.g. `.card:hover:focus`   → [".card", ":hover", ":focus"]
 *      `.card::before`       → [".card", "::before"]
 *      `.card:not(.active)`  → [".card", ":not(.active)"]
 *      `[data-x="y"]:hover`  → ['[data-x="y"]', ":hover"]
 *      `::placeholder`       → ["::placeholder"]   (no base)
 */
function splitCompound(compound: string): string[] {
  let bracketDepth = 0;
  let parenDepth = 0;
  let splitIdx = -1;
  for (let k = 0; k < compound.length; k++) {
    const c = compound[k];
    if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;
    else if (c === "(") parenDepth++;
    else if (c === ")") parenDepth--;
    else if (c === ":" && bracketDepth === 0 && parenDepth === 0) {
      splitIdx = k;
      break;
    }
  }
  if (splitIdx === -1) return [compound];
  const base = compound.slice(0, splitIdx);
  const pseudosStr = compound.slice(splitIdx);
  const pseudos = splitPseudos(pseudosStr);
  if (base === "" || pseudos.length === 0) return [compound];
  return [base, ...pseudos];
}

/**
 * Split a string of pseudo-classes/elements into individual tokens.
 * Handles `::` (pseudo-element — one token) and `(...)` (e.g. `:not(.a)`).
 *
 * E.g. `:hover:focus`     → [":hover", ":focus"]
 *      `::before`         → ["::before"]
 *      `:not(.a):hover`   → [":not(.a)", ":hover"]
 */
function splitPseudos(s: string): string[] {
  const result: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let parenDepth = 0;
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;
    else if (c === "(") parenDepth++;
    else if (c === ")") parenDepth--;
    // Split at `:` (depth 0) when current is non-empty AND doesn't end
    // with `:` (so `::` stays together as one pseudo-element token).
    if (
      c === ":" &&
      bracketDepth === 0 &&
      parenDepth === 0 &&
      current !== "" &&
      !current.endsWith(":")
    ) {
      result.push(current);
      current = "";
    }
    current += c;
  }
  if (current) result.push(current);
  return result;
}

// ============================================================
// Flatten (nested → flat)
// ------------------------------------------------------------
// Walks the parsed tree, resolving `&` against the parent selector
// stack. Each fully-resolved rule is emitted at the current depth
// (top-level or inside an @media/@supports/@container wrapper).
// @keyframes / @font-face / @page are serialized verbatim (no
// selector resolution — their "selectors" are keyframe selectors
// or N/A).
// ============================================================

function flattenCss(nodes: CssNode[], options: ConvertOptions): string {
  const out: string[] = [];
  flattenWalk(nodes, "", options, out, 0);
  return out.join("\n");
}

function flattenWalk(
  nodes: CssNode[],
  parentSel: string,
  options: ConvertOptions,
  out: string[],
  depth: number,
): void {
  const indent = getIndent(options.indent, depth);
  for (const node of nodes) {
    if (node.kind === "comment") {
      if (options.preserveComments) out.push(`${indent}${node.text}`);
      continue;
    }
    if (node.kind === "raw") {
      out.push(`${indent}${node.text};`);
      continue;
    }
    if (node.kind === "decl") {
      out.push(`${indent}${node.prop}: ${node.value};`);
      continue;
    }
    if (node.kind === "atRule") {
      if (node.leaf) {
        out.push(`${indent}${node.prelude};`);
        continue;
      }
      const innerOut: string[] = [];
      if (isWrapperAtRule(node.prelude)) {
        // @media / @supports / @container / @layer — recurse with top-level context.
        flattenWalk(node.body ?? [], "", options, innerOut, depth + 1);
      } else {
        // @keyframes / @font-face / @page / etc. — serialize body verbatim.
        serializeRawBody(node.body ?? [], options, innerOut, depth + 1);
      }
      out.push(`${indent}${node.prelude} {`);
      out.push(...innerOut);
      out.push(`${indent}}`);
      continue;
    }
    if (node.kind === "rule") {
      const resolvedSelectors = resolveSelector(node.selector, parentSel);
      const decls: Array<
        | { kind: "decl"; prop: string; value: string }
        | { kind: "raw"; text: string }
      > = [];
      const comments: Array<{ kind: "comment"; text: string }> = [];
      const nested: CssNode[] = [];
      for (const child of node.body) {
        if (child.kind === "decl" || child.kind === "raw") decls.push(child);
        else if (child.kind === "comment") comments.push(child);
        else nested.push(child);
      }
      const hasDecls =
        decls.length > 0 || (options.preserveComments && comments.length > 0);
      if (hasDecls) {
        out.push(`${indent}${resolvedSelectors.join(", ")} {`);
        const innerIndent = getIndent(options.indent, depth + 1);
        if (options.preserveComments) {
          for (const cm of comments) out.push(`${innerIndent}${cm.text}`);
        }
        for (const d of decls) {
          if (d.kind === "decl") {
            out.push(`${innerIndent}${d.prop}: ${d.value};`);
          } else {
            out.push(`${innerIndent}${d.text};`);
          }
        }
        out.push(`${indent}}`);
      }
      // Recurse into nested rules with the full comma-list parent selector
      // (so `& .title` under `.a, .b` resolves to `.a .title, .b .title`).
      const fullResolved = resolvedSelectors.join(", ");
      if (nested.length > 0 && fullResolved) {
        flattenWalk(nested, fullResolved, options, out, depth);
      }
      continue;
    }
  }
}

/** Serialize a body verbatim — for @keyframes, @font-face, @page, etc. */
function serializeRawBody(
  nodes: CssNode[],
  options: ConvertOptions,
  out: string[],
  depth: number,
): void {
  const indent = getIndent(options.indent, depth);
  for (const node of nodes) {
    if (node.kind === "comment") {
      if (options.preserveComments) out.push(`${indent}${node.text}`);
      continue;
    }
    if (node.kind === "decl") {
      out.push(`${indent}${node.prop}: ${node.value};`);
      continue;
    }
    if (node.kind === "raw") {
      out.push(`${indent}${node.text};`);
      continue;
    }
    if (node.kind === "atRule") {
      if (node.leaf) {
        out.push(`${indent}${node.prelude};`);
        continue;
      }
      const innerOut: string[] = [];
      serializeRawBody(node.body ?? [], options, innerOut, depth + 1);
      out.push(`${indent}${node.prelude} {`);
      out.push(...innerOut);
      out.push(`${indent}}`);
      continue;
    }
    if (node.kind === "rule") {
      const innerOut: string[] = [];
      serializeRawBody(node.body ?? [], options, innerOut, depth + 1);
      out.push(`${indent}${node.selector} {`);
      out.push(...innerOut);
      out.push(`${indent}}`);
      continue;
    }
  }
}

/**
 * Resolve a (possibly nested) selector against a parent selector.
 * Handles `&` substitution and comma-lists in both parent and child.
 *
 * E.g. resolveSelector("& .title", ".card")      → [".card .title"]
 *      resolveSelector("&:hover", ".card")       → [".card:hover"]
 *      resolveSelector("& .title", ".a, .b")     → [".a .title", ".b .title"]
 *      resolveSelector(".title", ".card")        → [".card .title"]  (descendant)
 *      resolveSelector("& .title", "")           → [".title"]         (top-level)
 */
function resolveSelector(selector: string, parentSel: string): string[] {
  const selectors = splitCommaList(selector);
  if (parentSel === "") {
    // Top-level — strip `&` (unusual but defensive).
    return selectors.map((s) =>
      s.includes("&") ? s.replace(/&/g, "").trim() || s : s,
    );
  }
  const parentParts = splitCommaList(parentSel);
  const result: string[] = [];
  for (const sel of selectors) {
    if (sel.includes("&")) {
      for (const parent of parentParts) {
        result.push(sel.replace(/&/g, parent));
      }
    } else {
      // No `&` → descendant by default.
      for (const parent of parentParts) {
        result.push(`${parent} ${sel}`);
      }
    }
  }
  return result;
}

/** Returns true for at-rules that wrap regular rules (@media, @supports, etc.). */
function isWrapperAtRule(prelude: string): boolean {
  const trimmed = prelude.trim();
  return /^(?:@media|@supports|@container|@layer)\b/.test(trimmed);
}

// ============================================================
// Nest (flat → nested)
// ------------------------------------------------------------
// Strategy: first flatten the input (handles already-nested input
// gracefully — idempotent on flat CSS), then build a tree by
// walking each rule's selector parts and finding/creating child
// nodes. Finally serialize the tree with `&` nesting syntax.
//
// Tree node identity = (compound, combinator). Rules with the same
// selector walk to the same node and merge decls (if mergeDuplicates).
// ============================================================

interface NestDecl {
  prop: string;
  value: string;
}

interface NestNode {
  kind: "selector" | "atRule";
  // selector nodes:
  compound: string;
  combinator: " " | ">" | "+" | "~" | null;
  // at-rule nodes:
  prelude: string;
  // common:
  decls: NestDecl[];
  comments: string[];
  children: NestNode[];
}

interface NestTree {
  children: NestNode[];
  decls: NestDecl[];
  comments: string[];
}

function nestCss(nodes: CssNode[], options: ConvertOptions): string {
  // Step 1: flatten the input to a list of top-level rules / at-rules.
  const flatNodes = flattenToNodes(nodes);
  // Step 2: build the tree.
  const tree: NestTree = { children: [], decls: [], comments: [] };
  for (const node of flatNodes) {
    insertIntoTree(tree, node, options);
  }
  // Step 3: serialize.
  const out: string[] = [];
  if (
    tree.decls.length > 0 ||
    (options.preserveComments && tree.comments.length > 0)
  ) {
    out.push(...serializeDecls(tree.decls, tree.comments, 0, options));
  }
  serializeNestChildren(tree.children, false, options, out, 0);
  return out.join("\n");
}

/** Flatten a parsed tree into a list of top-level rules and at-rules. */
function flattenToNodes(nodes: CssNode[]): CssNode[] {
  const out: CssNode[] = [];
  flattenToNodesWalk(nodes, "", out);
  return out;
}

function flattenToNodesWalk(
  nodes: CssNode[],
  parentSel: string,
  out: CssNode[],
): void {
  const decls: Array<
    | { kind: "decl"; prop: string; value: string }
    | { kind: "raw"; text: string }
  > = [];
  const comments: Array<{ kind: "comment"; text: string }> = [];
  const nested: CssNode[] = [];
  for (const node of nodes) {
    if (node.kind === "decl" || node.kind === "raw") decls.push(node);
    else if (node.kind === "comment") comments.push(node);
    else nested.push(node);
  }
  // Emit decls as a rule for parentSel (or top-level decls).
  if (parentSel !== "" && (decls.length > 0 || comments.length > 0)) {
    const body: CssNode[] = [...comments, ...decls];
    out.push({ kind: "rule", selector: parentSel, body });
  } else if (parentSel === "") {
    // Top-level decls (CSS nesting allows this).
    out.push(...decls);
    out.push(...comments);
  }
  for (const node of nested) {
    if (node.kind === "atRule") {
      if (node.leaf) {
        out.push(node);
        continue;
      }
      const innerOut: CssNode[] = [];
      flattenToNodesWalk(node.body ?? [], "", innerOut);
      out.push({
        kind: "atRule",
        prelude: node.prelude,
        body: innerOut,
        leaf: false,
      });
      continue;
    }
    if (node.kind === "rule") {
      const resolved = resolveSelector(node.selector, parentSel);
      const innerDecls: Array<
        | { kind: "decl"; prop: string; value: string }
        | { kind: "raw"; text: string }
      > = [];
      const innerComments: Array<{ kind: "comment"; text: string }> = [];
      const innerNested: CssNode[] = [];
      for (const child of node.body) {
        if (child.kind === "decl" || child.kind === "raw")
          innerDecls.push(child);
        else if (child.kind === "comment") innerComments.push(child);
        else innerNested.push(child);
      }
      const body: CssNode[] = [...innerComments, ...innerDecls];
      // Split comma-list selectors into separate rules (each gets the decls).
      for (const sel of resolved) {
        out.push({ kind: "rule", selector: sel, body: [...body] });
      }
      const fullResolved = resolved.join(", ");
      if (innerNested.length > 0 && fullResolved) {
        flattenToNodesWalk(innerNested, fullResolved, out);
      }
    }
  }
}

/** Insert a flat node into the nest tree. */
function insertIntoTree(
  parent: NestTree | NestNode,
  node: CssNode,
  options: ConvertOptions,
): void {
  if (node.kind === "comment") {
    if (options.preserveComments) parent.comments.push(node.text);
    return;
  }
  if (node.kind === "raw") {
    // Skip raws in nesting output.
    return;
  }
  if (node.kind === "decl") {
    // Top-level decl (CSS nesting allows this) or decl inside @font-face.
    if (options.mergeDuplicates) {
      const existing = parent.decls.find((d) => d.prop === node.prop);
      if (existing) existing.value = node.value;
      else parent.decls.push({ prop: node.prop, value: node.value });
    } else {
      parent.decls.push({ prop: node.prop, value: node.value });
    }
    return;
  }
  if (node.kind === "atRule") {
    if (node.leaf) {
      // Leaf at-rule (e.g. @import). Deduplicate by prelude.
      const existing = parent.children.find(
        (c) =>
          c.kind === "atRule" &&
          c.prelude === node.prelude &&
          c.children.length === 0 &&
          c.decls.length === 0,
      );
      if (!existing) {
        parent.children.push(makeAtRuleNode(node.prelude));
      }
      return;
    }
    // Find or create at-rule child.
    let child = parent.children.find(
      (c) => c.kind === "atRule" && c.prelude === node.prelude,
    );
    if (!child) {
      child = makeAtRuleNode(node.prelude);
      parent.children.push(child);
    }
    // Recurse into body (children are top-level inside the at-rule).
    for (const bodyNode of node.body ?? []) {
      insertIntoTree(child, bodyNode, options);
    }
    return;
  }
  if (node.kind === "rule") {
    // Split comma-list selectors; each becomes its own chain in the tree.
    const selectors = splitCommaList(node.selector);
    for (const sel of selectors) {
      const parts = splitSelector(sel);
      if (parts.length === 0) continue;
      let current: NestTree | NestNode = parent;
      for (const part of parts) {
        let child = current.children.find(
          (c) =>
            c.kind === "selector" &&
            c.compound === part.compound &&
            c.combinator === part.combinator,
        );
        if (!child) {
          child = makeSelectorNode(part.compound, part.combinator);
          current.children.push(child);
        }
        current = child;
      }
      // Attach decls and comments to the final node.
      const decls: NestDecl[] = [];
      const comments: string[] = [];
      for (const child of node.body) {
        if (child.kind === "decl") {
          decls.push({ prop: child.prop, value: child.value });
        } else if (child.kind === "comment") {
          comments.push(child.text);
        }
      }
      if (options.mergeDuplicates) {
        for (const decl of decls) {
          const existing = current.decls.find((d) => d.prop === decl.prop);
          if (existing) existing.value = decl.value;
          else current.decls.push(decl);
        }
      } else {
        current.decls.push(...decls);
      }
      if (options.preserveComments) {
        current.comments.push(...comments);
      }
    }
    return;
  }
}

function makeAtRuleNode(prelude: string): NestNode {
  return {
    kind: "atRule",
    compound: "",
    combinator: null,
    prelude,
    decls: [],
    comments: [],
    children: [],
  };
}

function makeSelectorNode(
  compound: string,
  combinator: SelectorPart["combinator"],
): NestNode {
  return {
    kind: "selector",
    compound,
    combinator,
    prelude: "",
    decls: [],
    comments: [],
    children: [],
  };
}

/** Serialize a list of nest tree children. */
function serializeNestChildren(
  children: NestNode[],
  parentIsSelector: boolean,
  options: ConvertOptions,
  out: string[],
  depth: number,
): void {
  for (const child of children) {
    if (child.kind === "atRule") {
      serializeNestAtRule(child, options, out, depth);
    } else {
      serializeNestSelector(child, parentIsSelector, options, out, depth);
    }
  }
}

function serializeNestSelector(
  node: NestNode,
  parentIsSelector: boolean,
  options: ConvertOptions,
  out: string[],
  depth: number,
): void {
  const indent = getIndent(options.indent, depth);
  // Build the selector line for this node.
  let selectorLine: string;
  if (!parentIsSelector) {
    // Top-level (parent is root or an at-rule wrapper) — no `&`.
    selectorLine = node.compound;
  } else {
    const comb = node.combinator;
    if (comb === null) {
      // Pseudo extension — append directly (e.g. `&:hover`, `&::before`).
      selectorLine = `&${node.compound}`;
    } else if (comb === " ") {
      // Descendant combinator.
      selectorLine = `& ${node.compound}`;
    } else {
      // Child / adjacent-sibling / general-sibling.
      selectorLine = `& ${comb} ${node.compound}`;
    }
  }
  const hasDecls =
    node.decls.length > 0 ||
    (options.preserveComments && node.comments.length > 0);
  const hasChildren = node.children.length > 0;
  // Emit a block if there are decls OR nested children (a rule with only
  // nested children is valid CSS nesting).
  if (hasDecls || hasChildren) {
    out.push(`${indent}${selectorLine} {`);
    out.push(...serializeDecls(node.decls, node.comments, depth + 1, options));
    // Serialize children INSIDE this block (at depth + 1).
    if (hasChildren) {
      serializeNestChildren(node.children, true, options, out, depth + 1);
    }
    out.push(`${indent}}`);
  }
}

function serializeNestAtRule(
  node: NestNode,
  options: ConvertOptions,
  out: string[],
  depth: number,
): void {
  const indent = getIndent(options.indent, depth);
  // Leaf at-rule (e.g. @import, @charset).
  if (node.children.length === 0 && node.decls.length === 0) {
    out.push(`${indent}${node.prelude};`);
    return;
  }
  out.push(`${indent}${node.prelude} {`);
  // @media etc. can have top-level decls (CSS nesting) or @font-face decls.
  if (
    node.decls.length > 0 ||
    (options.preserveComments && node.comments.length > 0)
  ) {
    out.push(...serializeDecls(node.decls, node.comments, depth + 1, options));
  }
  // Children are top-level rules inside the at-rule.
  if (node.children.length > 0) {
    serializeNestChildren(node.children, false, options, out, depth + 1);
  }
  out.push(`${indent}}`);
}

function serializeDecls(
  decls: NestDecl[],
  comments: string[],
  depth: number,
  options: ConvertOptions,
): string[] {
  const indent = getIndent(options.indent, depth);
  const out: string[] = [];
  if (options.preserveComments) {
    for (const c of comments) out.push(`${indent}${c}`);
  }
  for (const d of decls) {
    out.push(`${indent}${d.prop}: ${d.value};`);
  }
  return out;
}

// ============================================================
// Utilities
// ============================================================

function getIndent(style: IndentStyle, depth: number): string {
  if (style === "tab") return "\t".repeat(depth);
  const spaces = style === "4" ? 4 : 2;
  return " ".repeat(spaces * depth);
}

/** Count all rule nodes (recursively, including nested rules). */
function countRules(nodes: CssNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.kind === "rule") {
      count++;
      count += countRules(node.body);
    } else if (node.kind === "atRule" && node.body) {
      count += countRules(node.body);
    }
  }
  return count;
}

/** Compute the max nesting depth of a parsed tree (top-level = 1). */
function computeMaxDepth(nodes: CssNode[]): number {
  let max = 0;
  for (const node of nodes) {
    if (node.kind === "rule") {
      const childDepth = computeMaxDepth(node.body);
      max = Math.max(max, childDepth + 1);
    } else if (node.kind === "atRule" && node.body) {
      const childDepth = computeMaxDepth(node.body);
      max = Math.max(max, childDepth + 1);
    }
  }
  return max;
}

// ============================================================
// Example flat CSS (showcases all convertible features)
// ============================================================

const EXAMPLE_FLAT = `.card {
  padding: 1rem;
  border-radius: 0.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}
.card .title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}
.card .body {
  color: #4b5563;
  line-height: 1.5;
}
.card > .close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  cursor: pointer;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.card:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.card::before {
  content: "";
  display: block;
  height: 4px;
  background: linear-gradient(to right, #10b981, #14b8a6);
}
.card.featured {
  border-color: #f59e0b;
  border-width: 2px;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
}
.btn:hover {
  opacity: 0.9;
}
.btn:active {
  transform: translateY(1px);
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 600px) {
  .card {
    padding: 0.5rem;
  }
  .card .title {
    font-size: 1.25rem;
  }
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;

// ============================================================
// Component
// ============================================================

const COPY_CONFIRM_MS = 2000;

interface ConvertResult {
  output: string;
  error: string | null;
  inputRules: number;
  outputRules: number;
  depth: number;
}

export function NestingConverter() {
  const [direction, setDirection] = useState<Direction>("nest");
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentStyle>("2");
  const [mergeDuplicates, setMergeDuplicates] = useState(true);
  const [preserveComments, setPreserveComments] = useState(true);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const result: ConvertResult = useMemo(() => {
    const options: ConvertOptions = {
      indent,
      mergeDuplicates,
      preserveComments,
    };
    if (!input.trim()) {
      return {
        output: "",
        error: null,
        inputRules: 0,
        outputRules: 0,
        depth: 0,
      };
    }
    try {
      const parsed = parseCss(input);
      const inputRules = countRules(parsed);
      const output =
        direction === "nest"
          ? nestCss(parsed, options)
          : flattenCss(parsed, options);
      let outputRules = 0;
      let depth = 0;
      try {
        const reparsed = parseCss(output);
        outputRules = countRules(reparsed);
        depth = computeMaxDepth(reparsed);
      } catch {
        // Reparse of our own output should not fail, but be defensive.
      }
      return { output, error: null, inputRules, outputRules, depth };
    } catch (err) {
      return {
        output: "",
        error: err instanceof Error ? err.message : String(err),
        inputRules: 0,
        outputRules: 0,
        depth: 0,
      };
    }
  }, [input, direction, indent, mergeDuplicates, preserveComments]);

  // --- Cleanup copy timer on unmount ------------------------------
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
    } catch {
      // Clipboard may be unavailable (insecure context); silent fallback.
    }
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, COPY_CONFIRM_MS);
  }, [result.output]);

  const handleSwap = useCallback(() => {
    if (!result.output) return;
    // Move output to input and flip direction (enables round-tripping).
    setInput(result.output);
    setDirection((d) => (d === "nest" ? "flatten" : "nest"));
  }, [result.output]);

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_FLAT);
    setDirection("nest");
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const inputLabel =
    direction === "nest" ? "Input (flat CSS)" : "Input (nested CSS)";
  const outputLabel =
    direction === "nest" ? "Output (nested CSS)" : "Output (flat CSS)";
  const inputPlaceholder =
    direction === "nest"
      ? "Paste flat CSS here — e.g.\n.card { padding: 1rem; }\n.card .title { font-size: 1.5rem; }\n.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }"
      : "Paste nested CSS here — e.g.\n.card {\n  padding: 1rem;\n  & .title { font-size: 1.5rem; }\n  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }\n}";

  return (
    <div className="w-full space-y-3">
      {/* Header: direction toggle + action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={direction}
          onValueChange={(v) => setDirection(v as Direction)}
        >
          <TabsList>
            <TabsTrigger
              value="nest"
              aria-label="Convert flat CSS to nested CSS"
            >
              <ArrowRight className="size-3.5" />
              Nest
            </TabsTrigger>
            <TabsTrigger
              value="flatten"
              aria-label="Convert nested CSS to flat CSS"
            >
              <ArrowLeft className="size-3.5" />
              Flatten
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            className="h-8"
          >
            <Sparkles className="size-3.5" />
            Example
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!input}
            className="h-8"
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwap}
            disabled={!result.output}
            className="h-8"
            aria-label="Move output to input and flip direction"
          >
            <ArrowLeftRight className="size-3.5" />
            Swap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!result.output}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Options bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="nesting-indent"
            className="text-xs text-muted-foreground flex items-center gap-1.5"
          >
            <IndentIncrease className="size-3.5" />
            Indent
          </Label>
          <Select
            value={indent}
            onValueChange={(v) => setIndent(v as IndentStyle)}
          >
            <SelectTrigger
              id="nesting-indent"
              size="sm"
              className="h-7 w-[110px] text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
              <SelectItem value="tab">Tab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="nesting-merge"
            checked={mergeDuplicates}
            onCheckedChange={setMergeDuplicates}
          />
          <Label
            htmlFor="nesting-merge"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Merge duplicates
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="nesting-comments"
            checked={preserveComments}
            onCheckedChange={setPreserveComments}
          />
          <Label
            htmlFor="nesting-comments"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Preserve comments
          </Label>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <GitCompare className="size-3.5" aria-hidden="true" />
          <span>
            Input:{" "}
            <span className="font-mono text-foreground">
              {result.inputRules}
            </span>{" "}
            rules → Output:{" "}
            <span className="font-mono text-foreground">
              {result.outputRules}
            </span>{" "}
            rules · depth:{" "}
            <span className="font-mono text-foreground">{result.depth}</span>
          </span>
        </div>
      </div>

      {/* Two panels with direction arrow between them */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        {/* Input panel */}
        <div className="space-y-1.5">
          <Label
            htmlFor="nesting-input"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
          >
            <Code2 className="size-3.5" />
            {inputLabel}
          </Label>
          <Textarea
            id="nesting-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="font-mono text-xs min-h-[360px] resize-y"
            aria-label={inputLabel}
            placeholder={inputPlaceholder}
          />
        </div>

        {/* Direction arrow (rotates 90° on mobile when panels stack) */}
        <div className="flex items-center justify-center md:flex-col py-0.5">
          <ArrowRight
            className="size-4 text-muted-foreground rotate-90 md:rotate-0"
            aria-hidden="true"
          />
        </div>

        {/* Output panel */}
        <div className="space-y-1.5">
          <Label
            htmlFor="nesting-output"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
          >
            <ArrowRight className="size-3.5" />
            {outputLabel}
          </Label>
          <Textarea
            id="nesting-output"
            value={result.output}
            readOnly
            spellCheck={false}
            className="font-mono text-xs min-h-[360px] resize-y bg-muted/30"
            aria-label={outputLabel}
            placeholder="Converted CSS will appear here..."
          />
        </div>
      </div>

      {/* Error alert (below output) */}
      {result.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Conversion error</AlertTitle>
          <AlertDescription>
            <code className="font-mono text-xs break-all">{result.error}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
