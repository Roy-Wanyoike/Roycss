"use client";

/**
 * AccessibilitySuite — a self-contained, client-side accessibility
 * audit + remediation tool.
 *
 * Three tools in one (Radix Tabs):
 *   1. Audit      — runs a live DOM scan of the current page and produces
 *                   a list of WCAG findings (severity, selector, fix, link),
 *                   plus an overall 0-100 a11y score.
 *   2. Contrast   — two color inputs (FG / BG) with a live contrast ratio,
 *                   WCAG AA / AAA pass-fail badges for normal + large text,
 *                   and a preview swatch.
 *   3. Tab Order  — paints numbered badges on every focusable element on
 *                   the page so authors can see / verify the keyboard tab
 *                   order visually.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-free.
 *   • SSR-safe: `useMounted()` built on `useSyncExternalStore` gates every
 *     DOM-touching effect (no hydration mismatches, no setState-in-effect).
 *   • TS strict, zero `any`. All DOM lists use proper generic
 *     `querySelectorAll<HTMLImageElement>(...)` etc.
 *   • The suite excludes its own DOM subtree from audits + tab-order so it
 *     doesn't audit itself.
 *   • Color palette follows the RoyCSS theme: emerald / amber / rose / sky
 *     for severity, oklch(0.55 0.13 165) primary for accent.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  ListOrdered,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Severity = "critical" | "warning" | "info";

interface WcagRef {
  ref: string;
  name: string;
  url: string;
}

interface Finding {
  id: string;
  severity: Severity;
  rule: string;
  selector: string;
  description: string;
  fix: string;
  wcag: WcagRef;
}

interface AuditResult {
  findings: Finding[];
  score: number;
  scannedAt: number;
  stats: { critical: number; warning: number; info: number; total: number };
}

interface ContrastResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// Color helpers — hex/rgb parsing, relative luminance, contrast ratio.
// ═══════════════════════════════════════════════════════════════════════

type RGB = readonly [number, number, number];

function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  if (cleaned.length === 6 || cleaned.length === 8) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

const RGB_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;
function parseRgbString(s: string): RGB | null {
  const m = RGB_RE.exec(s);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function relativeLuminance([r, g, b]: RGB): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluateContrast(fg: RGB, bg: RGB): ContrastResult {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Selector descriptor — produces a short, CSS-like path for one element.
// ═══════════════════════════════════════════════════════════════════════

function describeSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id;
  const cls = Array.from(el.classList).slice(0, 2).join(".");
  let s = tag;
  if (id) s += `#${id}`;
  if (cls) s += `.${cls}`;
  const role = el.getAttribute("role");
  if (role) s += `[role="${role}"]`;
  return s;
}

/**
 * Walks up the DOM until it finds an element with a non-transparent
 * background-color. Falls back to white. Used by the contrast auditor
 * because `color` inherits but `background-color` does not — most text
 * elements have `background-color: transparent`.
 */
function effectiveBgColor(el: Element): RGB | null {
  let node: Element | null = el;
  while (node) {
    const bg = window.getComputedStyle(node).backgroundColor;
    if (bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
      const rgb = parseRgbString(bg);
      if (rgb) return rgb;
    }
    node = node.parentElement;
  }
  return [255, 255, 255];
}

// ═══════════════════════════════════════════════════════════════════════
// WCAG 2.1 references — each finding links to one of these.
// ═══════════════════════════════════════════════════════════════════════

const WCAG = {
  nonTextContent: {
    ref: "1.1.1",
    name: "Non-text Content",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
  },
  infoAndRelationships: {
    ref: "1.3.1",
    name: "Info and Relationships",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
  },
  contrastMinimum: {
    ref: "1.4.3",
    name: "Contrast (Minimum)",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
  },
  bypassBlocks: {
    ref: "2.4.1",
    name: "Bypass Blocks",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html",
  },
  pageTitled: {
    ref: "2.4.2",
    name: "Page Titled",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html",
  },
  focusOrder: {
    ref: "2.4.3",
    name: "Focus Order",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html",
  },
  linkPurpose: {
    ref: "2.4.4",
    name: "Link Purpose (In Context)",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html",
  },
  headingsAndLabels: {
    ref: "2.4.6",
    name: "Headings and Labels",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html",
  },
  languageOfPage: {
    ref: "3.1.1",
    name: "Language of Page",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html",
  },
  labelsOrInstructions: {
    ref: "3.3.2",
    name: "Labels or Instructions",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Severity metadata
// ═══════════════════════════════════════════════════════════════════════

interface SeverityMeta {
  label: string;
  badge: string;
  dot: string;
  points: number;
  Icon: typeof ShieldAlert;
}

const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critical: {
    label: "Critical",
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    dot: "bg-rose-500",
    points: 15,
    Icon: ShieldX,
  },
  warning: {
    label: "Warning",
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    dot: "bg-amber-500",
    points: 8,
    Icon: ShieldAlert,
  },
  info: {
    label: "Info",
    badge:
      "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300",
    dot: "bg-sky-500",
    points: 3,
    Icon: Info,
  },
};

function computeScore(findings: readonly Finding[]): number {
  let score = 100;
  for (const f of findings) score -= SEVERITY_META[f.severity].points;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ═══════════════════════════════════════════════════════════════════════
// Audit implementation — pure function over the live DOM.
// ═══════════════════════════════════════════════════════════════════════

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';

const HIDDEN_INPUT_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
]);

/**
 * Returns true if `el` is a strict descendant of `root` — i.e. inside the
 * suite's own DOM (which we never audit).
 */
function isInsideSuite(el: Element, root: Element): boolean {
  return el !== root && root.contains(el);
}

/**
 * Walks up from `el` looking for a `<label>` ancestor — covers the
 * `<label><input/></label>` wrapping pattern.
 */
function isWrappedInLabel(el: Element): boolean {
  let node: Element | null = el.parentElement;
  while (node) {
    if (node.tagName.toLowerCase() === "label") return true;
    node = node.parentElement;
  }
  return false;
}

function runAudit(root: Element): AuditResult {
  const findings: Finding[] = [];
  let counter = 0;

  const push = (
    severity: Severity,
    rule: string,
    selector: string,
    description: string,
    fix: string,
    wcag: WcagRef,
  ): void => {
    findings.push({
      id: `f-${counter++}`,
      severity,
      rule,
      selector,
      description,
      fix,
      wcag,
    });
  };

  // ── 1. Document language ──────────────────────────────────────────
  if (!document.documentElement.lang) {
    push(
      "critical",
      "Document language missing",
      "html",
      "The <html> element has no lang attribute. Screen readers cannot announce page text with correct pronunciation.",
      'Add lang="en" (or the appropriate BCP-47 code) to <html>.',
      WCAG.languageOfPage,
    );
  }

  // ── 2. Document title ────────────────────────────────────────────
  if (!document.title || document.title.trim().length === 0) {
    push(
      "critical",
      "Document title missing",
      "head > title",
      "The page has no <title>. Users cannot identify it in browser tabs, history, or bookmarks.",
      "Add a concise, descriptive <title> inside <head>.",
      WCAG.pageTitled,
    );
  }

  // ── 3. Skip link ─────────────────────────────────────────────────
  const skipLink = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("a[href]"),
  ).some((a) => {
    if (isInsideSuite(a, root)) return false;
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("#")) return false;
    const target = href.slice(1);
    if (!target) return false;
    const el = document.getElementById(target);
    return !!el;
  });
  if (!skipLink) {
    push(
      "warning",
      "Skip link missing",
      "body",
      "No skip-to-content link found. Keyboard users must tab through all navigation on every page view.",
      'Add <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a> as the first focusable element in <body>.',
      WCAG.bypassBlocks,
    );
  }

  // ── 4. Images without alt ────────────────────────────────────────
  const imgs = document.querySelectorAll<HTMLImageElement>("img:not([alt])");
  imgs.forEach((img) => {
    if (isInsideSuite(img, root)) return;
    const src = img.getAttribute("src") ?? "(no src)";
    push(
      "critical",
      "Image missing alt text",
      describeSelector(img),
      `Image "${src}" has no alt attribute. Screen readers cannot describe its content.`,
      'Add alt="descriptive text" — or alt="" if the image is purely decorative.',
      WCAG.nonTextContent,
    );
  });

  // ── 5. Buttons without accessible name ───────────────────────────
  const buttons = document.querySelectorAll<HTMLButtonElement>("button");
  buttons.forEach((btn) => {
    if (isInsideSuite(btn, root)) return;
    const ariaLabel = btn.getAttribute("aria-label");
    const ariaLabelledBy = btn.getAttribute("aria-labelledby");
    const text = (btn.textContent ?? "").trim();
    const title = btn.getAttribute("title");
    if (!text && !ariaLabel && !ariaLabelledBy && !title) {
      push(
        "critical",
        "Button missing accessible name",
        describeSelector(btn),
        "Button has no text content, aria-label, aria-labelledby, or title. Screen readers announce nothing meaningful.",
        "Add visible text, an aria-label, or aria-labelledby pointing to a visible label.",
        WCAG.infoAndRelationships,
      );
    }
  });

  // ── 6. Links without href or accessible name ─────────────────────
  const links = document.querySelectorAll<HTMLAnchorElement>("a");
  links.forEach((link) => {
    if (isInsideSuite(link, root)) return;
    const href = link.getAttribute("href");
    const ariaLabel = link.getAttribute("aria-label");
    const ariaLabelledBy = link.getAttribute("aria-labelledby");
    const text = (link.textContent ?? "").trim();
    const title = link.getAttribute("title");
    const hasName = !!(text || ariaLabel || ariaLabelledBy || title);
    if (!href || href === "#") {
      if (!hasName) {
        push(
          "critical",
          "Link missing href and name",
          describeSelector(link),
          "Link has no href and no accessible name. It is not keyboard-focusable and is invisible to AT.",
          'Add href="#anchor" (or a real URL) plus link text or an aria-label.',
          WCAG.linkPurpose,
        );
      }
    } else if (!hasName) {
      push(
        "warning",
        "Link missing accessible name",
        describeSelector(link),
        "Link has href but no text, aria-label, or title. Screen readers announce only the raw URL.",
        "Add link text describing the destination, or an aria-label.",
        WCAG.linkPurpose,
      );
    }
  });

  // ── 7. Form controls without labels ──────────────────────────────
  const controls = document.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");
  controls.forEach((ctrl) => {
    if (isInsideSuite(ctrl, root)) return;
    if (ctrl instanceof HTMLInputElement) {
      const type = (ctrl.type || "text").toLowerCase();
      if (HIDDEN_INPUT_TYPES.has(type)) return;
    }
    const id = ctrl.id;
    const ariaLabel = ctrl.getAttribute("aria-label");
    const ariaLabelledBy = ctrl.getAttribute("aria-labelledby");
    const title = ctrl.getAttribute("title");
    let hasLabel = !!(ariaLabel || ariaLabelledBy || title);
    if (!hasLabel && id) {
      const labelEl = document.querySelector<HTMLLabelElement>(
        `label[for="${CSS.escape(id)}"]`,
      );
      if (labelEl) hasLabel = true;
    }
    if (!hasLabel && isWrappedInLabel(ctrl)) hasLabel = true;
    if (!hasLabel) {
      const typeLabel =
        ctrl instanceof HTMLInputElement
          ? `input[type="${ctrl.type || "text"}"]`
          : ctrl.tagName.toLowerCase();
      push(
        "critical",
        "Form control missing label",
        describeSelector(ctrl),
        `Form control <${typeLabel}> has no associated <label>, aria-label, aria-labelledby, or title.`,
        "Add a <label for>, an aria-label, or wrap the control inside a <label>.",
        WCAG.labelsOrInstructions,
      );
    }
  });

  // ── 8. Heading hierarchy ─────────────────────────────────────────
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
  ).filter((h) => !isInsideSuite(h, root));
  let lastLevel = 0;
  let h1Count = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName.substring(1), 10);
    if (level === 1) h1Count++;
    if (lastLevel > 0 && level > lastLevel + 1) {
      push(
        "warning",
        "Heading hierarchy skip",
        describeSelector(h),
        `Heading level skips from h${lastLevel} to h${level}. Screen reader users may lose their place in the page outline.`,
        `Use h${lastLevel + 1} instead, or restructure the outline so levels increase by one.`,
        WCAG.headingsAndLabels,
      );
    }
    lastLevel = level;
  }
  if (headings.length > 0 && h1Count === 0) {
    push(
      "warning",
      "No h1 heading",
      "body",
      "The page has headings but no <h1>. The document outline has no primary title.",
      "Add a single <h1> describing the page's main topic.",
      WCAG.headingsAndLabels,
    );
  }
  if (h1Count > 1) {
    push(
      "info",
      "Multiple h1 headings",
      "body",
      `Found ${h1Count} <h1> elements. Best practice is one <h1> per page.`,
      "Keep a single <h1>; demote the others to <h2>.",
      WCAG.headingsAndLabels,
    );
  }

  // ── 9. Positive tabindex ─────────────────────────────────────────
  const tabindexed = document.querySelectorAll<HTMLElement>("[tabindex]");
  tabindexed.forEach((el) => {
    if (isInsideSuite(el, root)) return;
    const raw = el.getAttribute("tabindex");
    const val = raw === null ? 0 : parseInt(raw, 10);
    if (!Number.isNaN(val) && val > 0) {
      push(
        "warning",
        "Positive tabindex",
        describeSelector(el),
        `tabindex="${val}" overrides the natural DOM focus order, which can disorient keyboard users.`,
        'Use tabindex="0" (or remove the attribute) so the element follows source order.',
        WCAG.focusOrder,
      );
    }
  });

  // ── 10. Color contrast (sampled, visible text elements) ──────────
  const textCandidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "p, span, a, button, label, li, td, th, h1, h2, h3, h4, h5, h6, strong, em, small, div",
    ),
  ).filter((el) => {
    if (isInsideSuite(el, root)) return false;
    // Skip elements whose own children match — keeps us near leaf text nodes.
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? "")
      .join("")
      .trim();
    if (!directText) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  // Sample up to 40 evenly-distributed candidates to keep the audit fast.
  const sampleSize = Math.min(40, textCandidates.length);
  const pickedIndices = new Set<number>();
  for (let i = 0; i < sampleSize; i++) {
    pickedIndices.add(
      Math.floor((i * textCandidates.length) / sampleSize),
    );
  }
  for (const idx of pickedIndices) {
    const el = textCandidates[idx];
    if (!el) continue;
    const cs = window.getComputedStyle(el);
    const fg = parseRgbString(cs.color);
    if (!fg) continue;
    const bg = effectiveBgColor(el);
    if (!bg) continue;
    const ratio = contrastRatio(fg, bg);
    const fontSize = parseFloat(cs.fontSize);
    const fontWeight = parseFloat(cs.fontWeight);
    const isLarge =
      fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const threshold = isLarge ? 3 : 4.5;
    if (ratio < threshold) {
      push(
        "warning",
        "Insufficient color contrast",
        describeSelector(el),
        `Text has a contrast ratio of ${ratio.toFixed(2)}:1 (threshold ${threshold}:1 for ${isLarge ? "large" : "normal"} text).`,
        "Darken the foreground or lighten the background until the ratio meets WCAG AA.",
        WCAG.contrastMinimum,
      );
    }
  }

  // ── Score & stats ────────────────────────────────────────────────
  const stats = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
    total: findings.length,
  };

  return {
    findings,
    score: computeScore(findings),
    scannedAt: Date.now(),
    stats,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Tab order visualizer
// ═══════════════════════════════════════════════════════════════════════

const TAB_OVERLAY_ATTR = "data-roycss-a11y-tab-overlay";

function getTabOrder(root: Element): HTMLElement[] {
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return all.filter((el) => {
    if (isInsideSuite(el, root)) return false;
    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && parseInt(tabindex, 10) < 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const cs = window.getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    return true;
  });
}

function paintTabBadges(els: HTMLElement[]): HTMLElement[] {
  const badges: HTMLElement[] = [];
  els.forEach((el, idx) => {
    const badge = document.createElement("span");
    badge.textContent = String(idx + 1);
    badge.setAttribute(TAB_OVERLAY_ATTR, "");
    badge.setAttribute("aria-hidden", "true");
    const rect = el.getBoundingClientRect();
    badge.style.cssText = [
      "position:fixed",
      `left:${rect.left}px`,
      `top:${rect.top}px`,
      "z-index:2147483647",
      "pointer-events:none",
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      "min-width:22px",
      "height:22px",
      "padding:0 6px",
      "border-radius:9999px",
      "background:oklch(0.55 0.13 165)",
      "color:#fff",
      "font:700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace",
      "box-shadow:0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,0.45)",
      "transform:translate(-50%, -50%)",
    ].join(";");
    document.body.appendChild(badge);
    badges.push(badge);
  });
  return badges;
}

function clearTabBadges(): void {
  document
    .querySelectorAll<HTMLElement>(`[${TAB_OVERLAY_ATTR}]`)
    .forEach((el) => el.remove());
}

// ═══════════════════════════════════════════════════════════════════════
// SSR-safe mount detection (no setState-in-effect anti-pattern)
// ═══════════════════════════════════════════════════════════════════════

const emptySubscribe = (): (() => void) => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Score presentation
// ═══════════════════════════════════════════════════════════════════════

function getScoreMeta(score: number): {
  label: string;
  Icon: typeof ShieldCheck;
  tint: string;
  text: string;
} {
  if (score >= 90)
    return {
      label: "Excellent",
      Icon: ShieldCheck,
      tint: "text-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  if (score >= 70)
    return {
      label: "Good",
      Icon: ShieldCheck,
      tint: "text-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  if (score >= 50)
    return {
      label: "Needs work",
      Icon: ShieldAlert,
      tint: "text-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  return {
    label: "Poor",
    Icon: ShieldX,
    tint: "text-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

export function AccessibilitySuite() {
  const mounted = useMounted();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [result, setResult] = useState<AuditResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tabBadgesActive, setTabBadgesActive] = useState(false);
  const [focusableCount, setFocusableCount] = useState(0);

  const [fg, setFg] = useState("#0a0a0a");
  const [bg, setBg] = useState("#ffffff");

  const contrast = useMemo<ContrastResult | null>(() => {
    const f = hexToRgb(fg);
    const b = hexToRgb(bg);
    if (!f || !b) return null;
    return evaluateContrast(f, b);
  }, [fg, bg]);

  // ── Run audit (deferred to next frame so the spinner can paint) ──
  const runAuditNow = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    setRunning(true);
    requestAnimationFrame(() => {
      try {
        const res = runAudit(root);
        setResult(res);
      } finally {
        setRunning(false);
      }
    });
  }, []);

  // ── Tab order toggle ─────────────────────────────────────────────
  const toggleTabBadges = useCallback(() => {
    if (!rootRef.current) return;
    if (tabBadgesActive) {
      clearTabBadges();
      setTabBadgesActive(false);
      setFocusableCount(0);
      return;
    }
    const els = getTabOrder(rootRef.current);
    paintTabBadges(els);
    setFocusableCount(els.length);
    setTabBadgesActive(true);
  }, [tabBadgesActive]);

  // ── Repaint tab badges on scroll/resize; cleanup on unmount ──────
  useEffect(() => {
    if (!tabBadgesActive) return;
    const repaint = (): void => {
      if (!rootRef.current) return;
      clearTabBadges();
      const els = getTabOrder(rootRef.current);
      paintTabBadges(els);
      setFocusableCount(els.length);
    };
    window.addEventListener("scroll", repaint, true);
    window.addEventListener("resize", repaint);
    return () => {
      window.removeEventListener("scroll", repaint, true);
      window.removeEventListener("resize", repaint);
      clearTabBadges();
    };
  }, [tabBadgesActive]);

  const scoreMeta = result ? getScoreMeta(result.score) : null;
  const hasResults = !!result;
  const noFindings = hasResults && result!.findings.length === 0;

  return (
    <div ref={rootRef} className="w-full">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Accessibility className="size-5 text-primary" />
                Accessibility Suite
              </CardTitle>
              <CardDescription>
                Live WCAG 2.1 audit, contrast checker, and tab-order
                visualizer for the current page.
              </CardDescription>
            </div>
            {hasResults && scoreMeta && (
              <div className="text-right shrink-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Score
                </div>
                <div
                  className={cn(
                    "font-mono text-3xl font-bold leading-none",
                    scoreMeta.text,
                  )}
                >
                  {result!.score}
                  <span className="text-base text-muted-foreground">
                    /100
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    scoreMeta.text,
                  )}
                >
                  <scoreMeta.Icon className="size-3.5" />
                  {scoreMeta.label}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="audit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="audit" className="gap-1.5">
                <ShieldCheck className="size-3.5" />
                Audit
              </TabsTrigger>
              <TabsTrigger value="contrast" className="gap-1.5">
                <Eye className="size-3.5" />
                Contrast
              </TabsTrigger>
              <TabsTrigger value="taborder" className="gap-1.5">
                <ListOrdered className="size-3.5" />
                Tab Order
              </TabsTrigger>
            </TabsList>

            {/* ─── Audit tab ─────────────────────────────────────── */}
            <TabsContent value="audit" className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={runAuditNow}
                  disabled={running || !mounted}
                  size="sm"
                >
                  {running ? (
                    <>
                      <RotateCcw className="size-3.5 animate-spin" />
                      Scanning…
                    </>
                  ) : hasResults ? (
                    <>
                      <RotateCcw className="size-3.5" />
                      Re-run audit
                    </>
                  ) : (
                    <>
                      <PlayCircle className="size-3.5" />
                      Run audit
                    </>
                  )}
                </Button>
                {hasResults && (
                  <span className="text-xs text-muted-foreground">
                    {result!.stats.total} finding
                    {result!.stats.total === 1 ? "" : "s"} · scanned{" "}
                    {new Date(result!.scannedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {hasResults && (
                <>
                  {/* Score bar */}
                  <div className="space-y-2">
                    <Progress
                      value={result!.score}
                      className={cn(
                        "h-2.5",
                        result!.score >= 70 &&
                          "[&_[data-slot=progress-indicator]]:bg-emerald-500",
                        result!.score < 70 &&
                          result!.score >= 50 &&
                          "[&_[data-slot=progress-indicator]]:bg-amber-500",
                        result!.score < 50 &&
                          "[&_[data-slot=progress-indicator]]:bg-rose-500",
                      )}
                    />
                    {/* Stats */}
                    <div className="flex flex-wrap gap-2">
                      <SeverityPill
                        severity="critical"
                        count={result!.stats.critical}
                      />
                      <SeverityPill
                        severity="warning"
                        count={result!.stats.warning}
                      />
                      <SeverityPill
                        severity="info"
                        count={result!.stats.info}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Findings */}
                  {noFindings ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="size-6 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No accessibility issues found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All scanned rules passed. Re-run after DOM changes.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[420px] rounded-lg border">
                      <ul className="divide-y">
                        {result!.findings.map((f) => (
                          <FindingRow key={f.id} finding={f} />
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </>
              )}

              {!hasResults && mounted && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Accessibility className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Run an accessibility audit
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Scans the current page DOM for missing alt text,
                    unlabelled controls, heading skips, low contrast, and
                    more — mapped to WCAG 2.1 criteria.
                  </p>
                </div>
              )}

              {!mounted && (
                <div className="h-[120px] animate-pulse rounded-lg bg-muted/40" />
              )}
            </TabsContent>

            {/* ─── Contrast tab ──────────────────────────────────── */}
            <TabsContent value="contrast" className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ColorField
                  label="Foreground"
                  value={fg}
                  onChange={setFg}
                />
                <ColorField
                  label="Background"
                  value={bg}
                  onChange={setBg}
                />
              </div>

              {/* Live preview */}
              <div
                className="rounded-xl border p-6 text-center"
                style={{ background: bg, color: fg }}
              >
                <p className="text-xl font-bold">
                  The quick brown fox
                </p>
                <p className="mt-1 text-sm opacity-80">
                  jumps over the lazy dog
                </p>
                <p className="mt-2 text-xs opacity-60">
                  Small-text preview for contrast verification.
                </p>
              </div>

              {/* Ratio + WCAG badges */}
              {contrast ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Contrast ratio
                      </p>
                      <p className="font-mono text-3xl font-bold leading-none">
                        {contrast.ratio.toFixed(2)}
                        <span className="text-base text-muted-foreground">
                          :1
                        </span>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        contrast.ratio >= 4.5
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                      )}
                    >
                      {contrast.ratio >= 4.5 ? "AA pass" : "AA fail"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <WCAGBadge
                      label="AA · Normal"
                      threshold="≥ 4.5:1"
                      passed={contrast.aaNormal}
                    />
                    <WCAGBadge
                      label="AA · Large"
                      threshold="≥ 3:1"
                      passed={contrast.aaLarge}
                    />
                    <WCAGBadge
                      label="AAA · Normal"
                      threshold="≥ 7:1"
                      passed={contrast.aaaNormal}
                    />
                    <WCAGBadge
                      label="AAA · Large"
                      threshold="≥ 4.5:1"
                      passed={contrast.aaaLarge}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Large text = ≥ 24px, or ≥ 18.66px bold (≥ 700). WCAG
                    references:{" "}
                    <a
                      href={WCAG.contrastMinimum.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      1.4.3 Contrast (Minimum)
                    </a>{" "}
                    ·{" "}
                    <a
                      href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      1.4.6 Contrast (Enhanced)
                    </a>
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                  Enter valid hex colors (e.g. <code>#0a0a0a</code>) for
                  both fields to compute a contrast ratio.
                </div>
              )}
            </TabsContent>

            {/* ─── Tab order tab ─────────────────────────────────── */}
            <TabsContent value="taborder" className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={toggleTabBadges}
                  disabled={!mounted}
                  variant={tabBadgesActive ? "destructive" : "default"}
                  size="sm"
                >
                  {tabBadgesActive ? (
                    <>
                      <EyeOff className="size-3.5" />
                      Clear overlay
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" />
                      Visualize tab order
                    </>
                  )}
                </Button>
                {tabBadgesActive && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    {focusableCount} focusable element
                    {focusableCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">How it works</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click <strong>Visualize tab order</strong> to paint a
                  numbered badge on every focusable element on the page
                  (links, buttons, inputs, <code>[tabindex]</code>, etc.).
                  Numbers reflect the order a keyboard user will encounter
                  them when pressing <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px] border">Tab</kbd>.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Elements with <code>tabindex &lt; 0</code>, hidden
                  elements, and elements inside this suite are skipped.
                  Badges auto-repaint on scroll and resize.
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mb-1 inline size-3.5 align-text-bottom" />{" "}
                Tab order should follow the visual reading order. If
                numbers jump around the page, restructure the DOM rather
                than using <code>tabindex</code> to fix it. See{" "}
                <a
                  href={WCAG.focusOrder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  WCAG 2.4.3 Focus Order
                </a>
                .
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function SeverityPill({
  severity,
  count,
}: {
  severity: Severity;
  count: number;
}) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.badge,
      )}
    >
      <Icon className="size-3" />
      {meta.label}
      <span className="font-mono font-bold">{count}</span>
    </span>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const meta = SEVERITY_META[finding.severity];
  const Icon = meta.Icon;
  return (
    <li className="flex flex-col gap-2 p-3 transition-colors hover:bg-muted/40">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            meta.badge,
          )}
        >
          <Icon className="size-2.5" />
          {meta.label}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {finding.rule}
        </span>
        <code className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {finding.selector}
        </code>
      </div>
      <p className="text-xs text-muted-foreground">
        {finding.description}
      </p>
      <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/5 px-2 py-1.5 text-xs text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
        <span>
          <span className="font-semibold">Fix: </span>
          {finding.fix}
        </span>
      </div>
      <a
        href={finding.wcag.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
      >
        WCAG {finding.wcag.ref} · {finding.wcag.name}
      </a>
    </li>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safeColor = value.length === 7 ? value : "#000000";
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

function WCAGBadge({
  label,
  threshold,
  passed,
}: {
  label: string;
  threshold: string;
  passed: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5",
        passed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5",
      )}
    >
      {passed ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="size-4 shrink-0 text-rose-500" />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            passed
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-rose-700 dark:text-rose-300",
          )}
        >
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{threshold}</p>
      </div>
    </div>
  );
}
