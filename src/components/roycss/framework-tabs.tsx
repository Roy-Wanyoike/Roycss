"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { FrameworkExample, FrameworkId } from "@/lib/framework-adapters";

/**
 * FrameworkTabs — the shared ARIA tabs switcher for the
 * "Use in your framework" section (issue #246).
 *
 * Used by BOTH surfaces that render the section:
 *   • the effect detail dialog's FrameworkUsage (src/components/roycss/
 *     framework-usage.tsx), and
 *   • the /effects/<id> page's FrameworkUsageSection.
 *
 * Implements the APG Tabs pattern over the stack buttons:
 *   • container role="tablist" with aria-label,
 *   • each stack trigger role="tab" + aria-selected + id + aria-controls,
 *   • each panel role="tabpanel" + id + aria-labelledby,
 *   • roving tabindex (only the active tab is in the page tab order) and
 *     ArrowLeft/ArrowRight/Home/End navigation with automatic activation,
 *     wrapping at both ends.
 *
 * ALL tabpanels stay mounted — inactive ones carry the `hidden` attribute.
 * That is what keeps every framework's install/import/usage snippets in the
 * server-rendered HTML (the crawlability contract the <details> accordion
 * used to provide, see tests/unit/effect-page-rendering.test.ts), and it
 * means every panel's Copy button exists in the DOM exactly as before —
 * only its visibility changes. Visual design (tab bar + code blocks) is
 * unchanged from the dialog switcher this pattern was extracted from.
 */

/**
 * Pure APG arrow-key model for a wrapping, horizontal tab list — extracted
 * so it is unit-testable without a DOM (see
 * tests/unit/framework-tabs.test.ts).
 *
 * ArrowRight → next (wraps), ArrowLeft → previous (wraps), Home → first,
 * End → last. An unknown currentId falls back to the head of the list.
 */
export function nextFrameworkTabId<K extends string>(
  ids: readonly K[],
  currentId: K,
  key: "ArrowRight" | "ArrowLeft" | "Home" | "End",
): K {
  if (ids.length === 0) return currentId;
  const idx = ids.indexOf(currentId);
  const from = idx === -1 ? 0 : idx;
  switch (key) {
    case "ArrowRight":
      return ids[(from + 1) % ids.length];
    case "ArrowLeft":
      return ids[(from - 1 + ids.length) % ids.length];
    case "Home":
      return ids[0];
    case "End":
      return ids[ids.length - 1];
  }
}

/**
 * @param examples — the framework examples (order = tab order).
 * @param panels   — pre-rendered panel content, panels[i] belongs to
 *   examples[i]. Kept as ReactNode props so each surface can keep its own
 *   CodeBlock copy buttons (and their clipboard behavior) unchanged.
 * @param initialActiveId — pre-selected stack. Defaults to the FIRST
 *   example (the /effects/<id> accordion showed vanilla first); the dialog
 *   passes "react" to preserve its historical default.
 */
export function FrameworkTabs({
  examples,
  panels,
  initialActiveId,
}: {
  examples: FrameworkExample[];
  panels: ReactNode[];
  initialActiveId?: FrameworkId;
}) {
  const [active, setActive] = useState<FrameworkId | undefined>(
    initialActiveId ?? examples[0]?.id,
  );
  const current = examples.find((e) => e.id === active) ?? examples[0];
  const uid = useId();
  const tabId = (id: FrameworkId) => `${uid}-tab-${id}`;
  const panelId = (id: FrameworkId) => `${uid}-panel-${id}`;
  const tabRefs = useRef(new Map<FrameworkId, HTMLButtonElement>());

  if (examples.length === 0) return null;

  const handleTablistKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ): void => {
    const key = event.key;
    if (
      key !== "ArrowRight" &&
      key !== "ArrowLeft" &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }
    // The tab list owns these keys — stop the page from scrolling (Home/
    // End) or moving focus out of the tab row (arrows).
    event.preventDefault();
    const nextId = nextFrameworkTabId(
      examples.map((e) => e.id),
      current.id,
      key,
    );
    // Automatic activation: focus and selection move together (APG tabs,
    // automatic-activation model — the same behavior as Radix Tabs).
    setActive(nextId);
    tabRefs.current.get(nextId)?.focus();
  };

  return (
    <div>
      {/* Framework tab bar — same visual treatment as the dialog switcher
          this replaces (muted pill row, active = primary). */}
      <div
        role="tablist"
        aria-label="Use in your framework"
        onKeyDown={handleTablistKeyDown}
        className="flex flex-wrap gap-1 mb-3 p-1 rounded-xl bg-muted/60 border border-border/40"
      >
        {examples.map((ex) => {
          const isCurrent = ex.id === current.id;
          return (
            <button
              key={ex.id}
              ref={(node) => {
                if (node) tabRefs.current.set(ex.id, node);
                else tabRefs.current.delete(ex.id);
              }}
              type="button"
              role="tab"
              id={tabId(ex.id)}
              aria-selected={isCurrent}
              aria-controls={panelId(ex.id)}
              tabIndex={isCurrent ? 0 : -1}
              onClick={() => setActive(ex.id)}
              className={`flex-1 min-w-[5.5rem] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {ex.label}
            </button>
          );
        })}
      </div>

      {/* ALL panels stay in the DOM (crawlable SSR, pre-existing copy
          buttons); inactive ones are merely hidden. */}
      {examples.map((ex, i) => (
        <div
          key={ex.id}
          role="tabpanel"
          id={panelId(ex.id)}
          aria-labelledby={tabId(ex.id)}
          hidden={ex.id !== current.id}
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}
