"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

/**
 * EngineStatus — live platform health indicator.
 *
 * Polls /api/health every 60s and renders a compact pill in the footer
 * (or anywhere). Replaces the previously-hardcoded "All systems
 * operational" text.
 *
 * States: ok / degraded / down / unknown.
 *
 * Accessibility: role="status" + aria-live="polite" so screen readers
 * announce transitions only when the state actually changes.
 */
type HealthState = "ok" | "degraded" | "down" | "unknown";

interface HealthResponse {
  status: HealthState;
  effectsCount?: number;
  backendStatus?: { status: string; latencyMs?: number };
  liveServiceStatus?: { status: string; latencyMs?: number };
}

const POLL_INTERVAL_MS = 60_000;

const STATE_CONFIG: Record<
  HealthState,
  { label: string; dot: string; text: string; icon: typeof Check }
> = {
  ok: {
    label: "All systems operational",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: Check,
  },
  degraded: {
    label: "Degraded performance",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  down: {
    label: "Some services down",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  unknown: {
    label: "Checking status…",
    dot: "bg-slate-400",
    text: "text-muted-foreground",
    icon: HelpCircle,
  },
};

export function EngineStatus() {
  const [state, setState] = useState<HealthState>("unknown");
  const [effectsCount, setEffectsCount] = useState<number | null>(null);
  const lastStateRef = useRef<HealthState>("unknown");

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setState("degraded");
          return;
        }
        const data: HealthResponse = await res.json();
        if (cancelled) return;
        setState(data.status);
        setEffectsCount(data.effectsCount ?? null);
        lastStateRef.current = data.status;
      } catch {
        if (!cancelled) setState("down");
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs"
      title={`RoyCSS engine: ${cfg.label}${
        effectsCount ? ` · ${effectsCount.toLocaleString()} effects` : ""
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className={`size-2 rounded-full ${cfg.dot} ${
            state === "ok" ? "animate-pulse" : ""
          }`}
        />
      </AnimatePresence>
      <span className={`flex items-center gap-1 ${cfg.text}`}>
        <Icon className="size-3" aria-hidden="true" />
        {cfg.label}
      </span>
    </span>
  );
}
