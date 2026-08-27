"use client";

/**
 * BrowserCapabilityLab — a Baseline-style support grid for 12 modern CSS
 * features, each with a "Try it" live demo.
 *
 * Features covered:
 *   container queries · :has() · @scope · @property · view transitions ·
 *   scroll-driven animations · CSS nesting · light-dark() · anchor
 *   positioning · subgrid · @starting-style · text-wrap: balance
 *
 * Each feature card shows:
 *   - feature name + short description
 *   - Chrome / Firefox / Safari / Edge support badges (green = full,
 *     yellow = partial, red = none)
 *   - a "Try it" button that opens a Dialog with a live, scoped demo
 *
 * Demos are pure CSS wherever possible (the underlying feature does the
 * work). For features that need JS to trigger (view transitions) or a
 * state toggle (light-dark), a small action button is provided inside the
 * demo. All demo CSS is scoped via a per-demo unique class so styles never
 * leak onto the host page.
 *
 * Implementation notes:
 *   - Support matrix is hard-coded (mirrors Baseline / CanIUse late 2024).
 *   - TS strict, no `any`, no `console.log`. Self-contained, no props.
 *   - Responsive grid: 1 column on mobile, up to 3 on desktop.
 */

import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Globe,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RotateCcw,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type SupportStatus = "full" | "partial" | "none";

interface SupportEntry {
  status: SupportStatus;
  /** Minimum version that ships the feature, or null when unsupported. */
  version: string | null;
}

interface BrowserSupport {
  chrome: SupportEntry;
  firefox: SupportEntry;
  safari: SupportEntry;
  edge: SupportEntry;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  mdnUrl: string;
  baseline: string; // e.g. "Baseline 2023"
  support: BrowserSupport;
  demo: () => ReactNode;
}

// ============================================================
// Constants
// ============================================================

const STATUS_META: Record<
  SupportStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
    dot: string;
  }
> = {
  full: {
    label: "Full support",
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  partial: {
    label: "Partial / behind flag",
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  none: {
    label: "Not supported",
    icon: XCircle,
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    dot: "bg-red-500",
  },
};

const BROWSER_LABEL: Record<keyof BrowserSupport, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  edge: "Edge",
};

// ============================================================
// Per-feature demos
//
// Each demo is self-contained, returns JSX with a scoped <style> block.
// The CSS uses the modern feature under test so the rendered output IS
// the demonstration.
// ============================================================

/** Build a stable scope class from the React useId hook for a demo. */
function useDemoScope(prefix: string): string {
  const rawId = useId();
  return `${prefix}-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
}

// ── 1. Container Queries ───────────────────────────────────────────
function ContainerQueryDemo(): ReactNode {
  const scope = useDemoScope("cq");
  const [width, setWidth] = useState(320);
  const css = `
.${scope} { container-type: inline-size; container-name: demo; background: #f4f4f5; border-radius: 0.75rem; padding: 1rem; }
.${scope} .card { background: #fff; border: 2px solid #e4e4e7; border-radius: 0.5rem; padding: 1rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.${scope} .card .title { font-weight: 700; color: #18181b; }
.${scope} .card .desc { color: #71717a; font-size: 0.875rem; }
@container demo (width > 360px) {
  .${scope} .card { background: #059669; border-color: #047857; color: #fff; flex-direction: row; }
  .${scope} .card .title, .${scope} .card .desc { color: #fff; }
}
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="mb-3 flex items-center gap-3 text-xs">
        <span className="font-medium">Container width:</span>
        <input
          type="range"
          min={240}
          max={520}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-14 text-right tabular-nums">{width}px</span>
      </div>
      <div className={scope} style={{ width }}>
        <div className="card">
          <div>
            <div className="title">Resize me</div>
            <div className="desc">
              The card turns green when its container is wider than 360px.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. :has() ───────────────────────────────────────────────────────
function HasSelectorDemo(): ReactNode {
  const scope = useDemoScope("has");
  const css = `
.${scope} .panel { padding: 1rem; border-radius: 0.5rem; background: #f4f4f5; border: 1px solid #e4e4e7; }
.${scope} .panel:has(.checked) { background: #059669; border-color: #047857; color: #fff; }
.${scope} .panel:has(.checked) .label { color: #fff; }
.${scope} .label { font-weight: 600; color: #18181b; }
.${scope} label { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; cursor: pointer; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="panel">
          <div className="label">
            This panel turns green when the checkbox below is checked.
          </div>
          <label>
            <input type="checkbox" className="checked" defaultChecked />
            <span>Toggle me</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ── 3. @scope ───────────────────────────────────────────────────────
function ScopeDemo(): ReactNode {
  const scope = useDemoScope("sc");
  const css = `
.${scope} .root { padding: 1rem; background: #f4f4f5; border-radius: 0.5rem; }
.${scope} .item { padding: 0.5rem 0.75rem; margin: 0.25rem 0; background: #fafafa; border-radius: 0.375rem; }
@scope (.${scope} .root) to (.${scope} .boundary) {
  .item { color: #059669; font-weight: 600; border-left: 3px solid #059669; padding-left: 0.75rem; }
}
.${scope} .boundary { margin-top: 0.75rem; padding: 0.75rem; background: #fff7ed; border-radius: 0.375rem; }
.${scope} .boundary .item { color: #ea580c; border-left-color: #ea580c; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="root">
          <div className="item">Styled by @scope (green)</div>
          <div className="item">Styled by @scope (green)</div>
          <div className="boundary">
            <div className="item">Below the scope boundary (orange)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. @property ────────────────────────────────────────────────────
function PropertyDemo(): ReactNode {
  const scope = useDemoScope("prop");
  const css = `
@property --token-color {
  syntax: "<color>";
  inherits: true;
  initial-value: #2563eb;
}
.${scope} .root { --token-color: #059669; padding: 1rem; background: #f4f4f5; border-radius: 0.5rem; }
.${scope} .root .child { color: var(--token-color); font-weight: 600; margin: 0.25rem 0; }
.${scope} .root .child.deep { padding-left: 1rem; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="root">
          <div className="child">Inherited from parent (--token-color)</div>
          <div className="child deep">Also inherited (no explicit set)</div>
          <div className="child deep" style={{ color: "var(--token-color)" }}>
            Even deeper — still inherits
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. View Transitions ────────────────────────────────────────────
function ViewTransitionDemo(): ReactNode {
  const scope = useDemoScope("vt");
  const [toggled, setToggled] = useState(false);
  const css = `
.${scope} .stage { position: relative; height: 8rem; border-radius: 0.5rem; background: #f4f4f5; overflow: hidden; }
.${scope} .stage .ball { position: absolute; top: 50%; left: 1rem; transform: translateY(-50%); width: 4rem; height: 4rem; border-radius: 9999px; background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 10px 30px -10px rgba(5, 150, 105, 0.6); transition: left 0.3s ease; }
.${scope} .stage .ball.right { left: calc(100% - 5rem); background: linear-gradient(135deg, #ea580c, #f97316); }
::view-transition-group(ball) { animation-duration: 0.5s; }
::view-transition-old(ball) { animation: vt-fade-out 0.4s ease forwards; }
::view-transition-new(ball) { animation: vt-fade-in 0.4s ease forwards; }
@keyframes vt-fade-out { to { opacity: 0; transform: scale(0.8); } }
@keyframes vt-fade-in { from { opacity: 0; transform: scale(0.8); } }
`;
  const trigger = () => {
    const w = typeof window !== "undefined" ? window : null;
    if (w && "startViewTransition" in document) {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => void;
      };
      const fn = doc.startViewTransition;
      if (typeof fn === "function") {
        try {
          fn.call(doc, () => setToggled((p) => !p));
          return;
        } catch {
          /* unsupported at runtime — fall through */
        }
      }
    }
    setToggled((p) => !p);
  };
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="stage">
          <div className={cn("ball", toggled && "right")} style={{ viewTransitionName: "ball" }} />
        </div>
        <Button onClick={trigger} className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
          <RotateCcw className="size-4" />
          Trigger view transition
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Falls back to a CSS transition in browsers without
          <code className="mx-1">document.startViewTransition</code>.
        </p>
      </div>
    </div>
  );
}

// ── 6. Scroll-driven Animations ─────────────────────────────────────
function ScrollDrivenDemo(): ReactNode {
  const scope = useDemoScope("sd");
  const css = `
.${scope} .scroll-area { height: 10rem; overflow-y: auto; border-radius: 0.5rem; background: #f4f4f5; position: relative; }
.${scope} .scroll-area .inner { height: 200%; padding: 1rem; }
.${scope} .progress { position: sticky; top: 0; left: 0; right: 0; height: 0.5rem; background: #059669; transform-origin: left center; animation: sd-grow linear; animation-timeline: scroll(); }
@keyframes sd-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.${scope} .row { padding: 0.5rem 0; color: #71717a; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="scroll-area">
          <div className="inner">
            <div className="progress" />
            {Array.from({ length: 24 }).map((_, i) => (
              <div className="row" key={i}>
                Row {i + 1} — scroll to fill the green bar above.
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 7. CSS Nesting ─────────────────────────────────────────────────
function NestingDemo(): ReactNode {
  const scope = useDemoScope("nest");
  const css = `
.${scope} .card {
  background: #fff; border: 1px solid #e4e4e7; border-radius: 0.5rem; padding: 1rem;
  & .title { font-weight: 700; color: #18181b; }
  & .body { color: #71717a; font-size: 0.875rem; margin-top: 0.25rem; }
  &:hover { border-color: #059669; box-shadow: 0 6px 14px -6px rgba(5,150,105,0.25); }
  & .cta { margin-top: 0.75rem; color: #059669; font-weight: 600; cursor: pointer; }
  & .cta:hover { color: #047857; text-decoration: underline; }
}
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="card">
          <div className="title">Native CSS nesting</div>
          <div className="body">
            Selectors nest without a preprocessor — hover this card.
          </div>
          <div className="cta">Call to action</div>
        </div>
      </div>
    </div>
  );
}

// ── 8. light-dark() ────────────────────────────────────────────────
function LightDarkDemo(): ReactNode {
  const scope = useDemoScope("ld");
  const [dark, setDark] = useState(false);
  const css = `
.${scope} .panel { color-scheme: light dark; background: light-dark(#f4f4f5, #18181b); color: light-dark(#18181b, #f4f4f5); border: 1px solid light-dark(#e4e4e7, #3f3f46); padding: 1rem; border-radius: 0.5rem; }
.${scope} .panel .label { font-weight: 700; }
.${scope} .panel .desc { color: light-dark(#71717a, #a1a1aa); font-size: 0.875rem; margin-top: 0.25rem; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="panel" style={{ colorScheme: dark ? "dark" : "light" }}>
          <div className="label">{dark ? "Dark mode" : "Light mode"}</div>
          <div className="desc">
            Colors flip via <code>light-dark()</code> + color-scheme.
          </div>
        </div>
        <Button
          onClick={() => setDark((p) => !p)}
          variant="outline"
          size="sm"
          className="mt-3 gap-1.5"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          Toggle scheme
        </Button>
      </div>
    </div>
  );
}

// ── 9. Anchor Positioning ───────────────────────────────────────────
function AnchorDemo(): ReactNode {
  const scope = useDemoScope("anch");
  const css = `
.${scope} .stage { position: relative; padding: 1.5rem; background: #f4f4f5; border-radius: 0.5rem; }
.${scope} .anchor { anchor-name: --anch-btn; display: inline-flex; align-items: center; padding: 0.5rem 0.875rem; background: #059669; color: #fff; border-radius: 0.375rem; font-weight: 600; }
.${scope} .bubble { position: absolute; position-anchor: --anch-btn; top: anchor(bottom); left: anchor(center); margin-top: 0.5rem; transform: translateX(-50%); padding: 0.5rem 0.75rem; background: #18181b; color: #fff; border-radius: 0.375rem; font-size: 0.75rem; white-space: nowrap; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="stage">
          <span className="anchor">Hover target</span>
          <span className="bubble">Anchored tooltip ↑</span>
        </div>
      </div>
    </div>
  );
}

// ── 10. Subgrid ─────────────────────────────────────────────────────
function SubgridDemo(): ReactNode {
  const scope = useDemoScope("sub");
  const css = `
.${scope} .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
.${scope} .grid > .head, .${scope} .grid > .row { grid-column: span 3; display: grid; grid-template-columns: subgrid; gap: 0.5rem; }
.${scope} .head .cell { background: #059669; color: #fff; font-weight: 700; padding: 0.5rem; border-radius: 0.25rem; text-align: center; }
.${scope} .row .cell { padding: 0.5rem; border-bottom: 1px solid #e4e4e7; text-align: center; color: #52525b; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="grid">
          <div className="head">
            <div className="cell">A</div>
            <div className="cell">B</div>
            <div className="cell">C</div>
          </div>
          <div className="row">
            <div className="cell">a1</div>
            <div className="cell">b1</div>
            <div className="cell">c1</div>
          </div>
          <div className="row">
            <div className="cell">a2</div>
            <div className="cell">b2</div>
            <div className="cell">c2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 11. @starting-style ────────────────────────────────────────────
function StartingStyleDemo(): ReactNode {
  const scope = useDemoScope("ss");
  const [shown, setShown] = useState(false);
  const css = `
.${scope} .panel { background: #f4f4f5; border-radius: 0.5rem; padding: 1rem; transition: opacity 0.4s ease, transform 0.4s ease; }
.${scope} .panel.shown { opacity: 1; transform: translateY(0); }
.${scope} .panel.hidden { opacity: 0; transform: translateY(-0.5rem); }
@starting-style {
  .${scope} .panel.shown { opacity: 0; transform: translateY(-0.5rem); }
}
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className={cn("panel", shown ? "shown" : "hidden")}>
          <div className="font-semibold">I animate in from 0 opacity</div>
          <div className="text-xs text-muted-foreground mt-1">
            Triggered by <code>@starting-style</code> on first render of the
            &ldquo;shown&rdquo; state.
          </div>
        </div>
        <Button
          onClick={() => setShown((p) => !p)}
          variant="outline"
          size="sm"
          className="mt-3"
        >
          {shown ? "Hide" : "Show"}
        </Button>
      </div>
    </div>
  );
}

// ── 12. text-wrap: balance ─────────────────────────────────────────
function TextWrapDemo(): ReactNode {
  const scope = useDemoScope("tw");
  const css = `
.${scope} .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.${scope} .col { padding: 1rem; background: #f4f4f5; border-radius: 0.5rem; }
.${scope} .col h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.5rem; }
.${scope} .balanced { text-wrap: balance; }
.${scope} .unbalanced { text-wrap: auto; }
.${scope} .meta { color: #71717a; font-size: 0.75rem; margin-top: 0.5rem; }
`;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={scope}>
        <div className="row">
          <div className="col">
            <h3 className="balanced">
              A moderately long heading that wraps with text-wrap: balance
            </h3>
            <div className="meta">text-wrap: balance</div>
          </div>
          <div className="col">
            <h3 className="unbalanced">
              A moderately long heading that wraps with text-wrap: balance
            </h3>
            <div className="meta">text-wrap: auto (default)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Feature catalog
// ============================================================

const FEATURES: Feature[] = [
  {
    id: "container-queries",
    name: "Container Queries",
    description: "Style an element based on its container size, not viewport.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/CSS_containment/Container_queries",
    baseline: "Baseline 2023",
    support: {
      chrome: { status: "full", version: "105+" },
      firefox: { status: "full", version: "110+" },
      safari: { status: "full", version: "16+" },
      edge: { status: "full", version: "105+" },
    },
    demo: ContainerQueryDemo,
  },
  {
    id: "has",
    name: ":has() selector",
    description: "Style a parent based on its descendants or following siblings.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/:has",
    baseline: "Baseline 2023",
    support: {
      chrome: { status: "full", version: "105+" },
      firefox: { status: "full", version: "121+" },
      safari: { status: "full", version: "15.4+" },
      edge: { status: "full", version: "105+" },
    },
    demo: HasSelectorDemo,
  },
  {
    id: "scope",
    name: "@scope",
    description: "Apply styles to a subtree, optionally stopping at a boundary.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/@scope",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "118+" },
      firefox: { status: "partial", version: null },
      safari: { status: "partial", version: "17.4+" },
      edge: { status: "full", version: "118+" },
    },
    demo: ScopeDemo,
  },
  {
    id: "property",
    name: "@property",
    description: "Register a typed custom property with inheritance & initial value.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/@property",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "85+" },
      firefox: { status: "full", version: "128+" },
      safari: { status: "full", version: "16.4+" },
      edge: { status: "full", version: "85+" },
    },
    demo: PropertyDemo,
  },
  {
    id: "view-transitions",
    name: "View Transitions",
    description: "Animate between two DOM states with a single API call.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/API/View_Transitions_API",
    baseline: "Baseline 2023",
    support: {
      chrome: { status: "full", version: "111+" },
      firefox: { status: "partial", version: null },
      safari: { status: "full", version: "18+" },
      edge: { status: "full", version: "111+" },
    },
    demo: ViewTransitionDemo,
  },
  {
    id: "scroll-driven-animations",
    name: "Scroll-driven Animations",
    description: "Tie an animation's timeline to scroll progress, no JS needed.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/animation-timeline",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "115+" },
      firefox: { status: "partial", version: null },
      safari: { status: "partial", version: null },
      edge: { status: "full", version: "115+" },
    },
    demo: ScrollDrivenDemo,
  },
  {
    id: "nesting",
    name: "CSS Nesting",
    description: "Nest selectors inside other rules — no preprocessor required.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/CSS_nesting",
    baseline: "Baseline 2023",
    support: {
      chrome: { status: "full", version: "112+" },
      firefox: { status: "full", version: "117+" },
      safari: { status: "full", version: "16.5+" },
      edge: { status: "full", version: "112+" },
    },
    demo: NestingDemo,
  },
  {
    id: "light-dark",
    name: "light-dark()",
    description: "Pick a value per color-scheme without duplicating selectors.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "123+" },
      firefox: { status: "full", version: "120+" },
      safari: { status: "full", version: "17.5+" },
      edge: { status: "full", version: "123+" },
    },
    demo: LightDarkDemo,
  },
  {
    id: "anchor-positioning",
    name: "Anchor Positioning",
    description: "Position an element relative to an anchor by name.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/CSS_anchor_positioning",
    baseline: "Baseline 2024 (limited)",
    support: {
      chrome: { status: "full", version: "125+" },
      firefox: { status: "partial", version: null },
      safari: { status: "partial", version: null },
      edge: { status: "full", version: "125+" },
    },
    demo: AnchorDemo,
  },
  {
    id: "subgrid",
    name: "Subgrid",
    description: "A grid item inherits the parent's grid tracks for alignment.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout/Subgrid",
    baseline: "Baseline 2023",
    support: {
      chrome: { status: "full", version: "117+" },
      firefox: { status: "full", version: "71+" },
      safari: { status: "full", version: "16+" },
      edge: { status: "full", version: "117+" },
    },
    demo: SubgridDemo,
  },
  {
    id: "starting-style",
    name: "@starting-style",
    description: "Define initial styles for elements entering the DOM, for entry animation.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/@starting-style",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "117+" },
      firefox: { status: "partial", version: "129+" },
      safari: { status: "partial", version: "17.4+" },
      edge: { status: "full", version: "117+" },
    },
    demo: StartingStyleDemo,
  },
  {
    id: "text-wrap-balance",
    name: "text-wrap: balance",
    description: "Balance wrapped text lines so headings look even.",
    mdnUrl: "https://developer.mozilla.org/docs/Web/CSS/text-wrap",
    baseline: "Baseline 2024",
    support: {
      chrome: { status: "full", version: "114+" },
      firefox: { status: "full", version: "121+" },
      safari: { status: "full", version: "17.5+" },
      edge: { status: "full", version: "114+" },
    },
    demo: TextWrapDemo,
  },
];

// ============================================================
// Browser badge
// ============================================================

function BrowserBadge({
  browser,
  entry,
}: {
  browser: keyof BrowserSupport;
  entry: SupportEntry;
}): ReactNode {
  const meta = STATUS_META[entry.status];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
      <span
        className={cn("size-2 rounded-full", meta.dot)}
        aria-hidden="true"
      />
      <span className="font-medium">{BROWSER_LABEL[browser]}</span>
      <Icon
        className={cn(
          "size-3.5",
          entry.status === "full" && "text-emerald-600",
          entry.status === "partial" && "text-amber-600",
          entry.status === "none" && "text-red-600",
        )}
      />
      {entry.version && (
        <span className="text-muted-foreground tabular-nums">
          {entry.version}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Feature card
// ============================================================

function FeatureCard({ feature }: { feature: Feature }): ReactNode {
  const [open, setOpen] = useState(false);
  const Demo = feature.demo;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{feature.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {feature.baseline}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(BROWSER_LABEL) as Array<keyof BrowserSupport>).map(
            (b) => (
              <BrowserBadge
                key={b}
                browser={b}
                entry={feature.support[b]}
              />
            ),
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <FlaskConical className="size-4" />
              Try it
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="size-5 text-emerald-600" />
                {feature.name}
              </DialogTitle>
              <DialogDescription>{feature.description}</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <Demo />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="size-3.5" />
              <a
                href={feature.mdnUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 underline-offset-2 hover:text-emerald-700 hover:underline"
              >
                MDN reference <ExternalLink className="size-3" />
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Component
// ============================================================

export function BrowserCapabilityLab() {
  const summary = useMemo(() => {
    let full = 0;
    let partial = 0;
    let none = 0;
    for (const f of FEATURES) {
      for (const b of Object.keys(BROWSER_LABEL) as Array<keyof BrowserSupport>) {
        const s = f.support[b].status;
        if (s === "full") full++;
        else if (s === "partial") partial++;
        else none++;
      }
    }
    return { full, partial, none };
  }, []);

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5 text-emerald-600" />
          Browser Capability Lab
        </CardTitle>
        <CardDescription>
          A Baseline-style grid of 12 modern CSS features with live &ldquo;Try
          it&rdquo; demos. Badges: green = full support, yellow = partial /
          behind flag, red = none.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="size-3" />
            {summary.full} full
          </Badge>
          <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="size-3" />
            {summary.partial} partial
          </Badge>
          <Badge variant="secondary" className="gap-1 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <XCircle className="size-3" />
            {summary.none} none
          </Badge>
          <span className="text-muted-foreground">
            across {FEATURES.length} features × 4 browsers
          </span>
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" } as CSSProperties}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default BrowserCapabilityLab;
