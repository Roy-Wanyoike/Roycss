"use client";

import { useEffect, useState } from "react";

/**
 * EngineStatus — Live "all systems operational" indicator.
 *
 * Polls `/api/health` every 60s and reflects the actual platform state.
 * Replaces the hardcoded "All systems operational" pill in the footer so
 * the user gets real signal (not a static green dot).
 *
 * Visual states:
 *   ok       → emerald pulse + "All systems operational"
 *   degraded → amber      + "Degraded — {service}"
 *   down     → rose       + "Service offline"
 *   unknown  → slate      + "Checking systems…" (only on first load)
 */
type HealthStatus = "ok" | "degraded" | "down" | "unknown";

interface HealthResponse {
  status: HealthStatus;
  effectsCount?: number;
  dbStatus?: "ok" | "degraded" | "down";
  backendStatus?: "ok" | "degraded" | "down";
  liveServiceStatus?: "ok" | "degraded" | "down";
  timestamp?: string;
  version?: string;
}

const DOT_CLASSES: Record<HealthStatus, string> = {
  ok: "bg-emerald-500 animate-pulse",
  degraded: "bg-amber-500",
  down: "bg-rose-500",
  unknown: "bg-slate-400",
};

const LABELS: Record<HealthStatus, string> = {
  ok: "All systems operational",
  degraded: "Degraded performance",
  down: "Service offline",
  unknown: "Checking systems…",
};

export function EngineStatus() {
  const [status, setStatus] = useState<HealthStatus>("unknown");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function check() {
      try {
        const res = await fetch("/api/health", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) {
            setStatus("down");
            setDetail("");
          }
          return;
        }
        const data: HealthResponse = await res.json();
        if (cancelled) return;
        setStatus(data.status ?? "unknown");

        // Surface which subsystem is degraded
        const degraded: string[] = [];
        if (data.dbStatus === "degraded") degraded.push("DB");
        if (data.backendStatus === "degraded") degraded.push("API");
        if (data.liveServiceStatus === "degraded") degraded.push("Live");
        setDetail(degraded.length > 0 ? degraded.join(" · ") : "");
      } catch {
        if (!cancelled) {
          setStatus("down");
          setDetail("");
        }
      } finally {
        if (!cancelled) {
          // Schedule next poll (60s)
          timer = setTimeout(check, 60_000);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const label = detail ? `${LABELS[status]} — ${detail}` : LABELS[status];

  return (
    <span
      className="flex items-center gap-1.5"
      role="status"
      aria-live="polite"
      aria-label={`RoyCSS engine status: ${label}`}
      title={`Engine: ${label}`}
    >
      <span
        className={`size-2 rounded-full ${DOT_CLASSES[status]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
