"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { writeStoredAnimationPause } from "@/components/ui-library/foundation/animation-pause-storage";

/**
 * Site-wide "Pause animations" toggle (issue #214 — WCAG 2.2.2).
 *
 * Sets `data-animations-paused="true"` on <html>; the CSS hook right after
 * the existing off-screen pauser rule in globals.css freezes every CSS
 * animation site-wide with the same `animation-play-state: paused
 * !important` contract used by AnimationPauser's `data-animation-paused`.
 *
 * A11y contract:
 *  - constant accessible name ("Pause animations") + `aria-pressed` for
 *    state (per the APG toggle-button pattern — never rename the button,
 *    let the state do the talking);
 *  - visible focus ring + icon swap (Pause ⇄ Play) for sighted users;
 *  - attribute is written ONLY on user intent (never during render or on
 *    mount), so SSR markup is untouched — no hydration mismatch;
 *  - state survives client-side navigation because both headers (home
 *    mega-header + SiteHeader) re-read the <html> attribute on mount.
 *  - the choice PERSISTS across reloads (issue #214 tail): the toggle
 *    handler also writes `roycss-animations-paused` via the shared
 *    animation-pause-storage module (write-on-user-intent-only), and the
 *    pre-paint init script in layout.tsx re-applies the attribute from
 *    storage before the first paint. The mount-time rAF read below picks
 *    that attribute up — no extra mount logic needed.
 */
const HTML_ATTR = "data-animations-paused";

export function PauseAnimationsToggle({
  size = "sm",
}: {
  /** "sm" fits the compact SiteHeader; "lg" fits the home mega-header. */
  size?: "sm" | "lg";
}) {
  const t = useTranslations("SiteHeader");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Read-only sync, deferred via rAF (same pattern as SiteThemeToggle —
    // never writes, so hydration output is identical).
    const id = requestAnimationFrame(() => {
      setPaused(document.documentElement.hasAttribute(HTML_ATTR));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    if (next) {
      document.documentElement.setAttribute(HTML_ATTR, "true");
    } else {
      document.documentElement.removeAttribute(HTML_ATTR);
    }
    // Issue #214 tail: persist on USER INTENT only — the same write-once
    // contract as the theme toggle (#160). The pre-paint init script in
    // layout.tsx reads this key back on the next load; it never writes.
    writeStoredAnimationPause(window.localStorage, next);
  };

  const className =
    size === "lg"
      ? "flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      : "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      aria-label={t("pauseAnimations")}
      title={paused ? t("resumeAnimations") : t("pauseAnimations")}
      className={className}
    >
      {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      <span role="status" aria-live="polite" className="sr-only">
        {paused ? t("pausedStatus") : ""}
      </span>
    </button>
  );
}

export default PauseAnimationsToggle;
