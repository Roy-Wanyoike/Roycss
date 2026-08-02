"use client";

import { useMemo } from "react";
import { Accessibility, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";

/**
 * A11yScore — computes an accessibility score (0-100) for any effect
 * based on its CSS properties. Shows as a small badge with icon.
 *
 * Scoring criteria:
 * +20  has prefers-reduced-motion guard
 * +20  uses OKLCH colors (not hex/rgba)
 * +15  has transition (not instant change — gentler for vestibular)
 * +15  no infinite animation (or has reduced-motion guard)
 * +10  no backdrop-filter (can cause performance issues for a11y users)
 * +10  no 3D transforms (can cause motion sickness)
 * +10  animation duration ≤ 3s (longer = more vestibular risk)
 */

function computeA11yScore(css: string): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];

  // prefers-reduced-motion
  if (/prefers-reduced-motion/.test(css)) {
    score += 20;
  } else if (/animation|transition/.test(css)) {
    issues.push("Missing prefers-reduced-motion guard");
  } else {
    score += 20; // No animation = no reduced-motion needed
  }

  // OKLCH colors
  if (/oklch\(/.test(css) && !/#[0-9a-fA-F]{3,8}\b/.test(css)) {
    score += 20;
  } else if (/#[0-9a-fA-F]{3,8}\b/.test(css)) {
    issues.push("Uses hex colors instead of OKLCH");
  } else {
    score += 20; // No colors = fine
  }

  // Has transition (gentler than instant)
  if (/transition/.test(css)) score += 15;

  // Infinite animation
  if (/animation.*infinite/i.test(css)) {
    if (/prefers-reduced-motion/.test(css)) {
      score += 15; // Has guard, so infinite is OK
    } else {
      issues.push("Infinite animation without reduced-motion guard");
    }
  } else {
    score += 15; // No infinite = fine
  }

  // backdrop-filter
  if (/backdrop-filter/.test(css)) {
    issues.push("backdrop-filter may impact performance");
  } else {
    score += 10;
  }

  // 3D transforms
  if (/perspective|preserve-3d|rotateX|rotateY|rotate3d/.test(css)) {
    issues.push("3D transforms may cause motion sickness");
  } else {
    score += 10;
  }

  // Duration check
  const durationMatch = css.match(/animation:[^;]*?(\d+(?:\.\d+)?)s/);
  if (durationMatch) {
    const duration = parseFloat(durationMatch[1]);
    if (duration <= 3) score += 10;
    else issues.push(`Animation duration ${duration}s > 3s`);
  } else {
    score += 10; // No animation = fine
  }

  return { score: Math.min(100, score), issues };
}

function getScoreMeta(score: number) {
  if (score >= 80) return { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "A11y: Good" };
  if (score >= 50) return { icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10", label: "A11y: Fair" };
  return { icon: ShieldX, color: "text-rose-500", bg: "bg-rose-500/10", label: "A11y: Poor" };
}

interface A11yScoreProps {
  effect: CSSEffect;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function A11yScore({ effect, showLabel = false, size = "sm" }: A11yScoreProps) {
  const { score, issues } = useMemo(() => computeA11yScore(effect.cssCode), [effect.cssCode]);
  const meta = getScoreMeta(score);
  const Icon = meta.icon;
  const iconSize = size === "sm" ? "size-3" : "size-4";

  const title = `Accessibility: ${score}/100\n${issues.length > 0 ? "Issues:\n" + issues.map(i => "• " + i).join("\n") : "No issues found"}`;

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
      title={title}
    >
      <Icon className={iconSize} />
      {showLabel && <span className="text-[10px] font-medium">{meta.label}</span>}
      <span className="text-[10px] font-mono font-bold">{score}</span>
    </div>
  );
}

/** Export the compute function for use elsewhere */
export { computeA11yScore };
